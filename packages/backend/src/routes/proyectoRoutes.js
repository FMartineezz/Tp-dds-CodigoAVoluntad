import { Router } from "express";
import { proyectoController } from "../container.js";
import proyectoValidation, {
  validarActualizacionProyecto,
} from "../middlewares/validations/proyectoValidation.js";

const pathProyectos = "/proyectos";

export default function proyectoRoutes() {
  const router = Router();

  router.get("/proyectos", proyectoController.obtenerProyectos);

  router.get("/proyectos/:id", proyectoController.obtenerProyectoPorId);

  router.post("/proyectos", proyectoValidation, proyectoController.crearProyecto);

  // Alternativa recurso-céntrica: PATCH /proyectos/:id con body { finalizado: true } o { urlDonaciones: ... }
  router.patch(
    "/proyectos/:id",
    validarActualizacionProyecto,
    proyectoController.actualizarProyecto,
  );

  return router;
}
