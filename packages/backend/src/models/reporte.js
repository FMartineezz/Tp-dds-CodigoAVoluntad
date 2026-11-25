/** Qué tipo de problema reporta la persona. */
export const TipoReporte = Object.freeze({
  ERROR: "error", // algo no anda (un botón, una pantalla que no carga…)
  SUGERENCIA: "sugerencia", // una idea para mejorar
  OTRO: "otro",
});

/** En qué anda el reporte para el equipo administrativo. Todo reporte nace «nuevo». */
export const EstadoReporte = Object.freeze({
  NUEVO: "nuevo",
  EN_REVISION: "en_revision",
  RESUELTO: "resuelto",
});

/**
 * Reporte de un problema en la plataforma. Lo puede mandar cualquiera, sin cuenta.
 */
export class Reporte {
  /**
   * @param {typeof TipoReporte[keyof typeof TipoReporte]} tipo
   * @param {string} descripcion Qué pasó.
   * @param {string} [pantalla] Dónde pasó (la dirección de la pantalla, si la sabe).
   * @param {string} [correo] Para avisarle cuando se resuelva (opcional).
   */
  constructor(tipo, descripcion, pantalla, correo) {
    /** @type {string | null} */
    this.id = null;
    this.tipo = tipo;
    this.descripcion = descripcion;
    this.pantalla = pantalla ?? null;
    this.correo = correo ?? null;
    this.estado = EstadoReporte.NUEVO;
    this.fecha = new Date();
  }
}
