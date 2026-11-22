/**
 * Error de la aplicación con código del catálogo y status HTTP. El errorHandler lo responde
 * como `{ code, message }` con ese status.
 */
export class AppError extends Error {
  /**
   * @param {import("./errorCatalog.js").EntradaErrorCatalog} error Entrada de ErrorCatalog.
   * @param {number} [statusCode=400] Status HTTP con el que se responde.
   * @param {...any} args Argumentos para armar el mensaje, si `error.message` es una función.
   */
  constructor(error, statusCode = 400, ...args) {
    super(typeof error.message === "function" ? error.message(...args) : error.message);

    /** Código del catálogo (ej. "ERR-VAL-001"). @type {string} */
    this.code = error.code;
    /** Status HTTP. @type {number} */
    this.statusCode = statusCode;
  }
}
