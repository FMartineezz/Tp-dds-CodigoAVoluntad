import { MensajeModel } from "../schemas/mensajeSchema.js";

export class MensajeRepository {
  constructor() {
    this.model = MensajeModel;
  }

  //Mensaje que envia el colectivo
  async guardar(mensaje) {
    const nuevoMensaje = new this.model(mensaje);
    return await nuevoMensaje.save();
  }

  //Mensajes que recibe la persona Colaboradora
  async obtenerPorColaboradoraId(colaboradoraId) {
    return await this.model
      .where("personaColaboradora")
      .equals(colaboradoraId)
      .sort({ date: 1 })
      .populate("colectivo")
      .lean();
  }
}

/*export class MensajeRepository {
  constructor() {
    this.mensajes = [];
    this.id = 1;
  }

  agregarMensaje(mensaje) {
    mensaje.id = this.id;
    this.id++;
    this.mensajes.push(mensaje);
  }

  findByColaboradoraId(colaboradoraId) {
    return this.mensajes.filter((mensaje) => mensaje.personaColaboradora.id === colaboradoraId);
  }
}*/
