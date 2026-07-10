import axios from "axios";

export type TimelinesSendMessageResult = {
  ok: boolean;
  providerMessageId?: string | null;
  error?: string | null;
  raw?: unknown;
};

export type TimelinesChat = {
  id: string | number;
  name?: string | null;
  jid?: string | null;
  is_group?: boolean;
  closed?: boolean;
  read?: boolean;
  unattended?: boolean;
  responsible_name?: string | null;
  responsible_email?: string | null;
  last_message_uid?: string | null;
  last_message_timestamp?: string | null;
  whatsapp_account_id?: string | null;
  chat_url?: string | null;
};

export type TimelinesListGroupsResult = {
  ok: boolean;
  chats: TimelinesChat[];
  error?: string | null;
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

  async listActiveGroups(): Promise<TimelinesListGroupsResult> {
    if (!this.token) {
      return {
        ok: false,
        chats: [],
        error: "TIMELINES_API_TOKEN não configurado",
      };
    }

    try {
      const groupsById = new Map<string, TimelinesChat>();

      let page = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        console.log(
          `Buscando grupos ativos da TimelinesAI - página ${page}`
        );

        const response = await axios.get(
          `${this.baseUrl}/chats`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
              Accept: "application/json",
            },
            params: {
              group: true,
              closed: false,
              page,
            },
            timeout: 30000,
          }
        );

        if (response.data?.status !== "ok") {
          throw new Error(
            response.data?.message ||
              "A TimelinesAI retornou uma resposta inválida"
          );
        }

        const responseData = response.data?.data ?? {};

        const pageChats: TimelinesChat[] =
          Array.isArray(responseData.chats)
            ? responseData.chats
            : [];

        for (const chat of pageChats) {
          const isActiveGroup =
            chat.is_group === true &&
            chat.closed !== true;

          if (!isActiveGroup || chat.id === undefined) {
            continue;
          }

          groupsById.set(String(chat.id), chat);
        }

        hasMorePages =
          responseData.has_more_pages === true;

        page += 1;

        // Proteção para não entrar em loop infinito
        if (page > 1000) {
          console.warn(
            "Busca da TimelinesAI interrompida após 1000 páginas."
          );

          break;
        }
      }

      const chats = Array.from(groupsById.values());

      console.log(
        `Total de grupos ativos encontrados na TimelinesAI: ${chats.length}`
      );

      return {
        ok: true,
        chats,
      };
    } catch (error: any) {
      const providerError =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.status ||
        error?.message ||
        "Falha desconhecida ao buscar grupos";

      console.error(
        "Erro ao buscar grupos na TimelinesAI:",
        error?.response?.data ?? error
      );

      return {
        ok: false,
        chats: [],
        error: String(providerError),
      };
    }
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
