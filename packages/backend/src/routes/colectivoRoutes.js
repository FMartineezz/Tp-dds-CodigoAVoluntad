import { Router } from "express";
import validarColectivo from "../middlewares/validations/colectivoValidation.js";
import { colectivoController } from "../container.js";
import { mensajeController } from "../container.js";

const pathColectivos = "/colectivos";

export default function colectivoRoutes() {
  const router = Router();

  router.get(pathColectivos, (req, res) => {
    colectivoController.obtenerColectivos(req, res);
  });

  router.get(pathColectivos + "/:id", (req, res) => {
    colectivoController.obtenerColectivoPorId(req, res);
  });

  router.post(pathColectivos, validarColectivo, (req, res) => {
    colectivoController.crearColectivo(req, res);
  });

  router.post(
    pathColectivos + "/:colectivoId/mensajes",
    mensajeController.enviarMensajeDesdeColectivo,
  );

  return router;
}
