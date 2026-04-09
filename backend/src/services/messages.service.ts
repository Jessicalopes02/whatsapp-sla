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

function normalizeName(name?: string | null) {
  return (name ?? "").trim().toLowerCase();
}

function getDefaultSlaMinutesByRole(role?: string) {
  if (role === "sales_support") return 120;
  if (role === "cs") return 60;
  return 60;
}

export class MessagesService {
  async ingest(data: IngestMessageDTO) {
    console.log("GROUP RECEBIDO:", data.groupExternalId);
    console.log("GROUP NAME:", data.groupName);
    console.log("RESPONSÁVEL RECEBIDO:", data.responsibleName);

    let project = await prisma.project.findUnique({
      where: { groupExternalId: data.groupExternalId },
      include: { responsibleUser: true },
    });

    if (!project && data.responsibleName) {
      const normalizedResponsibleName = normalizeName(data.responsibleName);

      const users = await prisma.user.findMany({
        where: { active: true },
      });

      const responsibleUser =
        users.find((user) => {
          const userName = normalizeName(user.name);

          return (
            userName === normalizedResponsibleName ||
            userName.includes(normalizedResponsibleName) ||
            normalizedResponsibleName.includes(userName)
          );
        }) ?? null;

      if (responsibleUser) {
        project = await prisma.project.create({
          data: {
            name: data.groupName ?? `Projeto ${data.groupExternalId}`,
            groupExternalId: data.groupExternalId,
            groupName: data.groupName ?? `Grupo ${data.groupExternalId}`,
            responsibleUserId: responsibleUser.id,
            slaMinutes: getDefaultSlaMinutesByRole(responsibleUser.role),
            active: true,
          },
          include: {
            responsibleUser: true,
          },
        });

        await prisma.pendingGroup.deleteMany({
          where: { groupExternalId: data.groupExternalId },
        });

        console.log("PROJECT CRIADO AUTOMATICAMENTE:", project.id);
      }
    }

    if (!project) {
      await prisma.pendingGroup.upsert({
        where: {
          groupExternalId: data.groupExternalId,
        },
        update: {
          groupName: data.groupName ?? undefined,
          responsibleName: data.responsibleName ?? undefined,
          lastMessageAt: new Date(data.sentAt),
        },
        create: {
          groupExternalId: data.groupExternalId,
          groupName: data.groupName ?? null,
          responsibleName: data.responsibleName ?? null,
          lastMessageAt: new Date(data.sentAt),
        },
      });

      return {
        ignored: true,
        reason: "group_pending_identification",
        groupExternalId: data.groupExternalId,
      };
    }

    if (!project.active) {
      return { ignored: true, reason: "project_inactive" };
    }

    const normalizedSenderPhone = normalizePhone(data.senderPhone);
    const normalizedResponsiblePhone = normalizePhone(
      project.responsibleUser.phone
    );

    const senderType =
      normalizedSenderPhone === normalizedResponsiblePhone
        ? "responsible"
        : "customer";

    const sentAt = new Date(data.sentAt);

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

    if (senderType === "customer") {
      await slaService.handleIncomingCustomerMessage({
        projectId: project.id,
        messageId: message.id,
        sentAt,
      });
    }

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
    };
  }
}