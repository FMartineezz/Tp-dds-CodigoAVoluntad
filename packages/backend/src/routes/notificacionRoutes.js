import { Router } from "express";
import { notificacionController } from "../container.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

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
