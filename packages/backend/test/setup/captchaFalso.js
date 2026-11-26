/**
 * Reemplazo de validarCaptcha en los tests (ver "moduleNameMapper" en package.json).
 *
 * Por qué: el real le pregunta a hCaptcha por internet, y en los tests no hay un humano que
 * resuelva el captcha. Acá siempre deja pasar.
 */
export const validarCaptcha = (req, res, next) => next();
