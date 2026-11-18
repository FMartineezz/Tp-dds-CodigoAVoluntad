import request from "supertest";
import mongoose from "mongoose";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { habilidadService, colectivoService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";

usarBaseDeDatos();

const UNA_HORA = 60 * 60 * 1000;

function perfilBody(cambios = {}) {
  return {
    descripcion: "Desarrollo backend",
    habilidadesRequeridas: ["backend"],
    habilidadesOpcionales: ["frontend"],
    horas: 10,
    tipoDeCompromiso: "semanal",
    modalidadDeColaboracion: "gratuita",
    ...cambios,
  };
}

function proyectoBody(cambios = {}) {
  return {
    titulo: "Huerta digital",
    descripcion: "Sistema para organizar la huerta",
    perfiles: [perfilBody()],
    colectivo: "Huerta Comunitaria",
    urlSistema: "https://huerta.org",
    ...cambios,
  };
}

const postProyecto = (body) => request(app).post("/proyectos").send(body);

beforeEach(async () => {
  await habilidadService.crearHabilidad("Backend", "APIs y bases de datos");
  await habilidadService.crearHabilidad("Frontend", "Interfaces web");
  await colectivoService.crearColectivo("Huerta Comunitaria", "Huerta del barrio", "caba", "ong");
});

describe("POST /proyectos", () => {
  test("crea el proyecto con perfiles, cupo, fechas y urlDonaciones (201)", async () => {
    // Preparación
    const fechaCierre = new Date(Date.now() + 48 * UNA_HORA).toISOString();
    const fechaLimiteBusqueda = new Date(Date.now() + 24 * UNA_HORA).toISOString();

    // Ejecución
    const respuesta = await postProyecto(
      proyectoBody({
        perfiles: [perfilBody({ cantidadMaxima: 2 }), perfilBody({ descripcion: "Diseño UX" })],
        fechaCierre,
        fechaLimiteBusqueda,
        urlDonaciones: "https://cafecito.app/huerta",
      }),
    );

    // Validación
    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      titulo: "Huerta digital",
      finalizado: false,
      busquedaCerrada: false,
      fechaCierre,
      fechaLimiteBusqueda,
      urlDonaciones: "https://cafecito.app/huerta",
    });
    expect(respuesta.body._id).toBeDefined();
    expect(respuesta.body.perfiles).toHaveLength(2);
    expect(respuesta.body.perfiles[0].cantidadMaxima).toBe(2);
    expect(respuesta.body.perfiles[1].cantidadMaxima).toBeUndefined();

    const guardado = await ProyectoModel.findById(respuesta.body._id).lean();
    expect(guardado.perfiles.map((p) => p.descripcion)).toEqual([
      "Desarrollo backend",
      "Diseño UX",
    ]);
  });

  test("responde 409 si ya existe un proyecto con ese título en el colectivo", async () => {
    // Preparación
    await postProyecto(proyectoBody()).expect(201);

    // Ejecución
    const respuesta = await postProyecto(proyectoBody());

    // Validación
    expect(respuesta.status).toBe(409);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_YA_EXISTENTE.code);
    expect(await ProyectoModel.countDocuments()).toBe(1);
  });

  test("responde 400 si el colectivo no existe", async () => {
    // Ejecución
    const respuesta = await postProyecto(proyectoBody({ colectivo: "Fantasma" }));

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE.code);
  });

  test("responde 400 si alguna habilidad no existe", async () => {
    // Ejecución
    const respuesta = await postProyecto(
      proyectoBody({ perfiles: [perfilBody({ habilidadesRequeridas: ["cobol"] })] }),
    );

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO.code);
    expect(respuesta.body.message).toContain("cobol");
    expect(await ProyectoModel.countDocuments()).toBe(0);
  });

  test.each([
    ["sin título", { titulo: undefined }, ErrorCatalog.PROYECTO_TITULO_REQUERIDO],
    ["sin descripción", { descripcion: undefined }, ErrorCatalog.PROYECTO_DESCRIPCION_REQUERIDA],
    ["sin perfiles", { perfiles: [] }, ErrorCatalog.PROYECTO_PERFILES_REQUERIDOS],
    ["sin colectivo", { colectivo: undefined }, ErrorCatalog.PROYECTO_COLECTIVO_REQUERIDO],
    ["colectivo no texto", { colectivo: 12 }, ErrorCatalog.PROYECTO_COLECTIVO_FORMATO],
    ["urlSistema inválida", { urlSistema: "huerta" }, ErrorCatalog.PROYECTO_URL_SISTEMA_INVALIDA],
    [
      "urlDonaciones inválida",
      { urlDonaciones: "ftp://x.org" },
      ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA,
    ],
    [
      "perfil sin habilidades requeridas",
      { perfiles: [perfilBody({ habilidadesRequeridas: [] })] },
      ErrorCatalog.PERFIL_HABILIDADES_REQUERIDAS,
    ],
    [
      "perfil con tipo de compromiso inválido",
      { perfiles: [perfilBody({ tipoDeCompromiso: "anual" })] },
      ErrorCatalog.PERFIL_TIPO_COMPROMISO_FORMATO,
    ],
    [
      "perfil con cantidadMaxima no numérica",
      { perfiles: [perfilBody({ cantidadMaxima: "dos" })] },
      ErrorCatalog.ARGUMENTO_INVALIDO,
    ],
  ])("responde 400 %s", async (_caso, cambios, error) => {
    // Ejecución
    const respuesta = await postProyecto(proyectoBody(cambios));

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(error.code);
    expect(await ProyectoModel.countDocuments()).toBe(0);
  });

  // BUG: habilidadesOpcionales es opcional en la validación (zod le pone default []), pero el
  // middleware no reemplaza req.body por el dato parseado; PerfilService.crearPerfil hace
  // [...habilidadesRequeridas, ...undefined] y explota con TypeError → 500.
  test.failing("crea el proyecto aunque un perfil no envíe habilidadesOpcionales", async () => {
    // Ejecución
    const respuesta = await postProyecto(
      proyectoBody({ perfiles: [perfilBody({ habilidadesOpcionales: undefined })] }),
    );

    // Validación
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.perfiles[0].habilidadesOpcionales).toEqual([]);
  });

  // BUG: la validación de zod acepta cualquier número en cantidadMaxima, pero el schema de mongoose
  // exige min 1. Un cupo de 0 llega a la base, falla con ValidationError y la API responde 500
  // (ERR-CSR-500) en lugar de un 400 de validación.
  test.failing("responde 400 (no 500) si cantidadMaxima es 0", async () => {
    // Ejecución
    const respuesta = await postProyecto(
      proyectoBody({ perfiles: [perfilBody({ cantidadMaxima: 0 })] }),
    );

    // Validación
    expect(respuesta.status).toBe(400);
  });

  // BUG: lo mismo con horas negativas: zod no pone mínimo y mongoose (min 0) lo rechaza con un 500.
  test.failing("responde 400 (no 500) si las horas son negativas", async () => {
    // Ejecución
    const respuesta = await postProyecto(proyectoBody({ perfiles: [perfilBody({ horas: -5 })] }));

    // Validación
    expect(respuesta.status).toBe(400);
  });
});

describe("GET /proyectos", () => {
  test("lista todos los proyectos", async () => {
    // Preparación
    await postProyecto(proyectoBody({ titulo: "Uno" })).expect(201);
    await postProyecto(proyectoBody({ titulo: "Dos" })).expect(201);

    // Ejecución
    const respuesta = await request(app).get("/proyectos");

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.map((p) => p.titulo).sort()).toEqual(["Dos", "Uno"]);
  });

  test("devuelve una lista vacía si no hay proyectos", async () => {
    const respuesta = await request(app).get("/proyectos");
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual([]);
  });
});

describe("GET /proyectos/:id", () => {
  test("devuelve el proyecto", async () => {
    // Preparación
    const { body: creado } = await postProyecto(proyectoBody()).expect(201);

    // Ejecución
    const respuesta = await request(app).get(`/proyectos/${creado._id}`);

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ _id: creado._id, titulo: "Huerta digital" });
    expect(respuesta.body.perfiles).toHaveLength(1);
  });

  test("responde 404 si no existe", async () => {
    // Ejecución
    const respuesta = await request(app).get(`/proyectos/${new mongoose.Types.ObjectId()}`);

    // Validación
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
  });

  // BUG: un id que no es un ObjectId válido hace fallar el findById con un CastError que nadie
  // traduce, y la API responde 500 (ERR-CSR-500) en lugar de 404/400.
  test.failing("responde 404 (no 500) si el id no tiene formato de ObjectId", async () => {
    // Ejecución
    const respuesta = await request(app).get("/proyectos/no-es-un-id");

    // Validación
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
  });
});

describe("PATCH /proyectos/:id", () => {
  test("finaliza el proyecto", async () => {
    // Preparación
    const { body: creado } = await postProyecto(proyectoBody()).expect(201);

    // Ejecución
    const respuesta = await request(app)
      .patch(`/proyectos/${creado._id}`)
      .send({ finalizado: true });

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.finalizado).toBe(true);
    expect((await ProyectoModel.findById(creado._id).lean()).finalizado).toBe(true);
  });

  test("responde 400 si el proyecto ya estaba finalizado", async () => {
    // Preparación
    const { body: creado } = await postProyecto(proyectoBody()).expect(201);
    await request(app).patch(`/proyectos/${creado._id}`).send({ finalizado: true }).expect(200);

    // Ejecución
    const respuesta = await request(app)
      .patch(`/proyectos/${creado._id}`)
      .send({ finalizado: true });

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_FINALIZADO.code);
  });

  test("actualiza la urlDonaciones y la puede borrar con null", async () => {
    // Preparación
    const { body: creado } = await postProyecto(proyectoBody()).expect(201);

    // Ejecución
    const conUrl = await request(app)
      .patch(`/proyectos/${creado._id}`)
      .send({ urlDonaciones: "https://mercadopago.com/huerta" });
    const sinUrl = await request(app)
      .patch(`/proyectos/${creado._id}`)
      .send({ urlDonaciones: null });

    // Validación
    expect(conUrl.status).toBe(200);
    expect(conUrl.body.urlDonaciones).toBe("https://mercadopago.com/huerta");
    expect(sinUrl.status).toBe(200);
    expect(sinUrl.body.urlDonaciones).toBeNull();
  });

  test.each([
    [
      "urlDonaciones inválida",
      { urlDonaciones: "no-url" },
      ErrorCatalog.PROYECTO_URL_DONACIONES_INVALIDA,
    ],
    ["finalizado: false", { finalizado: false }, ErrorCatalog.ARGUMENTO_INVALIDO],
    ["un campo no permitido", { titulo: "Otro" }, ErrorCatalog.ARGUMENTO_INVALIDO],
    ["un body vacío", {}, ErrorCatalog.ARGUMENTO_INVALIDO],
  ])("responde 400 con %s", async (_caso, body, error) => {
    // Preparación
    const { body: creado } = await postProyecto(proyectoBody()).expect(201);

    // Ejecución
    const respuesta = await request(app).patch(`/proyectos/${creado._id}`).send(body);

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(error.code);
    const guardado = await ProyectoModel.findById(creado._id).lean();
    expect(guardado).toMatchObject({ titulo: "Huerta digital", finalizado: false });
  });

  test("responde 404 si el proyecto no existe", async () => {
    // Ejecución
    const respuesta = await request(app)
      .patch(`/proyectos/${new mongoose.Types.ObjectId()}`)
      .send({ finalizado: true });

    // Validación
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
  });
});
