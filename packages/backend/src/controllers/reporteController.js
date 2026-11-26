/** Endpoints de reportes de problemas (routes/reporteRoutes.js). */
export class ReporteController {
  /**
   * @param {object} deps
   * @param {import("../services/reporteService.js").ReporteService} deps.reporteService
   */
  constructor({ reporteService }) {
    this.reporteService = reporteService;
  }

  /**
   * POST /reportes (body validado por validarReporte) → 201 con el reporte.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  crearReporte = async (req, res) => {
    const reporte = await this.reporteService.crearReporte(req.body);
    res.status(201).location(`/admin/reportes/${reporte.id}`).json(reporte);
  };

  /** GET /admin/reportes?estado= → 200 con la lista (los más nuevos primero). */
  obtenerReportes = async (req, res) => {
    // Un ?estado= vacío cuenta como que no vino
    const estado = req.query.estado || undefined;
    res.status(200).json(await this.reporteService.obtenerReportes({ estado }));
  };

  /** GET /admin/reportes/:id → 200 con el reporte. */
  obtenerReportePorId = async (req, res) => {
    res.status(200).json(await this.reporteService.obtenerReportePorId(req.params.id));
  };

  /** PATCH /admin/reportes/:id/estado { estado } → 200 con el reporte actualizado. */
  actualizarEstado = async (req, res) => {
    const reporte = await this.reporteService.actualizarEstado(req.params.id, req.body?.estado);
    res.status(200).json(reporte);
  };
}
