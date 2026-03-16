type TimelineMessagePayload = any;

export function mapTimelineMessage(payload: TimelineMessagePayload) {
  const message =
    payload?.message ??
    payload?.data?.message ??
    payload?.event?.message ??
    payload;

  return {
    externalMessageId:
      message?.id ??
      message?.messageId ??
      message?.externalMessageId ??
      null,

    groupExternalId:
      message?.chatId ??
      message?.groupId ??
      message?.conversationId ??
      message?.groupExternalId ??
      null,

    senderPhone:
      message?.senderPhone ??
      message?.from ??
      message?.author ??
      message?.sender?.phone ??
      null,

    senderName:
      message?.senderName ??
      message?.fromName ??
      message?.sender?.name ??
      null,

    body:
      message?.text ??
      message?.body ??
      message?.message ??
      null,

    sentAt:
      message?.sentAt ??
      message?.timestamp ??
      message?.createdAt ??
      new Date().toISOString(),
  };
}

export function isTimelineGroupMessage(payload: any) {
  const raw =
    payload?.message ??
    payload?.data?.message ??
    payload?.event?.message ??
    payload;

  const chatType =
    raw?.chatType ??
    raw?.conversationType ??
    raw?.type ??
    raw?.chat?.type ??
    "";

  if (typeof chatType === "string") {
    return chatType.toLowerCase().includes("group");
  }

  return true;
}