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
}
