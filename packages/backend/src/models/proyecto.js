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
  constructor(titulo, descripcion, perfiles, colectivo, urlSistema) {
    this.id = null;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.perfiles = perfiles;
    this.colectivo = colectivo;
    this.urlSistema = urlSistema;
    this.logros = [];
    this.finalizado = false;
  }

  agregarLogro(logro) {
    const porcentajeActual = this.calcularPorcentajeConcrecion();

    if (porcentajeActual + logro.porcentaje > 100) {
      throw new Error("La concreción del proyecto no puede superar el 100%");
    }

    this.logros.push(logro);
  }

  eliminarLogro(logro) {
    this.logros = this.logros.filter((l) => l.id !== logro.id);
  }

  calcularPorcentajeConcrecion() {
    return this.logros.reduce((total, logro) => total + logro.porcentaje, 0,);
  }
}
