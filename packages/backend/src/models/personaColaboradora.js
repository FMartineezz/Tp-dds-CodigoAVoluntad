export const TipoMedioDeContacto = Object.freeze({
  EMAIL: "email",
  WHATSAPP: "whatsapp",
  SMS: "sms",
});

export class PersonaColaboradora {
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
  ) {
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
  }
}
