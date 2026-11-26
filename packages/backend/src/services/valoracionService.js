import { Valoracion, TipoEvaluador } from "../models/valoracion.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").ValoracionGuardada} ValoracionGuardada */
/** @typedef {typeof TipoEvaluador[keyof typeof TipoEvaluador]} TipoEvaluadorValor */
/** @typedef {import("../repositories/valoracionRepository.js").ValoracionResumida} ValoracionResumida */
/** @typedef {import("../repositories/valoracionRepository.js").DireccionValoracion} DireccionValoracion */

/**
 * Valoraciones mutuas entre persona y colectivo al terminar una colaboración.
 */
export class ValoracionService {
  /**
   * Los repositorios de proyecto, colectivo y persona son opcionales: sin ellos se saltean
   * los chequeos de existencia (lo aprovechan los tests).
   * @param {object} [deps]
   * @param {import("../repositories/valoracionRepository.js").ValoracionRepository} [deps.valoracionRepository] Requerido en la práctica.
   * @param {import("../repositories/colaboracionRepository.js").ColaboracionRepository} [deps.colaboracionRepository] Requerido en la práctica.
   * @param {import("../repositories/proyectoRepository.js").ProyectoRepository} [deps.proyectoRepository]
   * @param {import("../repositories/colectivoRepository.js").ColectivoRepository} [deps.colectivoRepository]
   * @param {import("../repositories/personaColaboradoraRepository.js").PersonaColaboradoraRepository} [deps.personaColaboradoraRepository]
   */
  constructor({
    valoracionRepository,
    colaboracionRepository,
    proyectoRepository,
    colectivoRepository,
    personaColaboradoraRepository,
  } = {}) {
    this.valoracionRepository = valoracionRepository;
    this.colaboracionRepository = colaboracionRepository;
    this.proyectoRepository = proyectoRepository;
    this.colectivoRepository = colectivoRepository;
    this.personaColaboradoraRepository = personaColaboradoraRepository;
  }

  /**
   * Crea la valoración de una colaboración finalizada. El autor y el destinatario se deducen
   * del evaluador (colectivo → persona o persona → colectivo).
   * @param {Id} colaboracionId
   * @param {TipoEvaluadorValor} evaluador
   * @param {number} puntaje
   * @param {string | null} [comentario]
   * @returns {Promise<ValoracionGuardada>}
   * @throws {AppError} 404 si no existe la colaboración (o le falta persona o colectivo); 400 si
   *   la colaboración no terminó, el evaluador es inválido o ya hay una valoración suya.
   */
  async crearValoracion(colaboracionId, evaluador, puntaje, comentario = null) {
    const colaboracion = this.colaboracionRepository.obtenerPorIdCompleto
      ? await this.colaboracionRepository.obtenerPorIdCompleto(colaboracionId)
      : await this.colaboracionRepository.obtenerPorId(colaboracionId);

    if (!colaboracion) {
      throw new AppError(ErrorCatalog.COLABORACION_NO_ENCONTRADA, 404, colaboracionId);
    }

    let proyecto = colaboracion.proyecto;
    const proyectoId = proyecto?._id || proyecto?.id || proyecto;
    if ((!proyecto || typeof proyecto !== "object" || proyecto.finalizado === undefined) && this.proyectoRepository) {
      proyecto = await this.proyectoRepository.obtenerPorId(proyectoId);
    }

    const proyectoFinalizado = Boolean(proyecto?.finalizado);
    const colaboracionFinalizada = colaboracion.activo === false || proyectoFinalizado;

    if (!colaboracionFinalizada) {
      throw new AppError(ErrorCatalog.VALORACION_COLABORACION_NO_FINALIZADA, 400);
    }

    const personaColaboradoraId =
      colaboracion.personaColaboradora?._id ||
      colaboracion.personaColaboradora?.id ||
      colaboracion.personaColaboradora;
    const colectivoId =
      proyecto?.colectivo?._id ||
      proyecto?.colectivo?.id ||
      proyecto?.colectivo;

    if (!personaColaboradoraId || !colectivoId) {
      throw new AppError(ErrorCatalog.RECURSO_NO_ENCONTRADO, 404);
    }

    let autor;
    let destinatario;

    if (evaluador === TipoEvaluador.COLECTIVO) {
      autor = colectivoId;
      destinatario = personaColaboradoraId;
    } else if (evaluador === TipoEvaluador.PERSONA) {
      autor = personaColaboradoraId;
      destinatario = colectivoId;
    } else {
      throw new AppError(ErrorCatalog.VALORACION_EVALUADOR_TIPO_FORMATO, 400);
    }

    const valoracionExistente = await this.valoracionRepository.obtenerPorColaboracionIdYEvaluador(
      colaboracionId,
      evaluador,
    );
    if (valoracionExistente) {
      throw new AppError(ErrorCatalog.VALORACION_EXISTENTE, 400, colaboracionId, evaluador);
    }

    const valoracion = new Valoracion(
      colaboracionId,
      evaluador,
      puntaje,
      comentario,
      autor,
      destinatario,
    );

    try {
      return await this.valoracionRepository.guardar(valoracion);
    } catch (error) {
      if (error.code === 11000) {
        throw new AppError(ErrorCatalog.VALORACION_EXISTENTE, 400, colaboracionId, evaluador);
      }
      throw error;
    }
  }

  /**
   * Valoraciones de una persona: "recibidas" (de colectivos), "emitidas" (suyas) o "todas".
   * @param {Id} personaColaboradoraId
   * @param {{ direccion?: DireccionValoracion }} [opciones]
   * @returns {Promise<ValoracionResumida[]>}
   * @throws {AppError} 404 si la persona no existe.
   */
  async obtenerValoracionesPersona(personaColaboradoraId, { direccion = "recibidas" } = {}) {
    if (this.personaColaboradoraRepository) {
      const persona = await this.personaColaboradoraRepository.obtenerPorId(personaColaboradoraId);
      if (!persona) {
        throw new AppError(ErrorCatalog.COLABORADORA_NO_ENCONTRADA, 404, personaColaboradoraId);
      }
    }

    const colaboraciones = await this.colaboracionRepository.obtenerPorPersonaColaboradoraId(
      personaColaboradoraId,
    );
    const colaboracionIds = colaboraciones.map((c) => c._id || c.id);

    let evaluadorFiltro;
    if (direccion === "recibidas") {
      evaluadorFiltro = TipoEvaluador.COLECTIVO;
    } else if (direccion === "emitidas") {
      evaluadorFiltro = TipoEvaluador.PERSONA;
    }

    return await this.valoracionRepository.obtenerPorColaboracionIds(
      colaboracionIds,
      { evaluador: evaluadorFiltro },
    );
  }

  /**
   * Valoraciones de un colectivo: "recibidas" (de personas), "emitidas" (suyas) o "todas".
   * @param {Id} colectivoId
   * @param {{ direccion?: DireccionValoracion }} [opciones]
   * @returns {Promise<ValoracionResumida[]>}
   * @throws {AppError} 404 si el colectivo no existe.
   */
  async obtenerValoracionesColectivo(colectivoId, { direccion = "recibidas" } = {}) {
    if (this.colectivoRepository) {
      const colectivo = await this.colectivoRepository.obtenerPorId(colectivoId);
      if (!colectivo) {
        throw new AppError(ErrorCatalog.COLECTIVO_NO_ENCONTRADO, 404, colectivoId);
      }
    }

    const proyectos = await this.proyectoRepository.obtenerPorColectivoId(colectivoId);
    const proyectoIds = proyectos.map((p) => p._id || p.id);

    const colaboraciones = await this.colaboracionRepository.obtenerPorProyectoIds(proyectoIds);
    const colaboracionIds = colaboraciones.map((c) => c._id || c.id);

    let evaluadorFiltro;
    if (direccion === "recibidas") {
      evaluadorFiltro = TipoEvaluador.PERSONA;
    } else if (direccion === "emitidas") {
      evaluadorFiltro = TipoEvaluador.COLECTIVO;
    }

    return await this.valoracionRepository.obtenerPorColaboracionIds(
      colaboracionIds,
      { evaluador: evaluadorFiltro },
    );
  }
}
