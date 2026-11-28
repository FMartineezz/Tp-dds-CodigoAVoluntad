import { Router } from "express";
import { validarPaginacion } from "../middlewares/validations/paginacionValidation.js";
import { validarFiltrosDeColaboradoras } from "../middlewares/validations/filtrosValidation.js";
import { personaColaboradoraController } from "../container.js";
import { mensajeController } from "../container.js";
import { verifyToken, exigirRol } from "../middlewares/auth.js";
import { cargarCuenta } from "../container.js";
import validarPersonaColaboradora, {
  validarActualizacionColaboradora,
} from "../middlewares/validations/personaColaboradoraValidation.js";
import { validarCaptcha } from "../middlewares/validations/captchaValidation.js";
import { recibirFoto } from "../middlewares/validations/fotoValidation.js";
import { exigirIdsValidos } from "../middlewares/validations/idValidation.js";
import ErrorCatalog from "../errors/errorCatalog.js";

const colOAdmin = [verifyToken, cargarCuenta, exigirRol("col", "adm")];
const soloCol = [verifyToken, cargarCuenta, exigirRol("col")];
const colOOrg = [verifyToken, cargarCuenta, exigirRol("col", "org")];

/**
 * Rutas de personas colaboradoras (ABM, listado paginado, proyectos acordes y mensajes).
 * @returns {import("express").Router}
 */
export default function personaColaboradoraRoutes() {
  const router = Router();
  exigirIdsValidos(router, {
    id: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
    personaColaboradoraId: ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
  });

  // Filtros opcionales: ?busqueda, ?habilidad y ?aceptaMensajes (ver filtrosValidation.js)
  router.get(
    "/colaboradoras",
    validarPaginacion,
    validarFiltrosDeColaboradoras,
    personaColaboradoraController.obtenerPersonasColaboradoras,
  );

  router.get("/colaboradoras/:id", personaColaboradoraController.obtenerPersonaColaboradoraPorId);

  // Privados: solo la dueña o un colectivo con el que colabora (ver el controller)
  router.get(
    "/colaboradoras/:id/contactos",
    ...colOOrg,
    personaColaboradoraController.obtenerContactos,
  );

  router.patch(
    "/colaboradoras/:id",
    ...soloCol,
    validarActualizacionColaboradora,
    personaColaboradoraController.actualizarPersonaColaboradora,
  );

  router.get(
    "/colaboradoras/:personaColaboradoraId/mensajes",
    ...soloCol,
    mensajeController.verMensajesColaboradora,
  );

  router.post(
    "/colaboradoras",
    verifyToken,
    validarCaptcha,
    validarPersonaColaboradora,
    personaColaboradoraController.crearPersonaColaboradora,
  );

  router.get(
    "/colaboradoras/:id/proyectos-acordes",
    ...soloCol,
    validarPaginacion,
    personaColaboradoraController.obtenerProyectosAcordes,
  );

  router.delete(
    "/colaboradoras/:id",
    ...colOAdmin,
    personaColaboradoraController.eliminarPersonaColaboradora,
  );

  // Foto de perfil subida: el PUT manda los bytes de la imagen, no JSON (ver fotoValidation.js)
  router.put(
    "/colaboradoras/:id/foto",
    ...soloCol,
    recibirFoto,
    personaColaboradoraController.subirFoto,
  );
  router.get("/colaboradoras/:id/foto", personaColaboradoraController.obtenerFoto);
  router.delete("/colaboradoras/:id/foto", ...soloCol, personaColaboradoraController.borrarFoto);

  return router;
}
