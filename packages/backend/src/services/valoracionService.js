import { Valoracion, TipoEvaluador } from "../models/valoracion.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

export class ValoracionService {
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