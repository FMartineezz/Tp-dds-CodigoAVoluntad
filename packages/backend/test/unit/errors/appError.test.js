import { AppError } from "../../../src/errors/appError.js";
import ErrorCatalog from "../../../src/errors/errorCatalog.js";

describe("AppError", () => {
  test("toma código y mensaje fijo del catálogo", () => {
    // Ejecución
    const error = new AppError(ErrorCatalog.RECURSO_NO_ENCONTRADO, 404);

    // Validación
    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      code: "ERR-CSR-001",
      statusCode: 404,
      message: "El recurso solicitado no fue encontrado",
    });
  });

  test("si el mensaje es una función, le pasa los argumentos", () => {
    // Ejecución
    const error = new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, "abc123");

    // Validación
    expect(error.message).toBe("El proyecto abc123 no fue encontrado");
  });

  test("el status por defecto es 400", () => {
    expect(new AppError(ErrorCatalog.ARGUMENTO_INVALIDO).statusCode).toBe(400);
  });

  test("se puede lanzar y atrapar por su tipo", () => {
    expect(() => {
      throw new AppError(ErrorCatalog.ERROR_INTERNO, 500);
    }).toThrow(AppError);
  });
});

describe("ErrorCatalog", () => {
  test("no tiene códigos repetidos", () => {
    // Preparación
    const codigos = Object.values(ErrorCatalog).map((error) => error.code);

    // Validación
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});
