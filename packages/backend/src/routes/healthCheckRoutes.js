import { Router } from "express";
import { healthCheckController } from "../container.js";

export default function healthCheckRoutes() {
  const router = Router();

  router.get("/healthCheck", healthCheckController.check);

  return router;
}
