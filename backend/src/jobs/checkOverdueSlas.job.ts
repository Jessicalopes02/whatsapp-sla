import { prisma } from "../repositories/prisma";
import { NotificationService } from "../services/notification.service";

const notificationService = new NotificationService();

export function startCheckOverdueSlasJob() {
  setInterval(async () => {
    try {
      const now = new Date();

      const warningTickets = await prisma.slaTicket.findMany({
        where: {
          status: "open",
          warningNotificationSent: false,
          deadlineAt: {
            gt: now,
          },
        },
        include: {
          project: {
            include: {
              responsibleUser: true,
            },
          },
          notifications: true,
        },
      });

      for (const ticket of warningTickets) {
        const minutesToDeadline = Math.floor(
          (ticket.deadlineAt.getTime() - now.getTime()) / 60000
        );

        const alreadyWarned = ticket.notifications.some((notification) => {
          const payload = notification.payload as { kind?: string };

          return (
            notification.type === "private_whatsapp_alert" &&
            payload.kind === "warning"
          );
        });

        if (
          minutesToDeadline <= 5 &&
          minutesToDeadline >= 0 &&
          !alreadyWarned
        ) {
          await notificationService.sendPrivateWarningAlert({
            slaTicketId: ticket.id,
            userId: ticket.project.responsibleUser.id,
            phone: ticket.project.responsibleUser.phone,
            projectName: ticket.project.name,
            minutesToDeadline,
          });

          await prisma.slaTicket.update({
            where: { id: ticket.id },
            data: {
              warningNotificationSent: true,
            },
          });
        }
      }

      const overdueTickets = await prisma.slaTicket.findMany({
        where: {
          status: "open",
          delayNotificationSent: false,
          deadlineAt: {
            lt: now,
          },
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

        if (delayMinutes <= 0) {
          continue;
        }

        await prisma.slaTicket.update({
          where: { id: ticket.id },
          data: {
            status: "overdue",
            delayNotificationSent: true,
            privateNotificationSent: true,
            delaySeconds: delayMinutes * 60,
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
    } catch (error) {
      console.error("Erro no job de SLA", error);
    }
  }, 60 * 1000);
}