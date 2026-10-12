import { Router } from "express";
import { logroController } from "../container.js";
import logroValidation from "../middlewares/validations/logroValidation.js";

const pathLogros = "/proyectos/:proyectoId/logros";

export default function logroRoutes() {
  const router = Router();

  router.post(pathLogros, logroValidation, logroController.crearLogro);

  router.get(pathLogros, logroController.obtenerLogros);

  router.get(pathLogros + "/:id",logroController.obtenerLogroPorId);

  router.put(pathLogros + "/:id", logroValidation, logroController.actualizarLogro);

  router.delete(pathLogros + "/:id", logroController.eliminarLogro);

  return router;
}
