import { Router } from "express";
import { healthCheckController } from "../container.js";

/**
 * Ruta de health check.
 * @returns {import("express").Router}
 */
export default function healthCheckRoutes() {
  const router = Router();

  router.get("/healthCheck", healthCheckController.check);

  return router;
}
