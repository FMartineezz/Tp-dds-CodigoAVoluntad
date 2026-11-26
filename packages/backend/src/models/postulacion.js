/** Estados de una postulación: queda pendiente hasta que el colectivo la resuelve. */
export const EstadoPostulacion = Object.freeze({
  PENDIENTE: "pendiente",
  ACEPTADA: "aceptada",
  RECHAZADA: "rechazada",
});

/** @typedef {import("../types.js").Id} Id */

/**
 * Pedido de una persona para sumarse a un perfil. Recién al aceptarse se crea la
 * colaboración y sus datos de contacto quedan disponibles para el colectivo.
 */
export class Postulacion {
  /**
   * @param {Id | { _id: Id }} personaColaboradora
   * @param {Id} colectivo
   * @param {Id | { _id: Id }} proyecto
   * @param {Id | { _id: Id }} perfil
   * @param {boolean} [anonima]
   * @param {Date} [fechaResolucion]
   */
  constructor(
    personaColaboradora,
    colectivo,
    proyecto,
    perfil,
    anonima = false,
    fechaResolucion = undefined,
  ) {
    /** @type {Id | null} */
    this.id = null;
    this.personaColaboradora = personaColaboradora;
    this.colectivo = colectivo;
    this.proyecto = proyecto;
    this.perfil = perfil;
    this.anonima = anonima;
    /** @type {typeof EstadoPostulacion[keyof typeof EstadoPostulacion]} */
    this.estado = EstadoPostulacion.PENDIENTE;
    this.fechaResolucion = fechaResolucion;
  }
}
