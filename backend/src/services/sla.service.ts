import { prisma } from "../repositories/prisma";
import { addMinutes } from "../utils/date";

export class SlaService {
  async handleIncomingCustomerMessage(params: {
    projectId: string;
    messageId: string;
    sentAt: Date;
  }) {
    const project = await prisma.project.findUnique({
      where: {
        id: params.projectId,
      },
    });

    if (!project) {
      return null;
    }

    /**
     * Verifica se o projeto já possui um ticket
     * aguardando resposta.
     *
     * Um ticket vencido também continua aguardando
     * resposta, portanto precisamos considerar:
     *
     * open
     * overdue
     */
    const pendingTicket =
      await prisma.slaTicket.findFirst({
        where: {
          projectId: params.projectId,
          status: {
            in: ["open", "overdue"],
          },
        },
        orderBy: {
          openedAt: "asc",
        },
      });

    /**
     * Se já existe um ticket pendente, uma nova
     * mensagem do cliente não deve abrir outro ticket.
     */
    if (pendingTicket) {
      return pendingTicket;
    }

    return prisma.slaTicket.create({
      data: {
        projectId: params.projectId,
        openedMessageId: params.messageId,
        openedAt: params.sentAt,
        deadlineAt: addMinutes(
          params.sentAt,
          project.slaMinutes
        ),
        status: "open",
      },
    });
  }

  async handleResponsibleReply(params: {
    projectId: string;
    messageId: string;
    sentAt: Date;
  }) {
    /**
     * Procura tanto tickets dentro do prazo
     * quanto tickets que já venceram.
     */
    const pendingTicket =
      await prisma.slaTicket.findFirst({
        where: {
          projectId: params.projectId,
          status: {
            in: ["open", "overdue"],
          },
        },
        orderBy: {
          openedAt: "asc",
        },
      });

    /**
     * Caso não exista ticket aguardando resposta,
     * apenas registra a mensagem, sem alterar SLA.
     */
    if (!pendingTicket) {
      return null;
    }

    const answeredOnTime =
      params.sentAt <= pendingTicket.deadlineAt;

    const delaySeconds = answeredOnTime
      ? 0
      : Math.max(
          0,
          Math.floor(
            (params.sentAt.getTime() -
              pendingTicket.deadlineAt.getTime()) /
              1000
          )
        );

    return prisma.slaTicket.update({
      where: {
        id: pendingTicket.id,
      },
      data: {
        answeredMessageId: params.messageId,
        answeredAt: params.sentAt,

        status: answeredOnTime
          ? "answered_on_time"
          : "answered_late",

        delaySeconds,
      },
    });
  }
}
