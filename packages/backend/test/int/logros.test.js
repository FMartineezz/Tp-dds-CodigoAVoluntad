import request from "supertest";
import mongoose from "mongoose";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { habilidadService, colectivoService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

const nuevoId = () => new mongoose.Types.ObjectId().toString();

function logro(descripcion, porcentaje) {
  return { descripcion, porcentaje, urlCodigoFuente: "https://github.com/huerta/app" };
}

let proyectoId;
let rutaLogros;

const postLogro = (body, ruta = rutaLogros) => request(app).post(ruta).send(body);

beforeEach(async () => {
  await habilidadService.crearHabilidad("Backend", "APIs y bases de datos");
  await colectivoService.crearColectivo("Huerta Comunitaria", "Huerta del barrio", "caba", "ong");
  const { body } = await request(app)
    .post("/proyectos")
    .send({
      titulo: "Huerta digital",
      descripcion: "Sistema para organizar la huerta",
      perfiles: [
        {
          descripcion: "Desarrollo backend",
          habilidadesRequeridas: ["backend"],
          habilidadesOpcionales: [],
          horas: 10,
          tipoDeCompromiso: "semanal",
          modalidadDeColaboracion: "gratuita",
        },
      ],
      colectivo: "Huerta Comunitaria",
      urlSistema: "https://huerta.org",
    })
    .expect(201);
  proyectoId = body._id;
  rutaLogros = `/proyectos/${proyectoId}/logros`;
});

describe("POST /proyectos/:id/logros", () => {
  test("crea el logro (201) con header Location", async () => {
    // Ejecución
    const respuesta = await postLogro(logro("MVP", 30));

    // Validación
    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject(logro("MVP", 30));
    expect(respuesta.headers.location).toBe(`${rutaLogros}/${respuesta.body._id}`);
  });

  test("acepta llegar a 100% y rechaza superarlo", async () => {
    // Preparación
    await postLogro(logro("MVP", 70)).expect(201);
    await postLogro(logro("Beta", 30)).expect(201);

    // Ejecución
    const respuesta = await postLogro(logro("Extra", 1));

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO.code);
    const { body: logros } = await request(app).get(rutaLogros);
    expect(logros).toHaveLength(2);
  });

  test.each([
    ["sin descripción", { descripcion: undefined }, ErrorCatalog.LOGRO_DESCRIPCION_INVALIDA],
    ["descripción en blanco", { descripcion: "   " }, ErrorCatalog.LOGRO_DESCRIPCION_INVALIDA],
    ["porcentaje 0", { porcentaje: 0 }, ErrorCatalog.LOGRO_PORCENTAJE_INVALIDO],
    ["porcentaje negativo", { porcentaje: -10 }, ErrorCatalog.LOGRO_PORCENTAJE_INVALIDO],
    ["porcentaje mayor a 100", { porcentaje: 101 }, ErrorCatalog.LOGRO_PORCENTAJE_INVALIDO],
    ["porcentaje como texto", { porcentaje: "50" }, ErrorCatalog.LOGRO_PORCENTAJE_INVALIDO],
    ["url inválida", { urlCodigoFuente: "github" }, ErrorCatalog.LOGRO_URL_INVALIDA],
    ["sin url", { urlCodigoFuente: undefined }, ErrorCatalog.LOGRO_URL_INVALIDA],
  ])("responde 400 %s", async (_caso, cambios, error) => {
    // Ejecución
    const respuesta = await postLogro({ ...logro("MVP", 30), ...cambios });

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(error.code);
  });

  test("responde 400 si el proyecto está finalizado", async () => {
    // Preparación
    await request(app).patch(`/proyectos/${proyectoId}`).send({ finalizado: true }).expect(200);

    // Ejecución
    const respuesta = await postLogro(logro("MVP", 30));

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_FINALIZADO.code);
  });

  test("responde 404 si el proyecto no existe", async () => {
    const respuesta = await postLogro(logro("MVP", 30), `/proyectos/${nuevoId()}/logros`);
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
  });
});

describe("GET /proyectos/:id/logros", () => {
  test("lista los logros y obtiene uno por id", async () => {
    // Preparación
    const { body: mvp } = await postLogro(logro("MVP", 30)).expect(201);
    await postLogro(logro("Beta", 20)).expect(201);

    // Ejecución
    const lista = await request(app).get(rutaLogros);
    const uno = await request(app).get(`${rutaLogros}/${mvp._id}`);

    // Validación
    expect(lista.status).toBe(200);
    expect(lista.body.map((l) => l.descripcion)).toEqual(["MVP", "Beta"]);
    expect(uno.status).toBe(200);
    expect(uno.body).toMatchObject({ _id: mvp._id, ...logro("MVP", 30) });
  });

  test("responde 404 si el logro no existe", async () => {
    const respuesta = await request(app).get(`${rutaLogros}/${nuevoId()}`);
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO.code);
  });

  test("responde 404 si el proyecto no existe", async () => {
    const respuesta = await request(app).get(`/proyectos/${nuevoId()}/logros`);
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
  });
});

describe("PATCH /proyectos/:id/logros/:logroId", () => {
  test("actualiza el porcentaje descontando el valor anterior del propio logro", async () => {
    // Preparación
    await postLogro(logro("MVP", 50)).expect(201);
    const { body: beta } = await postLogro(logro("Beta", 40)).expect(201);

    // Ejecución
    const respuesta = await request(app)
      .patch(`${rutaLogros}/${beta._id}`)
      .send({ porcentaje: 50 });

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ descripcion: "Beta", porcentaje: 50 });
  });

  test("responde 400 si el nuevo porcentaje supera el 100%", async () => {
    // Preparación
    await postLogro(logro("MVP", 50)).expect(201);
    const { body: beta } = await postLogro(logro("Beta", 40)).expect(201);

    // Ejecución
    const respuesta = await request(app)
      .patch(`${rutaLogros}/${beta._id}`)
      .send({ porcentaje: 60 });

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO.code);
  });

  test("responde 400 si un campo enviado es inválido", async () => {
    // Preparación
    const { body: mvp } = await postLogro(logro("MVP", 50)).expect(201);

    // Ejecución
    const respuesta = await request(app)
      .patch(`${rutaLogros}/${mvp._id}`)
      .send({ urlCodigoFuente: "no-url" });

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.LOGRO_URL_INVALIDA.code);
  });

  test("responde 404 si el logro no existe", async () => {
    const respuesta = await request(app)
      .patch(`${rutaLogros}/${nuevoId()}`)
      .send({ porcentaje: 10 });
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO.code);
  });
});

describe("DELETE /proyectos/:id/logros/:logroId", () => {
  test("elimina el logro y lo devuelve", async () => {
    // Preparación
    const { body: mvp } = await postLogro(logro("MVP", 50)).expect(201);

    // Ejecución
    const respuesta = await request(app).delete(`${rutaLogros}/${mvp._id}`);

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body._id).toBe(mvp._id);
    const { body: logros } = await request(app).get(rutaLogros);
    expect(logros).toEqual([]);
  });

  test("responde 400 si el proyecto está finalizado", async () => {
    // Preparación
    const { body: mvp } = await postLogro(logro("MVP", 50)).expect(201);
    await request(app).patch(`/proyectos/${proyectoId}`).send({ finalizado: true }).expect(200);

    // Ejecución
    const respuesta = await request(app).delete(`${rutaLogros}/${mvp._id}`);

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_FINALIZADO.code);
  });

  test("responde 404 si el logro no existe", async () => {
    const respuesta = await request(app).delete(`${rutaLogros}/${nuevoId()}`);
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO.code);
  });
});
