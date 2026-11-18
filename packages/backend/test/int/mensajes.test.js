import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import {
  armarEscenario,
  crearColectivo,
  crearProyecto,
  idInexistente,
} from "../utils/escenarios.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { MensajeModel } from "../../src/schemas/mensajeSchema.js";

usarBaseDeDatos();

const cuerpo = (e, extra = {}) => ({
  colectivoId: e.colectivoId,
  personaColaboradoraId: e.personaId,
  proyectoId: e.proyectoId,
  emisor: "colectivo",
  texto: "Hola, ¿querés sumarte?",
  ...extra,
});

const enviar = (body) => request(app).post("/mensajes").send(body);
const marcar = (body) => request(app).patch("/mensajes").send(body);

describe("Mensajes (HTTP)", () => {
  describe("POST /mensajes", () => {
    test("el colectivo envía un mensaje: 201", async () => {
      const e = await armarEscenario();

      const respuesta = await enviar(cuerpo(e));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({
        emisor: "colectivo",
        texto: "Hola, ¿querés sumarte?",
        leido: false,
      });
    });

    // BUG: validarMensaje normaliza el emisor a minúsculas pero no lo vuelve a escribir en
    // req.body; el service compara "COLECTIVO" !== "colectivo", trata el mensaje como si lo
    // enviara la persona y responde 403 MENSAJE_SIN_CONVERSACION_PREVIA.
    test.failing("el emisor se acepta en mayúsculas", async () => {
      const e = await armarEscenario();

      const respuesta = await enviar(cuerpo(e, { emisor: "COLECTIVO" }));

      expect(respuesta.status).toBe(201);
    });

    test("la respuesta no expone los datos de contacto de la colaboradora", async () => {
      const e = await armarEscenario({ contactos: [{ tipo: "email", valor: "ana@mail.test" }] });

      const respuesta = await enviar(cuerpo(e));

      expect(respuesta.status).toBe(201);
      expect(JSON.stringify(respuesta.body)).not.toContain("ana@mail.test");
    });

    test("responde 403 si la colaboradora bloquea los mensajes internos", async () => {
      const e = await armarEscenario({ bloquearMensajeInterno: true });

      const respuesta = await enviar(cuerpo(e));

      expect(respuesta.status).toBe(403);
      expect(respuesta.body.code).toBe(ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA.code);
    });

    test("responde 403 si el proyecto no pertenece al colectivo", async () => {
      const e = await armarEscenario();
      const otro = await crearColectivo();
      const ajeno = await crearProyecto({
        colectivo: otro,
        perfiles: [{ habilidadesRequeridas: [e.habilidad.codigo] }],
      });

      const respuesta = await enviar(cuerpo(e, { proyectoId: ajeno.id }));

      expect(respuesta.status).toBe(403);
      expect(respuesta.body.code).toBe(
        ErrorCatalog.MENSAJE_COLECTIVO_NO_COINCIDE_CON_PROYECTO.code,
      );
    });

    test("la colaboradora sin conversación previa recibe 403", async () => {
      const e = await armarEscenario();

      const respuesta = await enviar(cuerpo(e, { emisor: "persona" }));

      expect(respuesta.status).toBe(403);
      expect(respuesta.body.code).toBe(ErrorCatalog.MENSAJE_SIN_CONVERSACION_PREVIA.code);
    });

    test("la colaboradora responde con conversación previa: 201", async () => {
      const e = await armarEscenario();
      await enviar(cuerpo(e));

      const respuesta = await enviar(cuerpo(e, { emisor: "persona", texto: "¡Sí!" }));

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.emisor).toBe("persona");
    });

    test.each([
      ["colectivoId", ErrorCatalog.MENSAJE_COLECTIVO_REQUERIDO],
      ["personaColaboradoraId", ErrorCatalog.MENSAJE_PERSONA_COLABORADORA_REQUERIDO],
      ["proyectoId", ErrorCatalog.MENSAJE_PROYECTO_REQUERIDO],
      ["texto", ErrorCatalog.MENSAJE_TEXTO_REQUERIDO],
    ])("responde 400 si falta %s", async (campo, error) => {
      const e = await armarEscenario();
      const body = cuerpo(e);
      delete body[campo];

      const respuesta = await enviar(body);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });

    test("responde 400 si el texto está vacío o no es texto", async () => {
      const e = await armarEscenario();

      const vacio = await enviar(cuerpo(e, { texto: "" }));
      const numero = await enviar(cuerpo(e, { texto: 42 }));

      expect(vacio.status).toBe(400);
      expect(vacio.body.code).toBe(ErrorCatalog.MENSAJE_TEXTO_REQUERIDO.code);
      expect(numero.status).toBe(400);
      expect(numero.body.code).toBe(ErrorCatalog.MENSAJE_TEXTO_FORMATO.code);
    });

    test("responde 400 si el emisor no es colectivo ni persona", async () => {
      const e = await armarEscenario();

      const respuesta = await enviar(cuerpo(e, { emisor: "admin" }));

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.MENSAJE_EMISOR_INVALIDO.code);
    });

    // BUG: la validación usa la clave "MENSAJE_EMISOR_REQUERIDO" pero en el ErrorCatalog está
    // escrita "MENSAJE_EMISOR_RQUERIDO"; AppError recibe undefined, explota y la API responde 500.
    test.failing("responde 400 si falta el emisor", async () => {
      const e = await armarEscenario();
      const body = cuerpo(e);
      delete body.emisor;

      const respuesta = await enviar(body);

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe("ERR-VAL-806");
    });

    test("responde 404 si el colectivo no existe", async () => {
      const e = await armarEscenario();

      const respuesta = await enviar(cuerpo(e, { colectivoId: idInexistente() }));

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
    });
  });

  describe("GET de conversaciones", () => {
    test("GET /colectivos/:id/mensajes y GET /colaboradoras/:id/mensajes muestran la conversación", async () => {
      // Preparación
      const e = await armarEscenario();
      await enviar(cuerpo(e, { texto: "Primero" }));
      await enviar(cuerpo(e, { emisor: "persona", texto: "Segundo" }));

      // Ejecución
      const delColectivo = await request(app).get(`/colectivos/${e.colectivoId}/mensajes`);
      const deLaColaboradora = await request(app).get(`/colaboradoras/${e.personaId}/mensajes`);

      // Validación
      expect(delColectivo.status).toBe(200);
      expect(delColectivo.body.map((m) => m.texto)).toEqual(["Primero", "Segundo"]);
      expect(deLaColaboradora.status).toBe(200);
      expect(deLaColaboradora.body.map((m) => m.texto)).toEqual(["Primero", "Segundo"]);
    });

    test("responden 404 si el colectivo o la colaboradora no existen", async () => {
      const colectivo = await request(app).get(`/colectivos/${idInexistente()}/mensajes`);
      const colaboradora = await request(app).get(`/colaboradoras/${idInexistente()}/mensajes`);

      expect(colectivo.status).toBe(404);
      expect(colectivo.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
      expect(colaboradora.status).toBe(404);
      expect(colaboradora.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
    });
  });

  describe("PATCH /mensajes (marcar leídos)", () => {
    const lectura = (e, extra = {}) => ({
      colectivoId: e.colectivoId,
      personaColaboradoraId: e.personaId,
      proyectoId: e.proyectoId,
      lector: "persona",
      leido: true,
      ...extra,
    });

    test("la colaboradora marca como leídos los mensajes del colectivo", async () => {
      const e = await armarEscenario();
      await enviar(cuerpo(e));
      await enviar(cuerpo(e));

      const respuesta = await marcar(lectura(e));

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toEqual({ actualizados: 2 });
      expect(await MensajeModel.countDocuments({ leido: true })).toBe(2);
    });

    test("responde 400 si falta el lector o es inválido", async () => {
      const e = await armarEscenario();
      const sinLector = lectura(e);
      delete sinLector.lector;

      const faltante = await marcar(sinLector);
      const invalido = await marcar(lectura(e, { lector: "admin" }));

      expect(faltante.status).toBe(400);
      expect(faltante.body.code).toBe(ErrorCatalog.MENSAJE_LECTOR_REQUERIDO.code);
      expect(invalido.status).toBe(400);
      expect(invalido.body.code).toBe(ErrorCatalog.MENSAJE_LECTOR_INVALIDO.code);
    });

    // BUG: `leido: zod.boolean()` no define un código del catálogo; el mensaje de zod no existe
    // en ErrorCatalog, AppError recibe undefined y la API responde 500 en vez de 400.
    test.failing("responde 400 si falta el campo leido", async () => {
      const e = await armarEscenario();
      const body = lectura(e);
      delete body.leido;

      const respuesta = await marcar(body);

      expect(respuesta.status).toBe(400);
    });
  });
});
