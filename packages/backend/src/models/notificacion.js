export const DestinatarioNotificacion = Object.freeze({
  PERSONA: "persona",
  COLECTIVO: "colectivo",
});

export class Notificacion {
  constructor(personaColaboradora, colectivo, proyecto, destinatario, texto) {
    this.id = null;
    this.personaColaboradora = personaColaboradora;
    this.colectivo = colectivo;
    this.proyecto = proyecto;
    this.destinatario = destinatario;
    this.texto = texto;
  }
}
