import { Router } from "express";
import { ProjectsController } from "../controllers/projects.controller";  // Verifique se o caminho está correto

// Inicializando o roteador e o controlador
export const projectsRoutes = Router();
const controller = new ProjectsController();  // Instância do controlador

// Rota para listar projetos
projectsRoutes.get("/", controller.list);          // Função list

// Rota para criar projetos
projectsRoutes.post("/", controller.create);       // Função create

// Rota para atualizar projetos (usando o ID do projeto como parâmetro)
projectsRoutes.patch("/:id", controller.update);   // Função update