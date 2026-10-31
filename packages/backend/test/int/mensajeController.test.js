import { jest } from "@jest/globals";
import request from "supertest";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { buildTestApp } from "./utils/buildTestApp.js";

const ana = (cambios = {}) => ({
  _id: "pc1",
  nombreFantasia: "Ana",
  bloquearMensajeInterno: false,
  contactos: [{ tipo: "email", valor: "ana@mail.com" }],
  ...cambios,
});

describe("Mensajes", () => {
  let app;
  let repos;
  let transporter;

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    ({ app, repos, transporter } = buildTestApp());
    repos.colectivo.obtenerPorId.mockResolvedValue({ _id: "c1", nombre: "Fundación Ejemplo" });
    repos.personaColaboradora.obtenerPorId.mockResolvedValue(ana());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("POST /colectivos/:colectivoId/mensajes", () => {
    test("responde 201 y avisa por mail a la destinataria", async () => {
      // Preparación
      repos.mensaje.guardar.mockResolvedValue({ id: "m1" });

      // Ejecución
      const respuesta = await request(app)
        .post("/colectivos/c1/mensajes")
        .send({ personaColaboradoraId: "pc1", texto: "Hola Ana" });

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({
        id: "m1",
        personaColaboradora: "Ana",
        texto: "Hola Ana",
      });
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: "ana@mail.com", text: "Hola Ana" }),
      );
    });

    test("responde 403 si la destinataria no acepta mensajes internos", async () => {
      repos.personaColaboradora.obtenerPorId.mockResolvedValue(
        ana({ bloquearMensajeInterno: true }),
      );

      const respuesta = await request(app)
        .post("/colectivos/c1/mensajes")
        .send({ personaColaboradoraId: "pc1", texto: "Hola" });

      expect(respuesta.status).toBe(403);
      expect(respuesta.body.code).toBe(ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA.code);
      expect(repos.mensaje.guardar).not.toHaveBeenCalled();
    });

    test.each([
      [{ texto: "Hola" }, ErrorCatalog.MENSAJE_PERSONA_COLABORADORA_REQUERIDO],
      [{ personaColaboradoraId: "pc1", texto: "" }, ErrorCatalog.MENSAJE_TEXTO_REQUERIDO],
      [{ personaColaboradoraId: "pc1", texto: 5 }, ErrorCatalog.MENSAJE_TEXTO_FORMATO],
    ])("con %j responde 400", async (body, error) => {
      const respuesta = await request(app).post("/colectivos/c1/mensajes").send(body);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });
  });

  test("GET /colaboradoras/:id/mensajes responde 200 con la bandeja de entrada", async () => {
    // Preparación
    repos.mensaje.obtenerPorColaboradoraId.mockResolvedValue([
      {
        _id: "m1",
        colectivo: { nombre: "Fundación Ejemplo" },
        texto: "Hola",
        date: "2025-10-01T00:00:00.000Z",
      },
    ]);

    // Ejecución
    const respuesta = await request(app).get("/colaboradoras/pc1/mensajes");

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([
      { id: "m1", colectivo: "Fundación Ejemplo", texto: "Hola", date: "2025-10-01T00:00:00.000Z" },
    ]);
  });
});
