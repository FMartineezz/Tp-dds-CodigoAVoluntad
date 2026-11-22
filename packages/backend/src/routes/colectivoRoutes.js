import { Router } from "express";
import { validarPaginacion } from "../middlewares/validations/paginacionValidation.js";
import validarColectivo, {
  validarActualizacionColectivo,
} from "../middlewares/validations/colectivoValidation.js";
import { colectivoController } from "../container.js";
import { mensajeController } from "../container.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const pathColectivos = "/colectivos";

/**
 * Rutas de colectivos (ABM y listado paginado) y de sus mensajes.
 * @returns {import("express").Router}
 */
export default function colectivoRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    id: ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
    colectivoId: ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
  });

  router.get("/colectivos", validarPaginacion, colectivoController.obtenerColectivos);

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
