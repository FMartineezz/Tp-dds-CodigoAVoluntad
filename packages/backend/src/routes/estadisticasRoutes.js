import { Router } from "express";
import { estadisticasController } from "../container.js";
import { limiter } from "../middlewares/validations/rateLimit.js";

export default function estadisticasRoutes() {
  const router = Router();

  router.get("/estadisticas", limiter, estadisticasController.verEstadisticas);

  return router;
}
