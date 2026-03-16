import { Router } from "express";
import { UsersController } from "../controllers/users.controller";

export const usersRoutes = Router();
const controller = new UsersController();

usersRoutes.post("/", controller.create);
usersRoutes.get("/", controller.list);