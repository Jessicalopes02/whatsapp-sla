import { prisma } from "../repositories/prisma";
import { SlaService } from "./sla.service";

const slaService = new SlaService();

type IngestMessageDTO = {
  externalMessageId: string;
  groupExternalId: string;
  groupName?: string;
  responsibleName?: string;
  senderPhone: string;
  senderName?: string;
  body?: string;
  sentAt: string;
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

function getDefaultSlaMinutesByRole(role?: string) {
  if (role === "sales_support") return 120;
  if (role === "cs") return 60;
  if (role === "comercial") return 60;
  return 60;
}

export class MessagesService {
  async ingest(data: IngestMessageDTO) {
    console.log("GROUP RECEBIDO:", data.groupExternalId);
    console.log("GROUP NAME:", data.groupName);
    console.log("RESPONSÁVEL RECEBIDO:", data.responsibleName);

    const sentAt = new Date(data.sentAt);

    let project = await prisma.project.findUnique({
      where: { groupExternalId: data.groupExternalId },
      include: { responsibleUser: true },
    });

    // 🔥 CRIA PROJETO DIRETO (SEM PENDING)
    if (!project) {
      project = await prisma.project.create({
        data: {
          name: data.groupName ?? `Projeto ${data.groupExternalId}`,
          groupExternalId: data.groupExternalId,
          groupName: data.groupName ?? `Grupo ${data.groupExternalId}`,
          responsibleUserId: null,
          sectorId: null,
          slaMinutes: 60,
          active: true,
          lastMessageBody: data.body ?? null,
          lastSenderName: data.senderName ?? null,
          lastMessageAt: sentAt,
        },
        include: {
          responsibleUser: true,
        },
      });

      console.log("PROJECT CRIADO DIRETO:", project.id);
    } else {
      // 🔁 ATUALIZA ÚLTIMA MENSAGEM
      project = await prisma.project.update({
        where: { id: project.id },
        data: {
          name: project.name || data.groupName || `Projeto ${data.groupExternalId}`,
          groupName: data.groupName ?? project.groupName,
          lastMessageBody: data.body ?? project.lastMessageBody,
          lastSenderName: data.senderName ?? project.lastSenderName,
          lastMessageAt: sentAt,
        },
        include: {
          responsibleUser: true,
        },
      });
    }

    // 🚫 PROTEÇÃO (TS + runtime)
    if (!project) {
      return {
        ignored: true,
        reason: "project_not_available_after_upsert",
        groupExternalId: data.groupExternalId,
      };
    }

    if (!project.active) {
      return { ignored: true, reason: "project_inactive" };
    }

    const normalizedSenderPhone = normalizePhone(data.senderPhone);

    const normalizedResponsiblePhone = project.responsibleUser?.phone
      ? normalizePhone(project.responsibleUser.phone)
      : null;

    const senderType =
      normalizedResponsiblePhone &&
      normalizedSenderPhone === normalizedResponsiblePhone
        ? "responsible"
        : "customer";

    // 💬 SALVA MENSAGEM
    const message = await prisma.message.upsert({
      where: { externalMessageId: data.externalMessageId },
      update: {},
      create: {
        projectId: project.id,
        externalMessageId: data.externalMessageId,
        senderPhone: data.senderPhone,
        senderName: data.senderName,
        senderType,
        body: data.body,
        sentAt,
      },
    });

    // 🚧 SÓ COMEÇA SLA SE PROJETO ESTIVER CONFIGURADO
    const projectReadyForSla =
      !!project.responsibleUserId && !!project.sectorId;

    if (!projectReadyForSla) {
      return {
        success: true,
        messageId: message.id,
        senderType,
        projectId: project.id,
        projectName: project.name,
        pendingConfiguration: true,
        reason: "project_without_responsible_or_sector",
      };
    }

    // 🔁 AJUSTA SLA AUTOMATICAMENTE PELO CARGO
    if (project.responsibleUser) {
      const targetSla = getDefaultSlaMinutesByRole(project.responsibleUser.role);

      if (project.slaMinutes !== targetSla) {
        project = await prisma.project.update({
          where: { id: project.id },
          data: {
            slaMinutes: targetSla,
          },
          include: {
            responsibleUser: true,
          },
        });
      }
    }

    // 📥 MENSAGEM DO CLIENTE
    if (senderType === "customer") {
      await slaService.handleIncomingCustomerMessage({
        projectId: project.id,
        messageId: message.id,
        sentAt,
      });
    }

    // 📤 RESPOSTA DO RESPONSÁVEL
    if (senderType === "responsible") {
      await slaService.handleResponsibleReply({
        projectId: project.id,
        messageId: message.id,
        sentAt,
      });
    }

    return {
      success: true,
      messageId: message.id,
      senderType,
      projectId: project.id,
      projectName: project.name,
      pendingConfiguration: false,
    };
  }
}