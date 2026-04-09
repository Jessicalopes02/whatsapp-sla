import { prisma } from "../repositories/prisma";
import { TimelinesProvider } from "../integrations/timelines/timelines.provider";

type SendResult = {
  ok: boolean;
  providerMessageId?: string | null;
  error?: string | null;
};

const timelinesProvider = new TimelinesProvider();

export class NotificationService {
  async sendPrivateWarningAlert(params: {
    slaTicketId: string;
    userId: string;
    phone: string;
    projectName: string;
    minutesToDeadline: number;
  }) {
    const message = [
      "⚠️ Atenção: prazo de resposta acabando",
      "",
      `Projeto: ${params.projectName}`,
      "",
      "O cliente está aguardando resposta.",
      `Tempo restante: ${params.minutesToDeadline} minutos.`,
      "",
      "Responda o cliente antes do prazo para evitar atraso.",
    ].join("\n");

    const result = await this.sendWhatsappMessage(params.phone, message);

    await prisma.notification.create({
      data: {
        slaTicketId: params.slaTicketId,
        userId: params.userId,
        type: "private_whatsapp_alert",
        status: result.ok ? "sent" : "failed",
        payload: {
          kind: "warning",
          minutesToDeadline: params.minutesToDeadline,
          phone: params.phone,
          projectName: params.projectName,
          providerMessageId: result.providerMessageId ?? null,
          error: result.error ?? null,
        },
        sentAt: result.ok ? new Date() : null,
      },
    });

    if (!result.ok) {
      console.error(
        `[ALERTA WARNING FALHOU] Projeto ${params.projectName} -> ${params.phone}: ${result.error}`
      );
    } else {
      console.log(
        `[ALERTA WARNING ENVIADO] Projeto ${params.projectName} -> ${params.phone}`
      );
    }

    return result;
  }

  async sendPrivateDelayAlert(params: {
    slaTicketId: string;
    userId: string;
    phone: string;
    projectName: string;
    delayMinutes: number;
  }) {
    const message = [
      "🚨 Prazo de resposta expirado",
      "",
      `Projeto: ${params.projectName}`,
      "",
      "O cliente está sem resposta e o prazo já foi ultrapassado.",
      `Atraso atual: ${params.delayMinutes} minutos.`,
      "",
      "Prioridade alta: responder o cliente agora.",
    ].join("\n");

    const ALERT_PHONE = "554792102309";

    const result = await this.sendWhatsappMessage(ALERT_PHONE, message);

    await prisma.notification.create({
      data: {
        slaTicketId: params.slaTicketId,
        userId: params.userId,
        type: "private_whatsapp_alert",
        status: result.ok ? "sent" : "failed",
        payload: {
          kind: "delay",
          delayMinutes: params.delayMinutes,
          phone: params.phone,
          projectName: params.projectName,
          providerMessageId: result.providerMessageId ?? null,
          error: result.error ?? null,
        },
        sentAt: result.ok ? new Date() : null,
      },
    });

    if (!result.ok) {
      console.error(
        `[ALERTA DELAY FALHOU] Projeto ${params.projectName} -> ${params.phone}: ${result.error}`
      );
    } else {
      console.log(
        `[ALERTA DELAY ENVIADO] Projeto ${params.projectName} -> ${params.phone}`
      );
    }

    return result;
  }

  async sendWhatsappMessage(phone: string, text: string): Promise<SendResult> {
    try {
      return await timelinesProvider.sendMessage({ phone, text });
    } catch (error: any) {
      return {
        ok: false,
        error: error?.message ?? "Erro desconhecido ao enviar mensagem",
      };
    }
  }
}