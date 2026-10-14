import { Router } from "express";
import { logroController } from "../container.js";
import {
  validarLogro,
  validarActualizacionLogro,
} from "../middlewares/validations/logroValidation.js";

const pathLogros = "/proyectos/:proyectoId/logros";

export default function logroRoutes() {
  const router = Router();

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
