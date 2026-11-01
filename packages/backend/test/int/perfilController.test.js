import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

const perfilValido = {
  descripcion: "Tester",
  habilidadesRequeridas: ["cypress"],
  habilidadesOpcionales: ["react"],
  horas: 3,
  tipoDeCompromiso: "semanal",
  modalidadDeColaboracion: "incentivo_economico",
};

const perfilGuardado = {
  _id: "pf1",
  descripcion: "Desarrollo front",
  habilidadesRequeridas: ["h1"],
};

describe("Perfiles de un proyecto", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
    repos.proyecto.obtenerPorId.mockResolvedValue({ _id: "p1", perfiles: [perfilGuardado] });
    repos.proyecto.obtenerPerfilPorId.mockResolvedValue(perfilGuardado);
    repos.habilidad.obtenerPorCodigos.mockImplementation(async (codigos) =>
      codigos.map((codigo) => ({ _id: `h-${codigo}`, codigo })),
    );
  });

  test("GET /proyectos/:id/perfiles responde 200 con los perfiles", async () => {
    const respuesta = await request(app).get("/proyectos/p1/perfiles");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([perfilGuardado]);
  });

  test("GET /proyectos/:id/perfiles/:idPerfil responde 404 si el perfil no existe", async () => {
    repos.proyecto.obtenerPerfilPorId.mockResolvedValue(null);

    const respuesta = await request(app).get("/proyectos/p1/perfiles/inexistente");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PERFIL_NO_ENCONTRADO.code);
  });

  describe("POST /proyectos/:id/perfiles", () => {
    test("responde 201 con el perfil agregado", async () => {
      // Preparación
      repos.proyecto.guardarPerfil.mockImplementation(async (_, perfil) => ({
        ...perfil,
        _id: "pf2",
      }));

      // Ejecución
      const respuesta = await request(app).post("/proyectos/p1/perfiles").send(perfilValido);

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({
        _id: "pf2",
        descripcion: "Tester",
        habilidadesRequeridas: [{ _id: "h-cypress", codigo: "cypress" }],
      });
      expect(repos.proyecto.guardarPerfil).toHaveBeenCalledWith("p1", expect.any(Object));
    });

    test("responde 400 si la modalidad no es válida", async () => {
      const respuesta = await request(app)
        .post("/proyectos/p1/perfiles")
        .send({ ...perfilValido, modalidadDeColaboracion: "voluntariado" });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.PERFIL_MODALIDAD_FORMATO.code);
    });
  });

  describe("PATCH /proyectos/:id/perfiles/:idPerfil", () => {
    test("responde 200 y solo manda al repositorio los campos recibidos", async () => {
      // Preparación
      repos.proyecto.actualizarPerfil.mockResolvedValue({ ...perfilGuardado, horas: 8 });

      // Ejecución
      const respuesta = await request(app).patch("/proyectos/p1/perfiles/pf1").send({ horas: 8 });

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.horas).toBe(8);
      expect(repos.proyecto.actualizarPerfil).toHaveBeenCalledWith("p1", "pf1", { horas: 8 });
    });

    test("responde 400 si no viene ningún campo", async () => {
      const respuesta = await request(app).patch("/proyectos/p1/perfiles/pf1").send({});

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.ARGUMENTO_INVALIDO.code);
    });
  });

  test("DELETE /proyectos/:id/perfiles/:idPerfil responde 200 con el perfil quitado", async () => {
    repos.proyecto.eliminarPerfil.mockResolvedValue(perfilGuardado);

    const respuesta = await request(app).delete("/proyectos/p1/perfiles/pf1");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual(perfilGuardado);
    expect(repos.proyecto.eliminarPerfil).toHaveBeenCalledWith("p1", "pf1");
  });

  test("GET .../colaboradoras-acordes responde 200 con las colaboradoras que da el repositorio", async () => {
    // Preparación
    repos.personaColaboradora.obtenerPorHabilidadId.mockResolvedValue([
      { _id: "pc1", nombreFantasia: "Ana" },
    ]);

    // Ejecución
    const respuesta = await request(app).get("/proyectos/p1/perfiles/pf1/colaboradoras-acordes");

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([{ _id: "pc1", nombreFantasia: "Ana" }]);
    expect(repos.personaColaboradora.obtenerPorHabilidadId).toHaveBeenCalledWith(["h1"]);
  });
});
