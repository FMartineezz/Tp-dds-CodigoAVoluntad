import { AppError } from "../../errors/appError.js";
import ErrorCatalog from "../../errors/errorCatalog.js";
import { TipoColectivoEnum } from "../../models/colectivo.js";
import validacion from "./funcionesDeValidacion.js";
import Lodash from "lodash";

const validarColectivo = (req, res, next) => {
  const { nombre, descripcion, ubicacion, tipoDeColectivo } = req.body;

  validacion.esEmpty(nombre, ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO);

  validacion.esString(nombre, "nombre");

  validacion.esEmpty(descripcion, ErrorCatalog.COLECTIVO_DESCRIPCION_REQUERIDA);

  validacion.esString(descripcion, "descripcion");

  validacion.esEmpty(tipoDeColectivo, ErrorCatalog.COLECTIVO_TIPO_REQUERIDO);

  validacion.esString(tipoDeColectivo, "tipo de colectivo");

  if (!Lodash.includes(TipoColectivoEnum, tipoDeColectivo)) {
    throw new AppError(ErrorCatalog.COLECTIVO_TIPO_INVALIDO, 400);
  }

  next();
};

export default validarColectivo;
