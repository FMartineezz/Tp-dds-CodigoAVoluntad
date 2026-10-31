import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

const logroValido = { descripcion: "MVP", porcentaje: 40, urlCodigoFuente: "https://github.com/x" };

describe("Logros de un proyecto", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
    repos.proyecto.obtenerPorId.mockResolvedValue({
      _id: "p1",
      finalizado: false,
      logros: [{ _id: "l1", porcentaje: 50 }],
    });
  });

  describe("POST /proyectos/:id/logros", () => {
    test("responde 201 con el logro y su Location", async () => {
      // Preparación
      repos.proyecto.guardarLogro.mockResolvedValue({ _id: "l2", ...logroValido });

      // Ejecución
      const respuesta = await request(app).post("/proyectos/p1/logros").send(logroValido);

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.headers.location).toBe("/proyectos/p1/logros/l2");
      expect(respuesta.body).toEqual({ _id: "l2", ...logroValido });
    });

    test("responde 400 si el total de porcentajes superaría 100", async () => {
      const respuesta = await request(app)
        .post("/proyectos/p1/logros")
        .send({ ...logroValido, porcentaje: 51 });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO.code);
      expect(repos.proyecto.guardarLogro).not.toHaveBeenCalled();
    });

    test.each([
      [{ porcentaje: 0 }, ErrorCatalog.LOGRO_PORCENTAJE_INVALIDO],
      [{ porcentaje: 101 }, ErrorCatalog.LOGRO_PORCENTAJE_INVALIDO],
      [{ descripcion: "   " }, ErrorCatalog.LOGRO_DESCRIPCION_INVALIDA],
      [{ urlCodigoFuente: "github" }, ErrorCatalog.LOGRO_URL_INVALIDA],
    ])("con %j responde 400", async (cambios, error) => {
      const respuesta = await request(app)
        .post("/proyectos/p1/logros")
        .send({ ...logroValido, ...cambios });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });
  });

  test("GET /proyectos/:id/logros responde 200 con los logros", async () => {
    repos.proyecto.obtenerLogros.mockResolvedValue([{ _id: "l1", porcentaje: 50 }]);

    const respuesta = await request(app).get("/proyectos/p1/logros");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
  });

  test("PATCH /proyectos/:id/logros/:logroId responde 200 con el logro editado", async () => {
    // Preparación
    repos.proyecto.obtenerLogroPorId.mockResolvedValue({ _id: "l1", porcentaje: 50 });
    repos.proyecto.actualizarLogro.mockResolvedValue({ _id: "l1", porcentaje: 100 });

    // Ejecución
    const respuesta = await request(app).patch("/proyectos/p1/logros/l1").send({ porcentaje: 100 });

    // Validación
    expect(respuesta.status).toBe(200);
    expect(repos.proyecto.actualizarLogro).toHaveBeenCalledWith("p1", "l1", { porcentaje: 100 });
  });

  test("DELETE /proyectos/:id/logros/:logroId responde 404 si el logro no existe", async () => {
    repos.proyecto.obtenerLogroPorId.mockResolvedValue(null);

    const respuesta = await request(app).delete("/proyectos/p1/logros/inexistente");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO.code);
    expect(repos.proyecto.eliminarLogro).not.toHaveBeenCalled();
  });
});
