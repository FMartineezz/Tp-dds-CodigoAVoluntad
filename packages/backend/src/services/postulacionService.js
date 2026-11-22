import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { EVENTO_PROYECTOS_CERRADOS, eventos } from "../events/events.js";
import { EstadoPostulacion, Postulacion } from "../models/postulacion.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").PostulacionGuardada} PostulacionGuardada */
/** @typedef {typeof EstadoPostulacion[keyof typeof EstadoPostulacion]} EstadoPostulacionValor */

/** @typedef {import("../repositories/postulacionRepository.js").ProyectoDePostulacion} ProyectoDePostulacion */
/** @typedef {import("../repositories/postulacionRepository.js").PersonaDePostulacion} PersonaDePostulacion */

/**
 * Lo que ve la persona de cada una de sus postulaciones.
 * @typedef {object} VistaPostulacionDePersona
 * @property {Id} id
 * @property {string} proyecto Título del proyecto.
 * @property {Id} proyectoId
 * @property {string | undefined} perfil Descripción del perfil.
 * @property {Id} perfilId
 * @property {EstadoPostulacionValor} estado
 * @property {boolean} anonima
 */

/**
 * Lo que ve el colectivo de cada postulación que recibió.
 * @typedef {object} VistaPostulacionDeColectivo
 * @property {Id} id
 * @property {{ id: Id } & Pick<PersonaDePostulacion, "nombreFantasia" | "habilidades" | "presentacion">} personaColaboradora
 * @property {string} proyecto Título del proyecto.
 * @property {Id} proyectoId
 * @property {string | undefined} perfil Descripción del perfil.
 * @property {Id} perfilId
 * @property {EstadoPostulacionValor} estado
 */

/**
 * Postulaciones de personas a perfiles de proyectos: alta, consulta y resolución por parte
 * del colectivo. Al cerrarse proyectos, rechaza las postulaciones que quedaron pendientes.
 */
export class PostulacionService {
  /**
   * Se suscribe a EVENTO_PROYECTOS_CERRADOS para rechazar las pendientes de esos proyectos.
   * @param {object} deps
   * @param {import("../repositories/postulacionRepository.js").PostulacionRepository} deps.repository
   * @param {import("./personaColaboradoraService.js").PersonaColaboradoraService} deps.personaColaboradoraService
   * @param {import("./proyectoService.js").ProyectoService} deps.proyectoService
   * @param {import("./colectivoService.js").ColectivoService} deps.colectivoService
   * @param {import("./colaboracionService.js").ColaboracionService} deps.colaboracionService
   */
  constructor({
    repository,
    personaColaboradoraService,
    proyectoService,
    colectivoService,
    colaboracionService,
  }) {
    this.repository = repository;
    this.personaColaboradoraService = personaColaboradoraService;
    this.proyectoService = proyectoService;
    this.colectivoService = colectivoService;
    this.colaboracionService = colaboracionService;

    eventos.on(EVENTO_PROYECTOS_CERRADOS, async (proyectoIds) => {
      try {
        await this.rechazarPendientesDeProyectosCerrados(proyectoIds);
      } catch (error) {
        console.error(`Error al rechazar postulaciones por cierre: ${error.message}`);
      }
    });
  }

  /**
   * Postula a una persona a un perfil, si no tiene ya una postulación vigente, el proyecto
   * sigue buscando gente y tiene alguna de las habilidades requeridas.
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @param {Id} personaColaboradoraId
   * @param {boolean} [anonima]
   * @returns {Promise<Postulacion>} La postulación con el `id` asignado.
   * @throws {AppError} 404 si no existe la persona, el proyecto o el perfil; 409 si ya hay una
   *   postulación vigente, el proyecto está finalizado o la búsqueda cerrada; 400 si la persona
   *   no tiene ninguna habilidad requerida.
   */
  async crearPostulacion(proyectoId, perfilId, personaColaboradoraId, anonima = false) {
    const persona =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);
    const perfil = await this.proyectoService.obtenerPerfilPorId(proyectoId, perfilId);

    const postulacionExistenete = await this.repository.obtenerPorPersonaProyectoPerfil(
      personaColaboradoraId,
      proyectoId,
      perfilId,
    );
    //Ya existe la postulacion
    if (postulacionExistenete) {
      if (
        postulacionExistenete.estado === EstadoPostulacion.ACEPTADA ||
        postulacionExistenete.estado === EstadoPostulacion.PENDIENTE
      ) {
        throw new AppError(
          ErrorCatalog.POSTULACION_DUPLICADA,
          409,
          persona.nombreFantasia,
          perfil.descripcion,
          postulacionExistenete.estado,
        );
      }
    }

    //Proyecto finalizado
    if (proyecto.finalizado) {
      throw new AppError(ErrorCatalog.POSTULACION_PROYECTO_FINALIZADO, 409, proyectoId);
    }
    //Esta cerrada?
    if (!this.proyectoService.estaBusquedaAbierta(proyecto)) {
      throw new AppError(ErrorCatalog.POSTULACION_BUSQUEDA_CERRADA, 409, proyectoId);
    }
    //La persona colaboradora tiene aunque sea 1 habilidad requeridad del perfil al que se quiere postular?
    const esCompatible = perfil.habilidadesRequeridas.some((habilidadPerfil) =>
      persona.habilidades.some(
        (habilidadPersona) => habilidadPersona.toString() === habilidadPerfil.toString(),
      ),
    );

    if (!esCompatible) {
      throw new AppError(ErrorCatalog.POSTULACION_HABILIDAD_REQUERIDA, 400, persona.nombreFantasia);
    }

    // Sin populate, colectivo es un ObjectId (mongoose le agrega `_id`, que se devuelve a sí mismo)
    const colectivoId = /** @type {import("mongoose").Types.ObjectId} */ (proyecto.colectivo)._id;
    const postulacion = new Postulacion(persona, colectivoId, proyecto, perfil, anonima);
    const postulacionGuardada = await this.repository.guardar(postulacion);
    postulacion.id = postulacionGuardada.id;

    return postulacion;
  }

  // VISTAS PÚBLICAS
  /**
   * Postulaciones de una persona, armadas como vista para ella.
   * @param {Id} personaColaboradoraId
   * @returns {Promise<VistaPostulacionDePersona[]>}
   * @throws {AppError} 404 si la persona no existe.
   */
  async obtenerDePersona(personaColaboradoraId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const postulaciones = await this.repository.obtenerPorPersona(personaColaboradoraId);

    return postulaciones.map((postulacion) => this.aVistaDePersona(postulacion));
  }

  /**
   * Postulaciones recibidas por un colectivo, opcionalmente filtradas por estado.
   * @param {Id} colectivoId
   * @param {EstadoPostulacionValor} [estado]
   * @returns {Promise<VistaPostulacionDeColectivo[]>}
   * @throws {AppError} 404 si el colectivo no existe.
   */
  async obtenerDeColectivo(colectivoId, estado) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);

    const postulaciones = await this.repository.obtenerPorColectivo(colectivoId, estado);

    return postulaciones.map((postulacion) => this.aVistaDeColectivo(postulacion));
  }

  /**
   * Crea la colaboración correspondiente y marca la postulación como aceptada.
   * @param {PostulacionGuardada} postulacion
   * @returns {Promise<PostulacionGuardada | null>} La postulación actualizada.
   * @throws {AppError} 404/409 si no se puede crear la colaboración (ver ColaboracionService).
   */
  async #aceptarPostulacion(postulacion) {
    await this.colaboracionService.crearColaboracion(
      postulacion.personaColaboradora.toString(),
      postulacion.proyecto.toString(),
      postulacion.perfil.toString(),
      postulacion.anonima,
    );
    return await this.repository.actualizarPostulacion(postulacion._id, EstadoPostulacion.ACEPTADA);
  }

  /**
   * Marca la postulación como rechazada.
   * @param {PostulacionGuardada} postulacion
   * @returns {Promise<PostulacionGuardada | null>} La postulación actualizada.
   */
  async #procesarRechazo(postulacion) {
    return await this.repository.actualizarPostulacion(
      postulacion._id,
      EstadoPostulacion.RECHAZADA,
    );
  }

  /**
   * Resuelve una postulación pendiente (aceptar o rechazar).
   * @param {Id} postulacionId
   * @param {EstadoPostulacionValor} nuevoEstado ACEPTADA o RECHAZADA.
   * @param {Id} colectivoId Hoy no se usa: el chequeo de pertenencia está comentado.
   * @returns {Promise<PostulacionGuardada | null | undefined>} La postulación actualizada; undefined
   *   si `nuevoEstado` no es ACEPTADA ni RECHAZADA.
   * @throws {AppError} 404 si no existe; 409 si ya estaba resuelta.
   */
  async actualizarEstado(postulacionId, nuevoEstado, colectivoId) {
    const postulacion = await this.repository.obtenerPostulacionPorId(postulacionId);
    if (!postulacion) {
      throw new AppError(ErrorCatalog.POSTULACION_NO_ENCONTRADA, 404, postulacionId);
    }
    //if (postulacion.colectivo.toString() !== colectivoId.toString()) {
    //throw new AppError(ErrorCatalog.POSTULACION_NO_PERTENECE_A_COLECTIVO, 403);
    //}

    if (postulacion.estado !== EstadoPostulacion.PENDIENTE) {
      throw new AppError(ErrorCatalog.POSTULACION_YA_RESUELTA, 409);
    }
    if (nuevoEstado === EstadoPostulacion.ACEPTADA) {
      return await this.#aceptarPostulacion(postulacion);
    }

    if (nuevoEstado === EstadoPostulacion.RECHAZADA) {
      return await this.#procesarRechazo(postulacion);
    }
  }

  /**
   * Rechaza todas las postulaciones pendientes de los proyectos indicados.
   * @param {Id[]} proyectoIds
   * @returns {Promise<void>}
   */
  async rechazarPendientesDeProyectosCerrados(proyectoIds) {
    await this.repository.rechazarPendientesPorProyectos(proyectoIds);
  }

  // ARMADO DE VISTAS
  /**
   * Busca un perfil dentro del proyecto (populado) por su id.
   * @param {ProyectoDePostulacion} proyecto
   * @param {Id} perfilId
   * @returns {ProyectoDePostulacion["perfiles"][number] | undefined}
   */
  buscarPerfil(proyecto, perfilId) {
    return proyecto.perfiles.find((perfil) => perfil._id.toString() === perfilId.toString());
  }

  /**
   * Arma la vista de una postulación para la persona que se postuló.
   * @param {PostulacionGuardada & { proyecto: ProyectoDePostulacion, perfil: Id }} postulacion
   * @returns {VistaPostulacionDePersona}
   */
  aVistaDePersona({ _id, proyecto, perfil, estado, anonima }) {
    return {
      id: _id,
      proyecto: proyecto.titulo,
      proyectoId: proyecto._id,
      perfil: this.buscarPerfil(proyecto, perfil)?.descripcion,
      perfilId: perfil,
      estado,
      anonima,
    };
  }

  /**
   * Arma la vista de una postulación para el colectivo (sin datos de contacto).
   * @param {PostulacionGuardada & {
   *   personaColaboradora: PersonaDePostulacion,
   *   proyecto: ProyectoDePostulacion,
   *   perfil: Id,
   * }} postulacion
   * @returns {VistaPostulacionDeColectivo}
   */
  aVistaDeColectivo({ _id, personaColaboradora, proyecto, perfil, estado }) {
    return {
      id: _id,
      personaColaboradora: {
        id: personaColaboradora._id,
        nombreFantasia: personaColaboradora.nombreFantasia,
        habilidades: personaColaboradora.habilidades,
        presentacion: personaColaboradora.presentacion,
      },
      proyecto: proyecto.titulo,
      proyectoId: proyecto._id,
      perfil: this.buscarPerfil(proyecto, perfil)?.descripcion,
      perfilId: perfil,
      estado,
    };
  }

  /**
   * Cantidad de postulaciones por proyecto (total, aceptadas, pendientes y rechazadas).
   * @returns {ReturnType<import("../repositories/postulacionRepository.js").PostulacionRepository["obtenerEstadisticas"]>}
   *   Una fila por proyecto, de más a menos postulaciones.
   */
  async obtenerEstadisticas() {
    const resultado = await this.repository.obtenerEstadisticas();
    return resultado;
  }
}
