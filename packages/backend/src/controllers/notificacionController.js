/** Endpoints de notificaciones automáticas (routes/notificacionRoutes.js). */
export class NotificacionController {
  /**
   * @param {object} deps
   * @param {import("../services/notificacionAutomaticaService.js").NotificacionAutomaticaService} deps.notificacionAutomaticaService
   */
  constructor({ notificacionAutomaticaService }) {
    this.notificacionAutomaticaService = notificacionAutomaticaService;
  }

  /**
   * GET /colaboradoras/:colaboradoraId/notificaciones → 200 con las notificaciones de la persona.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerNotificacionesColaboradora = async (req, res) => {
    const colaboradoraId = req.params.colaboradoraId;

    const notificaciones =
      await this.notificacionAutomaticaService.obtenerNotificacionesDePersonaColaboradora(
        colaboradoraId,
      );

    res.status(200).json(notificaciones);
  };

  /**
   * GET /colectivos/:colectivoId/notificaciones → 200 con las notificaciones del colectivo.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  obtenerNotificacionesColectivo = async (req, res) => {
    const colectivoId = req.params.colectivoId;

    const notificaciones =
      await this.notificacionAutomaticaService.obtenerNotificacionesDelColectivo(colectivoId);

    res.status(200).json(notificaciones);
  };
}
