import { Router } from "express";
import { logroController } from "../container.js";
import logroValidation from "../middlewares/validations/logroValidation.js";

const pathLogros = "/proyectos/:proyectoId/logros";

export default function logroRoutes() {
  const router = Router();

  router.post(pathLogros, logroValidation, logroController.crearLogro);

  router.get(pathLogros, logroController.obtenerLogros);

  router.get(pathLogros + "/:logroId",logroController.obtenerLogroPorId);

  router.put(pathLogros + "/:logroId", logroValidation, logroController.actualizarLogro);

  router.delete(pathLogros + "/:logroId", logroController.eliminarLogro);

  return router;
}
