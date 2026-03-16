import { prisma } from "../repositories/prisma";
import { SlaService } from "./sla.service";

const slaService = new SlaService();

type IngestMessageDTO = {
  externalMessageId: string;
  groupExternalId: string;
  senderPhone: string;
  senderName?: string;
  body?: string;
  sentAt: string;
};

export class MessagesService {
  async ingest(data: IngestMessageDTO) {
    const project = await prisma.project.findUnique({
      where: { groupExternalId: data.groupExternalId },
      include: { responsibleUser: true },
    });

    if (!project || !project.active) {
      return { ignored: true, reason: "project_not_found_or_inactive" };
    }

    const senderType =
      data.senderPhone === project.responsibleUser.phone
        ? "responsible"
        : "customer";

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
        sentAt: new Date(data.sentAt),
      },
    });

    if (senderType === "customer") {
      await slaService.handleIncomingCustomerMessage({
        projectId: project.id,
        messageId: message.id,
        sentAt: new Date(data.sentAt),
      });
    }

    if (senderType === "responsible") {
      await slaService.handleResponsibleReply({
        projectId: project.id,
        messageId: message.id,
        sentAt: new Date(data.sentAt),
      });
    }

    return {
      success: true,
      messageId: message.id,
      senderType,
    };
  }
}