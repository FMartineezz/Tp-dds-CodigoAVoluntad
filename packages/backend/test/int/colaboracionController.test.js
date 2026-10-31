import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

const ana = { _id: "pc1", nombreFantasia: "Ana", habilidades: ["h-react"], contactos: [] };

const proyecto = (cambios = {}) => ({
  _id: "p1",
  titulo: "Web institucional",
  colectivo: { nombre: "Fundación Ejemplo" },
  finalizado: false,
  perfiles: [{ habilidadesRequeridas: ["h-react"] }],
  ...cambios,
});

describe("Colaboraciones", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
    repos.personaColaboradora.obtenerPorId.mockResolvedValue(ana);
    repos.proyecto.obtenerPorId.mockResolvedValue(proyecto());
  });

  describe("POST /colaboraciones", () => {
    test("responde 201 si la persona tiene alguna habilidad requerida", async () => {
      // Preparación
      repos.colaboracion.guardar.mockResolvedValue({ id: "col1" });

      // Ejecución
      const respuesta = await request(app)
        .post("/colaboraciones")
        .send({ personaColaboradoraId: "pc1", proyectoId: "p1", anonima: true });

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.headers.location).toBe("/colaboraciones/col1");
      expect(respuesta.body).toMatchObject({ id: "col1", anonima: true });
    });

    test("responde 400 si la persona no tiene ninguna habilidad requerida", async () => {
      repos.personaColaboradora.obtenerPorId.mockResolvedValue({ ...ana, habilidades: ["h-otra"] });

      const respuesta = await request(app)
        .post("/colaboraciones")
        .send({ personaColaboradoraId: "pc1", proyectoId: "p1" });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_HABILIDAD_REQUERIDA.code);
    });

    test("responde 409 si el proyecto está finalizado", async () => {
      repos.proyecto.obtenerPorId.mockResolvedValue(proyecto({ finalizado: true }));

      const respuesta = await request(app)
        .post("/colaboraciones")
        .send({ personaColaboradoraId: "pc1", proyectoId: "p1" });

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_PROYECTO_FINALIZADO.code);
    });

    test.each([
      [{ proyectoId: "p1" }, ErrorCatalog.COLABORACION_PERSONA_REQUERIDA],
      [{ personaColaboradoraId: "pc1" }, ErrorCatalog.COLABORACION_PROYECTO_REQUERIDO],
      [
        { personaColaboradoraId: "pc1", proyectoId: "p1", anonima: "si" },
        ErrorCatalog.COLABORACION_ANONIMA_FORMATO,
      ],
    ])("con %j responde 400", async (body, error) => {
      const respuesta = await request(app).post("/colaboraciones").send(body);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });
  });

  test("GET /colaboraciones oculta a la persona en las anónimas", async () => {
    // Preparación
    repos.colaboracion.obtenerTodas.mockResolvedValue([
      { _id: "col1", anonima: true, personaColaboradora: ana, proyecto: proyecto() },
      { _id: "col2", anonima: false, personaColaboradora: ana, proyecto: proyecto() },
    ]);

    // Ejecución
    const respuesta = await request(app).get("/colaboraciones");

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body[0].personaColaboradora).toBeNull();
    expect(respuesta.body[1].personaColaboradora).toEqual({
      _id: "pc1",
      nombreFantasia: "Ana",
      habilidades: ["h-react"],
    });
  });

  test("GET /colaboraciones/:id responde 404 si no existe", async () => {
    repos.colaboracion.obtenerPorId.mockResolvedValue(null);

    const respuesta = await request(app).get("/colaboraciones/inexistente");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_NO_ENCONTRADA.code);
  });
});
