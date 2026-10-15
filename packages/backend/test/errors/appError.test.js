import { AppError } from "../../src/errors/appError.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

describe("AppError", () => {
  test("toma código y mensaje fijo del catálogo", () => {
    const error = new AppError(ErrorCatalog.RECURSO_NO_ENCONTRADO, 404);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      code: "ERR-CSR-001",
      statusCode: 404,
      message: "El recurso solicitado no fue encontrado",
    });
  });

  test("si el mensaje es una función, le pasa los argumentos", () => {
    const error = new AppError(ErrorCatalog.PROYECTO_NO_ENCONTRADO, 404, "abc123");

    expect(error.message).toBe("El proyecto abc123 no fue encontrado");
  });

  test("el status por defecto es 400", () => {
    expect(new AppError(ErrorCatalog.ARGUMENTO_INVALIDO).statusCode).toBe(400);
  });
});

describe("ErrorCatalog", () => {
  test("no tiene códigos repetidos", () => {
    const codigos = Object.values(ErrorCatalog).map((error) => error.code);

    expect(new Set(codigos).size).toBe(codigos.length);
  });
});
