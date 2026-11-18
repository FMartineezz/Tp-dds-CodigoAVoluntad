import { Router } from "express";
import { mensajeController } from "../container.js";
import {
  validarMensaje,
  validarLecturaDeMensajes,
} from "../middlewares/validations/mensajeValidation.js";

export default function mensajeRoutes() {
  const router = Router();

  router.post("/mensajes", validarMensaje, mensajeController.enviarMensaje);

  router.patch("/mensajes", validarLecturaDeMensajes, mensajeController.marcarComoLeidos);

  return router;
}
