import { Router } from "express";
import { mensajeController } from "../container.js";
import {
  validarMensaje,
  validarLecturaDeMensajes,
} from "../middlewares/validations/mensajeValidation.js";

/**
 * Rutas de mensajes: envío y marcado como leídos.
 * @returns {import("express").Router}
 */
export default function mensajeRoutes() {
  const router = Router();

  router.post("/mensajes", validarMensaje, mensajeController.enviarMensaje);

  router.patch("/mensajes", validarLecturaDeMensajes, mensajeController.marcarComoLeidos);

  return router;
}
