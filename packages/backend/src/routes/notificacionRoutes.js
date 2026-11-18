import { Router } from "express";
import { notificacionController } from "../container.js";

export default function notificacionRoute() {
  const router = Router();

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
