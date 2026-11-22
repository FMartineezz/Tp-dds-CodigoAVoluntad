import { Router } from "express";
import { validarPaginacion } from "../middlewares/validations/paginacionValidation.js";
import { proyectoController } from "../container.js";
import proyectoValidation, {
  validarActualizacionProyecto,
} from "../middlewares/validations/proyectoValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const pathProyectos = "/proyectos";

/**
 * Rutas de proyectos: alta, consulta, listados paginados y actualización.
 * @returns {import("express").Router}
 */
export default function proyectoRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    id: ErrorCatalog.PROYECTO_NO_ENCONTRADO,
    colectivoId: ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
  });

  router.get("/proyectos", validarPaginacion, proyectoController.obtenerProyectos);

  router.get("/proyectos/:id", proyectoController.obtenerProyectoPorId);

  // Proyectos de un colectivo (paginado): para su página pública y su panel
  router.get(
    "/colectivos/:colectivoId/proyectos",
    validarPaginacion,
    proyectoController.obtenerProyectosDeColectivo,
  );

  router.post("/proyectos", proyectoValidation, proyectoController.crearProyecto);

  // Alternativa recurso-céntrica: PATCH /proyectos/:id con body { finalizado: true } o { urlDonaciones: ... }
  router.patch(
    "/proyectos/:id",
    validarActualizacionProyecto,
    proyectoController.actualizarProyecto,
  );

  return router;
}
