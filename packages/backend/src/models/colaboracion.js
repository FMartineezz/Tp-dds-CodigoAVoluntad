/** Quién dio de baja una colaboración. */
export const OrigenBaja = Object.freeze({
  PERSONA: "persona",
  COLECTIVO: "colectivo",
});

/** @typedef {import("../types.js").Id} Id */

/**
 * Participación de una persona en un perfil de un proyecto. Se crea al aceptar una
 * postulación y nunca se borra: la baja es lógica (activo = false).
 */
export class Colaboracion {
  /**
   * @param {Id} personaColaboradora
   * @param {Id} proyecto
   * @param {Id} perfil
   * @param {boolean} [esAnonima] Si es true, no se muestra públicamente quién colabora.
   */
  constructor(personaColaboradora, proyecto, perfil, esAnonima = false) {
    /** @type {Id | null} */
    this.id = null;
    this.personaColaboradora = personaColaboradora;
    this.proyecto = proyecto;
    this.perfil = perfil;
    this.anonima = esAnonima;
    this.activo = true;
    /** @type {Date | undefined} */
    this.fechaBaja = undefined;
    /** @type {typeof OrigenBaja[keyof typeof OrigenBaja] | undefined} */
    this.bajaPor = undefined;
  }
}
