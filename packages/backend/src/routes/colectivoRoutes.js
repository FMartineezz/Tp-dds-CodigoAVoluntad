import { Router } from "express";
import validarColectivo, {
  validarActualizacionColectivo,
} from "../middlewares/validations/colectivoValidation.js";
import validarMensaje from "../middlewares/validations/mensajeValidation.js";
import { colectivoController } from "../container.js";
import { mensajeController } from "../container.js";

const pathColectivos = "/colectivos";

export default function colectivoRoutes() {
  const router = Router();

  router.get("/colectivos", colectivoController.obtenerColectivos);

  router.get("/colectivos/:id", colectivoController.obtenerColectivoPorId);

  router.post("/colectivos", validarColectivo, colectivoController.crearColectivo);

  router.patch(
    "/colectivos/:id",
    validarActualizacionColectivo,
    colectivoController.actualizarColectivo,
  );

  router.post(
    "/colectivos/:colectivoId/mensajes",
    validarMensaje,
    mensajeController.enviarMensajeDesdeColectivo,
  );

  router.delete("/colectivos/:id", colectivoController.eliminarColectivo);

  return router;
}
