export const EstadoPostulacion = Object.freeze({
  PENDIENTE: "pendiente",
  ACEPTADA: "aceptada",
  RECHAZADA: "rechazada",
});

export class Postulacion {
  constructor(
    personaColaboradora,
    colectivo,
    proyecto,
    perfil,
    anonima = false,
    fechaResolucion = undefined,
  ) {
    this.id = null;
    this.personaColaboradora = personaColaboradora;
    this.colectivo = colectivo;
    this.proyecto = proyecto;
    this.perfil = perfil;
    this.anonima = anonima;
    this.estado = EstadoPostulacion.PENDIENTE;
    this.fechaResolucion = fechaResolucion;
  }
}
