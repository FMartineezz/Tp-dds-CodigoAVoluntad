import { Router } from "express";
import { validarPaginacion } from "../middlewares/validations/paginacionValidation.js";
import validarColectivo, {
  validarActualizacionColectivo,
} from "../middlewares/validations/colectivoValidation.js";
import { validarCaptcha } from "../middlewares/validations/captchaValidation.js";
import { colectivoController } from "../container.js";
import { mensajeController } from "../container.js";
import { verifyToken, exigirRol } from "../middlewares/auth.js";
import { cargarCuenta } from "../container.js";
import { recibirFoto } from "../middlewares/validations/fotoValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const soloAdmin = [verifyToken, cargarCuenta, exigirRol("adm")];
const soloOrg = [verifyToken, cargarCuenta, exigirRol("org")];
const orgOAdmin = [verifyToken, cargarCuenta, exigirRol("org", "adm")];

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

  router.post(
    "/colectivos",
    verifyToken,
    validarCaptcha,
    validarColectivo,
    colectivoController.crearColectivo,
  );

  router.patch(
    "/colectivos/:id",
    ...soloOrg,
    validarActualizacionColectivo,
    colectivoController.actualizarColectivo,
  );

  router.delete("/colectivos/:id", ...orgOAdmin, colectivoController.eliminarColectivo);

  // Foto de perfil subida: el PUT manda los bytes de la imagen, no JSON (ver fotoValidation.js)
  router.put("/colectivos/:id/foto", ...soloOrg, recibirFoto, colectivoController.subirFoto);
  router.get("/colectivos/:id/foto", colectivoController.obtenerFoto);
  router.delete("/colectivos/:id/foto", ...soloOrg, colectivoController.borrarFoto);

  // Para el equipo administrativo: los que se dieron de baja
  router.get("/admin/colectivos/bajas", ...soloAdmin, colectivoController.obtenerDadosDeBaja);

  router.get(
    "/colectivos/:colectivoId/mensajes",
    ...soloOrg,
    mensajeController.verMensajesColectivo,
  );

  return router;
}
