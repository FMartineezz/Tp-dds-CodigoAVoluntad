import { Router } from "express";
import { proyectoController } from "../container.js";
import proyectoValidation from "../middlewares/validations/proyectoValidation.js";

const pathProyectos = "/proyectos";

export default function proyectoRoutes() {
  const router = Router();

  router.get("/proyectos", proyectoController.obtenerProyectos);

  router.get("/proyectos/:id", proyectoController.obtenerProyectoPorId);

  router.post("/proyectos", proyectoValidation, proyectoController.crearProyecto);

  // Alternativa recurso-céntrica: PATCH /proyectos/:id con body { finalizado: true }
  router.patch("/proyectos/:id", proyectoController.actualizarProyecto);

  return router;
}
