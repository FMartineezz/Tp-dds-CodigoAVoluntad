export class Perfil {
  constructor(
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
  ) {
    this.id = null;
    this.descripcion = descripcion;
    this.habilidadesRequeridas = habilidadesRequeridas;
    this.habilidadesOpcionales = habilidadesOpcionales;
    this.horas = horas;
    this.tipoDeCompromiso = tipoDeCompromiso; // puede ser "semanales","mensuales" o "totales"
    this.modalidadDeColaboracion = modalidadDeColaboracion;
  }
}
