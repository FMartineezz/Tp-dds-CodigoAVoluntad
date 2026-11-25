import { jest } from "@jest/globals";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { TipoEvaluador } from "../../src/models/valoracion.js";
import { crearContexto, cargarEscenarioBase, expectAppError } from "../helpers/crearContexto.js";

describe("ValoracionService", () => {
  let ctx;
  let escenario;
  let ana;
  let colaboracion;

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

    // Creamos colaboración directamente en repo para tener escenario limpio
    colaboracion = await ctx.repos.colaboracion.guardar({
      personaColaboradora: ana.id,
      proyecto: escenario.proyecto.id,
      perfil: "perfil-1",
      anonima: false,
      activo: true,
    });
  });

  describe("crearValoracion", () => {
    test("falla con 404 si la colaboración no existe", async () => {
      await expectAppError(
        ctx.valoracionService.crearValoracion(
          "inexistente",
          TipoEvaluador.COLECTIVO,
          5,
          "Buen trabajo",
        ),
        ErrorCatalog.COLABORACION_NO_ENCONTRADA,
        404,
      );
    });

    test("falla con 400 si la colaboración no está finalizada (colaboración activa y proyecto abierto)", async () => {
      await expectAppError(
        ctx.valoracionService.crearValoracion(
          colaboracion.id,
          TipoEvaluador.COLECTIVO,
          5,
          "Buen trabajo",
        ),
        ErrorCatalog.VALORACION_COLABORACION_NO_FINALIZADA,
        400,
      );
    });

    test("permite valorar cuando el proyecto ha finalizado", async () => {
      await ctx.proyectoService.finalizarProyecto(escenario.proyecto.id);

      const valoracion = await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.COLECTIVO,
        5,
        "Excelente dedicación al proyecto",
      );

      expect(valoracion.puntaje).toBe(5);
      expect(valoracion.comentario).toBe("Excelente dedicación al proyecto");
      expect(valoracion.evaluador).toBe(TipoEvaluador.COLECTIVO);
      expect(String(valoracion.autor)).toBe(String(escenario.colectivo.id));
      expect(String(valoracion.destinatario)).toBe(String(ana.id));
    });

    test("permite valorar cuando la colaboración fue dada de baja / cerrada", async () => {
      await ctx.repos.colaboracion.desactivar(colaboracion.id);

      const valoracion = await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.PERSONA,
        4,
        "Excelente organización y acompañamiento",
      );

      expect(valoracion.puntaje).toBe(4);
      expect(valoracion.evaluador).toBe(TipoEvaluador.PERSONA);
      expect(String(valoracion.autor)).toBe(String(ana.id));
      expect(String(valoracion.destinatario)).toBe(String(escenario.colectivo.id));
    });

    test("permite comentario opcional (null)", async () => {
      await ctx.repos.colaboracion.desactivar(colaboracion.id);

      const valoracion = await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.PERSONA,
        5,
      );

      expect(valoracion.puntaje).toBe(5);
      expect(valoracion.comentario).toBeNull();
    });

    test("permite valoraciones mutuas (ambas partes pueden calificar la misma colaboración)", async () => {
      await ctx.repos.colaboracion.desactivar(colaboracion.id);

      const valColectivo = await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.COLECTIVO,
        5,
        "Cumplió con todos los objetivos",
      );

      const valPersona = await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.PERSONA,
        4,
        "Muy buena experiencia",
      );

      expect(valColectivo.evaluador).toBe(TipoEvaluador.COLECTIVO);
      expect(String(valColectivo.destinatario)).toBe(String(ana.id));

      expect(valPersona.evaluador).toBe(TipoEvaluador.PERSONA);
      expect(String(valPersona.destinatario)).toBe(String(escenario.colectivo.id));
    });

    test("rechaza valoración duplicada si la misma parte intenta calificar dos veces", async () => {
      await ctx.repos.colaboracion.desactivar(colaboracion.id);

      await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.COLECTIVO,
        5,
        "Primera valoración",
      );

      await expectAppError(
        ctx.valoracionService.crearValoracion(
          colaboracion.id,
          TipoEvaluador.COLECTIVO,
          4,
          "Segunda valoración intentada",
        ),
        ErrorCatalog.VALORACION_EXISTENTE,
        400,
      );
    });

    test("captura error E11000 de MongoDB y lo transforma en VALORACION_EXISTENTE", async () => {
      await ctx.repos.colaboracion.desactivar(colaboracion.id);

      // Simulamos que el repositorio lanza E11000
      jest.spyOn(ctx.repos.valoracion, "guardar").mockRejectedValueOnce(
        Object.assign(new Error("E11000 duplicate key error"), { code: 11000 }),
      );

      await expectAppError(
        ctx.valoracionService.crearValoracion(
          colaboracion.id,
          TipoEvaluador.COLECTIVO,
          5,
        ),
        ErrorCatalog.VALORACION_EXISTENTE,
        400,
      );
    });

    test("deriva estrictamente autor y destinatario a partir de la colaboración sin depender de evaluadorId", async () => {
      await ctx.repos.colaboracion.desactivar(colaboracion.id);

      const valPersona = await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.PERSONA,
        5,
        "Colaboración completada",
      );

      expect(String(valPersona.autor)).toBe(String(ana.id));
      expect(String(valPersona.destinatario)).toBe(String(escenario.colectivo.id));

      const valColectivo = await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.COLECTIVO,
        4,
        "Muy buen desempeño",
      );

      expect(String(valColectivo.autor)).toBe(String(escenario.colectivo.id));
      expect(String(valColectivo.destinatario)).toBe(String(ana.id));
    });

    test("falla si la colaboración no contiene datos suficientes para determinar ambas partes", async () => {
      const colabIncompleta = await ctx.repos.colaboracion.guardar({
        personaColaboradora: null,
        proyecto: escenario.proyecto.id,
        activo: false,
      });

      await expectAppError(
        ctx.valoracionService.crearValoracion(
          colabIncompleta.id,
          TipoEvaluador.COLECTIVO,
          5,
        ),
        ErrorCatalog.RECURSO_NO_ENCONTRADO,
        404,
      );
    });
  });

  describe("Historiales públicos", () => {
    beforeEach(async () => {
      await ctx.repos.colaboracion.desactivar(colaboracion.id);

      // Colectivo evalúa a Ana (recibida por Ana)
      await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.COLECTIVO,
        5,
        "Ana colaboró con excelencia",
      );

      // Ana evalúa al Colectivo (recibida por el Colectivo)
      await ctx.valoracionService.crearValoracion(
        colaboracion.id,
        TipoEvaluador.PERSONA,
        4,
        "La fundación fue muy clara y atenta",
      );
    });

    describe("obtenerValoracionesPersona", () => {
      test("por defecto muestra exclusivamente las valoraciones recibidas por la persona (Colectivo → Persona)", async () => {
        const valoraciones = await ctx.valoracionService.obtenerValoracionesPersona(ana.id);

        expect(valoraciones).toHaveLength(1);
        expect(valoraciones[0].evaluador).toBe(TipoEvaluador.COLECTIVO);
        expect(valoraciones[0].puntaje).toBe(5);
        expect(valoraciones[0]).not.toHaveProperty("destinatario");
        expect(valoraciones[0]).not.toHaveProperty("autor");
      });

      test("permite consultar valoraciones emitidas por la persona mediante filtro", async () => {
        const emitidas = await ctx.valoracionService.obtenerValoracionesPersona(ana.id, {
          direccion: "emitidas",
        });

        expect(emitidas).toHaveLength(1);
        expect(emitidas[0].evaluador).toBe(TipoEvaluador.PERSONA);
        expect(emitidas[0].puntaje).toBe(4);
      });

      test("permite consultar todas las valoraciones asociadas a la persona con direccion 'todas'", async () => {
        const todas = await ctx.valoracionService.obtenerValoracionesPersona(ana.id, {
          direccion: "todas",
        });

        expect(todas).toHaveLength(2);
      });

      test("falla con 404 si la persona no existe", async () => {
        await expectAppError(
          ctx.valoracionService.obtenerValoracionesPersona("inexistente"),
          ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
          404,
        );
      });
    });

    describe("obtenerValoracionesColectivo", () => {
      test("por defecto muestra exclusivamente las valoraciones recibidas por el colectivo (Persona → Colectivo)", async () => {
        const valoraciones = await ctx.valoracionService.obtenerValoracionesColectivo(
          escenario.colectivo.id,
        );

        expect(valoraciones).toHaveLength(1);
        expect(valoraciones[0].evaluador).toBe(TipoEvaluador.PERSONA);
        expect(valoraciones[0]).not.toHaveProperty("destinatario");
        expect(valoraciones[0]).not.toHaveProperty("autor");
      });

      test("permite consultar valoraciones emitidas por el colectivo mediante filtro", async () => {
        const emitidas = await ctx.valoracionService.obtenerValoracionesColectivo(
          escenario.colectivo.id,
          { direccion: "emitidas" },
        );

        expect(emitidas).toHaveLength(1);
        expect(emitidas[0].evaluador).toBe(TipoEvaluador.COLECTIVO);
        expect(emitidas[0].puntaje).toBe(5);
      });

      test("permite consultar todas las valoraciones asociadas al colectivo con direccion 'todas'", async () => {
        const todas = await ctx.valoracionService.obtenerValoracionesColectivo(
          escenario.colectivo.id,
          { direccion: "todas" },
        );

        expect(todas).toHaveLength(2);
      });

      test("falla con 404 si el colectivo no existe", async () => {
        await expectAppError(
          ctx.valoracionService.obtenerValoracionesColectivo("inexistente"),
          ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
          404,
        );
      });
    });
  });
});
