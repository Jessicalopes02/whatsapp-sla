import { prisma } from "../repositories/prisma";

type DashboardFilters = {
  period?: string;
  userId?: string;
  sectorId?: string;
  status?: string;
};

export class DashboardService {
  private getFromDate(period?: string) {
    const now = new Date();

    if (!period || period === "all") return null;

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

  async summary(filters: DashboardFilters = {}) {
    const now = new Date();
    const fromDate = this.getFromDate(filters.period);

    const projectWhere: any = {
      active: true,
    };

    if (filters.userId) {
      projectWhere.responsibleUserId = filters.userId;
    }

    if (filters.sectorId) {
      projectWhere.sectorId = filters.sectorId;
    }

    const ticketBaseWhere: any = {};

    if (fromDate) {
      ticketBaseWhere.openedAt = {
        gte: fromDate,
      };
    }

    if (filters.userId || filters.sectorId) {
      ticketBaseWhere.project = {};
    }

    if (filters.userId) {
      ticketBaseWhere.project.responsibleUserId = filters.userId;
    }

    if (filters.sectorId) {
      ticketBaseWhere.project.sectorId = filters.sectorId;
    }

    const [totalProjects, slasOpen, slasOverdue, answeredTickets] =
      await Promise.all([
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
        prisma.slaTicket.findMany({
          where: {
            ...ticketBaseWhere,
            status: {
              in: ["answered_on_time", "answered_late"],
            },
            answeredAt: {
              not: null,
            },
          },
        }),
      ]);

    const avgResponseTimeMinutes =
      answeredTickets.length > 0
        ? answeredTickets.reduce((acc, ticket) => {
            if (!ticket.answeredAt) return acc;
            const diffMs =
              ticket.answeredAt.getTime() - ticket.openedAt.getTime();
            return acc + diffMs / 1000 / 60;
          }, 0) / answeredTickets.length
        : 0;

    return {
      generatedAt: now.toISOString(),
      period: filters.period ?? "all",
      userId: filters.userId ?? null,
      sectorId: filters.sectorId ?? null,
      totalProjects,
      slasOpen,
      slasOverdue,
      avgResponseTimeMinutes: Number(avgResponseTimeMinutes.toFixed(2)),
    };
  }

  async byUser(filters: DashboardFilters = {}) {
    const fromDate = this.getFromDate(filters.period);

    const userWhere: any = {
      active: true,
    };

    if (filters.userId) {
      userWhere.id = filters.userId;
    }

    if (filters.sectorId) {
      userWhere.sectorId = filters.sectorId;
    }

    const users = await prisma.user.findMany({
      where: userWhere,
      include: {
        sector: true,
        projects: {
          where: filters.sectorId
            ? {
                sectorId: filters.sectorId,
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
      const allTickets = user.projects.flatMap((project) => project.slaTickets);

      const filteredTickets = fromDate
        ? allTickets.filter((ticket) => ticket.openedAt >= fromDate)
        : allTickets;

      const answeredTickets = filteredTickets.filter(
        (ticket) =>
          ticket.status === "answered_on_time" ||
          ticket.status === "answered_late"
      );

      const avgResponseTimeMinutes =
        answeredTickets.length > 0
          ? answeredTickets.reduce((acc, ticket) => {
              if (!ticket.answeredAt) return acc;
              const diffMs =
                ticket.answeredAt.getTime() - ticket.openedAt.getTime();
              return acc + diffMs / 1000 / 60;
            }, 0) / answeredTickets.length
          : 0;

      return {
        userId: user.id,
        name: user.name,
        phone: user.phone,
        sectorId: user.sectorId,
        sectorName: user.sector?.name ?? null,
        projectsCount: user.projects.length,
        totalTickets: filteredTickets.length,
        openTickets: filteredTickets.filter((ticket) => ticket.status === "open")
          .length,
        overdueTickets: filteredTickets.filter(
          (ticket) => ticket.status === "overdue"
        ).length,
        answeredOnTime: filteredTickets.filter(
          (ticket) => ticket.status === "answered_on_time"
        ).length,
        answeredLate: filteredTickets.filter(
          (ticket) => ticket.status === "answered_late"
        ).length,
        avgResponseTimeMinutes: Number(avgResponseTimeMinutes.toFixed(2)),
      };
    });
  }

  async openDelays(filters: DashboardFilters = {}) {
    const fromDate = this.getFromDate(filters.period);

    const where: any = {
      status: "overdue",
    };

    if (fromDate) {
      where.openedAt = {
        gte: fromDate,
      };
    }

    if (filters.userId || filters.sectorId) {
      where.project = {};
    }

    if (filters.userId) {
      where.project.responsibleUserId = filters.userId;
    }

    if (filters.sectorId) {
      where.project.sectorId = filters.sectorId;
    }

    const tickets = await prisma.slaTicket.findMany({
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

    return tickets.map((ticket) => {
      const delayMinutes = Math.floor(
        (now.getTime() - ticket.deadlineAt.getTime()) / 60000
      );

      return {
        id: ticket.id,
        projectId: ticket.projectId,
        projectName: ticket.project.name,
        groupName: ticket.project.groupName,
        sectorId: ticket.project.sectorId,
        sectorName: ticket.project.sector?.name ?? null,
        responsibleName: ticket.project.responsibleUser.name,
        responsiblePhone: ticket.project.responsibleUser.phone,
        openedAt: ticket.openedAt,
        deadlineAt: ticket.deadlineAt,
        delaySeconds: ticket.delaySeconds,
        delayMinutes,
        privateNotificationSent: ticket.privateNotificationSent,
      };
    });
  }

  async openTickets(filters: DashboardFilters = {}) {
    const fromDate = this.getFromDate(filters.period);

    const where: any = {
      status: "open",
    };

    if (fromDate) {
      where.openedAt = {
        gte: fromDate,
      };
    }

    if (filters.userId || filters.sectorId) {
      where.project = {};
    }

    if (filters.userId) {
      where.project.responsibleUserId = filters.userId;
    }

    if (filters.sectorId) {
      where.project.sectorId = filters.sectorId;
    }

    const tickets = await prisma.slaTicket.findMany({
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

    return tickets.map((ticket) => {
      const waitingMinutes = Math.floor(
        (now.getTime() - ticket.openedAt.getTime()) / 60000
      );

      const minutesToDeadline = Math.floor(
        (ticket.deadlineAt.getTime() - now.getTime()) / 60000
      );

      return {
        id: ticket.id,
        projectId: ticket.projectId,
        projectName: ticket.project.name,
        groupName: ticket.project.groupName,
        sectorId: ticket.project.sectorId,
        sectorName: ticket.project.sector?.name ?? null,
        responsibleName: ticket.project.responsibleUser.name,
        responsiblePhone: ticket.project.responsibleUser.phone,
        openedAt: ticket.openedAt,
        deadlineAt: ticket.deadlineAt,
        waitingMinutes,
        minutesToDeadline,
        isNearDeadline: minutesToDeadline <= 5 && minutesToDeadline >= 0,
        isOverdue: minutesToDeadline < 0,
      };
    });
  }

  async history(filters: DashboardFilters = {}) {
    const fromDate = this.getFromDate(filters.period);

    const where: any = {};

    if (fromDate) {
      where.openedAt = {
        gte: fromDate,
      };
    }

    if (filters.userId || filters.sectorId) {
      where.project = {};
    }

    if (filters.userId) {
      where.project.responsibleUserId = filters.userId;
    }

    if (filters.sectorId) {
      where.project.sectorId = filters.sectorId;
    }

    if (filters.status && filters.status !== "all") {
      where.status = filters.status;
    }

    const tickets = await prisma.slaTicket.findMany({
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
      const responseMinutes = ticket.answeredAt
        ? Math.floor(
            (ticket.answeredAt.getTime() - ticket.openedAt.getTime()) / 60000
          )
        : null;

      return {
        id: ticket.id,
        projectId: ticket.projectId,
        projectName: ticket.project.name,
        groupName: ticket.project.groupName,
        sectorId: ticket.project.sectorId,
        sectorName: ticket.project.sector?.name ?? null,
        responsibleName: ticket.project.responsibleUser.name,
        responsiblePhone: ticket.project.responsibleUser.phone,
        openedAt: ticket.openedAt,
        deadlineAt: ticket.deadlineAt,
        answeredAt: ticket.answeredAt,
        status: ticket.status,
        delaySeconds: ticket.delaySeconds,
        responseMinutes,
        privateNotificationSent: ticket.privateNotificationSent,
      };
    });
  }
}