import { Colaboracion, OrigenBaja } from "../models/colaboracion.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").ColaboracionGuardada} ColaboracionGuardada */
/** @typedef {typeof OrigenBaja[keyof typeof OrigenBaja]} OrigenBajaValor */

/**
 * Colaboraciones: alta con control de cupo del perfil, consultas y baja lógica.
 */
export class ColaboracionService {
  /**
   * @param {object} deps
   * @param {import("../repositories/colaboracionRepository.js").ColaboracionRepository} deps.colaboracionRepository
   * @param {import("./personaColaboradoraService.js").PersonaColaboradoraService} deps.personaColaboradoraService
   * @param {import("./proyectoService.js").ProyectoService} deps.proyectoService
   * @param {import("../repositories/colectivoRepository.js").ColectivoRepository} deps.colectivoRepository
   */
  constructor({
    colaboracionRepository,
    personaColaboradoraService,
    proyectoService,
    colectivoRepository,
  }) {
    this.colaboracionRepository = colaboracionRepository;
    this.personaColaboradoraService = personaColaboradoraService;
    this.proyectoService = proyectoService;
    this.colectivoRepository = colectivoRepository;
  }

  /**
   * Crea la colaboración de una persona en un perfil, si el proyecto sigue abierto y hay cupo.
   * @param {Id} personaId
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @param {boolean} [anonima]
   * @returns {Promise<Colaboracion>} La colaboración con el `id` asignado.
   * @throws {AppError} 404 si no existe la persona, el proyecto o el perfil; 409 si el proyecto
   *   está finalizado o el perfil no tiene cupo.
   */
  async crearColaboracion(personaId, proyectoId, perfilId, anonima) {
    const persona =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaId);
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);
    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);

    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.COLABORACION_PROYECTO_FINALIZADO, 409, proyectoId);
    }

    // Cupo: si el perfil no tiene cantidadMaxima, no hay límite
    if (perfil.cantidadMaxima !== undefined && perfil.cantidadMaxima !== null) {
      const ocupados = await this.colaboracionRepository.contarActivasPorPerfil(
        proyectoId,
        perfilId,
      );

      if (ocupados >= perfil.cantidadMaxima) {
        throw new AppError(ErrorCatalog.COLABORACION_CUPO_COMPLETO, 409, perfil.descripcion);
      }
    }

    // Pasamos los documentos enteros: mongoose se queda con el _id al guardar
    const colaboracion = new Colaboracion(persona, proyecto, perfil, anonima);
    const colaboracionGuardada = await this.colaboracionRepository.guardar(colaboracion);
    colaboracion.id = colaboracionGuardada.id;

    return colaboracion;
  }

  /**
   * Todas las colaboraciones.
   * @returns {Promise<ColaboracionGuardada[]>}
   */
  async obtenerColaboraciones() {
    return await this.colaboracionRepository.obtenerTodas();
  }

  /**
   * @param {Id} id
   * @returns {Promise<ColaboracionGuardada>}
   * @throws {AppError} 404 si no existe.
   */
  async obtenerColaboracionPorId(id) {
    const colaboracion = await this.colaboracionRepository.obtenerPorId(id);

    if (!colaboracion) {
      throw new AppError(ErrorCatalog.COLABORACION_NO_ENCONTRADA, 404, id);
    }

    return colaboracion;
  }

  // Cada una trae `denunciada`: así el front muestra «Ya denunciado» en vez de dejar
  // intentar una denuncia que el backend va a rechazar (una sola por colaboración)
  /**
   * Colaboraciones de una persona, cada una con `denunciada` (true si ya tiene denuncia).
   * @param {Id} personaId
   * @returns {Promise<Array<ColaboracionGuardada & { denunciada: boolean }>>}
   * @throws {AppError} 404 si no existe la persona.
   */
  async obtenerColaboracionesDePersona(personaId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaId);
    const colaboraciones = await this.colaboracionRepository.obtenerDePersona(personaId);
    const denunciadas = await this.colectivoRepository.colaboracionesDenunciadas(
      colaboraciones.map((colaboracion) => colaboracion._id),
    );
    return colaboraciones.map((colaboracion) => ({
      ...colaboracion,
      denunciada: denunciadas.has(String(colaboracion._id)),
    }));
  }

  /**
   * Colaboraciones de un proyecto.
   * @param {Id} proyectoId
   * @returns {Promise<ColaboracionGuardada[]>}
   * @throws {AppError} 404 si no existe el proyecto.
   */
  async obtenerColaboracionesDeProyecto(proyectoId) {
    await this.proyectoService.obtenerProyectoPorId(proyectoId);
    return await this.colaboracionRepository.obtenerDeProyecto(proyectoId);
  }

  // bajaPor (opcional): quién da la baja, "persona" o "colectivo" (OrigenBaja)
  /**
   * Da de baja (lógica) una colaboración activa.
   * @param {Id} id
   * @param {OrigenBajaValor} [bajaPor]
   * @returns {Promise<void>}
   * @throws {AppError} 400 si `bajaPor` no es válido; 404 si no existe; 409 si ya estaba dada de baja.
   */
  async desactivarColaboracion(id, bajaPor) {
    if (bajaPor !== undefined && !Object.values(OrigenBaja).includes(bajaPor)) {
      throw new AppError(ErrorCatalog.COLABORACION_ORIGEN_BAJA_INVALIDO, 400);
    }

    const colaboracion = await this.colaboracionRepository.obtenerPorId(id);

    if (!colaboracion) {
      throw new AppError(ErrorCatalog.COLABORACION_NO_ENCONTRADA, 404, id);
    }

    if (!colaboracion.activo) {
      throw new AppError(ErrorCatalog.COLABORACION_YA_DADA_DE_BAJA, 409, id);
    }

    await this.colaboracionRepository.desactivar(id, bajaPor);
  }

  //Estadisticas
  /**
   * Total de colaboraciones y cuántas son anónimas o públicas.
   * @returns {Promise<{ total: number, anonimas: number, publicas: number }>}
   */
  async obtenerEstadisticas() {
    const resultado = await this.colaboracionRepository.contarTotalYAnonimas();
    const { total, anonimas } = resultado[0] ?? { total: 0, anonimas: 0 };

    return { total, anonimas, publicas: total - anonimas };
  }
}
