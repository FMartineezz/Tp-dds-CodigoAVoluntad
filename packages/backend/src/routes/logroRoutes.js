import { Router } from "express";
import { logroController } from "../container.js";
import {
  validarLogro,
  validarActualizacionLogro,
} from "../middlewares/validations/logroValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const pathLogros = "/proyectos/:proyectoId/logros";

export default function logroRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    proyectoId: ErrorCatalog.PROYECTO_NO_ENCONTRADO,
    logroId: ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
  });

  router.post(pathLogros, validarLogro, logroController.crearLogro);

  router.get(pathLogros, logroController.obtenerLogros);

  router.get(pathLogros + "/:logroId", logroController.obtenerLogroPorId);

  router.patch(
    pathLogros + "/:logroId",
    validarActualizacionLogro,
    logroController.actualizarLogro,
  );

  router.delete(pathLogros + "/:logroId", logroController.eliminarLogro);

  return router;
}
