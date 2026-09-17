import { AppError } from "../../errors/appError.js";
import Lodash from "lodash";
import ErrorCatalog from "../../errors/errorCatalog.js";

function esNil(arg, error) {
  if (Lodash.isNil(arg)) {
    throw new AppError(error, 400);
  }
}

function esEmpty(arg, error) {
  if (Lodash.isEmpty(arg)) {
    throw new AppError(error, 400);
  }
}

function esString(arg, campo) {
  if (Lodash.isString(arg)) {
    throw new AppError(ErrorCatalog.ARGUMENTO_INVALIDO, 400, campo);
  }
}

export default { esNil, esEmpty, esString };
