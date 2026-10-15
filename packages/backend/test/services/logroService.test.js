import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { crearContexto, cargarEscenarioBase, expectAppError } from "../helpers/crearContexto.js";

const logro = (porcentaje, descripcion = "Hito") => ({
  descripcion,
  porcentaje,
  urlCodigoFuente: "https://github.com/fundacion/web",
});

describe("LogroService", () => {
  let ctx;
  let proyectoId;

  beforeEach(async () => {
    ctx = crearContexto();
    proyectoId = (await cargarEscenarioBase(ctx)).proyecto.id;
  });

  describe("crearLogro", () => {
    test("agrega el logro al proyecto", async () => {
      const creado = await ctx.logroService.crearLogro(proyectoId, logro(40, "MVP"));

      expect(creado).toMatchObject({ _id: expect.any(String), descripcion: "MVP", porcentaje: 40 });
      expect(await ctx.logroService.obtenerLogros(proyectoId)).toHaveLength(1);
    });

    test("los porcentajes pueden sumar exactamente 100", async () => {
      await ctx.logroService.crearLogro(proyectoId, logro(60));

      await expect(ctx.logroService.crearLogro(proyectoId, logro(40))).resolves.toBeDefined();
    });

    test("los porcentajes no pueden superar 100 en total", async () => {
      await ctx.logroService.crearLogro(proyectoId, logro(60));

      await expectAppError(
        ctx.logroService.crearLogro(proyectoId, logro(41)),
        ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO,
        400,
      );
    });

    test("no se pueden cargar logros en un proyecto finalizado", async () => {
      await ctx.proyectoService.finalizarProyecto(proyectoId);

      await expectAppError(
        ctx.logroService.crearLogro(proyectoId, logro(10)),
        ErrorCatalog.PROYECTO_FINALIZADO,
        400,
      );
    });

    test("falla con 404 si el proyecto no existe", async () => {
      await expectAppError(
        ctx.logroService.crearLogro("inexistente", logro(10)),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("obtenerLogroPorId", () => {
    test("devuelve el logro", async () => {
      const { _id } = await ctx.logroService.crearLogro(proyectoId, logro(10, "Login"));

      expect(await ctx.logroService.obtenerLogroPorId(proyectoId, _id)).toMatchObject({
        descripcion: "Login",
      });
    });

    test("falla con 404 si el logro no existe", async () => {
      await expectAppError(
        ctx.logroService.obtenerLogroPorId(proyectoId, "inexistente"),
        ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("actualizarLogro", () => {
    test("permite cambios parciales", async () => {
      const { _id } = await ctx.logroService.crearLogro(proyectoId, logro(30, "MVP"));

      const actualizado = await ctx.logroService.actualizarLogro(proyectoId, _id, {
        descripcion: "MVP terminado",
      });

      expect(actualizado).toMatchObject({ descripcion: "MVP terminado", porcentaje: 30 });
    });

    test("el porcentaje del logro editado no se cuenta dos veces", async () => {
      await ctx.logroService.crearLogro(proyectoId, logro(50));
      const { _id } = await ctx.logroService.crearLogro(proyectoId, logro(30));

      // 50 + 50 = 100: válido aunque antes el logro tuviera 30
      await expect(
        ctx.logroService.actualizarLogro(proyectoId, _id, { porcentaje: 50 }),
      ).resolves.toMatchObject({ porcentaje: 50 });
    });

    test("no puede dejar el total por encima de 100", async () => {
      await ctx.logroService.crearLogro(proyectoId, logro(50));
      const { _id } = await ctx.logroService.crearLogro(proyectoId, logro(30));

      await expectAppError(
        ctx.logroService.actualizarLogro(proyectoId, _id, { porcentaje: 51 }),
        ErrorCatalog.PROYECTO_PORCENTAJE_MAXIMO,
        400,
      );
    });

    test("no se pueden editar logros de un proyecto finalizado", async () => {
      const { _id } = await ctx.logroService.crearLogro(proyectoId, logro(30));
      await ctx.proyectoService.finalizarProyecto(proyectoId);

      await expectAppError(
        ctx.logroService.actualizarLogro(proyectoId, _id, { porcentaje: 40 }),
        ErrorCatalog.PROYECTO_FINALIZADO,
        400,
      );
    });
  });

  describe("eliminarLogro", () => {
    test("quita el logro del proyecto", async () => {
      const { _id } = await ctx.logroService.crearLogro(proyectoId, logro(30));

      await ctx.logroService.eliminarLogro(proyectoId, _id);

      expect(await ctx.logroService.obtenerLogros(proyectoId)).toEqual([]);
    });

    test("falla con 404 si el logro no existe", async () => {
      await expectAppError(
        ctx.logroService.eliminarLogro(proyectoId, "inexistente"),
        ErrorCatalog.PROYECTO_LOGRO_NO_ENCONTRADO,
        404,
      );
    });

    test("no se pueden eliminar logros de un proyecto finalizado", async () => {
      const { _id } = await ctx.logroService.crearLogro(proyectoId, logro(30));
      await ctx.proyectoService.finalizarProyecto(proyectoId);

      await expectAppError(
        ctx.logroService.eliminarLogro(proyectoId, _id),
        ErrorCatalog.PROYECTO_FINALIZADO,
        400,
      );
    });
  });
});
