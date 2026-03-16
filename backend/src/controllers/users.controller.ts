import { Request, Response } from "express";
import { UsersService } from "../services/users.service";

const service = new UsersService();

export class UsersController {
  create = async (req: Request, res: Response) => {
    try {
      const user = await service.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      console.error("Erro ao criar usuário", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  };

  list = async (_req: Request, res: Response) => {
    try {
      const users = await service.list();
      res.json(users);
    } catch (error) {
      console.error("Erro ao listar usuários", error);
      res.status(500).json({ message: "Erro ao listar usuários" });
    }
  };
}