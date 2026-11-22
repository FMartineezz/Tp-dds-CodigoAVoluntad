import { NotificacionModel } from "../schemas/notificacionSchema.js";
import { DestinatarioNotificacion } from "../models/notificacion.js";

const CODIGO_ERROR_CLAVE_DUPLICADA = 11000;

export class NotificacionRepository {
  constructor() {
    this.model = NotificacionModel;
  }

  //Mensaje que envia el colectivo
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
   * `ordered: false` sigue insertando aunque alguna falle: las que ya existían (índice único,
   * error 11000) se ignoran, igual que en {@link NotificacionRepository#guardar}.
   *
   * @param {import("../models/notificacion.js").Notificacion[]} notificaciones
   * @returns {Promise<object[]>} Las notificaciones que se insertaron.
   */
  async guardarVarias(notificaciones) {
    if (notificaciones.length === 0) return [];
    try {
      return await this.model.insertMany(notificaciones, { ordered: false });
    } catch (error) {
      // writeErrors puede ser un objeto o una lista, y mongoose deja el código en `err.code`
      const errores = [].concat(error.writeErrors ?? []);
      const soloDuplicados =
        errores.length > 0 && errores.every((e) => (e.code ?? e.err?.code) === CODIGO_ERROR_CLAVE_DUPLICADA);
      if (soloDuplicados) return error.insertedDocs ?? [];
      throw error;
    }
  }

  async obtenerDePersona(personaId) {
    return await this.model
      .find({ personaColaboradora: personaId, destinatario: DestinatarioNotificacion.PERSONA })
      .sort({ createdAt: -1 })
      .populate("proyecto", "titulo")
      .lean();
  }

  async obtenerDeColectivo(colectivoId) {
    return await this.model
      .find({ colectivo: colectivoId, destinatario: DestinatarioNotificacion.COLECTIVO })
      .sort({ createdAt: -1 })
      .populate("proyecto", "titulo")
      .populate("personaColaboradora", "nombreFantasia")
      .lean();
  }
}
