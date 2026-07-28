import { prisma } from "../repositories/prisma";

type DashboardFilters = {
  period?: string;
  userId?: string;
  sectorId?: string;
  status?: string;
};

const HANDLED_STATUSES = new Set([
  "answered_on_time",
  "answered_late",
  "closed_manual",
  "no_response_needed",
]);

const RESPONSE_METRIC_STATUSES = [
  "answered_on_time",
  "answered_late",
  "closed_manual",
  "no_response_needed",
];

type TicketForAverage = {
  openedAt: Date;
  answeredAt: Date | null;
  answeredMessageId: string | null;
};

export class DashboardService {
  private getFromDate(period?: string) {
    const now = new Date();

    if (!period || period === "all") {
      return null;
    }

    if (period === "today") {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }

    if (period === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return start;
    }

    if (period === "30d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return start;
    }

    return null;
  }

  private calculateAverageResponseTimeMinutes(
    tickets: TicketForAverage[]
  ) {
    /**
     * Só entra na média quando existe uma
     * mensagem real registrada como resposta.
     *
     * O simples clique em encerrar não deve
     * inventar um tempo de resposta.
     */
    const validTickets = tickets.filter(
      (ticket) =>
        ticket.answeredAt !== null &&
        ticket.answeredMessageId !== null
    );

    if (validTickets.length === 0) {
      return 0;
    }

    const totalMinutes = validTickets.reduce(
      (accumulator, ticket) => {
        if (!ticket.answeredAt) {
          return accumulator;
        }

        const differenceMilliseconds =
          ticket.answeredAt.getTime() -
          ticket.openedAt.getTime();

        const differenceMinutes = Math.max(
          0,
          differenceMilliseconds / 1000 / 60
        );

        return accumulator + differenceMinutes;
      },
      0
    );

    return Number(
      (
        totalMinutes / validTickets.length
      ).toFixed(2)
    );
  }

  private async getLastMessageForTicket(
    projectId: string,
    openedAt: Date
  ) {
    return prisma.message.findFirst({
      where: {
        projectId,
        sentAt: {
          gte: openedAt,
        },
      },
      orderBy: {
        sentAt: "desc",
      },
      select: {
        id: true,
        body: true,
        senderName: true,
        senderPhone: true,
        senderType: true,
        sentAt: true,
      },
    });
  }

  async summary(
    filters: DashboardFilters = {}
  ) {
    const now = new Date();
    const fromDate = this.getFromDate(
      filters.period
    );

    const projectWhere: any = {
      active: true,
    };

    if (filters.userId) {
      projectWhere.responsibleUserId =
        filters.userId;
    }

    if (filters.sectorId) {
      projectWhere.sectorId =
        filters.sectorId;
    }

    const ticketBaseWhere: any = {};

    if (fromDate) {
      ticketBaseWhere.openedAt = {
        gte: fromDate,
      };
    }

    if (
      filters.userId ||
      filters.sectorId
    ) {
      ticketBaseWhere.project = {};
    }

    if (filters.userId) {
      ticketBaseWhere.project.responsibleUserId =
        filters.userId;
    }

    if (filters.sectorId) {
      ticketBaseWhere.project.sectorId =
        filters.sectorId;
    }

    const [
      totalProjects,
      slasOpen,
      slasOverdue,
      answeredOnTime,
      answeredLate,
      closedManual,
      noResponseNeeded,
      responseTickets,
    ] = await Promise.all([
      prisma.project.count({
        where: projectWhere,
      }),

      prisma.slaTicket.count({
        where: {
          ...ticketBaseWhere,
          status: "open",
        },
      }),

      prisma.slaTicket.count({
        where: {
          ...ticketBaseWhere,
          status: "overdue",
        },
      }),

      prisma.slaTicket.count({
        where: {
          ...ticketBaseWhere,
          status: "answered_on_time",
        },
      }),

      prisma.slaTicket.count({
        where: {
          ...ticketBaseWhere,
          status: "answered_late",
        },
      }),

      prisma.slaTicket.count({
        where: {
          ...ticketBaseWhere,
          status: "closed_manual",
        },
      }),

      prisma.slaTicket.count({
        where: {
          ...ticketBaseWhere,
          status: "no_response_needed",
        },
      }),

      prisma.slaTicket.findMany({
        where: {
          ...ticketBaseWhere,

          status: {
            in: RESPONSE_METRIC_STATUSES,
          },

          answeredAt: {
            not: null,
          },

          answeredMessageId: {
            not: null,
          },
        },

        select: {
          openedAt: true,
          answeredAt: true,
          answeredMessageId: true,
        },
      }),
    ]);

    const avgResponseTimeMinutes =
      this.calculateAverageResponseTimeMinutes(
        responseTickets
      );

    const totalHandled =
      answeredOnTime +
      answeredLate +
      closedManual +
      noResponseNeeded;

    const totalTickets =
      slasOpen +
      slasOverdue +
      totalHandled;

    return {
      generatedAt: now.toISOString(),
      period: filters.period ?? "all",
      userId: filters.userId ?? null,
      sectorId: filters.sectorId ?? null,

      totalProjects,
      totalTickets,

      slasOpen,
      slasOverdue,

      answeredOnTime,
      answeredLate,

      closedManual,
      noResponseNeeded,

      totalHandled,

      /**
       * Quantos tickets realmente possuem
       * resposta válida para cálculo da média.
       */
      responseCount: responseTickets.length,

      avgResponseTimeMinutes,
    };
  }

  async byUser(
    filters: DashboardFilters = {}
  ) {
    const fromDate = this.getFromDate(
      filters.period
    );

    const userWhere: any = {
      active: true,
    };

    if (filters.userId) {
      userWhere.id = filters.userId;
    }

    if (filters.sectorId) {
      userWhere.sectorId =
        filters.sectorId;
    }

    const users = await prisma.user.findMany({
      where: userWhere,

      include: {
        sector: true,

        projects: {
          where: filters.sectorId
            ? {
                sectorId:
                  filters.sectorId,
              }
            : undefined,

          include: {
            slaTickets: true,
          },
        },
      },

      orderBy: {
        name: "asc",
      },
    });

    return users.map((user) => {
      const allTickets =
        user.projects.flatMap(
          (project) =>
            project.slaTickets
        );

      const filteredTickets = fromDate
        ? allTickets.filter(
            (ticket) =>
              ticket.openedAt >= fromDate
          )
        : allTickets;

      const openTickets =
        filteredTickets.filter(
          (ticket) =>
            ticket.status === "open"
        ).length;

      const overdueTickets =
        filteredTickets.filter(
          (ticket) =>
            ticket.status === "overdue"
        ).length;

      const answeredOnTime =
        filteredTickets.filter(
          (ticket) =>
            ticket.status ===
            "answered_on_time"
        ).length;

      const answeredLate =
        filteredTickets.filter(
          (ticket) =>
            ticket.status ===
            "answered_late"
        ).length;

      const closedManual =
        filteredTickets.filter(
          (ticket) =>
            ticket.status ===
            "closed_manual"
        ).length;

      const noResponseNeeded =
        filteredTickets.filter(
          (ticket) =>
            ticket.status ===
            "no_response_needed"
        ).length;

      const handledTickets =
        filteredTickets.filter(
          (ticket) =>
            HANDLED_STATUSES.has(
              ticket.status
            )
        );

      /**
       * Entram na média:
       *
       * - respondidos normalmente;
       * - encerrados manualmente com mensagem
       *   real do CS;
       * - sem resposta necessária quando já
       *   houve mensagem real do CS.
       */
      const responseTickets =
        filteredTickets.filter(
          (ticket) =>
            ticket.answeredAt !== null &&
            ticket.answeredMessageId !==
              null &&
            HANDLED_STATUSES.has(
              ticket.status
            )
        );

      const avgResponseTimeMinutes =
        this.calculateAverageResponseTimeMinutes(
          responseTickets
        );

      return {
        userId: user.id,
        name: user.name,
        phone: user.phone,

        sectorId: user.sectorId,
        sectorName:
          user.sector?.name ?? null,

        projectsCount:
          user.projects.length,

        totalTickets:
          filteredTickets.length,

        openTickets,
        overdueTickets,

        answeredOnTime,
        answeredLate,

        closedManual,
        noResponseNeeded,

        totalHandled:
          handledTickets.length,

        responseCount:
          responseTickets.length,

        avgResponseTimeMinutes,
      };
    });
  }

  async openDelays(
    filters: DashboardFilters = {}
  ) {
    const fromDate = this.getFromDate(
      filters.period
    );

    const where: any = {
      status: "overdue",
    };

    if (fromDate) {
      where.openedAt = {
        gte: fromDate,
      };
    }

    if (
      filters.userId ||
      filters.sectorId
    ) {
      where.project = {};
    }

    if (filters.userId) {
      where.project.responsibleUserId =
        filters.userId;
    }

    if (filters.sectorId) {
      where.project.sectorId =
        filters.sectorId;
    }

    const tickets =
      await prisma.slaTicket.findMany({
        where,

        include: {
          project: {
            include: {
              sector: true,
              responsibleUser: true,
            },
          },
        },

        orderBy: {
          deadlineAt: "asc",
        },
      });

    const now = new Date();

    return Promise.all(
      tickets.map(async (ticket) => {
        const delayMinutes = Math.max(
          0,
          Math.floor(
            (now.getTime() -
              ticket.deadlineAt.getTime()) /
              60000
          )
        );

        const lastMessage =
          await this.getLastMessageForTicket(
            ticket.projectId,
            ticket.openedAt
          );

        return {
          id: ticket.id,
          projectId: ticket.projectId,

          projectName:
            ticket.project.name,

          groupName:
            ticket.project.groupName,

          sectorId:
            ticket.project.sectorId,

          sectorName:
            ticket.project.sector
              ?.name ?? null,

          responsibleName:
            ticket.project
              .responsibleUser?.name ??
            null,

          responsiblePhone:
            ticket.project
              .responsibleUser?.phone ??
            null,

          openedAt: ticket.openedAt,
          deadlineAt:
            ticket.deadlineAt,

          delaySeconds:
            ticket.delaySeconds,

          delayMinutes,

          privateNotificationSent:
            ticket.privateNotificationSent,

          /**
           * Dados exibidos no card para
           * decidir se deve encerrar ou marcar
           * sem resposta necessária.
           */
          lastMessageBody:
            lastMessage?.body ??
            ticket.project
              .lastMessageBody ??
            null,

          lastSenderName:
            lastMessage?.senderName ??
            ticket.project
              .lastSenderName ??
            null,

          lastSenderPhone:
            lastMessage?.senderPhone ??
            null,

          lastSenderType:
            lastMessage?.senderType ??
            null,

          lastMessageAt:
            lastMessage?.sentAt ??
            ticket.project
              .lastMessageAt ??
            null,
        };
      })
    );
  }

  async openTickets(
    filters: DashboardFilters = {}
  ) {
    const fromDate = this.getFromDate(
      filters.period
    );

    const where: any = {
      status: "open",
    };

    if (fromDate) {
      where.openedAt = {
        gte: fromDate,
      };
    }

    if (
      filters.userId ||
      filters.sectorId
    ) {
      where.project = {};
    }

    if (filters.userId) {
      where.project.responsibleUserId =
        filters.userId;
    }

    if (filters.sectorId) {
      where.project.sectorId =
        filters.sectorId;
    }

    const tickets =
      await prisma.slaTicket.findMany({
        where,

        include: {
          project: {
            include: {
              sector: true,
              responsibleUser: true,
            },
          },
        },

        orderBy: {
          openedAt: "asc",
        },
      });

    const now = new Date();

    return Promise.all(
      tickets.map(async (ticket) => {
        const waitingMinutes = Math.max(
          0,
          Math.floor(
            (now.getTime() -
              ticket.openedAt.getTime()) /
              60000
          )
        );

        const minutesToDeadline =
          Math.floor(
            (ticket.deadlineAt.getTime() -
              now.getTime()) /
              60000
          );

        const lastMessage =
          await this.getLastMessageForTicket(
            ticket.projectId,
            ticket.openedAt
          );

        return {
          id: ticket.id,
          projectId: ticket.projectId,

          projectName:
            ticket.project.name,

          groupName:
            ticket.project.groupName,

          sectorId:
            ticket.project.sectorId,

          sectorName:
            ticket.project.sector
              ?.name ?? null,

          responsibleName:
            ticket.project
              .responsibleUser?.name ??
            null,

          responsiblePhone:
            ticket.project
              .responsibleUser?.phone ??
            null,

          openedAt: ticket.openedAt,
          deadlineAt:
            ticket.deadlineAt,

          waitingMinutes,
          minutesToDeadline,

          isNearDeadline:
            minutesToDeadline <= 5 &&
            minutesToDeadline >= 0,

          isOverdue:
            minutesToDeadline < 0,

          lastMessageBody:
            lastMessage?.body ??
            ticket.project
              .lastMessageBody ??
            null,

          lastSenderName:
            lastMessage?.senderName ??
            ticket.project
              .lastSenderName ??
            null,

          lastSenderPhone:
            lastMessage?.senderPhone ??
            null,

          lastSenderType:
            lastMessage?.senderType ??
            null,

          lastMessageAt:
            lastMessage?.sentAt ??
            ticket.project
              .lastMessageAt ??
            null,
        };
      })
    );
  }

  async history(
    filters: DashboardFilters = {}
  ) {
    const fromDate = this.getFromDate(
      filters.period
    );

    const where: any = {};

    if (fromDate) {
      where.openedAt = {
        gte: fromDate,
      };
    }

    if (
      filters.userId ||
      filters.sectorId
    ) {
      where.project = {};
    }

    if (filters.userId) {
      where.project.responsibleUserId =
        filters.userId;
    }

    if (filters.sectorId) {
      where.project.sectorId =
        filters.sectorId;
    }

    if (
      filters.status &&
      filters.status !== "all"
    ) {
      where.status = filters.status;
    }

    const tickets =
      await prisma.slaTicket.findMany({
        where,

        include: {
          project: {
            include: {
              sector: true,
              responsibleUser: true,
            },
          },
        },

        orderBy: {
          openedAt: "desc",
        },
      });

    return tickets.map((ticket) => {
      const responseMinutes =
        ticket.answeredAt &&
        ticket.answeredMessageId
          ? Math.max(
              0,
              Math.floor(
                (ticket.answeredAt.getTime() -
                  ticket.openedAt.getTime()) /
                  60000
              )
            )
          : null;

      return {
        id: ticket.id,
        projectId: ticket.projectId,

        projectName:
          ticket.project.name,

        groupName:
          ticket.project.groupName,

        sectorId:
          ticket.project.sectorId,

        sectorName:
          ticket.project.sector
            ?.name ?? null,

        responsibleName:
          ticket.project
            .responsibleUser?.name ??
          null,

        responsiblePhone:
          ticket.project
            .responsibleUser?.phone ??
          null,

        openedAt: ticket.openedAt,
        deadlineAt:
          ticket.deadlineAt,

        answeredAt:
          ticket.answeredAt,

        answeredMessageId:
          ticket.answeredMessageId,

        status: ticket.status,

        delaySeconds:
          ticket.delaySeconds,

        responseMinutes,

        countsInResponseAverage:
          ticket.answeredAt !== null &&
          ticket.answeredMessageId !==
            null,

        isHandled:
          HANDLED_STATUSES.has(
            ticket.status
          ),

        privateNotificationSent:
          ticket.privateNotificationSent,
      };
    });
  }
}
