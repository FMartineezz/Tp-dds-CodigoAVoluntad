import { Router } from "express";
import validarColectivo, {
  validarActualizacionColectivo,
} from "../middlewares/validations/colectivoValidation.js";
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

  router.delete("/colectivos/:id", colectivoController.eliminarColectivo);

  router.get("/colectivos/:colectivoId/mensajes", mensajeController.verMensajesColectivo);

  return router;
}
