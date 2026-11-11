export class NotificacionController {
  constructor({ notificacionAutomaticaService }) {
    this.notificacionAutomaticaService = notificacionAutomaticaService;
  }

  obtenerNotificacionesColaboradora = async (req, res) => {
    const colaboradoraId = req.params.colaboradoraId;

    const notificaciones =
      await this.notificacionAutomaticaService.obtenerNotificacionesDePersonaColaboradora(
        colaboradoraId,
      );

    res.status(200).json(notificaciones);
  };

  obtenerNotificacionesColectivo = async (req, res) => {
    const colectivoId = req.params.colectivoId;

    const notificaciones =
      await this.notificacionAutomaticaService.obtenerNotificacionesDelColectivo(colectivoId);

    res.status(200).json(notificaciones);
  };
}
