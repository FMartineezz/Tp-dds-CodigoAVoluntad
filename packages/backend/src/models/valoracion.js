export const TipoEvaluador = Object.freeze({
  PERSONA: "persona",
  COLECTIVO: "colectivo",
});

export class Valoracion {
  constructor(colaboracion, evaluador, puntaje, comentario = null, autor = null, destinatario = null) {
    this.id = null;
    this.colaboracion = colaboracion;
    this.evaluador = evaluador;
    this.puntaje = puntaje;
    this.comentario = comentario;
    this.autor = autor;
    this.destinatario = destinatario;
  }
}