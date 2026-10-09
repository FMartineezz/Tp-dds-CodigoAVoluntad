export class MensajeRepository {
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
}
