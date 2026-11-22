import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";
import { Mensaje, Emisor } from "../models/mensaje.js";
import { TipoMedioDeContacto } from "../models/personaColaboradora.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").MensajeGuardado} MensajeGuardado */
/** @typedef {import("../types.js").ColectivoGuardado} ColectivoGuardado */
/** @typedef {import("../types.js").ProyectoGuardado} ProyectoGuardado */
/** @typedef {import("../types.js").PersonaColaboradoraGuardada} PersonaColaboradoraGuardada */
/** @typedef {import("../models/personaColaboradora.js").MedioDeContacto} MedioDeContacto */
/** @typedef {typeof Emisor[keyof typeof Emisor]} EmisorValor */

/**
 * Mensajería interna entre colectivos y personas colaboradoras sobre un proyecto, con réplica
 * por los medios de contacto externos de la persona.
 */
export class MensajeService {
  // transporter: cualquier objeto con sendMail(opciones) (en producción, el de nodemailer)
  /**
   * @param {object} deps
   * @param {import("../repositories/mensajesRepository.js").MensajeRepository} deps.repository
   * @param {import("./colectivoService.js").ColectivoService} deps.colectivoService
   * @param {import("./personaColaboradoraService.js").PersonaColaboradoraService} deps.personaColaboradoraService
   * @param {{ sendMail: (opciones: object) => Promise<unknown> }} deps.transporter
   * @param {import("./proyectoService.js").ProyectoService} deps.proyectoService
   */
  constructor({
    repository,
    colectivoService,
    personaColaboradoraService,
    transporter,
    proyectoService,
  }) {
    this.repository = repository;
    this.colectivoService = colectivoService;
    this.personaColaboradoraService = personaColaboradoraService;
    this.transporter = transporter;
    this.proyectoService = proyectoService;
  }

  /**
   * Envía un mensaje en la conversación colectivo–persona–proyecto, según quién lo emite.
   * @param {Id} colectivoId
   * @param {Id} personaColaboradoraId
   * @param {Id} proyectoId
   * @param {EmisorValor} emisor
   * @param {string} texto
   * @returns {Promise<MensajeGuardado>}
   * @throws {AppError} 404 si no existe el colectivo, la persona o el proyecto; 403 si el
   *   proyecto no es del colectivo, la persona no acepta mensajes o no hay conversación previa.
   */
  async enviarMensaje(colectivoId, personaColaboradoraId, proyectoId, emisor, texto) {
    const colectivo = await this.colectivoService.obtenerColectivoPorId(colectivoId);
    const personaColaboradora =
      await this.personaColaboradoraService.obtenerPersonaColaboradoraPorIdConContactos(
        personaColaboradoraId,
      );
    const proyecto = await this.proyectoService.obtenerProyectoPorId(proyectoId);

    if (emisor === Emisor.COLECTIVO) {
      if (proyecto.colectivo != colectivoId) {
        throw new AppError(ErrorCatalog.MENSAJE_COLECTIVO_NO_COINCIDE_CON_PROYECTO, 403);
      }
      return await this.enviarMensajeDesdeColectivo(
        colectivo,
        personaColaboradora,
        proyecto,
        texto,
      );
    } else {
      return await this.enviarMensajeDesdePersonaColaboradora(
        colectivo,
        personaColaboradora,
        proyecto,
        texto,
      );
    }
  }

  /**
   * Mensaje del colectivo a la persona; además se replica por sus contactos externos.
   * @param {ColectivoGuardado} colectivo
   * @param {PersonaColaboradoraGuardada} personaColaboradora Con `contactos` cargados.
   * @param {ProyectoGuardado} proyecto
   * @param {string} texto
   * @returns {Promise<MensajeGuardado>}
   * @throws {AppError} 403 si la persona bloquea los mensajes internos.
   */
  async enviarMensajeDesdeColectivo(colectivo, personaColaboradora, proyecto, texto) {
    if (personaColaboradora.bloquearMensajeInterno) {
      throw new AppError(
        ErrorCatalog.MENSAJE_DESTINATARIA_NO_ACEPTA,
        403,
        personaColaboradora.nombreFantasia,
      );
    }

    // Se pasan los documentos completos: mongoose los castea a su _id al guardar (el modelo pide Id).
    const mensaje = new Mensaje(
      /** @type {any} */ (colectivo),
      /** @type {any} */ (personaColaboradora),
      /** @type {any} */ (proyecto),
      Emisor.COLECTIVO,
      texto,
    );
    const mensajeGuardado = await this.repository.guardar(mensaje);
    mensaje.id = mensajeGuardado.id;

    this.replicadorDeMensaje(personaColaboradora.contactos, texto);

    return mensajeGuardado;
  }

  /**
   * Mensajes de todas las conversaciones de una persona.
   * @param {Id} personaColaboradoraId
   * @returns {Promise<MensajeGuardado[]>}
   * @throws {AppError} 404 si no existe la persona.
   */
  async verMensajesColaboradora(personaColaboradoraId) {
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const mensajes = await this.repository.obtenerPorColaboradoraId(personaColaboradoraId);

    return mensajes;
  }

  /**
   * Mensajes de todas las conversaciones de un colectivo.
   * @param {Id} colectivoId
   * @returns {Promise<MensajeGuardado[]>}
   * @throws {AppError} 404 si no existe el colectivo.
   */
  async verMensajesColectivo(colectivoId) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);

    const mensajes = await this.repository.obtenerPorColectivoId(colectivoId);

    return mensajes;
  }

  /**
   * Respuesta de la persona; solo se permite si el colectivo ya inició la conversación.
   * @param {ColectivoGuardado} colectivo
   * @param {PersonaColaboradoraGuardada} personaColaboradora
   * @param {ProyectoGuardado} proyecto
   * @param {string} texto
   * @returns {Promise<MensajeGuardado>}
   * @throws {AppError} 403 si no hay conversación previa.
   */
  async enviarMensajeDesdePersonaColaboradora(colectivo, personaColaboradora, proyecto, texto) {
    const existeConversacionPrevia = await this.repository.existeConversacion(
      colectivo._id,
      personaColaboradora._id,
      proyecto._id,
    );

    if (!existeConversacionPrevia) {
      throw new AppError(ErrorCatalog.MENSAJE_SIN_CONVERSACION_PREVIA, 403);
    }

    const mensaje = new Mensaje(
      /** @type {any} */ (colectivo),
      /** @type {any} */ (personaColaboradora),
      /** @type {any} */ (proyecto),
      Emisor.PERSONA,
      texto,
    );
    const mensajeGuardado = await this.repository.guardar(mensaje);
    mensaje.id = mensajeGuardado.id;

    return mensajeGuardado;
  }

  /**
   * Marca como leídos (o no) los mensajes que recibió `lector` en la conversación.
   * @param {Id} colectivoId
   * @param {Id} personaColaboradoraId
   * @param {Id} proyectoId
   * @param {EmisorValor} lector Quién lee: se marcan los mensajes del otro emisor.
   * @param {boolean} leido
   * @returns {Promise<{ actualizados: number }>} Cantidad de mensajes modificados.
   * @throws {AppError} 404 si no existe el colectivo o la persona.
   */
  async marcarComoLeidos(colectivoId, personaColaboradoraId, proyectoId, lector, leido) {
    await this.colectivoService.obtenerColectivoPorId(colectivoId);
    await this.personaColaboradoraService.obtenerPersonaColaboradoraPorId(personaColaboradoraId);

    const emisorDeLosMensajes = lector === Emisor.PERSONA ? Emisor.COLECTIVO : Emisor.PERSONA;
    const actualizados = await this.repository.marcarComoLeidos(
      colectivoId,
      personaColaboradoraId,
      proyectoId,
      emisorDeLosMensajes,
      leido,
    );
    return { actualizados };
  }

  //Notificador externo (replicador del mensaje por los contactos de la personaColaboradora)
  /**
   * Reenvía el texto por cada medio de contacto (email, SMS o WhatsApp); no espera los envíos.
   * @param {MedioDeContacto[]} contactos
   * @param {string} texto
   * @returns {Promise<void>}
   */
  async replicadorDeMensaje(contactos, texto) {
    for (const contacto of contactos) {
      switch (contacto.tipo) {
        case TipoMedioDeContacto.EMAIL: {
          this.enviarEmail(contacto.valor, texto);
          break;
        }
        case TipoMedioDeContacto.SMS: {
          this.enviarSms(contacto.valor, texto);
          break;
        }
        case TipoMedioDeContacto.WHATSAPP: {
          this.enviarWhatsapp(contacto.valor, texto);
          break;
        }
      }
    }
  }

  /**
   * Envía el texto por mail con el transporter; si falla, solo lo loguea.
   * @param {string} email
   * @param {string} texto
   * @returns {Promise<void>}
   */
  async enviarEmail(email, texto) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: email,
        text: texto,
      });
    } catch {
      console.log("No se pudo enviar el mail al destino");
    }
  }

  /**
   * Simulado: solo loguea.
   * @param {string} numero
   * @param {string} texto
   * @returns {Promise<void>}
   */
  async enviarSms(numero, texto) {
    console.log("Se envio el mensaje de texto");
  }

  /**
   * Simulado: solo loguea.
   * @param {string} numero
   * @param {string} texto
   * @returns {Promise<void>}
   */
  async enviarWhatsapp(numero, texto) {
    console.log("Se envio el mensaje de wathsapp");
  }
}
