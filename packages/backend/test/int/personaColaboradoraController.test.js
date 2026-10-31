import { jest } from "@jest/globals";
import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

const colaboradoraValida = {
  nombreFantasia: "Ana",
  git: "github.com/ana",
  habilidades: ["react"],
  presentacion: "Dev front",
  contactos: [{ tipo: "EMAIL", valor: "ana@mail.com" }],
};

const ana = {
  _id: "pc1",
  nombreFantasia: "Ana",
  habilidades: ["h1"],
  contactos: [{ tipo: "email", valor: "ana@mail.com" }],
};

describe("Personas colaboradoras", () => {
  let app;
  let repos;

  beforeEach(() => {
    ({ app, repos } = buildTestApp());
  });

  describe("POST /colaboradoras", () => {
    test("responde 201 y guarda los contactos normalizados", async () => {
      // Preparación
      repos.habilidad.obtenerPorCodigo.mockResolvedValue({ _id: "h1", codigo: "react" });
      repos.personaColaboradora.guardar.mockResolvedValue({ id: "pc1" });

      // Ejecución
      const respuesta = await request(app).post("/colaboradoras").send(colaboradoraValida);

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.headers.location).toBe("/colaboradoras/pc1");
      expect(repos.personaColaboradora.guardar.mock.calls[0][0].contactos).toEqual([
        { tipo: "email", valor: "ana@mail.com" },
      ]);
    });

    test("responde 400 si alguna habilidad no existe", async () => {
      repos.habilidad.obtenerPorCodigo.mockResolvedValue(null);

      const respuesta = await request(app).post("/colaboradoras").send(colaboradoraValida);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO.code);
      expect(repos.personaColaboradora.guardar).not.toHaveBeenCalled();
    });

    test.each([
      [{ git: "" }, ErrorCatalog.COLABORADORA_GIT_REQUERIDO],
      [{ habilidades: "react" }, ErrorCatalog.COLABORADORA_HABILIDADES_FORMATO],
      [
        { contactos: [{ tipo: "email", valor: "ana" }] },
        ErrorCatalog.MEDIO_CONTACTO_EMAIL_INVALIDO,
      ],
      [
        { contactos: [{ tipo: "sms", valor: "11 2789" }] },
        ErrorCatalog.MEDIO_CONTACTO_TELEFONO_INVALIDO,
      ],
      [{ contactos: [{ tipo: "fax", valor: "1" }] }, ErrorCatalog.MEDIO_CONTACTO_TIPO_INVALIDO],
      [
        { bloquearMensajeInterno: "si" },
        ErrorCatalog.COLABORADORA_BLOQUEAR_MENSAJE_INTERNO_INVALIDO,
      ],
    ])("con %j responde 400", async (cambios, error) => {
      const respuesta = await request(app)
        .post("/colaboradoras")
        .send({ ...colaboradoraValida, ...cambios });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });
  });

  test("GET /colaboradoras responde 200 sin exponer contactos", async () => {
    repos.personaColaboradora.obtenerTodas.mockResolvedValue([ana]);

    const respuesta = await request(app).get("/colaboradoras");

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([{ _id: "pc1", nombreFantasia: "Ana", habilidades: ["h1"] }]);
  });

  test("GET /colaboradoras/:id responde 404 si no existe", async () => {
    repos.personaColaboradora.obtenerPorId.mockResolvedValue(null);

    const respuesta = await request(app).get("/colaboradoras/inexistente");

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
  });

  test("GET /colaboradoras/:id/proyectos-acordes responde 200 con los proyectos", async () => {
    // Preparación
    jest.spyOn(console, "log").mockImplementation(() => {});
    repos.personaColaboradora.obtenerPorId.mockResolvedValue(ana);
    repos.proyecto.obtenerPorAlgunaHabilidad.mockResolvedValue([{ _id: "p1", titulo: "Web" }]);

    // Ejecución
    const respuesta = await request(app).get("/colaboradoras/pc1/proyectos-acordes");

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([{ _id: "p1", titulo: "Web" }]);
    expect(repos.proyecto.obtenerPorAlgunaHabilidad).toHaveBeenCalledWith(["h1"]);
    console.log.mockRestore();
  });
});
