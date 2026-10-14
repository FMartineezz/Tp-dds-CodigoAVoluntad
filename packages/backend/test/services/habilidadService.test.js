import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { crearContexto, expectAppError } from "../helpers/crearContexto.js";

describe("HabilidadService", () => {
  let ctx;

  beforeEach(() => {
    ctx = crearContexto();
  });

  describe("crearHabilidad", () => {
    test("guarda la habilidad con su código normalizado y devuelve su id", async () => {
      const habilidad = await ctx.habilidadService.crearHabilidad("Desarrollo Web React", "Front");

      expect(habilidad).toMatchObject({
        titulo: "Desarrollo Web React",
        codigo: "desarrollo_web_react",
      });
      expect(typeof habilidad.id).toBe("string");
      expect(await ctx.habilidadService.obtenerHabilidadPorId(habilidad.id)).toMatchObject({
        codigo: "desarrollo_web_react",
      });
    });

    test("no permite dos habilidades con el mismo título", async () => {
      await ctx.habilidadService.crearHabilidad("Python", "Backend");

      await expectAppError(
        ctx.habilidadService.crearHabilidad("Python", "Otra descripción"),
        ErrorCatalog.HABILIDAD_YA_EXISTE,
        409,
      );
    });
  });

  test("obtenerHabilidades lista todas", async () => {
    await ctx.habilidadService.crearHabilidad("Python", "d");
    await ctx.habilidadService.crearHabilidad("Go", "d");

    expect(await ctx.habilidadService.obtenerHabilidades()).toHaveLength(2);
  });

  test("obtenerHabilidadPorId falla con 404 si no existe", async () => {
    await expectAppError(
      ctx.habilidadService.obtenerHabilidadPorId("inexistente"),
      ErrorCatalog.HABILIDAD_NO_ENCONTRADA_POR_ID,
      404,
    );
  });

  describe("obtenerHabilidadPorCodigo", () => {
    test("encuentra la habilidad por su código", async () => {
      await ctx.habilidadService.crearHabilidad("Python", "d");

      expect(await ctx.habilidadService.obtenerHabilidadPorCodigo("python")).toMatchObject({
        titulo: "Python",
      });
    });

    test("falla con 400 si el código no existe", async () => {
      await expectAppError(
        ctx.habilidadService.obtenerHabilidadPorCodigo("cobol"),
        ErrorCatalog.HABILIDAD_INEXISTENTE_GENERICO,
        400,
      );
    });
  });

  test("obtenerHabilidadesPorCodigos devuelve solo las que existen", async () => {
    await ctx.habilidadService.crearHabilidad("Python", "d");
    await ctx.habilidadService.crearHabilidad("Go", "d");

    const habilidades = await ctx.habilidadService.obtenerHabilidadesPorCodigos([
      "python",
      "cobol",
    ]);

    expect(habilidades.map((h) => h.codigo)).toEqual(["python"]);
  });
});
