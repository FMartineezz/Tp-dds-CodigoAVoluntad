import { Router } from "express";
import { authController } from "../container.js";
import { verifyToken } from "../middlewares/auth.js";

export default function authRoutes() {
  const router = Router();

  router.get("/auth/estado", verifyToken, authController.verificarUsuario);

  return router;
}
