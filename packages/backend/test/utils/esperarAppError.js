import { AppError } from "../../src/errors/appError.js";

// Verifica que la promesa falle con un AppError del catálogo y con el status esperado
export async function esperarAppError(promesa, error, statusCode) {
  await expect(promesa).rejects.toThrow(AppError);
  await expect(promesa).rejects.toMatchObject({ code: error.code, statusCode });
}
