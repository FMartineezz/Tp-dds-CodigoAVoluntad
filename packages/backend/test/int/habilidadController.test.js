import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

describe("Habilidades", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
  });

  describe("GET /habilidades", () => {
    test("responde 200 con todas las habilidades", async () => {
      // Preparación
      repos.habilidad.obtenerTodas.mockResolvedValue([{ _id: "h1", titulo: "React" }]);

      // Ejecución
      const respuesta = await request(app).get("/habilidades");

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toEqual([{ _id: "h1", titulo: "React" }]);
    });
  });

  describe("GET /habilidades/:id", () => {
    test("responde 200 con la habilidad", async () => {
      repos.habilidad.obtenerPorId.mockResolvedValue({ _id: "h1", titulo: "React" });

      const respuesta = await request(app).get("/habilidades/h1");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.titulo).toBe("React");
      expect(repos.habilidad.obtenerPorId).toHaveBeenCalledWith("h1");
    });

    test("responde 404 con el código del catálogo si no existe", async () => {
      repos.habilidad.obtenerPorId.mockResolvedValue(null);

      const respuesta = await request(app).get("/habilidades/inexistente");

      expect(respuesta.status).toBe(404);
      expect(respuesta.body).toEqual({
        code: ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID.code,
        message: "La habilidad de id inexistente no fue encontrado",
      });
    });
  });

  describe("POST /habilidades", () => {
    test("responde 201 con la habilidad creada y su Location", async () => {
      // Preparación
      repos.habilidad.obtenerPorTitulo.mockResolvedValue(null);
      repos.habilidad.guardar.mockResolvedValue({ id: "h1" });

      // Ejecución
      const respuesta = await request(app)
        .post("/habilidades")
        .send({ titulo: "Desarrollo Web React", descripcion: "Front con React" })
        .set("Content-Type", "application/json");

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.headers.location).toBe("/habilidades/h1");
      expect(respuesta.body).toEqual({
        id: "h1",
        titulo: "Desarrollo Web React",
        codigo: "desarrollo_web_react",
        descripcion: "Front con React",
      });
    });

    test("responde 409 si ya existe una habilidad con ese título", async () => {
      repos.habilidad.obtenerPorTitulo.mockResolvedValue({ _id: "h1" });

      const respuesta = await request(app)
        .post("/habilidades")
        .send({ titulo: "React", descripcion: "d" });

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDAD_YA_EXISTE.code);
      expect(repos.habilidad.guardar).not.toHaveBeenCalled();
    });

    test.each([
      [{ descripcion: "d" }, ErrorCatalog.HABILIDAD_TITULO_REQUERIDO],
      [{ titulo: "", descripcion: "d" }, ErrorCatalog.HABILIDAD_TITULO_REQUERIDO],
      [{ titulo: "React" }, ErrorCatalog.HABILIDAD_DESCRIPCION_REQUERIDA],
      [{ titulo: 123, descripcion: "d" }, ErrorCatalog.ARGUMENTO_INVALIDO],
    ])("con el body %j responde 400 sin llegar al service", async (body, error) => {
      const respuesta = await request(app).post("/habilidades").send(body);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
      expect(repos.habilidad.obtenerPorTitulo).not.toHaveBeenCalled();
    });
  });
});
