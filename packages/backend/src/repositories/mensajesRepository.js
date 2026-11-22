import { MensajeModel } from "../schemas/mensajeSchema.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").MensajeGuardado} MensajeGuardado */
/** @typedef {import("../models/mensaje.js").Mensaje} Mensaje */

/** Acceso a la colección de mensajes entre colectivos y personas colaboradoras. */
export class MensajeRepository {
  constructor() {
    // Model<any>: los tipos que mongoose infiere del schema no coinciden con los de dominio
    // (opcionales vs. null); el contrato real lo declara el JSDoc de cada método.
    /** @type {import("mongoose").Model<any>} */
    this.model = MensajeModel;
  }

  /**
   * Guarda un mensaje nuevo.
   * @param {Mensaje} mensaje
   * @returns {Promise<import("mongoose").Document & MensajeGuardado>} El documento de mongoose (sin lean).
   */
  async guardar(mensaje) {
    const nuevoMensaje = new this.model(mensaje);
    return await nuevoMensaje.save();
  }

  //Mensajes de la persona Colaboradora (Que recibe y que emite)
  /**
   * Mensajes de una persona colaboradora, del más viejo al más nuevo, con colectivo, persona y
   * proyecto poblados.
   * @param {Id} colaboradoraId
   * @returns {Promise<MensajeGuardado[]>}
   */
  async obtenerPorColaboradoraId(colaboradoraId) {
    return await this.model
      .where("personaColaboradora")
      .equals(colaboradoraId)
      .sort({ date: 1 })
      .populate("colectivo")
      .populate("personaColaboradora")
      .populate("proyecto")
      .lean();
  }

  //Mensajes del colectivo (Que recibe y que emite)
  /**
   * Mensajes de un colectivo, del más viejo al más nuevo, con colectivo, persona y proyecto
   * poblados.
   * @param {Id} colectivoId
   * @returns {Promise<MensajeGuardado[]>}
   */
  async obtenerPorColectivoId(colectivoId) {
    return await this.model
      .where("colectivo")
      .equals(colectivoId)
      .sort({ date: 1 })
      .populate("colectivo")
      .populate("personaColaboradora")
      .populate("proyecto")
      .lean();
  }

  /**
   * Indica si ya hay al menos un mensaje entre ese colectivo y esa persona sobre el proyecto.
   * @param {Id} colectivoId
   * @param {Id} personaColaboradoraId
   * @param {Id} proyectoId
   * @returns {Promise<boolean>}
   */
  async existeConversacion(colectivoId, personaColaboradoraId, proyectoId) {
    const existe = await this.model.exists({
      colectivo: colectivoId,
      personaColaboradora: personaColaboradoraId,
      proyecto: proyectoId,
    });
    return Boolean(existe);
  }

  /**
   * Marca como leídos (o no) los mensajes no leídos de una conversación que mandó un emisor.
   * @param {Id} colectivoId
   * @param {Id} personaColaboradoraId
   * @param {Id} proyectoId
   * @param {Mensaje["emisor"]} emisorDeLosMensajes Quién mandó los mensajes a marcar.
   * @param {boolean} leido
   * @returns {Promise<number>} Cuántos mensajes se modificaron.
   */
  async marcarComoLeidos(
    colectivoId,
    personaColaboradoraId,
    proyectoId,
    emisorDeLosMensajes,
    leido,
  ) {
    const resultado = await this.model.updateMany(
      {
        colectivo: colectivoId,
        personaColaboradora: personaColaboradoraId,
        proyecto: proyectoId,
        emisor: emisorDeLosMensajes,
        leido: false,
      },
      { $set: { leido: leido } },
    );
    return resultado.modifiedCount;
  }
}
