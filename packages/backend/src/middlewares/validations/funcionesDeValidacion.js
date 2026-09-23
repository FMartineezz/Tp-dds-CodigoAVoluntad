import { AppError } from "../../errors/appError.js";
import Lodash from "lodash";

function esNil(arg, error, ...args) {
  if (Lodash.isNil(arg)) {
    throw new AppError(error, 400, ...args);
  }
}

function esEmpty(arg, error, ...args) {
  if (Lodash.isEmpty(arg)) {
    throw new AppError(error, 400, ...args);
  }
}

function esString(arg, error, ...args) {
  if (!Lodash.isString(arg)) {
    throw new AppError(error, 400, ...args);
  }
}

function esNumero(arg, error, ...args) {
  if (!Lodash.isFinite(arg)) {
    throw new AppError(error, 400, ...args);
  }
}

function esArrayDeStrings(arg, error, ...args) {
  if (!Lodash.isArray(arg) || !Lodash.every(arg, Lodash.isString)) {
    throw new AppError(error, 400, ...args);
  }
}

function esValorPermitido(arg, valoresPermitidos, error, ...args) {
  if (!Lodash.includes(valoresPermitidos, arg)) {
    throw new AppError(error, 400, ...args);
  }
}

/**
 * Campo de texto obligatorio: valida presencia y tipo string.
 * @param {*} arg
 * @param {object} errorRequerido - Error si el campo falta o está vacío.
 * @param {object} errorFormato - Error si el campo no es un string.
 * @param {string} Campo - Argumento para el mensaje de errorFormato.
 */
function esStringRequerido(arg, errorRequerido, errorArgumento, campo) {
  esNil(arg, errorRequerido);
  esString(arg, errorArgumento, campo);
  esEmpty(arg, errorRequerido);
}

/**
 * Campo numérico obligatorio: valida presencia (con isNil, no isEmpty) y tipo número.
 * @param {*} arg
 * @param {object} errorRequerido - Error si el campo falta.
 * @param {object} errorFormato - Error si el campo no es un número (normalmente ARGUMENTO_INVALIDO).
 * @param {string} nombreCampo - Nombre del campo, para el mensaje de errorFormato.
 */
function esNumeroRequerido(arg, errorRequerido, errorFormato, nombreCampo) {
  esNil(arg, errorRequerido);
  esNumero(arg, errorFormato, nombreCampo);
}

/**
 * @param {*} arg
 * @param {object} valoresPermitidos - Valores que se permiten que tenga el arg.
 * @param {object} errorFormato - Error si el campo no es un número (normalmente ARGUMENTO_INVALIDO).
 * @param {string} nombreCampo - Nombre del campo, para el mensaje de errorFormato.
 */

function esValorPermitidoRequerido(arg, valoresPermitidos, errorRequerido, errorFormato) {
  esNil(arg, errorRequerido);
  esValorPermitido(arg, valoresPermitidos, errorFormato);
}

function esArrayDeStringsConMinimo(arg, minimo, errorRequerido, errorFormato) {
  esNil(arg, errorRequerido);
  esArrayDeStrings(arg, errorFormato);
  if (arg.length < minimo) {
    throw new AppError(errorRequerido, STATUS_VALIDACION);
  }
}

export default {
  esNil,
  esEmpty,
  esString,
  esNumero,
  esArrayDeStrings,
  esValorPermitido,
  esStringRequerido,
  esNumeroRequerido,
  esValorPermitidoRequerido,
  esArrayDeStringsConMinimo,
};
