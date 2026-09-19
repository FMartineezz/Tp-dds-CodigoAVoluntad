import ErrorCatalog from "../../errors/errorCatalog.js";
import validacion from "./funcionesDeValidacion.js";
import { TipoColectivo } from "../../models/colectivo.js";

const validarColectivo = (req, res, next) => {
  const { nombre, descripcion, ubicacion, tipoDeColectivo } = req.body;

  validacion.esStringRequerido(
    nombre,
    ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "nombre",
  );

  validacion.esStringRequerido(
    descripcion,
    ErrorCatalog.COLECTIVO_DESCRIPCION_REQUERIDA,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "descripcion",
  );

  validacion.esStringRequerido(
    tipoDeColectivo,
    ErrorCatalog.COLECTIVO_TIPO_REQUERIDO,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "tipo de colectivo",
  );

  validacion.esValorPermitido(tipoDeColectivo, TipoColectivo, ErrorCatalog.COLECTIVO_TIPO_INVALIDO);

  next();
};

export default validarColectivo;
