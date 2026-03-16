import { prisma } from "../repositories/prisma";
import { NotificationService } from "../services/notification.service";

const notificationService = new NotificationService();

export function startCheckOverdueSlasJob() {
  setInterval(async () => {
    const now = new Date();

    const overdueTickets = await prisma.slaTicket.findMany({
      where: {
        status: "open",
        deadlineAt: {
          lt: now,
        },
        privateNotificationSent: false,
      },
      include: {
        project: {
          include: {
            responsibleUser: true,
          },
        },
      },
    });

    for (const ticket of overdueTickets) {
      const delayMinutes = Math.floor(
        (now.getTime() - ticket.deadlineAt.getTime()) / 60000
      );

      await prisma.slaTicket.update({
        where: { id: ticket.id },
        data: {
          status: "overdue",
          privateNotificationSent: true,
          delaySeconds: Math.floor(
            (now.getTime() - ticket.deadlineAt.getTime()) / 1000
          ),
        },
      });

      await notificationService.sendPrivateDelayAlert({
        slaTicketId: ticket.id,
        userId: ticket.project.responsibleUser.id,
        phone: ticket.project.responsibleUser.phone,
        projectName: ticket.project.name,
        delayMinutes,
      });
    }
  }, 60 * 1000);
}