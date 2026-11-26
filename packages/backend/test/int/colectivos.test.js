import request from "supertest";
import mongoose from "mongoose";
import { app } from "./utils/app.js";
import { conToken } from "../utils/tokenDeTest.js";
import { usarBaseDeDatos } from "../utils/db.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

const idInexistente = () => new mongoose.Types.ObjectId().toString();

const colectivoValido = (cambios = {}) => ({
  nombre: "Asamblea Norte",
  descripcion: "Asamblea barrial",
  ubicacion: "caba",
  tipoDeColectivo: "asamblea",
  ...cambios,
});

const crearColectivo = (body = colectivoValido()) =>
  request(app).post("/colectivos").set(conToken()).send(body);

describe("Colectivos (HTTP)", () => {
  describe("POST /colectivos", () => {
    test("sin token de Keycloak responde 401 y no crea nada", async () => {
      // Ejecución
      const respuesta = await request(app).post("/colectivos").send(colectivoValido());

      // Validación
      expect(respuesta.status).toBe(401);
      const listado = await request(app).get("/colectivos");
      expect(listado.body.resultados).toHaveLength(0);
    });

    test("con un token que no firmó Keycloak responde 403", async () => {
      // Ejecución
      const respuesta = await request(app)
        .post("/colectivos")
        .set("Authorization", "Bearer token-trucho")
        .send(colectivoValido());

      // Validación
      expect(respuesta.status).toBe(403);
    });

    test("crea el colectivo y responde 201 con Location", async () => {
      // Ejecución
      const respuesta = await crearColectivo(
        colectivoValido({ redesSociales: [{ tipo: "Instagram", url: "https://instagram.com/a" }] }),
      );

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({
        nombre: "Asamblea Norte",
        ubicacion: "caba",
        tipoDeColectivo: "asamblea",
        proyectos: [],
        redesSociales: [{ tipo: "instagram", url: "https://instagram.com/a" }],
      });
      expect(respuesta.body).not.toHaveProperty("denuncias");
      expect(respuesta.headers.location).toBe(`/colectivos/${respuesta.body.id}`);
    });

    test.each([
      ["sin nombre", { nombre: undefined }, ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO],
      ["nombre vacío", { nombre: "" }, ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO],
      ["sin descripción", { descripcion: undefined }, ErrorCatalog.COLECTIVO_DESCRIPCION_REQUERIDA],
      ["sin tipo", { tipoDeColectivo: undefined }, ErrorCatalog.COLECTIVO_TIPO_REQUERIDO],
      ["tipo inválido", { tipoDeColectivo: "club" }, ErrorCatalog.COLECTIVO_TIPO_INVALIDO],
      ["redes que no son lista", { redesSociales: "x" }, ErrorCatalog.RED_SOCIAL_FORMATO],
      [
        "red social con tipo inválido",
        { redesSociales: [{ tipo: "myspace", url: "https://myspace.com" }] },
        ErrorCatalog.RED_SOCIAL_TIPO_INVALIDO,
      ],
      [
        "red social con url inválida",
        { redesSociales: [{ tipo: "github", url: "no-es-url" }] },
        ErrorCatalog.RED_SOCIAL_URL_INVALIDA,
      ],
      [
        "redes sociales duplicadas",
        {
          redesSociales: [
            { tipo: "github", url: "https://github.com/a" },
            { tipo: " GITHUB ", url: "https://github.com/b" },
          ],
        },
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
      ],
    ])("responde 400 %s", async (_caso, cambios, error) => {
      // Ejecución
      const respuesta = await crearColectivo(colectivoValido(cambios));

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });

    test("responde 409 si ya existe un colectivo con ese nombre", async () => {
      // Preparación
      await crearColectivo();

      // Ejecución
      const respuesta = await crearColectivo();

      // Validación
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_YA_EXISTE.code);
    });

    test.each([
      ["sin ubicación", { ubicacion: undefined }],
      ["con una ubicación inválida", { ubicacion: "narnia" }],
    ])("responde 400 %s", async (_caso, cambios) => {
      // Ejecución
      const respuesta = await crearColectivo(colectivoValido(cambios));

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_UBICACION_INVALIDA.code);
    });
  });

  describe("GET /colectivos", () => {
    test("lista los colectivos creados", async () => {
      // Preparación
      await crearColectivo(colectivoValido({ nombre: "Uno" }));
      await crearColectivo(colectivoValido({ nombre: "Dos" }));

      // Ejecución
      const respuesta = await request(app).get("/colectivos");

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.resultados.map((c) => c.nombre).sort()).toEqual(["Dos", "Uno"]);
      respuesta.body.resultados.forEach((colectivo) => {
        expect(colectivo).not.toHaveProperty("denuncias");
        expect(colectivo).not.toHaveProperty("activo");
      });
    });
  });

  describe("GET /colectivos/:id", () => {
    test("devuelve el colectivo", async () => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución
      const respuesta = await request(app).get(`/colectivos/${creado.body.id}`);

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({ _id: creado.body.id, nombre: "Asamblea Norte" });
    });

    test("responde 404 si no existe", async () => {
      // Ejecución
      const respuesta = await request(app).get(`/colectivos/${idInexistente()}`);

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
    });

    test("responde 404 si el id no es un ObjectId válido", async () => {
      // Ejecución
      const respuesta = await request(app).get("/colectivos/no-es-un-id");

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
    });
  });

  describe("PATCH /colectivos/:id", () => {
    test("edita los campos enviados y conserva el resto", async () => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución
      const respuesta = await request(app)
        .patch(`/colectivos/${creado.body.id}`)
        .send({ descripcion: "Nueva descripción", tipoDeColectivo: "ong" });

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({
        nombre: "Asamblea Norte",
        descripcion: "Nueva descripción",
        tipoDeColectivo: "ong",
        ubicacion: "caba",
      });
      const consulta = await request(app).get(`/colectivos/${creado.body.id}`);
      expect(consulta.body.descripcion).toBe("Nueva descripción");
    });

    test("reemplaza las redes sociales normalizadas", async () => {
      // Preparación
      const creado = await crearColectivo(
        colectivoValido({ redesSociales: [{ tipo: "github", url: "https://github.com/a" }] }),
      );

      // Ejecución
      const respuesta = await request(app)
        .patch(`/colectivos/${creado.body.id}`)
        .send({ redesSociales: [{ tipo: "YouTube", url: "https://youtube.com/a" }] });

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.redesSociales).toEqual([
        { tipo: "youtube", url: "https://youtube.com/a" },
      ]);
    });

    test("responde 400 con redes sociales duplicadas y no modifica el colectivo", async () => {
      // Preparación
      const creado = await crearColectivo(
        colectivoValido({ redesSociales: [{ tipo: "github", url: "https://github.com/a" }] }),
      );

      // Ejecución
      const respuesta = await request(app)
        .patch(`/colectivos/${creado.body.id}`)
        .send({
          redesSociales: [
            { tipo: "tiktok", url: "https://tiktok.com/a" },
            { tipo: "TikTok", url: "https://tiktok.com/b" },
          ],
        });

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO.code);
      const consulta = await request(app).get(`/colectivos/${creado.body.id}`);
      expect(consulta.body.redesSociales).toEqual([
        { tipo: "github", url: "https://github.com/a" },
      ]);
    });

    test.each([
      ["un body vacío", {}, ErrorCatalog.ARGUMENTO_INVALIDO],
      ["solo campos desconocidos", { campoInventado: 1 }, ErrorCatalog.ARGUMENTO_INVALIDO],
      ["un nombre vacío", { nombre: "" }, ErrorCatalog.COLECTIVO_NOMBRE_REQUERIDO],
      ["un tipo inválido", { tipoDeColectivo: "club" }, ErrorCatalog.COLECTIVO_TIPO_INVALIDO],
    ])("responde 400 con %s", async (_caso, body, error) => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución
      const respuesta = await request(app).patch(`/colectivos/${creado.body.id}`).send(body);

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });

    test("responde 404 si el colectivo no existe", async () => {
      // Ejecución
      const respuesta = await request(app)
        .patch(`/colectivos/${idInexistente()}`)
        .send({ descripcion: "x" });

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
    });

    // BUG: al crear se rechaza un nombre repetido (409), pero al editar no se chequea:
    // se puede renombrar un colectivo con el nombre de otro y quedan dos con el mismo nombre.
    test.failing("responde 409 si se renombra con el nombre de otro colectivo", async () => {
      // Preparación
      await crearColectivo(colectivoValido({ nombre: "Uno" }));
      const otro = await crearColectivo(colectivoValido({ nombre: "Dos" }));

      // Ejecución
      const respuesta = await request(app)
        .patch(`/colectivos/${otro.body.id}`)
        .send({ nombre: "Uno" });

      // Validación
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_YA_EXISTE.code);
    });

    test("responde 400 si la ubicación es inválida", async () => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución
      const respuesta = await request(app)
        .patch(`/colectivos/${creado.body.id}`)
        .send({ ubicacion: "narnia" });

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_UBICACION_INVALIDA.code);
    });
  });

  describe("DELETE /colectivos/:id", () => {
    test("responde 404 si el colectivo no existe", async () => {
      // Ejecución
      const respuesta = await request(app).delete(`/colectivos/${idInexistente()}`);

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_NO_ENCONTRADO.code);
    });

    test("da de baja el colectivo y deja de listarse", async () => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución
      const respuesta = await request(app).delete(`/colectivos/${creado.body.id}`);

      // Validación
      expect(respuesta.status).toBe(204);
      const listado = await request(app).get("/colectivos");
      expect(listado.body.resultados).toEqual([]);
    });

    test("responde 409 al eliminar un colectivo ya dado de baja", async () => {
      // Preparación
      const creado = await crearColectivo();
      await request(app).delete(`/colectivos/${creado.body.id}`);

      // Ejecución
      const respuesta = await request(app).delete(`/colectivos/${creado.body.id}`);

      // Validación
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.COLECTIVO_YA_DADO_DE_BAJA.code);
    });
  });
});
