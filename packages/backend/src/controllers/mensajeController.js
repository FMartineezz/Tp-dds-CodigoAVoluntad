export class MensajeController {
  constructor({ mensajeService }) {
    this.mensajeService = mensajeService;
  }

  enviarMensajeDesdeColectivo = async (req, res) => {
    const colectivoId = req.params.colectivoId;

    const mensaje = await this.mensajeService.enviarMensajeDesdeColectivo(
      colectivoId,
      req.body.personaColaboradoraId,
      req.body.texto,
    );

    res.status(201).json(mensaje);
  };

  verBandejaDeEntradaColaboradora = async (req, res) => {
    const personaColaboradoraId = req.params.personaColaboradoraId;

    const mensajes =
      await this.mensajeService.obtenerBandejaDeEntradaColaboradora(personaColaboradoraId);

    res.status(200).json(mensajes);
  };
}
