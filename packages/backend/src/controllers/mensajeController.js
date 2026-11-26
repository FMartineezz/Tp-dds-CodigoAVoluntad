/**
 * Endpoints de mensajes entre un colectivo y una persona colaboradora (routes/mensajeRoutes.js;
 * las conversaciones se consultan desde colectivoRoutes y personaColaboradoraRoutes).
 */
export class MensajeController {
  /**
   * @param {object} deps
   * @param {import("../services/mensajeService.js").MensajeService} deps.mensajeService
   */
  constructor({ mensajeService }) {
    this.mensajeService = mensajeService;
  }

  /**
   * POST /mensajes (body validado por validarMensaje) → 201 con el mensaje enviado.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
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

  /**
   * PATCH /mensajes (body validado por validarLecturaDeMensajes) → 200 con el resultado de
   * marcar la conversación como leída (o no leída) para el lector.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
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

  /**
   * GET /colaboradoras/:personaColaboradoraId/mensajes → 200 con los mensajes de la persona.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  verMensajesColaboradora = async (req, res) => {
    const personaColaboradoraId = req.params.personaColaboradoraId;

    const mensajes = await this.mensajeService.verMensajesColaboradora(personaColaboradoraId);

    res.status(200).json(mensajes);
  };

  /**
   * GET /colectivos/:colectivoId/mensajes → 200 con los mensajes del colectivo.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  verMensajesColectivo = async (req, res) => {
    const colectivoId = req.params.colectivoId;

    const mensajes = await this.mensajeService.verMensajesColectivo(colectivoId);

    res.status(200).json(mensajes);
  };
}
