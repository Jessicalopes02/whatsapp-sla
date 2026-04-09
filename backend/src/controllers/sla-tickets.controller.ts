import { Request, Response } from "express";
import { prisma } from "../repositories/prisma";

const ALLOWED_MANUAL_CLOSE_STATUS = [
  "closed_manual",
  "no_response_needed",
] as const;

type ManualCloseStatus = (typeof ALLOWED_MANUAL_CLOSE_STATUS)[number];

export class SlaTicketsController {
  close = async (req: Request, res: Response) => {
    try {
      const ticketId = String(req.params.id || "");
      const status = req.body?.status as ManualCloseStatus | undefined;

      if (!ticketId) {
        return res.status(400).json({
          error: "ticket_id_is_required",
        });
      }

      if (!status || !ALLOWED_MANUAL_CLOSE_STATUS.includes(status)) {
        return res.status(400).json({
          error: "invalid_status",
          allowed: ALLOWED_MANUAL_CLOSE_STATUS,
        });
      }

      const ticket = await prisma.slaTicket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return res.status(404).json({
          error: "ticket_not_found",
        });
      }

      if (ticket.status !== "open" && ticket.status !== "overdue") {
        return res.status(409).json({
          error: "ticket_cannot_be_closed_in_current_status",
          currentStatus: ticket.status,
        });
      }

      const now = new Date();

      const updatedTicket = await prisma.slaTicket.update({
        where: { id: ticketId },
        data: {
          status,
          answeredAt: now,
          delaySeconds:
            now > ticket.deadlineAt
              ? Math.floor(
                  (now.getTime() - ticket.deadlineAt.getTime()) / 1000
                )
              : 0,
        },
      });

      return res.json({
        success: true,
        ticket: updatedTicket,
      });
    } catch (error) {
      console.error("Erro ao encerrar ticket manualmente", error);

      return res.status(500).json({
        error: "internal_close_ticket_error",
      });
    }
  };
}