import { prisma } from "../repositories/prisma";

export class NotificationService {
  async sendPrivateDelayAlert(params: {
    slaTicketId: string;
    userId: string;
    phone: string;
    projectName: string;
    delayMinutes: number;
  }) {
    await prisma.notification.create({
      data: {
        slaTicketId: params.slaTicketId,
        userId: params.userId,
        type: "private_whatsapp_alert",
        status: "sent",
        payload: {
          phone: params.phone,
          projectName: params.projectName,
          delayMinutes: params.delayMinutes,
        },
        sentAt: new Date(),
      },
    });

    console.log(
      `[ALERTA] Projeto ${params.projectName} atrasado ${params.delayMinutes} min. Enviar para ${params.phone}`
    );
  }
}