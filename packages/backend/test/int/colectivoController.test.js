import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

const colectivoValido = {
  nombre: "Fundación Ejemplo",
  descripcion: "Una fundación",
  ubicacion: "caba",
  tipoDeColectivo: "fundacion",
};

describe("Colectivos", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
  });

  describe("POST /colectivos", () => {
    test("responde 201 con el colectivo creado y su Location", async () => {
      // Preparación
      repos.colectivo.obtenerPorNombre.mockResolvedValue(null);
      repos.colectivo.guardar.mockResolvedValue({ id: "c1" });

      // Ejecución
      const respuesta = await request(app).post("/colectivos").send(colectivoValido);

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.headers.location).toBe("/colectivos/c1");
      expect(respuesta.body).toMatchObject({ id: "c1", ...colectivoValido, proyectos: [] });
    });

    test("responde 409 si ya existe un colectivo con ese nombre", async () => {
      repos.colectivo.obtenerPorNombre.mockResolvedValue({ _id: "c1" });

      const respuesta = await request(app).post("/colectivos").send(colectivoValido);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_YA_EXISTE.code);
    });

    test.each([
      [{ nombre: undefined }, ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO],
      [{ descripcion: "" }, ErrorCatalog.COLECTIVO_DESCRIPCION_REQUERIDA],
      [{ tipoDeColectivo: undefined }, ErrorCatalog.COLECTIVO_TIPO_REQUERIDO],
      [{ tipoDeColectivo: "club" }, ErrorCatalog.COLECTIVO_TIPO_INVALIDO],
    ])("con %j responde 400", async (cambios, error) => {
      const respuesta = await request(app)
        .post("/colectivos")
        .send({ ...colectivoValido, ...cambios });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
      expect(repos.colectivo.guardar).not.toHaveBeenCalled();
    });
  });

  test("GET /colectivos responde 200 con todos los colectivos", async () => {
    repos.colectivo.obtenerTodos.mockResolvedValue([colectivoValido]);

    const respuesta = await request(app).get("/colectivos");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
  });

  describe("GET /colectivos/:id", () => {
    test("responde 200 con el colectivo", async () => {
      repos.colectivo.obtenerPorId.mockResolvedValue({ _id: "c1", ...colectivoValido });

      const respuesta = await request(app).get("/colectivos/c1");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.nombre).toBe("Fundación Ejemplo");
    });

    test("responde 404 si no existe", async () => {
      repos.colectivo.obtenerPorId.mockResolvedValue(null);

      const respuesta = await request(app).get("/colectivos/inexistente");

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
    });
  });
});
