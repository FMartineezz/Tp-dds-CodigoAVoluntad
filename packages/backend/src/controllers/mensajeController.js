export class MensajeController {
  constructor({ mensajeService }) {
    this.mensajeService = mensajeService;
  }

  enviarMensaje = async (req, res) => {
    const mensaje = await this.mensajeService.enviarMensaje(
      req.body.colectivoId,
      req.body.personaColaboradoraId,
      req.body.proyectoId,
      req.body.emisor,
      req.body.texto,
    );
    // Sin header Location: no hay GET de un solo recurso (los mensajes se consultan como conversación),
    // así que no existe una URL propia a la cual apuntar.
    res.status(201).json(mensaje);
  };

  marcarComoLeidos = async (req, res) => {
    const resultado = await this.mensajeService.marcarComoLeidos(
      req.body.colectivoId,
      req.body.personaColaboradoraId,
      req.body.proyectoId,
      req.body.lector,
      req.body.leido,
    );
    res.status(200).json(resultado);
  };

  verMensajesColaboradora = async (req, res) => {
    const personaColaboradoraId = req.params.personaColaboradoraId;

    const mensajes = await this.mensajeService.verMensajesColaboradora(personaColaboradoraId);

    res.status(200).json(mensajes);
  };

  verMensajesColectivo = async (req, res) => {
    const colectivoId = req.params.colectivoId;

    const mensajes = await this.mensajeService.verMensajesColectivo(colectivoId);

    res.status(200).json(mensajes);
  };
}
