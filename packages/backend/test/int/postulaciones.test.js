import request from "supertest";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import {
  armarEscenario,
  crearColaboradora,
  crearHabilidad,
  idInexistente,
} from "../utils/escenarios.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";
import { ColaboracionModel } from "../../src/schemas/colaboracionSchema.js";

usarBaseDeDatos();

const rutaPostulacion = (e) => `/proyectos/${e.proyectoId}/perfiles/${e.perfilId}/postulaciones`;

const postularse = (e, body = { personaColaboradoraId: e.personaId }) =>
  request(app).post(rutaPostulacion(e)).send(body);

describe("Postulaciones (HTTP)", () => {
  describe("POST /proyectos/:proyectoId/perfiles/:perfilId/postulaciones", () => {
    test("responde 201 con la postulación pendiente", async () => {
      // Preparación
      const e = await armarEscenario();

      // Ejecución
      const respuesta = await postularse(e, { personaColaboradoraId: e.personaId, anonima: true });

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body.id).toBeDefined();
      expect(respuesta.body.estado).toBe("pendiente");
      expect(respuesta.body.anonima).toBe(true);
    });

    test("responde 400 si falta la colaboradora", async () => {
      const e = await armarEscenario();

      const respuesta = await postularse(e, {});

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_PERSONA_REQUERIDA.code);
    });

    test("responde 400 si anonima no es booleano", async () => {
      const e = await armarEscenario();

      const respuesta = await postularse(e, { personaColaboradoraId: e.personaId, anonima: "si" });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_ANONIMA_FORMATO.code);
    });

    test("responde 409 ante una postulación duplicada", async () => {
      const e = await armarEscenario();
      await postularse(e);

      const respuesta = await postularse(e);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_DUPLICADA.code);
    });

    test("responde 409 si el proyecto está finalizado", async () => {
      const e = await armarEscenario();
      await request(app).patch(`/proyectos/${e.proyectoId}`).send({ finalizado: true });

      const respuesta = await postularse(e);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_PROYECTO_FINALIZADO.code);
    });

    test("responde 409 si la búsqueda está cerrada", async () => {
      const e = await armarEscenario();
      await ProyectoModel.updateOne({ _id: e.proyectoId }, { busquedaCerrada: true });

      const respuesta = await postularse(e);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_BUSQUEDA_CERRADA.code);
    });

    test("responde 409 si venció la fecha límite de búsqueda", async () => {
      const e = await armarEscenario({ fechaLimiteBusqueda: new Date(Date.now() - 60_000) });

      const respuesta = await postularse(e);

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_BUSQUEDA_CERRADA.code);
    });

    test("responde 400 si la colaboradora no tiene habilidades requeridas", async () => {
      const e = await armarEscenario();
      const otra = await crearHabilidad();
      const persona = await crearColaboradora({ habilidades: [otra.codigo] });

      const respuesta = await postularse(e, { personaColaboradoraId: persona.id });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_HABILIDAD_REQUERIDA.code);
    });

    test("responde 404 si el perfil no existe", async () => {
      const e = await armarEscenario();

      const respuesta = await postularse({ ...e, perfilId: idInexistente() });

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.PERFIL_NO_ENCONTRADO.code);
    });

    // BUG: un id con formato inválido produce un CastError de mongoose que no se traduce a un
    // error del catálogo y el errorHandler responde 500 en lugar de 404 (o 400).
    test.failing("responde 404 si el id del proyecto no es un ObjectId válido", async () => {
      const e = await armarEscenario();

      const respuesta = await postularse({ ...e, proyectoId: "no-es-un-id" });

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
    });
  });

  describe("GET de listados", () => {
    test("GET /colectivos/:id/postulaciones lista y filtra por estado", async () => {
      // Preparación
      const e = await armarEscenario();
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      const { body: p1 } = await postularse(e);
      await postularse(e, { personaColaboradoraId: otra.id });
      await request(app).patch(`/postulaciones/${p1.id}`).send({ estado: "rechazada" });

      // Ejecución
      const todas = await request(app).get(`/colectivos/${e.colectivoId}/postulaciones`);
      const pendientes = await request(app).get(
        `/colectivos/${e.colectivoId}/postulaciones?estado=pendiente`,
      );

      // Validación
      expect(todas.status).toBe(200);
      expect(todas.body).toHaveLength(2);
      expect(pendientes.status).toBe(200);
      expect(pendientes.body).toHaveLength(1);
      expect(pendientes.body[0].personaColaboradora.nombreFantasia).toBe(otra.nombreFantasia);
      expect(pendientes.body[0].estado).toBe("pendiente");
    });

    test("GET /colectivos/:id/postulaciones responde 404 si el colectivo no existe", async () => {
      const respuesta = await request(app).get(`/colectivos/${idInexistente()}/postulaciones`);

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
    });

    test("GET /colaboradoras/:id/postulaciones lista las postulaciones de la colaboradora", async () => {
      const e = await armarEscenario();
      await postularse(e);

      const respuesta = await request(app).get(`/colaboradoras/${e.personaId}/postulaciones`);

      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toHaveLength(1);
      expect(respuesta.body[0]).toMatchObject({
        proyecto: e.proyecto.titulo,
        perfil: e.perfil.descripcion,
        estado: "pendiente",
      });
    });

    test("GET /colaboradoras/:id/postulaciones responde 404 si la colaboradora no existe", async () => {
      const respuesta = await request(app).get(`/colaboradoras/${idInexistente()}/postulaciones`);

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORADORA_NO_ENCONTRADA.code);
    });
  });

  describe("PATCH /postulaciones/:id", () => {
    test("aceptar (sin importar mayúsculas) responde 200 y crea la colaboración", async () => {
      const e = await armarEscenario();
      const { body: postulacion } = await postularse(e);

      const respuesta = await request(app)
        .patch(`/postulaciones/${postulacion.id}`)
        .send({ estado: "ACEPTADA" });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.estado).toBe("aceptada");
      const colaboraciones = await request(app).get("/colaboraciones");
      expect(colaboraciones.body).toHaveLength(1);
    });

    test("rechazar responde 200 y no crea colaboración", async () => {
      const e = await armarEscenario();
      const { body: postulacion } = await postularse(e);

      const respuesta = await request(app)
        .patch(`/postulaciones/${postulacion.id}`)
        .send({ estado: "rechazada" });

      expect(respuesta.status).toBe(200);
      expect(respuesta.body.estado).toBe("rechazada");
      expect(await ColaboracionModel.countDocuments()).toBe(0);
    });

    test("responde 400 si falta el estado", async () => {
      const e = await armarEscenario();
      const { body: postulacion } = await postularse(e);

      const respuesta = await request(app).patch(`/postulaciones/${postulacion.id}`).send({});

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_ESTADO_REQUERIDO.code);
    });

    test("responde 400 si el estado no es aceptada ni rechazada", async () => {
      const e = await armarEscenario();
      const { body: postulacion } = await postularse(e);

      const respuesta = await request(app)
        .patch(`/postulaciones/${postulacion.id}`)
        .send({ estado: "pendiente" });

      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_ESTADO_INVALIDO.code);
    });

    test("responde 409 si la postulación ya fue resuelta", async () => {
      const e = await armarEscenario();
      const { body: postulacion } = await postularse(e);
      await request(app).patch(`/postulaciones/${postulacion.id}`).send({ estado: "aceptada" });

      const respuesta = await request(app)
        .patch(`/postulaciones/${postulacion.id}`)
        .send({ estado: "rechazada" });

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_YA_RESUELTA.code);
    });

    test("responde 404 si la postulación no existe", async () => {
      const respuesta = await request(app)
        .patch(`/postulaciones/${idInexistente()}`)
        .send({ estado: "aceptada" });

      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.POSTULACION_NO_ENCONTRADA.code);
    });

    test("responde 409 al aceptar con el cupo del perfil completo", async () => {
      const e = await armarEscenario({ cantidadMaxima: 1 });
      const otra = await crearColaboradora({ habilidades: [e.habilidad.codigo] });
      const { body: p1 } = await postularse(e);
      const { body: p2 } = await postularse(e, { personaColaboradoraId: otra.id });
      await request(app).patch(`/postulaciones/${p1.id}`).send({ estado: "aceptada" });

      const respuesta = await request(app)
        .patch(`/postulaciones/${p2.id}`)
        .send({ estado: "aceptada" });

      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLABORACION_CUPO_COMPLETO.code);
    });
  });

  describe("datos de contacto (enunciado)", () => {
    const contactos = [{ tipo: "email", valor: "ana@contacto.test" }];

    test("con la postulación pendiente, el colectivo no recibe los contactos", async () => {
      const e = await armarEscenario({ contactos });
      await postularse(e);

      const respuesta = await request(app).get(`/colectivos/${e.colectivoId}/postulaciones`);

      expect(respuesta.status).toBe(200);
      expect(JSON.stringify(respuesta.body)).not.toContain("ana@contacto.test");
    });

    // BUG: una vez aceptada la postulación, el enunciado indica que los datos de contacto quedan
    // disponibles para el colectivo; sin embargo ningún endpoint del colectivo los devuelve.
    test.failing("con la postulación aceptada, el colectivo recibe los contactos", async () => {
      const e = await armarEscenario({ contactos });
      const { body: postulacion } = await postularse(e);
      await request(app).patch(`/postulaciones/${postulacion.id}`).send({ estado: "aceptada" });

      const respuesta = await request(app).get(
        `/colectivos/${e.colectivoId}/postulaciones?estado=aceptada`,
      );

      expect(respuesta.status).toBe(200);
      expect(respuesta.body[0].personaColaboradora.contactos).toEqual(contactos);
    });
  });
});
