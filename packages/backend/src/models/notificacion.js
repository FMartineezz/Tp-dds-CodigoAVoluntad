/** A quién va dirigida una notificación automática. */
export const DestinatarioNotificacion = Object.freeze({
  PERSONA: "persona",
  COLECTIVO: "colectivo",
});

/** @typedef {import("../types.js").Id} Id */

/**
 * Aviso automático de una coincidencia entre un proyecto y una persona (ver
 * NotificacionAutomaticaService).
 */
export class Notificacion {
  /**
   * @param {Id | { _id: Id }} personaColaboradora
   * @param {Id | { _id: Id }} colectivo
   * @param {Id | { _id: Id }} proyecto
   * @param {typeof DestinatarioNotificacion[keyof typeof DestinatarioNotificacion]} destinatario
   * @param {string} texto
   */
  constructor(personaColaboradora, colectivo, proyecto, destinatario, texto) {
    /** @type {Id | null} */
    this.id = null;
    this.personaColaboradora = personaColaboradora;
    this.colectivo = colectivo;
    this.proyecto = proyecto;
    this.destinatario = destinatario;
    this.texto = texto;
  }
}
