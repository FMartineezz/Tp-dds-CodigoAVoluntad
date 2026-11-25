/** Endpoints de reportes de problemas (routes/reporteRoutes.js). */
export class ReporteController {
  /**
   * @param {object} deps
   * @param {import("../services/reporteService.js").ReporteService} deps.reporteService
   */
  constructor({ reporteService }) {
    this.reporteService = reporteService;
  }

  // Sin header Location: todavía no hay un GET para consultar un reporte (lo verá el
  // equipo administrativo cuando exista su panel)
  /**
   * POST /reportes (body validado por validarReporte) → 201 con el reporte.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  crearReporte = async (req, res) => {
    const reporte = await this.reporteService.crearReporte(req.body);
    res.status(201).json(reporte);
  };
}
