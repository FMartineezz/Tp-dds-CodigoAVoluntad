/**
 * Hito del avance de un proyecto.
 */
export class Logro {
  /**
   * @param {string} descripcion
   * @param {number} porcentaje Porcentaje de concreción del proyecto (0–100).
   * @param {string} urlCodigoFuente Enlace al repositorio público.
   */
  constructor(descripcion, porcentaje, urlCodigoFuente) {
    /** @type {string | null} */
    this.id = null;
    this.descripcion = descripcion;
    this.porcentaje = porcentaje;
    this.urlCodigoFuente = urlCodigoFuente;
  }
}
