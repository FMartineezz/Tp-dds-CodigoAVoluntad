export const TipoCompromiso = Object.freeze({
  TOTAL: "total",
  SEMANAL: "semanal",
  MENSUAL: "mensual",
});

export const ModalidadColaboracion = Object.freeze({
  GRATUITA: "gratuita",
  INCENTIVO_ECONOMICO: "incentivo_economico",
  CONTRATACION_EVENTUAL: "contratacion_eventual",
});

export class Proyecto {
  constructor(
    titulo,
    descripcion,
    habilidadesRequeridas,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
    colectivo,
  ) {
    this.id = null;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.habilidadesRequeridas = habilidadesRequeridas;
    //Separo el campo compromiso esperado en dos campos: horas y tipo de horas
    this.horas = horas;
    this.tipoDeCompromiso = tipoDeCompromiso; // puede ser "semanales","mensuales" o "totales"
    this.modalidadDeColaboracion = modalidadDeColaboracion;
    this.colectivo = colectivo;
    this.finalizado = false;
  }
}
