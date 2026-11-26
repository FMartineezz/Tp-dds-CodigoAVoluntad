import { Router } from "express";
import { estadisticasController } from "../container.js";
import { limiter } from "../middlewares/validations/rateLimit.js";

/**
 * Ruta de estadísticas generales (con rate limit).
 * @returns {import("express").Router}
 */
export default function estadisticasRoutes() {
  const router = Router();

  router.get("/estadisticas", limiter, estadisticasController.verEstadisticas);

  return router;
}
