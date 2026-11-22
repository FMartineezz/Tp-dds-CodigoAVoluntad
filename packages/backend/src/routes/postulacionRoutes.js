import { Router } from "express";
import { postulacionController } from "../container.js";
import {
  validarPostulacion,
  validarResolucionPostulacion,
} from "../middlewares/validations/postulacionValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/**
 * Rutas de postulaciones: alta, resolución y listados por persona o colectivo.
 * @returns {import("express").Router}
 */
export default function postulacionRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    id: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
    colectivoId: ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
    proyectoId: ErrorCatalog.PROYECTO_NO_ENCONTRADO,
    perfilId: ErrorCatalog.PERFIL_NO_ENCONTRADO,
    postulacionId: ErrorCatalog.POSTULACION_NO_ENCONTRADA,
  });

  router.get("/colaboradoras/:id/postulaciones", postulacionController.listarDePersona);

  router.get("/colectivos/:colectivoId/postulaciones", postulacionController.listarDeColectivo);

  router.post(
    "/proyectos/:proyectoId/perfiles/:perfilId/postulaciones",
    validarPostulacion,
    postulacionController.crearPostulacion,
  );

  router.patch(
    "/postulaciones/:postulacionId",
    validarResolucionPostulacion,
    postulacionController.actualizarPostulacion,
  );

  return router;
}
