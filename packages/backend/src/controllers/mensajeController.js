export class MensajeController {
  constructor({ mensajeService }) {
    this.mensajeService = mensajeService;
  }

  enviarMensajeDesdeColectivo = (req, res) => {
    const colectivoId = Number(req.params.colectivoId);

    const mensaje = this.mensajeService.enviarMensajeDesdeColectivo(
      colectivoId,
      personaColaboradoraId,
      mensaje,
    );

    res.status(201).json(mensaje);
  };

  obtenerBandejaDeEntradaColaboradora = (req, res) => {
    const personaColaboradoraId = Number(req.params.personaColaboradoraId);

    const mensajes = this.mensajeService.obtenerBandejaDeEntradaColaboradora(personaColaboradoraId);

    res.status(200).json(mensajes);
  };
}
