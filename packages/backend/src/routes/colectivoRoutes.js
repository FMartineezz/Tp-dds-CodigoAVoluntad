import { Router } from "express";
import { validarPaginacion } from "../middlewares/validations/paginacionValidation.js";
import validarColectivo, {
  validarActualizacionColectivo,
} from "../middlewares/validations/colectivoValidation.js";
import { validarCaptcha } from "../middlewares/validations/captchaValidation.js";
import { colectivoController } from "../container.js";
import { mensajeController } from "../container.js";
import { recibirFoto } from "../middlewares/validations/fotoValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

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

  router.post("/colectivos", validarCaptcha, validarColectivo, colectivoController.crearColectivo);

  router.patch(
    "/colectivos/:id",
    validarActualizacionColectivo,
    colectivoController.actualizarColectivo,
  );

  router.delete("/colectivos/:id", colectivoController.eliminarColectivo);

  // Foto de perfil subida: el PUT manda los bytes de la imagen, no JSON (ver fotoValidation.js)
  router.put("/colectivos/:id/foto", recibirFoto, colectivoController.subirFoto);
  router.get("/colectivos/:id/foto", colectivoController.obtenerFoto);
  router.delete("/colectivos/:id/foto", colectivoController.borrarFoto);

  // Para el equipo administrativo: los que se dieron de baja
  router.get("/admin/colectivos/bajas", colectivoController.obtenerDadosDeBaja);

  router.get("/colectivos/:colectivoId/mensajes", mensajeController.verMensajesColectivo);

  return router;
}
