export const EstadoColaboracion = Object.freeze({
  ACTIVA: "activa",
  BAJA: "baja",
});

export const OrigenBaja = Object.freeze({
  PERSONA: "persona",
  COLECTIVO: "colectivo",
});

export class Colaboracion {
  constructor(personaColaboradora, proyecto, perfil, esAnonima = false) {
    this.id = null;
    this.personaColaboradora = personaColaboradora;
    this.proyecto = proyecto;
    this.perfil = perfil;
    this.anonima = esAnonima;
    this.estado = EstadoColaboracion.ACTIVA;
    this.fechaBaja = undefined;
    this.bajaPor = undefined;
  }
}
