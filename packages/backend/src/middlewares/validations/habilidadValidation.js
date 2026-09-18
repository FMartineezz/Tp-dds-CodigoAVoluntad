import ErrorCatalog from "../../errors/errorCatalog.js";
import validacion from "./funcionesDeValidacion.js";

const validarHabilidad = (req, res, next) => {
  const { titulo, descripcion } = req.body;

  validacion.esStringRequerido(
    titulo,
    ErrorCatalog.HABILIDAD_TITULO_REQUERIDO,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "titulo",
  );

  validacion.esStringRequerido(
    descripcion,
    ErrorCatalog.HABILIDAD_DESCRIPCION_REQUERIDA,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "descripcion",
  );

  next();
};

export default validarHabilidad;
