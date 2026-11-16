import { MensajeModel } from "../schemas/mensajeSchema.js";

export class MensajeRepository {
  constructor() {
    this.model = MensajeModel;
  }

  async guardar(mensaje) {
    const nuevoMensaje = new this.model(mensaje);
    return await nuevoMensaje.save();
  }

  //Mensajes de la persona Colaboradora (Que recibe y que emite)
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

  async existeConversacion(colectivoId, personaColaboradoraId, proyectoId) {
    const existe = await this.model.exists({
      colectivo: colectivoId,
      personaColaboradora: personaColaboradoraId,
      proyecto: proyectoId,
    });
    return Boolean(existe);
  }

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
