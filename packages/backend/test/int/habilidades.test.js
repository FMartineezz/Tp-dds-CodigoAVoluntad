import request from "supertest";
import mongoose from "mongoose";
import { app } from "./utils/app.js";
import { usarBaseDeDatos } from "../utils/db.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";

usarBaseDeDatos();

const crearHabilidad = (body) => request(app).post("/habilidades").send(body);

describe("Habilidades (HTTP)", () => {
  describe("POST /habilidades", () => {
    test("crea la habilidad y responde 201 con Location", async () => {
      // Ejecución
      const respuesta = await crearHabilidad({ titulo: "Desarrollo Web", descripcion: "Front" });

      // Validación
      expect(respuesta.status).toBe(201);
      expect(respuesta.body).toMatchObject({
        titulo: "Desarrollo Web",
        codigo: "desarrollo_web",
        descripcion: "Front",
      });
      expect(respuesta.headers.location).toBe(`/habilidades/${respuesta.body.id}`);
    });

    test.each([
      [{ descripcion: "d" }, ErrorCatalog.HABILIDAD_TITULO_REQUERIDO],
      [{ titulo: "", descripcion: "d" }, ErrorCatalog.HABILIDAD_TITULO_REQUERIDO],
      [{ titulo: "Node" }, ErrorCatalog.HABILIDAD_DESCRIPCION_REQUERIDA],
      [{ titulo: "Node", descripcion: "" }, ErrorCatalog.HABILIDAD_DESCRIPCION_REQUERIDA],
      [{ titulo: 123, descripcion: "d" }, ErrorCatalog.ARGUMENTO_INVALIDO],
    ])("responde 400 con el body %j", async (body, error) => {
      // Ejecución
      const respuesta = await crearHabilidad(body);

      // Validación
      expect(respuesta.status).toBe(400);
      expect(respuesta.body.code).toBe(error.code);
    });

    test("responde 409 si ya existe una habilidad con el mismo título", async () => {
      // Preparación
      await crearHabilidad({ titulo: "Node", descripcion: "Backend" });

      // Ejecución
      const respuesta = await crearHabilidad({ titulo: "Node", descripcion: "Backend" });

      // Validación
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDAD_YA_EXISTE.code);
    });

    // BUG: el chequeo de duplicados es por título, pero el índice único es por código. Un título
    // distinto con el mismo código (snake_case) termina en un E11000 de Mongo y responde 500.
    test.failing("responde 409 si el título genera un código ya existente", async () => {
      // Preparación
      await crearHabilidad({ titulo: "Node JS", descripcion: "Backend" });

      // Ejecución
      const respuesta = await crearHabilidad({ titulo: "node-js", descripcion: "Backend" });

      // Validación
      expect(respuesta.status).toBe(409);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDAD_YA_EXISTE.code);
    });
  });

  describe("GET /habilidades", () => {
    test("lista las habilidades creadas", async () => {
      // Preparación
      await crearHabilidad({ titulo: "Node", descripcion: "Backend" });
      await crearHabilidad({ titulo: "React", descripcion: "Frontend" });

      // Ejecución
      const respuesta = await request(app).get("/habilidades");

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body.map((h) => h.codigo).sort()).toEqual(["node", "react"]);
    });
  });

  describe("GET /habilidades/:id", () => {
    test("devuelve la habilidad", async () => {
      // Preparación
      const creada = await crearHabilidad({ titulo: "Node", descripcion: "Backend" });

      // Ejecución
      const respuesta = await request(app).get(`/habilidades/${creada.body.id}`);

      // Validación
      expect(respuesta.status).toBe(200);
      expect(respuesta.body).toMatchObject({ _id: creada.body.id, titulo: "Node", codigo: "node" });
    });

    test("responde 404 si no existe", async () => {
      // Ejecución
      const respuesta = await request(app).get(
        `/habilidades/${new mongoose.Types.ObjectId().toString()}`,
      );

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID.code);
    });

    test("responde 404 si el id no es un ObjectId válido", async () => {
      // Ejecución
      const respuesta = await request(app).get("/habilidades/no-es-un-id");

      // Validación
      expect(respuesta.status).toBe(404);
      expect(respuesta.body.code).toBe(ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID.code);
    });
  });
});
