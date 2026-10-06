export class Colaboracion {
  constructor(personaColaboradora, proyecto, esAnonima = false) {
    this.id = null;
    this.personaColaboradora = personaColaboradora;
    this.proyecto = proyecto;
    this.anonima = esAnonima;
  }
}
