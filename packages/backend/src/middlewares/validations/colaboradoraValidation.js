import ErrorCatalog from "../../errors/errorCatalog.js";
import Lodash from "lodash";
import validacion from "./funcionesDeValidacion.js";

const validarColaboradora = (req, res, next) => {
  const { nombreFantasia, git, habilidades, presentacion } = req.body;

  validacion.esEmpty(
    nombreFantasia,
    ErrorCatalog.COLABORADORA_NOMBRE_FANTASIA_REQUERIDO,
  );

  validacion.esEmpty(git, ErrorCatalog.COLABORADORA_GIT_REQUERIDO);

  validacion.esNil(
    habilidades,
    ErrorCatalog.COLABORADORA_HABILIDADES_REQUERIDAS,
  );

  if (
    !Lodash.isArray(habilidades) &&
    Lodash.every(habilidades, Lodash.isString)
  ) {
    throw new AppError(ErrorCatalog.COLABORADORA_HABILIDADES_FORMATO, 400);
  }

  validacion.esEmpty(
    presentacion,
    ErrorCatalog.COLABORADORA_PRESENTACION_REQUERIDA,
  );

  next();
};

export default validarColaboradora;
