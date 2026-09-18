import ErrorCatalog from "../../errors/errorCatalog.js";
import validacion from "./funcionesDeValidacion.js";

const validarColaboradora = (req, res, next) => {
  const { nombreFantasia, git, habilidades, presentacion } = req.body;

  validacion.esStringRequerido(
    nombreFantasia,
    ErrorCatalog.COLABORADORA_NOMBRE_FANTASIA_REQUERIDO,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "nombre fantasia",
  );

  validacion.esStringRequerido(
    git,
    ErrorCatalog.COLABORADORA_GIT_REQUERIDO,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "git",
  );

  validacion.esNil(habilidades, ErrorCatalog.COLABORADORA_HABILIDADES_REQUERIDAS);

  validacion.esArrayDeStrings(habilidades, ErrorCatalog.COLABORADORA_HABILIDADES_FORMATO);

  validacion.esStringRequerido(
    presentacion,
    ErrorCatalog.COLABORADORA_PRESENTACION_REQUERIDA,
    ErrorCatalog.ARGUMENTO_INVALIDO,
    "presentacion",
  );

  next();
};

export default validarColaboradora;
