import { ReporteModel } from "../schemas/reporteSchema.js";

/** @typedef {import("../types.js").ReporteGuardado} ReporteGuardado */

/** Acceso a la colección de reportes de problemas. */
export class ReporteRepository {
  constructor() {
    this.model = ReporteModel;
  }

  /**
   * Guarda un reporte nuevo.
   * @param {import("../models/reporte.js").Reporte} reporte
   * @returns {Promise<import("mongoose").Document & ReporteGuardado>}
   */
  async guardar(reporte) {
    return await new this.model(reporte).save();
  }

  /**
   * Todos los reportes, los más nuevos primero; con `estado`, solo los de ese estado.
   * @param {{ estado?: string }} [filtro]
   * @returns {Promise<ReporteGuardado[]>}
   */
  async obtenerTodos(filtro = {}) {
    return await this.model.find(filtro).sort({ fecha: -1 }).lean();
  }

  /**
   * @param {import("../types.js").Id} id
   * @returns {Promise<ReporteGuardado | null>}
   */
  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  /**
   * Cambia el estado de un reporte.
   * @param {import("../types.js").Id} id
   * @param {string} estado
   * @returns {Promise<ReporteGuardado | null>} El reporte actualizado, o null si no existe.
   */
  async actualizarEstado(id, estado) {
    return await this.model
      .findByIdAndUpdate(id, { estado }, { new: true })
      .lean();
  }
}
