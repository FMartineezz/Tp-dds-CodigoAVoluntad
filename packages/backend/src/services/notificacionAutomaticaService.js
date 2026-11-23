import { eventos, EVENTO_PERSONA_CREADA, EVENTO_PROYECTO_CREADO } from "../events/events.js";
import { Notificacion, DestinatarioNotificacion } from "../models/notificacion.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").ProyectoGuardado} ProyectoGuardado */
/** @typedef {import("../types.js").PersonaColaboradoraGuardada} PersonaColaboradoraGuardada */
/** @typedef {import("../errors/appError.js").AppError} AppError */

/**
 * Genera notificaciones automáticas a partir de los eventos del sistema (proyecto creado,
 * persona creada) y permite consultarlas.
 */
export class NotificacionAutomaticaService {
  /**
   * @param {object} deps
   * @param {import("../repositories/notificacionRepository.js").NotificacionRepository} deps.repository
   * @param {import("./personaColaboradoraService.js").PersonaColaboradoraService} deps.personaColaboradoraService
   * @param {import("./colectivoService.js").ColectivoService} deps.colectivoService
   * @param {import("./busquedaService.js").BusquedaService} deps.busquedaService
   */
  constructor({ repository, personaColaboradoraService, colectivoService, busquedaService }) {
    this.repository = repository;
    this.personaColaboradoraService = personaColaboradoraService;
    this.colectivoService = colectivoService;
    this.busquedaService = busquedaService;
  }

  /**
   * Se suscribe a los eventos de proyecto y persona creados. Los errores se loguean y no se
   * propagan, para no romper la operación que disparó el evento.
   * @returns {void}
   */
  iniciar() {
    eventos.on(EVENTO_PROYECTO_CREADO, async (proyecto, colectivoNombre) => {
      try {
        await this.notificarAPersonasColaboradoras(proyecto, colectivoNombre);
      } catch (error) {
        console.error(`Error en las notificaciones automaticas: ${error.message}`);
      }
    });

    eventos.on(EVENTO_PERSONA_CREADA, async (personaColaboradora) => {
      try {
        await this.notificarAColectivos(personaColaboradora);
      } catch (error) {
        console.error(`Error en las notificaciones automaticas: ${error.message}`);
      }
    });
  }

  /**
   * Avisa a las personas con alguna habilidad requerida por el proyecto recién publicado.
   * @param {ProyectoGuardado} proyecto
   * @param {string} colectivoNombre Nombre del colectivo, para el texto del aviso.
   * @returns {Promise<void>}
   */
  async notificarAPersonasColaboradoras(proyecto, colectivoNombre) {
    const personasColaboradoras =
      await this.busquedaService.obtenerPersonasColaboradorasAcordesAProyecto(proyecto);

    // Se arman todas en memoria y se guardan con un solo insertMany (no un insert por persona)
    const notificaciones = personasColaboradoras.map(
      (persona) =>
        new Notificacion(
          persona,
          proyecto.colectivo,
          proyecto,
          DestinatarioNotificacion.PERSONA,
          `Hola ${persona.nombre}!, se publico el proyecto " ${proyecto.titulo} " del colectivo ${colectivoNombre} que busca perfiles acordes a tus habilidades`,
        ),
    );
    await this.repository.guardarVarias(notificaciones);
  }

  /**
   * Avisa a los colectivos cuyos proyectos buscan habilidades de la persona recién creada.
   * @param {PersonaColaboradoraGuardada} personaColaboradora
   * @returns {Promise<void>}
   * @throws {AppError} 404 si la persona no existe.
   */
  async notificarAColectivos(personaColaboradora) {
    const proyectos = await this.busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(
      personaColaboradora._id,
    );

    // El repositorio trae los proyectos con el colectivo populado
    const notificaciones = proyectos.map(
      (proyecto) =>
        new Notificacion(
          personaColaboradora,
          proyecto.colectivo,
          proyecto,
          DestinatarioNotificacion.COLECTIVO,
          `Hola ${proyecto.colectivo.nombre}!, hay una nueva persona colaboradora " ${personaColaboradora.nombreFantasia} " la cual tiene habilidades acordes al proyecto " ${proyecto.titulo} "`,
        ),
    );
    await this.repository.guardarVarias(notificaciones);
  }

  //GET
  /**
   * Notificaciones dirigidas a una persona, de la más nueva a la más vieja.
   * @param {Id} personaColaboradoraId
   * @returns {Promise<import("../types.js").NotificacionGuardada[]>}
   * @throws {AppError} 404 si la persona no existe.
   */
  async obtenerNotificacionesDePersonaColaboradora(personaColaboradoraId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos(
      personaColaboradoraId,
    );

    return await this.repository.obtenerDePersona(personaColaboradoraId);
  }

  /**
   * Notificaciones dirigidas a un colectivo, de la más nueva a la más vieja.
   * @param {Id} colectivoId
   * @returns {Promise<import("../types.js").NotificacionGuardada[]>}
   * @throws {AppError} 404 si el colectivo no existe.
   */
  async obtenerNotificacionesDelColectivo(colectivoId) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);

    return await this.repository.obtenerDeColectivo(colectivoId);
  }
}
