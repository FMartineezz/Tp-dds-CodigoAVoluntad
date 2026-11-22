/** Endpoint de estadísticas generales de la plataforma (routes/estadisticasRoutes.js). */
export class EstadisticasController {
  /**
   * @param {object} deps
   * @param {import("../services/estadisticasService.js").EstadisticasService} deps.estadisticasService
   */
  constructor({ estadisticasService }) {
    this.estadisticasService = estadisticasService;
  }

  /**
   * GET /estadisticas (con rate limit) → 200 con las estadísticas.
   * @param {import("../types.js").RequestConParams} req
   * @param {import("express").Response} res
   */
  verEstadisticas = async (req, res) => {
    const estadisticas = await this.estadisticasService.obtenerEstadisticas();

    res.status(200).json(estadisticas);
  };
}
