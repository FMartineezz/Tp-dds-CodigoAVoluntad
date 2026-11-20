import { usarBaseDeDatos } from "../utils/db.js";
import { esperarAppError } from "../utils/esperarAppError.js";
import { armarEscenario, crearColaboracion, idInexistente } from "../utils/escenarios.js";
import { valoracionService, colaboracionService, proyectoService } from "../../src/container.js";
import ErrorCatalog from "../../src/errors/errorCatalog.js";
import { TipoEvaluador } from "../../src/models/valoracion.js";
import { ValoracionModel } from "../../src/schemas/valoracionSchema.js";

usarBaseDeDatos();

// Colaboración ya finalizada por baja lógica (requisito para valorar).
async function colaboracionDadaDeBaja(opciones) {
  const e = await armarEscenario();
  const { colaboracionId } = await crearColaboracion(e, opciones);
  await colaboracionService.desactivarColaboracion(colaboracionId);
  return { e, colaboracionId };
}

describe("ValoracionService", () => {
  describe("crearValoracion", () => {
    test("el colectivo valora a la persona en una colaboración dada de baja", async () => {
      // Preparación
      const { e, colaboracionId } = await colaboracionDadaDeBaja();

      // Ejecución
      const valoracion = await valoracionService.crearValoracion(
        colaboracionId,
        TipoEvaluador.COLECTIVO,
        5,
        "Excelente trabajo",
      );

      // Validación
      const guardada = await ValoracionModel.findById(valoracion._id).lean();
      expect(guardada).toMatchObject({
        evaluador: TipoEvaluador.COLECTIVO,
        puntaje: 5,
        comentario: "Excelente trabajo",
      });
      expect(guardada.colaboracion.toString()).toBe(colaboracionId);
      expect(guardada.autor.toString()).toBe(e.colectivoId);
      expect(guardada.destinatario.toString()).toBe(e.personaId);
    });

    test("la persona valora al colectivo (autor y destinatario invertidos)", async () => {
      const { e, colaboracionId } = await colaboracionDadaDeBaja();

      const valoracion = await valoracionService.crearValoracion(
        colaboracionId,
        TipoEvaluador.PERSONA,
        4,
      );

      const guardada = await ValoracionModel.findById(valoracion._id).lean();
      expect(guardada.autor.toString()).toBe(e.personaId);
      expect(guardada.destinatario.toString()).toBe(e.colectivoId);
    });

    test("se puede valorar si el proyecto finalizó aunque la colaboración siga activa", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);
      await proyectoService.finalizarProyecto(e.proyectoId);

      const valoracion = await valoracionService.crearValoracion(
        colaboracionId,
        TipoEvaluador.PERSONA,
        3,
      );

      expect(valoracion.puntaje).toBe(3);
    });

    test("se puede valorar una colaboración anónima", async () => {
      const { e, colaboracionId } = await colaboracionDadaDeBaja({ anonima: true });

      const valoracion = await valoracionService.crearValoracion(
        colaboracionId,
        TipoEvaluador.COLECTIVO,
        4,
      );

      expect(valoracion.destinatario.toString()).toBe(e.personaId);
    });

    test("no se puede valorar una colaboración activa de un proyecto en curso", async () => {
      const e = await armarEscenario();
      const { colaboracionId } = await crearColaboracion(e);

      await esperarAppError(
        valoracionService.crearValoracion(colaboracionId, TipoEvaluador.COLECTIVO, 5),
        ErrorCatalog.VALORACION_COLABORACION_NO_FINALIZADA,
        400,
      );
      expect(await ValoracionModel.countDocuments()).toBe(0);
    });

    test("cada parte puede valorar una sola vez por colaboración", async () => {
      const { colaboracionId } = await colaboracionDadaDeBaja();
      await valoracionService.crearValoracion(colaboracionId, TipoEvaluador.COLECTIVO, 5);
      await valoracionService.crearValoracion(colaboracionId, TipoEvaluador.PERSONA, 4);

      await esperarAppError(
        valoracionService.crearValoracion(colaboracionId, TipoEvaluador.COLECTIVO, 1),
        ErrorCatalog.VALORACION_EXISTENTE,
        400,
      );
      expect(await ValoracionModel.countDocuments()).toBe(2);
    });

    test("rechaza un tipo de evaluador desconocido", async () => {
      const { colaboracionId } = await colaboracionDadaDeBaja();

      await esperarAppError(
        valoracionService.crearValoracion(colaboracionId, "admin", 5),
        ErrorCatalog.VALORACION_EVALUADOR_TIPO_FORMATO,
        400,
      );
    });

    test("falla con 404 si la colaboración no existe", async () => {
      await esperarAppError(
        valoracionService.crearValoracion(idInexistente(), TipoEvaluador.COLECTIVO, 5),
        ErrorCatalog.COLABORACION_NO_ENCONTRADA,
        404,
      );
    });
  });

  describe("listados", () => {
    async function conValoracionesCruzadas() {
      const { e, colaboracionId } = await colaboracionDadaDeBaja();
      await valoracionService.crearValoracion(
        colaboracionId,
        TipoEvaluador.COLECTIVO,
        5,
        "Del colectivo",
      );
      await valoracionService.crearValoracion(
        colaboracionId,
        TipoEvaluador.PERSONA,
        2,
        "De la persona",
      );
      return e;
    }

    test("la persona ve por defecto las recibidas y puede pedir las emitidas", async () => {
      const e = await conValoracionesCruzadas();

      const recibidas = await valoracionService.obtenerValoracionesPersona(e.personaId);
      const emitidas = await valoracionService.obtenerValoracionesPersona(e.personaId, {
        direccion: "emitidas",
      });

      expect(recibidas.map((v) => v.comentario)).toEqual(["Del colectivo"]);
      expect(emitidas.map((v) => v.comentario)).toEqual(["De la persona"]);
    });

    test("el colectivo ve por defecto las recibidas y puede pedir las emitidas", async () => {
      const e = await conValoracionesCruzadas();

      const recibidas = await valoracionService.obtenerValoracionesColectivo(e.colectivoId);
      const emitidas = await valoracionService.obtenerValoracionesColectivo(e.colectivoId, {
        direccion: "emitidas",
      });

      expect(recibidas.map((v) => v.puntaje)).toEqual([2]);
      expect(emitidas.map((v) => v.puntaje)).toEqual([5]);
    });

    test("las vistas no exponen autor ni destinatario", async () => {
      const e = await conValoracionesCruzadas();

      const [valoracion] = await valoracionService.obtenerValoracionesPersona(e.personaId);

      expect(valoracion.autor).toBeUndefined();
      expect(valoracion.destinatario).toBeUndefined();
    });

    test("fallan con 404 si la persona o el colectivo no existen", async () => {
      await esperarAppError(
        valoracionService.obtenerValoracionesPersona(idInexistente()),
        ErrorCatalog.COLABORADORA_NO_ENCONTRADA,
        404,
      );
      await esperarAppError(
        valoracionService.obtenerValoracionesColectivo(idInexistente()),
        ErrorCatalog.COLECTIVO_NO_ENCONTRADO,
        404,
      );
    });
  });
});
