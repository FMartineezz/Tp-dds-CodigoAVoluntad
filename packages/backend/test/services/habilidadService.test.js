import mongoose from "mongoose";
import { habilidadService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { HabilidadModel } from "../../src/schemas/habilidadSchema.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";

usarBaseDeDatos();

describe("HabilidadService", () => {
  describe("crearHabilidad", () => {
    test("persiste la habilidad con su código en snake_case y devuelve el id", async () => {
      // Ejecución
      const habilidad = await habilidadService.crearHabilidad("Desarrollo Web React", "Front");

      // Validación
      expect(habilidad).toMatchObject({
        titulo: "Desarrollo Web React",
        codigo: "desarrollo_web_react",
        descripcion: "Front",
      });
      expect(habilidad.id).toBeDefined();
      const guardada = await HabilidadModel.findById(habilidad.id).lean();
      expect(guardada).toMatchObject({
        titulo: "Desarrollo Web React",
        codigo: "desarrollo_web_react",
      });
    });

    test("rechaza con 409 una habilidad con el mismo título", async () => {
      // Preparación
      await habilidadService.crearHabilidad("Node", "Backend");

      // Ejecución y Validación
      await esperarAppError(
        habilidadService.crearHabilidad("Node", "Otra descripción"),
        ErrorCatalog.HABILIDAD_YA_EXISTE,
        409,
      );
      expect(await HabilidadModel.countDocuments()).toBe(1);
    });

    // BUG: crearHabilidad solo busca duplicados por título, pero el índice único es por código.
    // Dos títulos distintos con el mismo código ("Node JS" y "node-js" -> "node_js") pasan el chequeo
    // y el save explota con un E11000 de Mongo (un error que no es AppError, termina en 500).
    test.failing(
      "rechaza con 409 una habilidad cuyo título genera un código ya existente",
      async () => {
        // Preparación
        await habilidadService.crearHabilidad("Node JS", "Backend");

        // Ejecución y Validación
        await esperarAppError(
          habilidadService.crearHabilidad("node-js", "Backend"),
          ErrorCatalog.HABILIDAD_YA_EXISTE,
          409,
        );
      },
    );
  });

  describe("obtenerHabilidades", () => {
    test("devuelve una lista vacía si no hay habilidades", async () => {
      // Ejecución y Validación
      expect(await habilidadService.obtenerHabilidades()).toEqual([]);
    });

    test("devuelve todas las habilidades guardadas", async () => {
      // Preparación
      await habilidadService.crearHabilidad("Node", "Backend");
      await habilidadService.crearHabilidad("React", "Frontend");

      // Ejecución
      const habilidades = await habilidadService.obtenerHabilidades();

      // Validación
      expect(habilidades.map((h) => h.codigo).sort()).toEqual(["node", "react"]);
    });
  });

  describe("obtenerHabilidadPorId", () => {
    test("devuelve la habilidad existente", async () => {
      // Preparación
      const creada = await habilidadService.crearHabilidad("Node", "Backend");

      // Ejecución
      const habilidad = await habilidadService.obtenerHabilidadPorId(creada.id);

      // Validación
      expect(habilidad).toMatchObject({ titulo: "Node", codigo: "node", descripcion: "Backend" });
    });

    test("falla con 404 si no existe", async () => {
      // Preparación
      const idInexistente = new mongoose.Types.ObjectId().toString();

      // Ejecución y Validación
      await esperarAppError(
        habilidadService.obtenerHabilidadPorId(idInexistente),
        ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID,
        404,
      );
    });
  });

  describe("obtenerHabilidadPorCodigo", () => {
    test("devuelve la habilidad del código", async () => {
      // Preparación
      await habilidadService.crearHabilidad("Base de Datos", "SQL y NoSQL");

      // Ejecución
      const habilidad = await habilidadService.obtenerHabilidadPorCodigo("base_de_datos");

      // Validación
      expect(habilidad.titulo).toBe("Base de Datos");
    });

    test("falla con 400 si el código no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        habilidadService.obtenerHabilidadPorCodigo("no_existe"),
        ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
        400,
      );
    });
  });

  describe("obtenerMapaPorCodigos", () => {
    test("devuelve un mapa código → habilidad con una sola consulta", async () => {
      // Preparación
      await habilidadService.crearHabilidad("Node", "Backend");
      await habilidadService.crearHabilidad("Python", "Datos");

      // Ejecución
      const mapa = await habilidadService.obtenerMapaPorCodigos(["node", "python", "node"]);

      // Validación
      expect([...mapa.keys()].sort()).toEqual(["node", "python"]);
      expect(mapa.get("node").titulo).toBe("Node");
    });

    test("responde 400 con los códigos que no existen", async () => {
      // Preparación
      await habilidadService.crearHabilidad("Node", "Backend");

      // Ejecución y Validación
      await esperarAppError(
        habilidadService.obtenerMapaPorCodigos(["node", "cobol"]),
        ErrorCatalog.HABILIDADES_INEXISTENTES_GENERICO,
        400,
      );
    });
  });
});
