import { EstadoReporte, Reporte } from "../models/reporte.js";
import { AppError } from "../errors/appError.js";
import ErrorCatalog from "../errors/errorCatalog.js";

// true si el texto es uno de los estados de un reporte (nuevo, en_revision, resuelto)
const esEstadoDeReporte = (estado) => Object.values(EstadoReporte).includes(estado);

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

  /**
   * Reportes para el equipo administrativo, los más nuevos primero.
   * @param {{ estado?: string }} [filtro]
   * @throws {AppError} 400 si el estado no existe.
   */
  async obtenerReportes({ estado } = {}) {
    if (estado === undefined) return await this.reporteRepository.obtenerTodos();
    if (!esEstadoDeReporte(estado)) {
      throw new AppError(ErrorCatalog.REPORTE_ESTADO_INVALIDO, 400);
    }
    return await this.reporteRepository.obtenerTodos({ estado });
  }

  /**
   * @param {import("../types.js").Id} id
   * @throws {AppError} 404 si no existe.
   */
  async obtenerReportePorId(id) {
    const reporte = await this.reporteRepository.obtenerPorId(id);
    if (!reporte) throw new AppError(ErrorCatalog.REPORTE_NO_ENCONTRADO, 404, id);
    return reporte;
  }

  /**
   * Pasa un reporte a otro estado (por ejemplo, de «nuevo» a «resuelto»).
   * @param {import("../types.js").Id} id
   * @param {string} estado
   * @throws {AppError} 400 si el estado no existe; 404 si no existe el reporte.
   */
  async actualizarEstado(id, estado) {
    if (!esEstadoDeReporte(estado)) {
      throw new AppError(ErrorCatalog.REPORTE_ESTADO_INVALIDO, 400);
    }
    const reporte = await this.reporteRepository.actualizarEstado(id, estado);
    if (!reporte) throw new AppError(ErrorCatalog.REPORTE_NO_ENCONTRADO, 404, id);
    return reporte;
  }
}
