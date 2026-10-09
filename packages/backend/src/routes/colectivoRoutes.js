import { Router } from "express";
import validarColectivo from "../middlewares/validations/colectivoValidation.js";
import validarMensaje from "../middlewares/validations/mensajeValidation.js";
import { colectivoController } from "../container.js";
import { mensajeController } from "../container.js";

const pathColectivos = "/colectivos";

export default function colectivoRoutes() {
  const router = Router();

  router.get("/colectivos", colectivoController.obtenerColectivos);

  router.get("/colectivos/:id", colectivoController.obtenerColectivoPorId);

  router.post("/colectivos", validarColectivo, colectivoController.crearColectivo);

  router.post(
    "/colectivos/:colectivoId/mensajes",
    validarMensaje,
    mensajeController.enviarMensajeDesdeColectivo,
  );

  return router;
}
