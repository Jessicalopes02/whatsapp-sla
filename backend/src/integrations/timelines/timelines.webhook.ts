import { Request, Response } from "express";
import { MessagesService } from "../../services/messages.service";
import { mapTimelineMessage, isTimelineGroupMessage } from "./timelines.mapper";

const messagesService = new MessagesService();

export class TimelinesWebhookController {
  async receive(req: Request, res: Response) {
    try {
      const payload = req.body;

      if (!isTimelineGroupMessage(payload)) {
        return res.status(200).json({
          received: true,
          ignored: true,
          reason: "not_group_message",
        });
      }

      const mapped = mapTimelineMessage(payload);

      if (!mapped.externalMessageId || !mapped.groupExternalId || !mapped.senderPhone) {
        return res.status(200).json({
          received: true,
          ignored: true,
          reason: "missing_fields",
        });
      }

      const result = await messagesService.ingest({
        externalMessageId: mapped.externalMessageId,
        groupExternalId: mapped.groupExternalId,
        senderPhone: mapped.senderPhone,
        senderName: mapped.senderName,
        body: mapped.body,
        sentAt: mapped.sentAt,
      });

      return res.json({
        received: true,
        result,
      });

    } catch (error) {
      console.error("Erro no webhook timelines", error);

      return res.status(500).json({
        received: false,
      });
    }
  }
}