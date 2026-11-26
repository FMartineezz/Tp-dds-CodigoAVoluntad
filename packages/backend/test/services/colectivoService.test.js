import mongoose from "mongoose";
import { colectivoService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { ColectivoModel } from "../../src/schemas/colectivoSchema.js";
import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";

usarBaseDeDatos();

const idInexistente = () => new mongoose.Types.ObjectId().toString();

const crearColectivo = (nombre = "Asamblea Norte", redesSociales = []) =>
  colectivoService.crearColectivo(
    nombre,
    "Asamblea barrial",
    "caba",
    "asamblea",
    undefined, // keycloackId: en los tests no hay usuario de Keycloak
    redesSociales,
  );

describe("ColectivoService", () => {
  describe("crearColectivo", () => {
    test("persiste el colectivo activo y devuelve el id sin denuncias", async () => {
      // Ejecución
      const colectivo = await crearColectivo();

      // Validación
      expect(colectivo).toMatchObject({
        nombre: "Asamblea Norte",
        ubicacion: "caba",
        tipoDeColectivo: "asamblea",
        proyectos: [],
        activo: true,
      });
      expect(colectivo).not.toHaveProperty("denuncias");
      const guardado = await ColectivoModel.findById(colectivo.id).select("+activo").lean();
      expect(guardado).toMatchObject({ nombre: "Asamblea Norte", activo: true });
    });

    test("normaliza las redes sociales (tipo en minúsculas y url sin espacios)", async () => {
      // Ejecución
      const colectivo = await crearColectivo("Asamblea Norte", [
        { tipo: " Instagram ", url: " https://instagram.com/asamblea " },
      ]);

      // Validación
      const guardado = await ColectivoModel.findById(colectivo.id).lean();
      expect(guardado.redesSociales).toEqual([
        { tipo: "instagram", url: "https://instagram.com/asamblea" },
      ]);
    });

    test("rechaza con 400 redes sociales con tipo duplicado (sin importar mayúsculas)", async () => {
      // Ejecución y Validación
      await esperarAppError(
        crearColectivo("Asamblea Norte", [
          { tipo: "github", url: "https://github.com/a" },
          { tipo: "GitHub", url: "https://github.com/b" },
        ]),
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
        400,
      );
      expect(await ColectivoModel.countDocuments()).toBe(0);
    });

    test("rechaza con 400 una red social con url inválida", async () => {
      // Ejecución y Validación
      await esperarAppError(
        crearColectivo("Asamblea Norte", [{ tipo: "github", url: "ftp://github.com/a" }]),
        ErrorCatalog.RED_SOCIAL_URL_INVALIDA,
        400,
      );
    });

    test("rechaza con 409 un nombre ya usado", async () => {
      // Preparación
      await crearColectivo();

      // Ejecución y Validación
      await esperarAppError(crearColectivo(), ErrorCatalog.COLECTIVO_YA_EXISTE, 409);
      expect(await ColectivoModel.countDocuments()).toBe(1);
    });
  });

  describe("obtener", () => {
    test("obtenerColectivos lista solo los activos", async () => {
      // Preparación
      const activo = await crearColectivo("Activo");
      const inactivo = await crearColectivo("Inactivo");
      await ColectivoModel.findByIdAndUpdate(inactivo.id, { activo: false });

      // Ejecución
      const { resultados: colectivos, total } = await colectivoService.obtenerColectivos({
        pagina: 1,
        limite: 20,
      });

      // Validación
      expect(colectivos.map((c) => String(c._id))).toEqual([activo.id]);
      expect(total).toBe(1);
    });

    test("obtenerColectivoPorId devuelve el colectivo", async () => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución
      const colectivo = await colectivoService.obtenerColectivoPorId(creado.id);

      // Validación
      expect(colectivo).toMatchObject({
        nombre: "Asamblea Norte",
        descripcion: "Asamblea barrial",
      });
    });

    test("obtenerColectivoPorId falla con 404 si no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        colectivoService.obtenerColectivoPorId(idInexistente()),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });

    test("obtenerColectivoPorNombre devuelve el colectivo", async () => {
      // Preparación
      await crearColectivo();

      // Ejecución
      const colectivo = await colectivoService.obtenerColectivoPorNombre("Asamblea Norte");

      // Validación
      expect(colectivo.tipoDeColectivo).toBe("asamblea");
    });

    test("obtenerColectivoPorNombre falla con 400 si no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        colectivoService.obtenerColectivoPorNombre("No existe"),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE,
        400,
      );
    });
  });

  describe("actualizarColectivo", () => {
    test("actualiza los campos y devuelve el colectivo actualizado", async () => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución
      const actualizado = await colectivoService.actualizarColectivo(creado.id, {
        descripcion: "Nueva descripción",
        ubicacion: "cordoba",
      });

      // Validación
      expect(actualizado).toMatchObject({
        nombre: "Asamblea Norte",
        descripcion: "Nueva descripción",
        ubicacion: "cordoba",
      });
      const guardado = await ColectivoModel.findById(creado.id).lean();
      expect(guardado.descripcion).toBe("Nueva descripción");
    });

    test("reemplaza las redes sociales normalizándolas", async () => {
      // Preparación
      const creado = await crearColectivo("Asamblea Norte", [
        { tipo: "github", url: "https://github.com/a" },
      ]);

      // Ejecución
      const actualizado = await colectivoService.actualizarColectivo(creado.id, {
        redesSociales: [{ tipo: "LinkedIn", url: "https://linkedin.com/a" }],
      });

      // Validación
      expect(actualizado.redesSociales).toEqual([
        { tipo: "linkedin", url: "https://linkedin.com/a" },
      ]);
    });

    test("rechaza con 400 redes sociales duplicadas sin modificar el colectivo", async () => {
      // Preparación
      const creado = await crearColectivo("Asamblea Norte", [
        { tipo: "github", url: "https://github.com/a" },
      ]);

      // Ejecución y Validación
      await esperarAppError(
        colectivoService.actualizarColectivo(creado.id, {
          redesSociales: [
            { tipo: "x", url: "https://x.com/a" },
            { tipo: "X", url: "https://x.com/b" },
          ],
        }),
        ErrorCatalog.RED_SOCIAL_TIPO_DUPLICADO,
        400,
      );
      const guardado = await ColectivoModel.findById(creado.id).lean();
      expect(guardado.redesSociales).toEqual([{ tipo: "github", url: "https://github.com/a" }]);
    });

    test.each([[{}], [null]])("rechaza con 400 cambios vacíos (%j)", async (cambios) => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución y Validación
      await esperarAppError(
        colectivoService.actualizarColectivo(creado.id, cambios),
        ErrorCatalog.ARGUMENTO_INVALIDO,
        400,
      );
    });

    test("falla con 404 si el colectivo no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        colectivoService.actualizarColectivo(idInexistente(), { descripcion: "x" }),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("agregarProyecto", () => {
    test("agrega el id del proyecto al colectivo", async () => {
      // Preparación
      const creado = await crearColectivo();
      const proyectoId = new mongoose.Types.ObjectId();

      // Ejecución
      await colectivoService.agregarProyecto(creado.id, proyectoId);

      // Validación
      const guardado = await ColectivoModel.findById(creado.id).lean();
      expect(guardado.proyectos.map(String)).toEqual([proyectoId.toString()]);
    });
  });

  describe("eliminarColectivo", () => {
    test("falla con 404 si el colectivo no existe", async () => {
      // Ejecución y Validación
      await esperarAppError(
        colectivoService.eliminarColectivo(idInexistente()),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });

    test("da de baja (lógica) el colectivo", async () => {
      // Preparación
      const creado = await crearColectivo();

      // Ejecución
      await colectivoService.eliminarColectivo(creado.id);

      // Validación
      const guardado = await ColectivoModel.findById(creado.id).select("+activo").lean();
      expect(guardado.activo).toBe(false);
      expect(await colectivoService.obtenerColectivos({ pagina: 1, limite: 20 })).toEqual({
        resultados: [],
        total: 0,
      });
    });

    test("falla con 409 si el colectivo ya estaba dado de baja", async () => {
      // Preparación
      const creado = await crearColectivo();
      await ColectivoModel.findByIdAndUpdate(creado.id, { activo: false });

      // Ejecución y Validación
      await esperarAppError(
        colectivoService.eliminarColectivo(creado.id),
        ErrorCatalog.COLECTIVO_YA_DADO_DE_BAJA,
        409,
      );
    });
  });
});
