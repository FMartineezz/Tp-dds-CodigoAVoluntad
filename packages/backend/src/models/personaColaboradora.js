/** Medios de contacto externos (privados: no se muestran en la plataforma). */
export const TipoMedioDeContacto = Object.freeze({
  EMAIL: "email",
  WHATSAPP: "whatsapp",
  SMS: "sms",
});

/** @typedef {import("../types.js").Id} Id */

/**
 * Medio de contacto privado de una persona.
 * @typedef {object} MedioDeContacto
 * @property {typeof TipoMedioDeContacto[keyof typeof TipoMedioDeContacto]} tipo
 * @property {string} valor Email o número.
 */

/**
 * Persona del ámbito del desarrollo que ofrece su trabajo. Puede mantenerse anónima con un
 * nombre de fantasía.
 */
export class PersonaColaboradora {
  /**
   * @param {string} nombreFantasia
   * @param {string} git Cuenta de GitHub o GitLab.
   * @param {string | null} [nombre]
   * @param {string | null} [apellido]
   * @param {Array<Id | { _id: Id }>} [habilidades]
   * @param {string[] | null} [pronombres]
   * @param {string | null} [presentacion]
   * @param {MedioDeContacto[]} [contactos]
   * @param {boolean} [bloquearMensajeInterno] true si NO quiere recibir mensajes internos.
   * @param {import("./redSocial.js").RedSocial[]} [redesSociales]
   * @param {boolean} [activo] false cuando la cuenta se dio de baja (datos anonimizados).
   */
  constructor(
    nombreFantasia,
    git,
    nombre = null,
    apellido = null,
    habilidades = [],
    pronombres = null,
    presentacion = null,
    contactos = [],
    bloquearMensajeInterno = false,
    redesSociales = [],
    activo = true
  ) {
    /** @type {Id | null} */
    this.id = null;
    this.nombreFantasia = nombreFantasia;
    this.git = git;
    this.nombre = nombre;
    this.apellido = apellido;
    this.habilidades = habilidades;
    this.pronombres = pronombres;
    this.presentacion = presentacion;
    this.contactos = contactos;
    this.bloquearMensajeInterno = bloquearMensajeInterno;
    this.redesSociales = redesSociales;
    this.activo = activo;
  }
}
