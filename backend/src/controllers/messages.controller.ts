import { Request, Response } from "express";
import { MessagesService } from "../services/messages.service";

const service = new MessagesService();

export class MessagesController {
  ingest = async (req: Request, res: Response) => {
    const result = await service.ingest(req.body);
    res.status(201).json(result);
  };
}