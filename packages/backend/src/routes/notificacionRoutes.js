import { Router } from "express";
import { notificacionController } from "../container.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/**
 * Rutas de notificaciones de una persona colaboradora o de un colectivo.
 * @returns {import("express").Router}
 */
export default function notificacionRoute() {
  const router = Router();
  exigirIdsValidos(router, {
    colaboradoraId: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
    colectivoId: ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
  });

  router.get(
    "/colaboradoras/:colaboradoraId/notificaciones",
    notificacionController.obtenerNotificacionesColaboradora,
  );

  router.get(
    "/colectivos/:colectivoId/notificaciones",
    notificacionController.obtenerNotificacionesColectivo,
  );

  return router;
}
