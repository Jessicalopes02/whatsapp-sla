import { Request, Response } from "express";
import { MessagesService } from "../../services/messages.service";
import { prisma } from "../../repositories/prisma";
import { TimelinesProvider } from "./timelines.provider";
import {
  isTimelineGroupMessage,
  mapTimelineMessage,
} from "./timelines.mapper";

const messagesService = new MessagesService();
const timelinesProvider = new TimelinesProvider();

const WEBHOOK_TOKEN =
  process.env.TIMELINES_WEBHOOK_TOKEN || "dev_token";

const TEST_SEND_TOKEN =
  process.env.TIMELINES_TEST_SEND_TOKEN ||
  WEBHOOK_TOKEN ||
  "dev_token";

function parseTimelineDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

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
        responsibleName:
          mapped.responsibleName ?? undefined,
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
      console.error(
        "Erro no webhook TimelinesAI",
        error
      );

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

      const result =
        await timelinesProvider.sendMessage({
          phone,
          text,
        });

      return res
        .status(result.ok ? 200 : 502)
        .json(result);
    } catch (error) {
      console.error(
        "Erro no teste de envio TimelinesAI",
        error
      );

      return res.status(500).json({
        ok: false,
        error: "internal_test_send_error",
      });
    }
  };

  listGroups = async (req: Request, res: Response) => {
    try {
      const token = req.query.token;

      if (token !== TEST_SEND_TOKEN) {
        return res.status(401).json({
          ok: false,
          error: "invalid_token",
        });
      }

      const result =
        await timelinesProvider.listActiveGroups();

      if (!result.ok) {
        return res.status(502).json({
          ok: false,
          error: result.error,
        });
      }

      const groups = result.chats.map((chat) => ({
        id: String(chat.id),
        name: chat.name ?? "Grupo sem nome",
        jid: chat.jid ?? null,
        closed: chat.closed ?? false,
        lastMessageAt:
          chat.last_message_timestamp ?? null,
        responsibleName:
          chat.responsible_name ?? null,
        chatUrl: chat.chat_url ?? null,
      }));

      return res.status(200).json({
        ok: true,
        total: groups.length,
        groups,
      });
    } catch (error) {
      console.error(
        "Erro ao listar grupos da TimelinesAI:",
        error
      );

      return res.status(500).json({
        ok: false,
        error: "internal_list_groups_error",
      });
    }
  };

  syncGroups = async (req: Request, res: Response) => {
    try {
      const token = req.query.token;

      if (token !== TEST_SEND_TOKEN) {
        return res.status(401).json({
          ok: false,
          error: "invalid_token",
        });
      }

      console.log(
        "Iniciando sincronização dos grupos da TimelinesAI..."
      );

      const result =
        await timelinesProvider.listActiveGroups();

      if (!result.ok) {
        return res.status(502).json({
          ok: false,
          error: result.error,
        });
      }

      const validChats = result.chats.filter(
        (chat) =>
          chat.id !== undefined &&
          chat.id !== null
      );

      const externalIds = validChats.map(
        (chat) => String(chat.id)
      );

      const existingProjects =
        externalIds.length > 0
          ? await prisma.project.findMany({
              where: {
                groupExternalId: {
                  in: externalIds,
                },
              },
              select: {
                groupExternalId: true,
              },
            })
          : [];

      const existingIds = new Set(
        existingProjects.map(
          (project) => project.groupExternalId
        )
      );

      let created = 0;
      let updated = 0;
      let failed = 0;

      const errors: Array<{
        groupExternalId: string;
        groupName: string;
        error: string;
      }> = [];

      const batchSize = 20;

      for (
        let index = 0;
        index < validChats.length;
        index += batchSize
      ) {
        const batch = validChats.slice(
          index,
          index + batchSize
        );

        await Promise.all(
          batch.map(async (chat) => {
            const groupExternalId = String(chat.id);

            const groupName =
              chat.name?.trim() ||
              `Grupo ${groupExternalId}`;

            const lastMessageAt =
              parseTimelineDate(
                chat.last_message_timestamp
              );

            const alreadyExists =
              existingIds.has(groupExternalId);

            try {
              await prisma.project.upsert({
                where: {
                  groupExternalId,
                },

                create: {
                  name: groupName,
                  groupExternalId,
                  groupName,
                  responsibleUserId: null,
                  sectorId: null,
                  slaMinutes: 60,
                  active: true,
                  lastMessageAt,
                },

                update: {
                  name: groupName,
                  groupName,
                  active: true,

                  ...(lastMessageAt
                    ? {
                        lastMessageAt,
                      }
                    : {}),
                },
              });

              if (alreadyExists) {
                updated += 1;
              } else {
                created += 1;
              }
            } catch (error) {
              failed += 1;

              const errorMessage =
                error instanceof Error
                  ? error.message
                  : "Erro desconhecido";

              errors.push({
                groupExternalId,
                groupName,
                error: errorMessage,
              });

              console.error(
                `Erro ao sincronizar o grupo ${groupExternalId}:`,
                error
              );
            }
          })
        );

        console.log(
          `Sincronização: ${Math.min(
            index + batchSize,
            validChats.length
          )}/${validChats.length}`
        );
      }

      console.log(
        "Sincronização de grupos concluída:",
        {
          totalFound: validChats.length,
          created,
          updated,
          failed,
        }
      );

      return res.status(200).json({
        ok: failed === 0,
        totalFound: validChats.length,
        created,
        updated,
        failed,
        errors: errors.slice(0, 20),
      });
    } catch (error) {
      console.error(
        "Erro ao sincronizar grupos da TimelinesAI:",
        error
      );

      return res.status(500).json({
        ok: false,
        error: "internal_sync_groups_error",
      });
    }
  };
}
