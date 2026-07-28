import { prisma } from "../repositories/prisma";
import { SlaService } from "./sla.service";

const slaService = new SlaService();

type MessageDirection =
  | "incoming"
  | "outgoing"
  | null;

type IngestMessageDTO = {
  externalMessageId: string;
  groupExternalId: string;
  groupName?: string;
  responsibleName?: string;
  senderPhone?: string;
  senderName?: string;
  body?: string;
  sentAt: string;
  direction?: MessageDirection;
};

function normalizePhone(
  phone?: string | null
) {
  if (!phone) {
    return "";
  }

  return phone.replace(/\D/g, "");
}

function parseSentAt(value: string) {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return new Date();
  }

  return parsedDate;
}

function getDefaultSlaMinutesByRole(
  role?: string
) {
  if (role === "sales_support") return 120;
  if (role === "cs") return 60;
  if (role === "comercial") return 60;

  return 60;
}

export class MessagesService {
  async ingest(data: IngestMessageDTO) {
    console.log(
      "GROUP RECEBIDO:",
      data.groupExternalId
    );

    console.log(
      "GROUP NAME:",
      data.groupName
    );

    console.log(
      "RESPONSÁVEL RECEBIDO:",
      data.responsibleName
    );

    console.log(
      "DIREÇÃO RECEBIDA:",
      data.direction
    );

    const sentAt = parseSentAt(data.sentAt);

    let project =
      await prisma.project.findUnique({
        where: {
          groupExternalId:
            data.groupExternalId,
        },
        include: {
          responsibleUser: true,
        },
      });

    /**
     * Cria o projeto diretamente quando o grupo
     * ainda não existe no banco.
     */
    if (!project) {
      project = await prisma.project.create({
        data: {
          name:
            data.groupName ??
            `Projeto ${data.groupExternalId}`,

          groupExternalId:
            data.groupExternalId,

          groupName:
            data.groupName ??
            `Grupo ${data.groupExternalId}`,

          responsibleUserId: null,
          sectorId: null,
          slaMinutes: 60,
          active: true,

          lastMessageBody:
            data.body ?? null,

          lastSenderName:
            data.senderName ?? null,

          lastMessageAt:
            sentAt,
        },
        include: {
          responsibleUser: true,
        },
      });

      console.log(
        "PROJECT CRIADO DIRETO:",
        project.id
      );
    } else {
      /**
       * Atualiza os dados da última mensagem,
       * sem apagar responsável, setor ou SLA.
       */
      project = await prisma.project.update({
        where: {
          id: project.id,
        },
        data: {
          name:
            project.name ||
            data.groupName ||
            `Projeto ${data.groupExternalId}`,

          groupName:
            data.groupName ??
            project.groupName,

          lastMessageBody:
            data.body ??
            project.lastMessageBody,

          lastSenderName:
            data.senderName ??
            project.lastSenderName,

          lastMessageAt:
            sentAt,
        },
        include: {
          responsibleUser: true,
        },
      });
    }

    if (!project) {
      return {
        ignored: true,
        reason:
          "project_not_available_after_upsert",
        groupExternalId:
          data.groupExternalId,
      };
    }

    if (!project.active) {
      return {
        ignored: true,
        reason: "project_inactive",
      };
    }

    /**
     * Evita processar novamente uma mensagem
     * que já foi salva anteriormente.
     */
    const existingMessage =
      await prisma.message.findUnique({
        where: {
          externalMessageId:
            data.externalMessageId,
        },
      });

    if (existingMessage) {
      return {
        success: true,
        duplicated: true,
        ignored: true,
        reason: "message_already_processed",
        messageId: existingMessage.id,
        projectId: project.id,
      };
    }

    const normalizedSenderPhone =
      normalizePhone(data.senderPhone);

    const normalizedResponsiblePhone =
      normalizePhone(
        project.responsibleUser?.phone
      );

    let senderType:
      | "responsible"
      | "customer";

    /**
     * A direção enviada pela TimelinesAI
     * tem prioridade.
     */
    if (data.direction === "outgoing") {
      senderType = "responsible";
    } else if (
      data.direction === "incoming"
    ) {
      senderType = "customer";
    } else if (
      normalizedResponsiblePhone &&
      normalizedSenderPhone &&
      normalizedSenderPhone ===
        normalizedResponsiblePhone
    ) {
      /**
       * Comparação de telefone fica como
       * alternativa para eventos antigos.
       */
      senderType = "responsible";
    } else {
      senderType = "customer";
    }

    /**
     * senderPhone é obrigatório no banco.
     *
     * Algumas mensagens enviadas pelo time
     * podem chegar sem telefone do remetente.
     */
    const senderPhoneForStorage =
      data.senderPhone?.trim() ||
      (senderType === "responsible"
        ? project.responsibleUser?.phone?.trim() ||
          "outgoing_team"
        : "unknown_customer");

    console.log(
      "TIPO IDENTIFICADO:",
      senderType
    );

    const message =
      await prisma.message.create({
        data: {
          projectId:
            project.id,

          externalMessageId:
            data.externalMessageId,

          senderPhone:
            senderPhoneForStorage,

          senderName:
            data.senderName,

          senderType,

          body:
            data.body,

          sentAt,
        },
      });

    /**
     * O SLA só é iniciado ou encerrado quando
     * o projeto já possui responsável e setor.
     */
    const projectReadyForSla =
      Boolean(project.responsibleUserId) &&
      Boolean(project.sectorId);

    if (!projectReadyForSla) {
      return {
        success: true,
        messageId:
          message.id,

        senderType,

        projectId:
          project.id,

        projectName:
          project.name,

        pendingConfiguration: true,

        reason:
          "project_without_responsible_or_sector",
      };
    }

    /**
     * Ajusta o SLA conforme o cargo do
     * responsável cadastrado.
     */
    if (project.responsibleUser) {
      const targetSla =
        getDefaultSlaMinutesByRole(
          project.responsibleUser.role
        );

      if (
        project.slaMinutes !== targetSla
      ) {
        project =
          await prisma.project.update({
            where: {
              id: project.id,
            },
            data: {
              slaMinutes: targetSla,
            },
            include: {
              responsibleUser: true,
            },
          });
      }
    }

    /**
     * Mensagem recebida do cliente:
     * abre ou mantém o ticket de SLA.
     */
    if (senderType === "customer") {
      await slaService.handleIncomingCustomerMessage(
        {
          projectId:
            project.id,

          messageId:
            message.id,

          sentAt,
        }
      );
    }

    /**
     * Mensagem enviada pelo time:
     * encerra o ticket pendente.
     */
    if (senderType === "responsible") {
      await slaService.handleResponsibleReply(
        {
          projectId:
            project.id,

          messageId:
            message.id,

          sentAt,
        }
      );
    }

    return {
      success: true,

      messageId:
        message.id,

      senderType,

      direction:
        data.direction ?? null,

      projectId:
        project.id,

      projectName:
        project.name,

      pendingConfiguration: false,
    };
  }
}
