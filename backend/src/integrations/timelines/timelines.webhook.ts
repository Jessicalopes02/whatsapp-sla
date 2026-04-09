import { Request, Response } from "express";
import { MessagesService } from "../../services/messages.service";
import { TimelinesProvider } from "./timelines.provider";
import {
  isTimelineGroupMessage,
  mapTimelineMessage,
} from "./timelines.mapper";

const messagesService = new MessagesService();
const timelinesProvider = new TimelinesProvider();

const WEBHOOK_TOKEN = process.env.TIMELINES_WEBHOOK_TOKEN || "dev_token";
const TEST_SEND_TOKEN =
  process.env.TIMELINES_TEST_SEND_TOKEN || WEBHOOK_TOKEN || "dev_token";

export class TimelinesWebhookController {
  receive = async (req: Request, res: Response) => {
    try {
      const token = req.query.token;

      if (token !== WEBHOOK_TOKEN) {
        return res.status(401).json({
          error: "invalid_token",
        });
      }

      const payload = req.body;

      console.log(
        "PAYLOAD TIMELINES:",
        JSON.stringify(payload, null, 2)
      );

      if (!isTimelineGroupMessage(payload)) {
        return res.status(200).json({
          received: true,
          ignored: true,
          reason: "not_group_message",
        });
      }

      const mapped = mapTimelineMessage(payload);

      console.log("MAPPED TIMELINES:", mapped);

      if (
        !mapped.externalMessageId ||
        !mapped.groupExternalId ||
        !mapped.senderPhone
      ) {
        return res.status(200).json({
          received: true,
          ignored: true,
          reason: "missing_fields",
          mapped,
        });
      }

      const result = await messagesService.ingest({
        externalMessageId: mapped.externalMessageId,
        groupExternalId: mapped.groupExternalId,
        groupName: mapped.groupName ?? undefined,
        responsibleName: mapped.responsibleName ?? undefined,
        senderPhone: mapped.senderPhone,
        senderName: mapped.senderName ?? undefined,
        body: mapped.body ?? undefined,
        sentAt: mapped.sentAt,
      });

      console.log("RESULTADO INGEST:", result);

      return res.json({
        received: true,
        result,
      });
    } catch (error) {
      console.error("Erro no webhook TimelinesAI", error);

      return res.status(500).json({
        received: false,
      });
    }
  };

  testSend = async (req: Request, res: Response) => {
    try {
      const token = req.query.token;

      if (token !== TEST_SEND_TOKEN) {
        return res.status(401).json({
          error: "invalid_token",
        });
      }

      const { phone, text } = req.body as {
        phone?: string;
        text?: string;
      };

      if (!phone || !text) {
        return res.status(400).json({
          ok: false,
          error: "phone_and_text_are_required",
        });
      }

      const result = await timelinesProvider.sendMessage({
        phone,
        text,
      });

      return res.status(result.ok ? 200 : 502).json(result);
    } catch (error) {
      console.error("Erro no teste de envio TimelinesAI", error);

      return res.status(500).json({
        ok: false,
        error: "internal_test_send_error",
      });
    }
  };
}