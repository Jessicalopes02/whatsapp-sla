type TimelineMessagePayload = any;

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
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  const chatUrl =
    payload?.chat?.chat_url ??
    payload?.data?.chat?.chat_url ??
    payload?.chat_url ??
    null;

  if (typeof chatUrl === "string") {
    const match = chatUrl.match(/\/chat\/(\d+)\/messages/i);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}

function extractMessageId(payload: any, groupExternalId: string | null): string {
  const candidates = [
    payload?.message?.id,
    payload?.message?.messageId,
    payload?.message?.externalMessageId,
    payload?.id,
    payload?.message_id,
  ];

  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value);
    }
  }

  return `${groupExternalId ?? "chat"}_${Date.now()}`;
}

export function mapTimelineMessage(payload: TimelineMessagePayload) {
  const groupExternalId = extractChatId(payload);

  const senderPhone =
    payload?.message?.senderPhone ??
    payload?.message?.from ??
    payload?.message?.author ??
    payload?.message?.sender?.phone ??
    payload?.sender?.phone ??
    payload?.phone ??
    payload?.sender_phone ??
    null;

  const senderName =
    payload?.message?.senderName ??
    payload?.message?.fromName ??
    payload?.message?.sender?.name ??
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
    payload?.text ??
    payload?.message?.content ??
    "";

  const sentAt =
    payload?.message?.sentAt ??
    payload?.message?.timestamp ??
    payload?.message?.createdAt ??
    payload?.message?.created_at ??
    payload?.created_at ??
    new Date().toISOString();

  return {
    externalMessageId: extractMessageId(payload, groupExternalId),
    groupExternalId,
    groupName,
    responsibleName,
    senderPhone,
    senderName,
    body,
    sentAt,
  };
}

export function isTimelineGroupMessage(payload: any) {
  if (payload?.chat?.is_group === true) {
    return true;
  }

  if (payload?.data?.chat?.is_group === true) {
    return true;
  }

  if (payload?.event_type === "message:received:new") {
    return (
      payload?.chat?.is_group === true || payload?.data?.chat?.is_group === true
    );
  }

  return false;
}