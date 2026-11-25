import { Reporte } from "../models/reporte.js";

/** Reportes de problemas en la plataforma (los manda cualquiera, sin cuenta). */
export class ReporteService {
  /**
   * @param {object} deps
   * @param {import("../repositories/reporteRepository.js").ReporteRepository} deps.reporteRepository
   */
  constructor({ reporteRepository }) {
    this.reporteRepository = reporteRepository;
  }

  /**
   * Registra un reporte (los datos ya vienen validados por validarReporte).
   * @param {{ tipo: string, descripcion: string, pantalla?: string, correo?: string }} datos
   * @returns {Promise<import("../models/reporte.js").Reporte>} Con su id.
   */
  async crearReporte({ tipo, descripcion, pantalla, correo }) {
    const reporte = new Reporte(tipo, descripcion, pantalla, correo);
    const guardado = await this.reporteRepository.guardar(reporte);
    reporte.id = guardado.id;
    return reporte;
  }
}
