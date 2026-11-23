/** Quién valora: la persona al colectivo o el colectivo a la persona. */
export const TipoEvaluador = Object.freeze({
  PERSONA: "persona",
  COLECTIVO: "colectivo",
});

/** @typedef {import("../types.js").Id} Id */

/**
 * Calificación mutua al terminar una colaboración (puntaje + comentario breve).
 */
export class Valoracion {
  /**
   * @param {Id} colaboracion
   * @param {typeof TipoEvaluador[keyof typeof TipoEvaluador]} evaluador
   * @param {number} puntaje
   * @param {string | null} [comentario]
   * @param {Id | null} [autor]
   * @param {Id | null} [destinatario]
   */
  constructor(colaboracion, evaluador, puntaje, comentario = null, autor = null, destinatario = null) {
    /** @type {Id | null} */
    this.id = null;
    this.colaboracion = colaboracion;
    this.evaluador = evaluador;
    this.puntaje = puntaje;
    this.comentario = comentario;
    this.autor = autor;
    this.destinatario = destinatario;
  }
}