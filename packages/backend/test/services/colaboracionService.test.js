import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { crearContexto, cargarEscenarioBase, expectAppError } from "../helpers/crearContexto.js";

describe("ColaboracionService", () => {
  let ctx;
  let escenario;
  let ana; // tiene React, que el proyecto requiere
  let beto; // solo tiene Testing, que en el proyecto es opcional

  beforeEach(async () => {
    ctx = crearContexto();
    escenario = await cargarEscenarioBase(ctx);
    ana = await ctx.personaColaboradoraService.crearPersonaColaboradora(
      "Ana",
      "github.com/ana",
      null,
      null,
      ["desarrollo_web_react"],
      null,
      "Hola",
      [{ tipo: "email", valor: "ana@mail.com" }],
    );
    beto = await ctx.personaColaboradoraService.crearPersonaColaboradora(
      "Beto",
      "github.com/beto",
      null,
      null,
      ["testing_e_2_e"],
    );
  });

  describe("crearColaboracion", () => {
    test("anota a la persona si tiene al menos una habilidad requerida", async () => {
      const colaboracion = await ctx.colaboracionService.crearColaboracion(
        ana.id,
        escenario.proyecto.id,
      );

      expect(colaboracion.anonima).toBe(false);
      expect(typeof colaboracion.id).toBe("string");
    });

    test("tener solo habilidades opcionales no alcanza", async () => {
      await expectAppError(
        ctx.colaboracionService.crearColaboracion(beto.id, escenario.proyecto.id),
        ErrorCatalog.COLABORACION_HABILIDAD_REQUERIDA,
        400,
      );
    });

    test("no se puede colaborar en un proyecto finalizado", async () => {
      await ctx.proyectoService.finalizarProyecto(escenario.proyecto.id);

      await expectAppError(
        ctx.colaboracionService.crearColaboracion(ana.id, escenario.proyecto.id),
        ErrorCatalog.COLABORACION_PROYECTO_FINALIZADO,
        409,
      );
    });

    test("falla con 404 si la persona no existe", async () => {
      await expectAppError(
        ctx.colaboracionService.crearColaboracion("inexistente", escenario.proyecto.id),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
    });

    test("falla con 404 si el proyecto no existe", async () => {
      await expectAppError(
        ctx.colaboracionService.crearColaboracion(ana.id, "inexistente"),
        ErrorCatalog.PROYECTO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("contribuciones anónimas", () => {
    test("una colaboración anónima figura, pero sin la persona", async () => {
      const { id } = await ctx.colaboracionService.crearColaboracion(
        ana.id,
        escenario.proyecto.id,
        true,
      );

      const colaboracion = await ctx.colaboracionService.obtenerColaboracionPorId(id);

      expect(colaboracion.anonima).toBe(true);
      expect(colaboracion.personaColaboradora).toBeNull();
      expect(colaboracion.proyecto).toMatchObject({ titulo: "Web institucional" });
    });

    test("una colaboración pública muestra a la persona, sin sus contactos", async () => {
      const { id } = await ctx.colaboracionService.crearColaboracion(ana.id, escenario.proyecto.id);

      const colaboracion = await ctx.colaboracionService.obtenerColaboracionPorId(id);

      expect(colaboracion.personaColaboradora.nombreFantasia).toBe("Ana");
      expect(colaboracion.personaColaboradora).not.toHaveProperty("contactos");
    });

    test("obtenerColaboraciones aplica la misma regla a cada una", async () => {
      await ctx.colaboracionService.crearColaboracion(ana.id, escenario.proyecto.id, true);
      await ctx.colaboracionService.crearColaboracion(ana.id, escenario.proyecto.id, false);

      const colaboraciones = await ctx.colaboracionService.obtenerColaboraciones();

      expect(colaboraciones.map((c) => c.personaColaboradora?.nombreFantasia ?? null)).toEqual([
        null,
        "Ana",
      ]);
    });
  });

  test("obtenerColaboracionPorId falla con 404 si no existe", async () => {
    await expectAppError(
      ctx.colaboracionService.obtenerColaboracionPorId("inexistente"),
      ErrorCatalog.COLABORACION_NO_ENCONTRADA,
      404,
    );
  });
});
