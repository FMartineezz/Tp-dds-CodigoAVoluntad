/** Estados por los que pasa una denuncia mientras la revisa el equipo administrativo. */
export const EstadoDenuncia = Object.freeze({
  PENDIENTE: "pendiente",
  EN_REVISION: "en_revision",
  RESUELTA: "resuelta",
  DESCARTADA: "descartada",
});

/** @typedef {import("../types.js").Id} Id */

/**
 * Denuncia de una persona contra el colectivo con el que colaboró.
 */
export class Denuncia {
  /**
   * @param {string} descripcion
   * @param {Id} colaboracionId La colaboración que habilita a denunciar.
   */
  constructor(descripcion, colaboracionId) {
    /** @type {Id | null} */
    this.id = null;
    this.descripcion = descripcion;
    this.fecha = new Date();
    this.estado = EstadoDenuncia.PENDIENTE;
    this.colaboracionId = colaboracionId;
  }
}
