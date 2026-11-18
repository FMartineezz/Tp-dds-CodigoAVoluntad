import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import {
  armarEscenario,
  crearColaboracion,
  crearColaboradora,
  idInexistente,
} from "../utils/escenarios.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ColaboracionModel } from "../../src/schemas/colaboracionSchema.js";

usarBaseDeDatos();

describe("Colaboraciones (HTTP)", () => {
  describe("GET /colaboraciones", () => {
    test("responde 200 con las colaboraciones activas", async () => {
      // Preparación
      const e = await armarEscenario();
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      await crearColaboracion(e);
      const { colaboracionId } = await crearColaboracion(e, { persona: otra });
      await request(app).delete(`/colaboraciones/${colaboracionId}`);

      // Ejecución
      const respuesta = await request(app).get("/colaboraciones");

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toHaveLength(1);
      expect(respuesta.body[0].personaColaboradora._id).toBe(e.personaId);
      expect(respuesta.body[0].proyecto._id).toBe(e.proyectoId);
    });

    test("responde una lista vacía si no hay colaboraciones", async () => {
      const respuesta = await request(app).get("/colaboraciones");

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toEqual([]);
    });
  });

  describe("GET /colaboraciones/:id", () => {
    test("responde 200 con la colaboración", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);

      const respuesta = await request(app).get(`/colaboraciones/${colaboracionId}`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({ _id: colaboracionId, activo: true, anonima: false });
    });

    test("en una colaboración anónima no devuelve la persona", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e, { anonima: true });

      const respuesta = await request(app).get(`/colaboraciones/${colaboracionId}`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.personaColaboradora).toBeNull();
    });

    test("responde 404 si no existe", async () => {
      const respuesta = await request(app).get(`/colaboraciones/${idInexistente()}`);

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_NO_ENCONTRADA.code);
    });
  });

  describe("DELETE /colaboraciones/:id", () => {
    test("responde 200 y hace una baja lógica", async () => {
      // Preparación
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);

      // Ejecución
      const respuesta = await request(app).delete(`/colaboraciones/${colaboracionId}`);

      // Validación
      expect(respuesta.status).toBe(200);
      const guardada = await ColaboracionModel.findById(colaboracionId).lean();
      expect(guardada.activo).toBe(false);
      expect(guardada.fechaBaja).toBeInstanceOf(Date);
      const detalle = await request(app).get(`/colaboraciones/${colaboracionId}`);
      expect(detalle.status).toBe(200);
      expect(detalle.body.activo).toBe(false);
    });

    test("la baja es permanente: un segundo DELETE responde 409", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await request(app).delete(`/colaboraciones/${colaboracionId}`);

      const respuesta = await request(app).delete(`/colaboraciones/${colaboracionId}`);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_YA_DADA_DE_BAJA.code);
    });

    test("la baja es permanente: la persona no puede volver a postularse al perfil", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await request(app).delete(`/colaboraciones/${colaboracionId}`);

      const respuesta = await request(app)
        .post(`/proyectos/${e.proyectoId}/perfiles/${e.perfilId}/postulaciones`)
        .send({ personaColaboradoraId: e.personaId });

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_DUPLICADA.code);
    });

    test("libera el cupo del perfil para aceptar otra postulación", async () => {
      // Preparación
      const e = await armarEscenario({ cantidadMaxima: 1 });
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      const { colaboracionId } = await crearColaboracion(e);
      const { body: pendiente } = await request(app)
        .post(`/proyectos/${e.proyectoId}/perfiles/${e.perfilId}/postulaciones`)
        .send({ personaColaboradoraId: otra.id });
      const sinCupo = await request(app)
        .patch(`/postulaciones/${pendiente.id}`)
        .send({ estado: "aceptada" });

      // Ejecución
      await request(app).delete(`/colaboraciones/${colaboracionId}`);
      const conCupo = await request(app)
        .patch(`/postulaciones/${pendiente.id}`)
        .send({ estado: "aceptada" });

      // Validación
      expect(sinCupo.status).toBe(409);
      expect(sinCupo.body.code).toBe(ErrorCatalog.COLABORACION_CUPO_COMPLETO.code);
      expect(conCupo.status).toBe(200);
      expect(conCupo.body.estado).toBe("aceptada");
    });

    test("responde 404 si no existe", async () => {
      const respuesta = await request(app).delete(`/colaboraciones/${idInexistente()}`);

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_NO_ENCONTRADA.code);
    });

    // BUG: con un id que no es un ObjectId válido mongoose lanza un CastError que el
    // errorHandler no traduce, y la API responde 500 en lugar de 404.
    test.failing("responde 404 si el id no tiene formato válido", async () => {
      const respuesta = await request(app).delete("/colaboraciones/no-es-un-id");

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_NO_ENCONTRADA.code);
    });
  });
});
