import axios from "axios";

export type TimelinesSendMessageResult = {
  ok: boolean;
  providerMessageId?: string | null;
  error?: string | null;
  raw?: unknown;
};

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("55")) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

export class TimelinesProvider {
  private readonly baseUrl: string;
  private readonly token: string | undefined;

  constructor() {
    this.baseUrl =
      process.env.TIMELINES_API_BASE_URL ||
      "https://app.timelines.ai/integrations/api";

    this.token = process.env.TIMELINES_API_TOKEN;
  }

  async sendMessage(params: {
    phone: string;
    text: string;
  }): Promise<TimelinesSendMessageResult> {
    if (!this.token) {
      return {
        ok: false,
        error: "TIMELINES_API_TOKEN não configurado",
      };
    }

    const normalizedPhone = normalizePhone(params.phone);

    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          phone: normalizedPhone,
          text: params.text,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      return {
        ok: true,
        providerMessageId:
          response.data?.data?.message_uid ??
          response.data?.message_uid ??
          response.data?.id ??
          null,
        raw: response.data,
      };
    } catch (error: any) {
      const providerError =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.status ||
        error?.message ||
        "Falha desconhecida ao enviar mensagem";

      return {
        ok: false,
        error: providerError,
        raw: error?.response?.data ?? null,
      };
    }
  }
}