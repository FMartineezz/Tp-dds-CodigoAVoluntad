import request from "supertest";
import mongoose from "mongoose";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { habilidadService, colectivoService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ProyectoModel } from "../../src/schemas/proyectoSchema.js";

usarBaseDeDatos();

const nuevoId = () => new mongoose.Types.ObjectId().toString();

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

let habilidades;
let proyectoId;
let perfilId;
let rutaPerfiles;

beforeEach(async () => {
  await habilidadService.crearHabilidad("Backend", "APIs y bases de datos");
  await habilidadService.crearHabilidad("Frontend", "Interfaces web");
  await habilidadService.crearHabilidad("Testing", "Pruebas automatizadas");
  habilidades = Object.fromEntries(
    (await habilidadService.obtenerHabilidades()).map((h) => [h.codigo, String(h._id)]),
  );
  await colectivoService.crearColectivo("Huerta Comunitaria", "Huerta del barrio", "caba", "ong");

  const { body } = await request(app)
    .post("/proyectos")
    .send({
      titulo: "Huerta digital",
      descripcion: "Sistema para organizar la huerta",
      perfiles: [perfilBody({ cantidadMaxima: 2 })],
      colectivo: "Huerta Comunitaria",
      urlSistema: "https://huerta.org",
    })
    .expect(201);
  proyectoId = body._id;
  perfilId = body.perfiles[0]._id;
  rutaPerfiles = `/proyectos/${proyectoId}/perfiles`;
});

describe("GET /proyectos/:id/perfiles", () => {
  test("lista los perfiles del proyecto", async () => {
    // Ejecución
    const respuesta = await request(app).get(rutaPerfiles);

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
    expect(respuesta.body[0]).toMatchObject({
      _id: perfilId,
      descripcion: "Desarrollo backend",
      habilidadesRequeridas: [habilidades.backend],
      habilidadesOpcionales: [habilidades.frontend],
      cantidadMaxima: 2,
    });
  });

  test("responde 404 si el proyecto no existe", async () => {
    const respuesta = await request(app).get(`/proyectos/${nuevoId()}/perfiles`);
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
  });
});

describe("GET /proyectos/:id/perfiles/:idPerfil", () => {
  test("devuelve el perfil", async () => {
    const respuesta = await request(app).get(`${rutaPerfiles}/${perfilId}`);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.descripcion).toBe("Desarrollo backend");
  });

  test("responde 404 si el perfil no existe", async () => {
    const respuesta = await request(app).get(`${rutaPerfiles}/${nuevoId()}`);
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PERFIL_NO_ENCONTRADO.code);
  });
});

describe("POST /proyectos/:id/perfiles", () => {
  test("agrega un perfil (201)", async () => {
    // Ejecución
    const respuesta = await request(app)
      .post(rutaPerfiles)
      .send(
        perfilBody({
          descripcion: "Testing",
          habilidadesRequeridas: ["testing"],
          habilidadesOpcionales: [],
          tipoDeCompromiso: "total",
          cantidadMaxima: 1,
        }),
      );

    // Validación
    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      descripcion: "Testing",
      habilidadesRequeridas: [habilidades.testing],
      cantidadMaxima: 1,
    });
    const guardado = await ProyectoModel.findById(proyectoId).lean();
    expect(guardado.perfiles.map((p) => p.descripcion)).toEqual(["Desarrollo backend", "Testing"]);
  });

  test("responde 400 si alguna habilidad no existe", async () => {
    // Ejecución
    const respuesta = await request(app)
      .post(rutaPerfiles)
      .send(perfilBody({ habilidadesRequeridas: ["cobol"] }));

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO.code);
    expect((await ProyectoModel.findById(proyectoId).lean()).perfiles).toHaveLength(1);
  });

  test.each([
    ["sin descripción", { descripcion: undefined }, ErrorCatalog.PERFIL_DESCRIPCION_REQUERIDO],
    [
      "sin habilidades requeridas",
      { habilidadesRequeridas: undefined },
      ErrorCatalog.PERFIL_HABILIDADES_REQUERIDAS,
    ],
    [
      "habilidades requeridas no array",
      { habilidadesRequeridas: "backend" },
      ErrorCatalog.PERFIL_HABILIDADES_REQUERIDAS_FORMATO,
    ],
    [
      "habilidades opcionales no array",
      { habilidadesOpcionales: "frontend" },
      ErrorCatalog.PERFIL_HABILIDADES_OPCIONALES_FORMATO,
    ],
    ["sin horas", { horas: undefined }, ErrorCatalog.PERFIL_HORAS_REQUERIDAS],
    [
      "sin tipo de compromiso",
      { tipoDeCompromiso: undefined },
      ErrorCatalog.PERFIL_TIPO_COMPROMISO_REQUERIDO,
    ],
    [
      "modalidad inválida",
      { modalidadDeColaboracion: "voluntaria" },
      ErrorCatalog.PERFIL_MODALIDAD_FORMATO,
    ],
    [
      "sin modalidad",
      { modalidadDeColaboracion: undefined },
      ErrorCatalog.PERFIL_MODALIDAD_REQUERIDA,
    ],
  ])("responde 400 %s", async (_caso, cambios, error) => {
    // Ejecución
    const respuesta = await request(app).post(rutaPerfiles).send(perfilBody(cambios));

    // Validación
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(error.code);
  });

  // BUG: validarPerfil no reemplaza req.body por el dato parseado, así que el default [] de
  // habilidadesOpcionales nunca se aplica y crearPerfil hace [...undefined] → TypeError → 500.
  test.failing("agrega un perfil aunque no envíe habilidadesOpcionales", async () => {
    // Ejecución
    const respuesta = await request(app)
      .post(rutaPerfiles)
      .send(perfilBody({ habilidadesOpcionales: undefined }));

    // Validación
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.habilidadesOpcionales).toEqual([]);
  });

  // BUG: si el proyecto no existe, agregarPerfil no lo valida y el repositorio devuelve null,
  // por lo que la API responde 201 con body null en lugar de 404.
  test.failing("responde 404 si el proyecto no existe", async () => {
    // Ejecución
    const respuesta = await request(app)
      .post(`/proyectos/${nuevoId()}/perfiles`)
      .send(perfilBody());

    // Validación
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
  });
});

describe("PATCH /proyectos/:id/perfiles/:idPerfil", () => {
  test("editar un perfil sin tocar habilidades no las borra", async () => {
    // Ejecución
    const respuesta = await request(app)
      .patch(`${rutaPerfiles}/${perfilId}`)
      .send({ descripcion: "Backend senior", horas: 20 });

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      descripcion: "Backend senior",
      horas: 20,
      habilidadesRequeridas: [habilidades.backend],
      habilidadesOpcionales: [habilidades.frontend],
    });
    const { body: guardado } = await request(app).get(`${rutaPerfiles}/${perfilId}`);
    expect(guardado.habilidadesRequeridas).toEqual([habilidades.backend]);
    expect(guardado.habilidadesOpcionales).toEqual([habilidades.frontend]);
  });

  test("reemplaza las habilidades requeridas cuando vienen", async () => {
    // Ejecución
    const respuesta = await request(app)
      .patch(`${rutaPerfiles}/${perfilId}`)
      .send({ habilidadesRequeridas: ["testing"] });

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.habilidadesRequeridas).toEqual([habilidades.testing]);
    expect(respuesta.body.habilidadesOpcionales).toEqual([habilidades.frontend]);
  });

  test("responde 400 si alguna habilidad no existe", async () => {
    const respuesta = await request(app)
      .patch(`${rutaPerfiles}/${perfilId}`)
      .send({ habilidadesOpcionales: ["cobol"] });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO.code);
  });

  test("responde 400 con un body vacío", async () => {
    const respuesta = await request(app).patch(`${rutaPerfiles}/${perfilId}`).send({});
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.ARGUMENTO_INVALIDO.code);
  });

  test("responde 400 si un campo enviado es inválido", async () => {
    const respuesta = await request(app)
      .patch(`${rutaPerfiles}/${perfilId}`)
      .send({ tipoDeCompromiso: "anual" });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.code).toBe(ErrorCatalog.PERFIL_TIPO_COMPROMISO_FORMATO.code);
  });

  test("responde 404 si el perfil no existe", async () => {
    const respuesta = await request(app)
      .patch(`${rutaPerfiles}/${nuevoId()}`)
      .send({ descripcion: "X" });
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PERFIL_NO_ENCONTRADO.code);
  });

  // BUG: el PATCH valida cantidadMaxima pero el repositorio no la incluye entre los campos que
  // actualiza, así que responde 200 con el cupo viejo.
  test.failing("actualiza la cantidadMaxima", async () => {
    // Ejecución
    const respuesta = await request(app)
      .patch(`${rutaPerfiles}/${perfilId}`)
      .send({ cantidadMaxima: 5 });

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.cantidadMaxima).toBe(5);
  });
});

describe("DELETE /proyectos/:id/perfiles/:idPerfil", () => {
  test("elimina el perfil y lo devuelve", async () => {
    // Ejecución
    const respuesta = await request(app).delete(`${rutaPerfiles}/${perfilId}`);

    // Validación
    expect(respuesta.status).toBe(200);
    expect(respuesta.body._id).toBe(perfilId);
    const { body: perfiles } = await request(app).get(rutaPerfiles);
    expect(perfiles).toEqual([]);
    const despues = await request(app).get(`${rutaPerfiles}/${perfilId}`);
    expect(despues.status).toBe(404);
  });

  test("responde 404 si el perfil no existe", async () => {
    const respuesta = await request(app).delete(`${rutaPerfiles}/${nuevoId()}`);
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PERFIL_NO_ENCONTRADO.code);
  });

  test("responde 404 si el proyecto no existe", async () => {
    const respuesta = await request(app).delete(`/proyectos/${nuevoId()}/perfiles/${perfilId}`);
    expect(respuesta.status).toBe(404);
    expect(respuesta.body.code).toBe(ErrorCatalog.PROYECTO_NO_ENCONTRADO.code);
  });
});
