/** Quién escribió un mensaje interno. */
export const Emisor = Object.freeze({ PERSONA: "persona", COLECTIVO: "colectivo" });

/** @typedef {import("../types.js").Id} Id */

/**
 * Mensaje interno de la conversación entre un colectivo y una persona sobre un proyecto.
 */
export class Mensaje {
  /**
   * @param {Id} colectivo
   * @param {Id} personaColaboradora
   * @param {Id} proyecto
   * @param {typeof Emisor[keyof typeof Emisor]} emisor
   * @param {string} texto
   */
  constructor(colectivo, personaColaboradora, proyecto, emisor, texto) {
    /** @type {Id | null} */
    this.id = null;
    this.colectivo = colectivo;
    this.personaColaboradora = personaColaboradora;
    this.proyecto = proyecto;
    this.emisor = emisor;
    this.texto = texto;
    this.leido = false;
    this.date = new Date();
  }
}
