import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

const perfilValido = {
  descripcion: "Desarrollo front",
  habilidadesRequeridas: ["react"],
  habilidadesOpcionales: ["cypress"],
  horas: 5,
  tipoDeCompromiso: "mensual",
  modalidadDeColaboracion: "gratuita",
};

const proyectoValido = {
  titulo: "Web institucional",
  descripcion: "Sitio de la fundación",
  perfiles: [perfilValido],
  colectivo: "Fundación Ejemplo",
  urlSistema: "https://fundacion.org",
};

describe("Proyectos", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
  });

  describe("POST /proyectos", () => {
    beforeEach(() => {
      repos.colectivo.obtenerPorNombre.mockResolvedValue({
        _id: "c1",
        nombre: "Fundación Ejemplo",
      });
      repos.colectivo.obtenerPorId.mockResolvedValue({ _id: "c1", proyectos: [] });
      repos.proyecto.obtenerPorTituloYColectivo.mockResolvedValue(null);
      repos.habilidad.obtenerPorCodigo.mockImplementation(async (codigo) =>
        codigo === "cobol" ? null : { _id: `h-${codigo}`, codigo },
      );
      repos.proyecto.guardar.mockImplementation(async (proyecto) => ({
        ...proyecto,
        _id: "p1",
        id: "p1",
      }));
    });

    test("responde 201, guarda el proyecto y lo vincula al colectivo", async () => {
      // Ejecución
      const respuesta = await request(app)
        .post("/proyectos")
        .send(proyectoValido)
        .set("Content-Type", "application/json");

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.headers.location).toBe("/proyectos/p1");
      expect(respuesta.body).toMatchObject({
        id: "p1",
        titulo: "Web institucional",
        finalizado: false,
        logros: [],
      });
      expect(respuesta.body.perfiles[0].habilidadesRequeridas).toEqual([
        { _id: "h-react", codigo: "react" },
      ]);
      expect(repos.colectivo.agregarProyecto).toHaveBeenCalledWith("c1", "p1");
    });

    test("responde 409 si el colectivo ya tiene un proyecto con ese título", async () => {
      repos.proyecto.obtenerPorTituloYColectivo.mockResolvedValue({ titulo: "Web institucional" });

      const respuesta = await request(app).post("/proyectos").send(proyectoValido);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_YA_EXISTENTE.code);
    });

    test("responde 400 si el colectivo no existe", async () => {
      repos.colectivo.obtenerPorNombre.mockResolvedValue(null);

      const respuesta = await request(app).post("/proyectos").send(proyectoValido);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE.code);
    });

    test("responde 400 si un perfil pide una habilidad inexistente", async () => {
      const respuesta = await request(app)
        .post("/proyectos")
        .send({
          ...proyectoValido,
          perfiles: [{ ...perfilValido, habilidadesRequeridas: ["cobol"] }],
        });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO.code);
      expect(repos.proyecto.guardar).not.toHaveBeenCalled();
    });

    test.each([
      [{ titulo: "" }, ErrorCatalog.PROYECTO_TITULO_REQUERIDO],
      [{ perfiles: [] }, ErrorCatalog.PROYECTO_PERFILES_REQUERIDOS],
      [{ colectivo: 7 }, ErrorCatalog.PROYECTO_COLECTIVO_FORMATO],
      [{ urlSistema: "no-es-url" }, ErrorCatalog.PROYECTO_URL_SISTEMA_INVALIDA],
      [
        { perfiles: [{ ...perfilValido, tipoDeCompromiso: "anual" }] },
        ErrorCatalog.PERFIL_TIPO_COMPROMISO_FORMATO,
      ],
    ])("con %j responde 400 sin llegar al service", async (cambios, error) => {
      const respuesta = await request(app)
        .post("/proyectos")
        .send({ ...proyectoValido, ...cambios });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
      expect(repos.colectivo.obtenerPorNombre).not.toHaveBeenCalled();
    });
  });

  test("GET /proyectos responde 200 con todos los proyectos", async () => {
    repos.proyecto.obtenerTodos.mockResolvedValue([{ _id: "p1" }, { _id: "p2" }]);

    const respuesta = await request(app).get("/proyectos");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(2);
  });

  test("GET /proyectos/:id responde 404 si no existe", async () => {
    repos.proyecto.obtenerPorId.mockResolvedValue(null);

    const respuesta = await request(app).get("/proyectos/inexistente");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({
      code: ErrorCatalog.PROYECTO_NO_ENCONTRADO.code,
      message: "El proyecto inexistente no fue encontrado",
    });
  });

  describe("PATCH /proyectos/:id", () => {
    test("{ finalizado: true } responde 200 con el proyecto finalizado", async () => {
      // Preparación
      repos.proyecto.obtenerPorId.mockResolvedValue({ _id: "p1", finalizado: false });
      repos.proyecto.finalizarProyecto.mockResolvedValue({ _id: "p1", finalizado: true });

      // Ejecución
      const respuesta = await request(app).patch("/proyectos/p1").send({ finalizado: true });

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.finalizado).toBe(true);
      expect(repos.proyecto.finalizarProyecto).toHaveBeenCalledWith("p1");
    });

    test("responde 400 si el proyecto ya estaba finalizado", async () => {
      repos.proyecto.obtenerPorId.mockResolvedValue({ _id: "p1", finalizado: true });

      const respuesta = await request(app).patch("/proyectos/p1").send({ finalizado: true });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_FINALIZADO.code);
    });

    test("responde 400 si se intenta cambiar otro campo", async () => {
      const respuesta = await request(app).patch("/proyectos/p1").send({ titulo: "Otro" });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.ARGUMENTO_INVALIDO.code);
    });
  });
});
