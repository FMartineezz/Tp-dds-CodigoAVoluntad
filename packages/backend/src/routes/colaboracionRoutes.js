import { Router } from "express";
import { colaboracionController } from "../container.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export default function colaboracionRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    id: ErrorCatalog.COLABORACION_NO_ENCONTRADA,
    personaColaboradoraId: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
    proyectoId: ErrorCatalog.PROYECTO_NO_ENCONTRADO,
  });

  router.get("/colaboraciones", colaboracionController.obtenerColaboraciones);

  router.get("/colaboraciones/:id", colaboracionController.obtenerColaboracionPorId);

  // Baja: ?por=persona o ?por=colectivo registra quién la dio (opcional)
  router.delete("/colaboraciones/:id", colaboracionController.desactivarColaboracion);

  // Historial de una colaboradora y equipo de un proyecto (activas y dadas de baja)
  router.get(
    "/colaboradoras/:personaColaboradoraId/colaboraciones",
    colaboracionController.obtenerColaboracionesDePersona,
  );

  router.get(
    "/proyectos/:proyectoId/colaboraciones",
    colaboracionController.obtenerColaboracionesDeProyecto,
  );

  return router;
}
