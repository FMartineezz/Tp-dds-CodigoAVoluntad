import { NotificacionModel } from "../schemas/notificacionSchema.js";
import { DestinatarioNotificacion } from "../models/notificacion.js";

const CODIGO_ERROR_CLAVE_DUPLICADA = 11000;

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").NotificacionGuardada} NotificacionGuardada */
/** @typedef {import("../models/notificacion.js").Notificacion} Notificacion */

/** Acceso a la colección de notificaciones (para personas y para colectivos). */
export class NotificacionRepository {
  constructor() {
    // Model<any>: los tipos que mongoose infiere del schema no coinciden con los de dominio
    // (opcionales vs. null); el contrato real lo declara el JSDoc de cada método.
    /** @type {import("mongoose").Model<any>} */
    this.model = NotificacionModel;
  }

  //Mensaje que envia el colectivo
  /**
   * Guarda una notificación; si ya existía (índice único) no la duplica.
   * @param {Notificacion} notificacion
   * @returns {Promise<(import("mongoose").Document & NotificacionGuardada) | null>} El documento
   *   de mongoose (sin lean), o null si era un duplicado.
   */
  async guardar(notificacion) {
    try {
      const nuevaNotificacion = new this.model(notificacion);
      return await nuevaNotificacion.save();
    } catch (error) {
      if (error.code === CODIGO_ERROR_CLAVE_DUPLICADA) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Guarda varias notificaciones con UN solo `insertMany` (en vez de un insert por cada una).
   * Las que ya existían (índice único) se ignoran, igual que en {@link NotificacionRepository#guardar}.
   *
   * @param {import("../models/notificacion.js").Notificacion[]} notificaciones
   * @returns {Promise<void>}
   */
  async guardarVarias(notificaciones) {
    try {
      // ordered: false → si una está repetida, las demás se guardan igual
      await this.model.insertMany(notificaciones, { ordered: false });
    } catch (error) {
      if (error.code !== CODIGO_ERROR_CLAVE_DUPLICADA) throw error;
    }
  }

  /**
   * Notificaciones dirigidas a una persona, de la más nueva a la más vieja, con el título del
   * proyecto poblado.
   * @param {Id} personaId
   * @returns {Promise<NotificacionGuardada[]>}
   */
  async obtenerDePersona(personaId) {
    return await this.model
      .find({ personaColaboradora: personaId, destinatario: DestinatarioNotificacion.PERSONA })
      .sort({ createdAt: -1 })
      .populate("proyecto", "titulo")
      .lean();
  }

  /**
   * Notificaciones dirigidas a un colectivo, de la más nueva a la más vieja, con el título del
   * proyecto y el nombre de fantasía de la persona poblados.
   * @param {Id} colectivoId
   * @returns {Promise<NotificacionGuardada[]>}
   */
  async obtenerDeColectivo(colectivoId) {
    return await this.model
      .find({ colectivo: colectivoId, destinatario: DestinatarioNotificacion.COLECTIVO })
      .sort({ createdAt: -1 })
      .populate("proyecto", "titulo")
      .populate("personaColaboradora", "nombreFantasia")
      .lean();
  }
}
