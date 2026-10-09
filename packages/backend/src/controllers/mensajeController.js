export class MensajeController {
  constructor({ mensajeService }) {
    this.mensajeService = mensajeService;
  }

  enviarMensajeDesdeColectivo = (req, res) => {
    const colectivoId = Number(req.params.colectivoId);

    const mensaje = this.mensajeService.enviarMensajeDesdeColectivo(
      colectivoId,
      req.body.personaColaboradoraId,
      req.body.texto,
    );

    res.status(201).json(mensaje);
  };

  verBandejaDeEntradaColaboradora = (req, res) => {
    const personaColaboradoraId = Number(req.params.personaColaboradoraId);

    const mensajes = this.mensajeService.verBandejaDeEntradaColaboradora(personaColaboradoraId);

    res.status(200).json(mensajes);
  };
}
