import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { armarEscenario, crearColaboracion, idInexistente } from "../utils/escenarios.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

async function colaboracionDadaDeBaja() {
  const e = await armarEscenario();
  const { colaboracionId } = await crearColaboracion(e);
  await request(app).delete(`/colaboraciones/${colaboracionId}`);
  return { e, colaboracionId };
}

const valorar = (body) => request(app).post("/valoraciones").send(body);

describe("Valoraciones (HTTP)", () => {
  describe("POST /valoraciones", () => {
    test("responde 201 al valorar una colaboración dada de baja", async () => {
      const { colaboracionId } = await colaboracionDadaDeBaja();

      const respuesta = await valorar({
        colaboracionId,
        evaluador: "colectivo",
        puntaje: 5,
        comentario: "  Muy buena colaboración  ",
      });

      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({
        colaboracion: colaboracionId,
        evaluador: "colectivo",
        puntaje: 5,
        comentario: "Muy buena colaboración",
      });
    });

    test("responde 400 si la colaboración no finalizó", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);

      const respuesta = await valorar({ colaboracionId, evaluador: "persona", puntaje: 4 });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.VALORACION_COLABORACION_NO_FINALIZADA.code);
    });

    test("responde 400 si la parte ya valoró esa colaboración", async () => {
      const { colaboracionId } = await colaboracionDadaDeBaja();
      await valorar({ colaboracionId, evaluador: "persona", puntaje: 4 });

      const respuesta = await valorar({ colaboracionId, evaluador: "persona", puntaje: 1 });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.VALORACION_EXISTENTE.code);
    });

    test("responde 404 si la colaboración no existe", async () => {
      const respuesta = await valorar({
        colaboracionId: idInexistente(),
        evaluador: "persona",
        puntaje: 4,
      });

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_NO_ENCONTRADA.code);
    });

    test("responde 400 si falta el id de la colaboración", async () => {
      const respuesta = await valorar({ evaluador: "persona", puntaje: 4 });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.VALORACION_COLABORACION_ID_INVALIDO.code);
    });

    test.each([
      [{ evaluador: "admin", puntaje: 4 }, ErrorCatalog.VALORACION_EVALUADOR_TIPO_FORMATO],
      [{ evaluador: "persona", puntaje: 6 }, ErrorCatalog.VALORACION_PUNTAJE_RANGO],
      [{ evaluador: "persona", puntaje: 0 }, ErrorCatalog.VALORACION_PUNTAJE_RANGO],
      [{ evaluador: "persona", puntaje: 3.5 }, ErrorCatalog.VALORACION_PUNTAJE_FORMATO],
      [{ evaluador: "persona", puntaje: "5" }, ErrorCatalog.VALORACION_PUNTAJE_FORMATO],
      [
        { evaluador: "persona", puntaje: 4, comentario: "a".repeat(501) },
        ErrorCatalog.VALORACION_COMENTARIO_LARGO,
      ],
      [
        { evaluador: "persona", puntaje: 4, comentario: 10 },
        ErrorCatalog.VALORACION_COMENTARIO_FORMATO,
      ],
    ])("responde 400 ante un body inválido %o", async (body, error) => {
      const { colaboracionId } = await colaboracionDadaDeBaja();

      const respuesta = await valorar({ colaboracionId, ...body });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });

    // BUG: `puntaje` usa zod.number sin required_error; si falta, el mensaje de zod ("Required")
    // no existe en el ErrorCatalog, AppError recibe undefined y la API responde 500 en vez de
    // 400 VALORACION_PUNTAJE_REQUERIDO.
    test.failing("responde 400 si falta el puntaje", async () => {
      const { colaboracionId } = await colaboracionDadaDeBaja();

      const respuesta = await valorar({ colaboracionId, evaluador: "persona" });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.VALORACION_PUNTAJE_REQUERIDO.code);
    });
  });

  describe("GET de valoraciones", () => {
    async function conValoracionesCruzadas() {
      const { e, colaboracionId } = await colaboracionDadaDeBaja();
      await valorar({ colaboracionId, evaluador: "colectivo", puntaje: 5 });
      await valorar({ colaboracionId, evaluador: "persona", puntaje: 2 });
      return e;
    }

    test("GET /personaColaboradora/:id/valoraciones devuelve recibidas o emitidas", async () => {
      const e = await conValoracionesCruzadas();

      const recibidas = await request(app).get(`/personaColaboradora/${e.personaId}/valoraciones`);
      const emitidas = await request(app).get(
        `/personaColaboradora/${e.personaId}/valoraciones?direccion=emitidas`,
      );

      expect(recibidas.status).toBe(200);
      expect(recibidas.body.map((v) => v.puntaje)).toEqual([5]);
      expect(emitidas.status).toBe(200);
      expect(emitidas.body.map((v) => v.puntaje)).toEqual([2]);
    });

    test("GET /colectivo/:id/valoraciones devuelve recibidas o emitidas", async () => {
      const e = await conValoracionesCruzadas();

      const recibidas = await request(app).get(`/colectivo/${e.colectivoId}/valoraciones`);
      const emitidas = await request(app).get(
        `/colectivo/${e.colectivoId}/valoraciones?direccion=emitidas`,
      );

      expect(recibidas.status).toBe(200);
      expect(recibidas.body.map((v) => v.puntaje)).toEqual([2]);
      expect(emitidas.body.map((v) => v.puntaje)).toEqual([5]);
    });

    test("responden 404 si la persona o el colectivo no existen", async () => {
      const persona = await request(app).get(
        `/personaColaboradora/${idInexistente()}/valoraciones`,
      );
      const colectivo = await request(app).get(`/colectivo/${idInexistente()}/valoraciones`);

      expect(persona.status).toBe(404);
      expect(persona.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
      expect(colectivo.status).toBe(404);
      expect(colectivo.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
    });
  });
});
