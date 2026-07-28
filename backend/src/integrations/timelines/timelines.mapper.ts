type TimelineMessagePayload = any;

export type TimelineMessageDirection =
  | "incoming"
  | "outgoing"
  | null;

function extractChatId(payload: any): string | null {
  const directCandidates = [
    payload?.chat?.id,
    payload?.chat?.chat_id,
    payload?.data?.chat?.id,
    payload?.data?.chat?.chat_id,
    payload?.message?.chatId,
    payload?.message?.groupId,
    payload?.message?.conversationId,
    payload?.message?.groupExternalId,
    payload?.chat_id,
  ];

  for (const value of directCandidates) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value);
    }
  }

  const chatUrl =
    payload?.chat?.chat_url ??
    payload?.data?.chat?.chat_url ??
    payload?.chat_url ??
    null;

  if (typeof chatUrl === "string") {
    const match = chatUrl.match(
      /\/chat\/(\d+)\/messages/i
    );

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function extractMessageId(
  payload: any,
  groupExternalId: string | null
): string {
  const candidates = [
    payload?.message?.message_uid,
    payload?.data?.message?.message_uid,
    payload?.message_uid,
    payload?.message?.id,
    payload?.data?.message?.id,
    payload?.message?.messageId,
    payload?.message?.externalMessageId,
    payload?.id,
    payload?.message_id,
  ];

  for (const value of candidates) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return String(value);
    }
  }

  const timestamp =
    payload?.message?.timestamp ??
    payload?.message?.created_at ??
    payload?.created_at ??
    "no-date";

  const body =
    payload?.message?.text ??
    payload?.message?.body ??
    payload?.message?.message ??
    payload?.text ??
    "";

  return [
    groupExternalId ?? "chat",
    timestamp,
    String(body).slice(0, 50),
  ].join("_");
}

function extractDirection(
  payload: any
): TimelineMessageDirection {
  const eventType =
    payload?.event_type ??
    payload?.eventType ??
    payload?.type ??
    null;

  const rawDirection =
    payload?.message?.direction ??
    payload?.data?.message?.direction ??
    payload?.direction ??
    null;

  const normalizedDirection =
    typeof rawDirection === "string"
      ? rawDirection.toLowerCase()
      : "";

  if (
    eventType === "message:sent:new" ||
    normalizedDirection === "sent" ||
    normalizedDirection === "outgoing" ||
    normalizedDirection === "outbound"
  ) {
    return "outgoing";
  }

  if (
    eventType === "message:received:new" ||
    normalizedDirection === "received" ||
    normalizedDirection === "incoming" ||
    normalizedDirection === "inbound"
  ) {
    return "incoming";
  }

  return null;
}

export function mapTimelineMessage(
  payload: TimelineMessagePayload
) {
  const groupExternalId = extractChatId(payload);
  const direction = extractDirection(payload);

  const senderPhone =
    payload?.message?.senderPhone ??
    payload?.message?.sender_phone ??
    payload?.message?.from ??
    payload?.message?.author ??
    payload?.message?.sender?.phone ??
    payload?.message?.sender?.phone_number ??
    payload?.data?.message?.sender?.phone ??
    payload?.data?.message?.sender?.phone_number ??
    payload?.sender?.phone ??
    payload?.sender?.phone_number ??
    payload?.phone ??
    payload?.sender_phone ??
    null;

  const senderName =
    payload?.message?.senderName ??
    payload?.message?.fromName ??
    payload?.message?.sender?.full_name ??
    payload?.message?.sender?.name ??
    payload?.data?.message?.sender?.full_name ??
    payload?.data?.message?.sender?.name ??
    payload?.sender?.full_name ??
    payload?.sender?.name ??
    payload?.contact?.name ??
    payload?.author_name ??
    null;

  const groupName =
    payload?.chat?.full_name ??
    payload?.data?.chat?.full_name ??
    payload?.chat?.name ??
    payload?.data?.chat?.name ??
    null;

  const responsibleName =
    payload?.recipient?.full_name ??
    payload?.data?.recipient?.full_name ??
    payload?.chat?.responsible_name ??
    payload?.data?.chat?.responsible_name ??
    null;

  const body =
    payload?.message?.text ??
    payload?.message?.body ??
    payload?.message?.message ??
    payload?.data?.message?.text ??
    payload?.data?.message?.body ??
    payload?.text ??
    payload?.message?.content ??
    "";

  const sentAt =
    payload?.message?.sentAt ??
    payload?.message?.timestamp ??
    payload?.message?.createdAt ??
    payload?.message?.created_at ??
    payload?.data?.message?.timestamp ??
    payload?.data?.message?.created_at ??
    payload?.created_at ??
    new Date().toISOString();

  return {
    externalMessageId: extractMessageId(
      payload,
      groupExternalId
    ),
    groupExternalId,
    groupName,
    responsibleName,
    senderPhone,
    senderName,
    body,
    sentAt,
    direction,
  };
}

export function isTimelineGroupMessage(
  payload: any
) {
  const eventType =
    payload?.event_type ??
    payload?.eventType ??
    payload?.type ??
    null;

  const isSupportedMessageEvent =
    eventType === "message:received:new" ||
    eventType === "message:sent:new" ||
    eventType === null;

  if (!isSupportedMessageEvent) {
    return false;
  }

  const isGroup =
    payload?.chat?.is_group === true ||
    payload?.data?.chat?.is_group === true ||
    payload?.message?.is_group === true ||
    payload?.data?.message?.is_group === true;

  if (isGroup) {
    return true;
  }

  const groupJid =
    payload?.chat?.jid ??
    payload?.data?.chat?.jid ??
    payload?.message?.chat_jid ??
    null;

  if (
    typeof groupJid === "string" &&
    groupJid.endsWith("@g.us")
  ) {
    return true;
  }

  return false;
}
