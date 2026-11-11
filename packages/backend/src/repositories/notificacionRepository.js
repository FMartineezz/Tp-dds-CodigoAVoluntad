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
