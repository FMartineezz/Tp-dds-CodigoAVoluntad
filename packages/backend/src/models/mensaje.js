export const Emisor = Object.freeze({ PERSONA: "persona", COLECTIVO: "colectivo" });

export class Mensaje {
  constructor(colectivo, personaColaboradora, proyecto, emisor, texto) {
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
