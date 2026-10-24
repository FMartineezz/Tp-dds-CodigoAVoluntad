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
    perfiles,
    colectivo,
    urlSistema,
    fechaCierre = undefined,
    fechaLimiteBusqueda = undefined,
  ) {
    this.id = null;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.perfiles = perfiles;
    this.colectivo = colectivo;
    this.urlSistema = urlSistema;
    this.logros = [];
    this.finalizado = false;
    this.fechaCierre = fechaCierre;
    this.busquedaCerrada = false;
    this.fechaLimiteBusqueda = fechaLimiteBusqueda;
  }
}
