export class MensajeService {
  constructor({ repository, colectivoService, personaColaboradoraService }) {
    this.repository = repository;
    this.colectivoService = colectivoService;
    this.personaColaboradoraService = personaColaboradoraService;
  }

  enviarMensajeDesdeColectivo(colectivoId, personaColaboradoraId, mensaje) {}

  obtenerBandejaDeEntradaColaboradora(personaColaboradoraId) {
    const mensajes = this.repository.findByColaboradoraId(personaColaboradoraId);

    return mensajes.map((mensaje) => this.vistaDeMensajes(mensaje));
  }

  vistaDeMensajes({ colectivo, mensaje }) {
    return {
      colectivo: colectivo.nombre,
      mensaje: mensaje,
    };
  }
}
