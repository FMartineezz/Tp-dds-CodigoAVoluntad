import { eventos, EVENTO_PERSONA_CREADA, EVENTO_PROYECTO_CREADO } from "../events/events.js";
import { Notificacion, DestinatarioNotificacion } from "../models/notificacion.js";

export class NotificacionAutomaticaService {
  constructor({ repository, personaColaboradoraService, colectivoService, busquedaService }) {
    this.repository = repository;
    this.personaColaboradoraService = personaColaboradoraService;
    this.colectivoService = colectivoService;
    this.busquedaService = busquedaService;
  }

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

  async notificarAColectivos(personaColaboradora) {
    const proyectos = await this.busquedaService.obtenerProyectosAcordesALaPersonaColaboradora(
      personaColaboradora._id,
    );

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
  async obtenerNotificacionesDePersonaColaboradora(personaColaboradoraId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos(
      personaColaboradoraId,
    );

    return await this.repository.obtenerDePersona(personaColaboradoraId);
  }

  async obtenerNotificacionesDelColectivo(colectivoId) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);

    return await this.repository.obtenerDeColectivo(colectivoId);
  }
}
