import ErrorCatalog from "../../errors/errorCatalog.js";
import validacion from "./funcionesDeValidacion.js";

const validarHabilidad = (req, res, next) => {
  const { titulo, descripcion } = req.body;

  validacion.esEmpty(titulo, ErrorCatalog.HABILIDAD_TITULO_REQUERIDO);

  validacion.esString(titulo, "titulo");

  validacion.esEmpty(descripcion, ErrorCatalog.HABILIDAD_DESCRIPCION_REQUERIDA);

  validacion.esString(descripcion, "descripcion");

  next();
};

export default validarHabilidad;
