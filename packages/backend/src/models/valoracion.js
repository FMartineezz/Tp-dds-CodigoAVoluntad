export const TipoEvaluador = Object.freeze({
  PERSONA: "persona",
  COLECTIVO: "colectivo",
});

export class Valoracion {
  constructor(colaboracion, evaluador, puntaje, comentario) {
    this.id = null;
    this.colaboracion = colaboracion;
    this.evaluador = evaluador;
    this.puntaje = puntaje;
    this.comentario = comentario;
  }
}