import { jest } from "@jest/globals";
import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildApp } from "../../src/app.js";
import swaggerRoutes from "../../src/routes/swaggerRoutes.js";
import { buildTestApp } from "./utils/buildTestApp.js";

describe("App", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
  });

  test("GET /healthCheck responde 200", async () => {
    const respuesta = await request(app).get("/healthCheck");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ status: "ok" });
  });

  test("una ruta inexistente responde 404 con el código del catálogo", async () => {
    const respuesta = await request(app).get("/no-existe");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.RECURSO_NO_ENCONTRADO.code);
  });

  test("un error inesperado responde 500 sin exponer el detalle", async () => {
    // Preparación: el repositorio falla como si se cayera la base de datos
    jest.spyOn(console, "error").mockImplementation(() => {});
    repos.habilidad.obtenerTodas.mockRejectedValue(new Error("conexión perdida con Mongo"));

    // Ejecución
    const respuesta = await request(app).get("/habilidades");

    // Validación
    expect(respuesta.status).toBe(500);
    expect(respuesta.body).toEqual({
      code: ErrorCatalog.ERROR_INTERNO.code,
      message: ErrorCatalog.ERROR_INTERNO.message,
    });
    console.error.mockRestore();
  });

  test("GET /api-docs/ publica la documentación de Swagger", async () => {
    const respuesta = await request(buildApp([swaggerRoutes()])).get("/api-docs/");

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers["content-type"]).toMatch(/text\/html/);
  });
});
