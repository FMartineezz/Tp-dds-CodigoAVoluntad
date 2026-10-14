import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { crearContexto, expectAppError } from "../helpers/crearContexto.js";

describe("ColectivoService", () => {
  let ctx;

  beforeEach(() => {
    ctx = crearContexto();
  });

  test("crearColectivo guarda el colectivo sin proyectos y devuelve su id", async () => {
    const colectivo = await ctx.colectivoService.crearColectivo(
      "Fundación",
      "d",
      "caba",
      "fundacion",
    );

    expect(colectivo).toMatchObject({ nombre: "Fundación", proyectos: [] });
    expect(await ctx.colectivoService.obtenerColectivoPorId(colectivo.id)).toMatchObject({
      nombre: "Fundación",
    });
  });

  test("no permite dos colectivos con el mismo nombre", async () => {
    await ctx.colectivoService.crearColectivo("Fundación", "d", "caba", "fundacion");

    await expectAppError(
      ctx.colectivoService.crearColectivo("Fundación", "otra", "salta", "ong"),
      ErrorCatalog.COLECTIVO_YA_EXISTE,
      409,
    );
  });

  test("obtenerColectivos lista todos", async () => {
    await ctx.colectivoService.crearColectivo("A", "d", "caba", "ong");
    await ctx.colectivoService.crearColectivo("B", "d", "caba", "ong");

    expect(await ctx.colectivoService.obtenerColectivos()).toHaveLength(2);
  });

  test("obtenerColectivoPorId falla con 404 si no existe", async () => {
    await expectAppError(
      ctx.colectivoService.obtenerColectivoPorId("inexistente"),
      ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
      404,
    );
  });

  test("obtenerColectivoPorNombre falla con 400 si no existe", async () => {
    await expectAppError(
      ctx.colectivoService.obtenerColectivoPorNombre("Nadie"),
      ErrorCatalog.COLECTIVO_NO_ENCONTRADO_POR_NOMBRE,
      400,
    );
  });

  test("agregarProyecto vincula el proyecto al colectivo", async () => {
    const colectivo = await ctx.colectivoService.crearColectivo("A", "d", "caba", "ong");

    await ctx.colectivoService.agregarProyecto(colectivo.id, "proyecto-1");

    expect((await ctx.colectivoService.obtenerColectivoPorId(colectivo.id)).proyectos).toEqual([
      "proyecto-1",
    ]);
  });
});
