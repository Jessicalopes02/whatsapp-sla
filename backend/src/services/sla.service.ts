import { prisma } from "../repositories/prisma";
import { addMinutes } from "../utils/date";

export class SlaService {
  async handleIncomingCustomerMessage(params: {
    projectId: string;
    messageId: string;
    sentAt: Date;
  }) {
    const project = await prisma.project.findUnique({
      where: { id: params.projectId },
    });

    if (!project) return null;

    const openTicket = await prisma.slaTicket.findFirst({
      where: {
        projectId: params.projectId,
        status: "open",
      },
    });

    if (openTicket) return openTicket;

    return prisma.slaTicket.create({
      data: {
        projectId: params.projectId,
        openedMessageId: params.messageId,
        openedAt: params.sentAt,
        deadlineAt: addMinutes(params.sentAt, project.slaMinutes),
        status: "open",
      },
    });
  }

  async handleResponsibleReply(params: {
    projectId: string;
    messageId: string;
    sentAt: Date;
  }) {
    const openTicket = await prisma.slaTicket.findFirst({
      where: {
        projectId: params.projectId,
        status: "open",
      },
      orderBy: {
        openedAt: "asc",
      },
    });

    if (!openTicket) return null;

    const delaySeconds =
      params.sentAt > openTicket.deadlineAt
        ? Math.floor(
            (params.sentAt.getTime() - openTicket.deadlineAt.getTime()) / 1000
          )
        : 0;

    return prisma.slaTicket.update({
      where: { id: openTicket.id },
      data: {
        answeredMessageId: params.messageId,
        answeredAt: params.sentAt,
        status:
          params.sentAt <= openTicket.deadlineAt
            ? "answered_on_time"
            : "answered_late",
        delaySeconds,
      },
    });
  }
}