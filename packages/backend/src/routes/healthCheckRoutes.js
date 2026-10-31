import { Router } from "express";
import * as container from "../container.js";

export default function healthCheckRoutes({ healthCheckController } = container) {
  const router = Router();

  router.get("/healthCheck", healthCheckController.check);

  return router;
}
