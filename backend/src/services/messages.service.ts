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

function phonesMatch(
  senderPhone?: string | null,
  responsiblePhone?: string | null
) {
  const normalizedSender =
    normalizePhone(senderPhone);

  const normalizedResponsible =
    normalizePhone(responsiblePhone);

  if (
    !normalizedSender ||
    !normalizedResponsible
  ) {
    return false;
  }

  if (
    normalizedSender ===
    normalizedResponsible
  ) {
    return true;
  }

  /**
   * Permite comparar:
   *
   * 5513997274816
   * com
   * 13997274816
   *
   * O número pode chegar com ou sem
   * o código 55 do Brasil.
   */
  if (
    normalizedSender.length >= 10 &&
    normalizedResponsible.length >= 10
  ) {
    return (
      normalizedSender.endsWith(
        normalizedResponsible
      ) ||
      normalizedResponsible.endsWith(
        normalizedSender
      )
    );
  }

  return false;
}

function normalizeName(
  value?: string | null
) {
  return (value ?? "")
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(
  senderName?: string | null,
  responsibleName?: string | null
) {
  const normalizedSenderName =
    normalizeName(senderName);

  const normalizedResponsibleName =
    normalizeName(responsibleName);

  if (
    !normalizedSenderName ||
    !normalizedResponsibleName
  ) {
    return false;
  }

  if (
    normalizedSenderName ===
    normalizedResponsibleName
  ) {
    return true;
  }

  /**
   * Evita comparar apenas um primeiro nome,
   * como "João".
   */
  const responsibleNameParts =
    normalizedResponsibleName.split(" ");

  if (
    responsibleNameParts.length < 2
  ) {
    return false;
  }

  /**
   * Exemplo:
   *
   * Responsável:
   * Enzo Gustavo
   *
   * Nome recebido:
   * Enzo Gustavo - CS Process
   */
  return normalizedSenderName.startsWith(
    `${normalizedResponsibleName} `
  );
}

function parseSentAt(value: string) {
  const parsedDate = new Date(value);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return new Date();
  }

  return parsedDate;
}

function getDefaultSlaMinutesByRole(
  role?: string
) {
  if (role === "sales_support") {
    return 120;
  }

  if (role === "cs") {
    return 60;
  }

  if (role === "comercial") {
    return 60;
  }

  return 60;
}

export class MessagesService {
  async ingest(
    data: IngestMessageDTO
  ) {
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
      "REMETENTE RECEBIDO:",
      data.senderName
    );

    console.log(
      "TELEFONE RECEBIDO:",
      data.senderPhone
    );

    console.log(
      "DIREÇÃO RECEBIDA:",
      data.direction
    );

    const sentAt = parseSentAt(
      data.sentAt
    );

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
     * Cria o projeto quando o grupo
     * ainda não existe no banco.
     */
    if (!project) {
      project =
        await prisma.project.create({
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

            lastMessageAt: sentAt,
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
       * Atualiza a última mensagem,
       * sem remover responsável,
       * setor ou configuração do SLA.
       */
      project =
        await prisma.project.update({
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

            lastMessageAt: sentAt,
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
     * Evita processar duas vezes
     * a mesma mensagem.
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

        reason:
          "message_already_processed",

        messageId:
          existingMessage.id,

        projectId:
          project.id,
      };
    }

    const phoneMatchesResponsible =
      phonesMatch(
        data.senderPhone,
        project.responsibleUser?.phone
      );

    const nameMatchesResponsible =
      namesMatch(
        data.senderName,
        project.responsibleUser?.name
      );

    const outgoingMessage =
      data.direction === "outgoing";

    let senderType:
      | "responsible"
      | "customer";

    /**
     * Ordem correta:
     *
     * 1. Telefone do responsável;
     * 2. Nome completo do responsável;
     * 3. Direção outgoing;
     * 4. Caso contrário, cliente.
     *
     * Assim, uma mensagem do CS que chega
     * incorretamente como incoming ainda é
     * reconhecida como responsável.
     */
    if (
      phoneMatchesResponsible ||
      nameMatchesResponsible ||
      outgoingMessage
    ) {
      senderType = "responsible";
    } else {
      senderType = "customer";
    }

    console.log(
      "IDENTIFICAÇÃO DA MENSAGEM:",
      {
        direction:
          data.direction ?? null,

        senderName:
          data.senderName ?? null,

        responsibleName:
          project.responsibleUser
            ?.name ?? null,

        senderPhone:
          data.senderPhone ?? null,

        responsiblePhone:
          project.responsibleUser
            ?.phone ?? null,

        phoneMatchesResponsible,

        nameMatchesResponsible,

        outgoingMessage,

        senderType,
      }
    );

    /**
     * senderPhone é obrigatório
     * no banco.
     */
    const senderPhoneForStorage =
      data.senderPhone?.trim() ||
      (
        senderType === "responsible"
          ? project.responsibleUser
              ?.phone?.trim() ||
            "outgoing_team"
          : "unknown_customer"
      );

    console.log(
      "TIPO IDENTIFICADO:",
      senderType
    );

    const message =
      await prisma.message.create({
        data: {
          projectId: project.id,

          externalMessageId:
            data.externalMessageId,

          senderPhone:
            senderPhoneForStorage,

          senderName:
            data.senderName,

          senderType,

          body: data.body,

          sentAt,
        },
      });

    /**
     * O SLA só é processado quando
     * o projeto possui responsável
     * e setor.
     */
    const projectReadyForSla =
      Boolean(
        project.responsibleUserId
      ) &&
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
     * Ajusta o SLA conforme o cargo
     * do responsável.
     */
    if (
      project.responsibleUser
    ) {
      const targetSla =
        getDefaultSlaMinutesByRole(
          project.responsibleUser.role
        );

      if (
        project.slaMinutes !==
        targetSla
      ) {
        project =
          await prisma.project.update({
            where: {
              id: project.id,
            },

            data: {
              slaMinutes:
                targetSla,
            },

            include: {
              responsibleUser: true,
            },
          });
      }
    }

    /**
     * Cliente foi o último:
     * abre ou mantém o ticket.
     */
    if (
      senderType === "customer"
    ) {
      await slaService
        .handleIncomingCustomerMessage(
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
     * Responsável respondeu:
     * encerra o ticket aberto ou atrasado.
     */
    if (
      senderType === "responsible"
    ) {
      await slaService
        .handleResponsibleReply(
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

      identification: {
        phoneMatchesResponsible,
        nameMatchesResponsible,
        outgoingMessage,
      },

      projectId:
        project.id,

      projectName:
        project.name,

      pendingConfiguration: false,
    };
  }
}
