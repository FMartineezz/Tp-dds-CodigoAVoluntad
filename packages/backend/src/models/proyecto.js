/** Cómo se mide el compromiso de horas de un perfil. */
export const TipoCompromiso = Object.freeze({
  TOTAL: "total",
  SEMANAL: "semanal",
  MENSUAL: "mensual",
});

/** @typedef {typeof TipoCompromiso[keyof typeof TipoCompromiso]} TipoCompromisoValor */

/** Si la colaboración es gratuita, con incentivo económico o con posible contratación. */
export const ModalidadColaboracion = Object.freeze({
  GRATUITA: "gratuita",
  INCENTIVO_ECONOMICO: "incentivo_economico",
  CONTRATACION_EVENTUAL: "contratacion_eventual",
});

/** @typedef {typeof ModalidadColaboracion[keyof typeof ModalidadColaboracion]} ModalidadColaboracionValor */

// No es un campo guardado: se deduce de finalizado, busquedaCerrada y fechaLimiteBusqueda.
// Lo usa el filtro ?estado de GET /proyectos.
/** Estado de un proyecto visto desde afuera. */
export const EstadoDeProyecto = Object.freeze({
  ABIERTO: "abierto", // todavía busca gente
  EN_CURSO: "en_curso", // no terminó, pero ya no busca gente (cerró la búsqueda o venció la fecha)
  FINALIZADO: "finalizado",
});

/** @typedef {import("../types.js").Id} Id */

/**
 * Proyecto de software que publica un colectivo, con los perfiles que necesita.
 */
export class Proyecto {
  /**
   * @param {string} titulo Único dentro del colectivo.
   * @param {string} descripcion
   * @param {import("./perfil.js").Perfil[]} perfiles
   * @param {Id | { _id: Id }} colectivo
   * @param {string} urlSistema Enlace al sistema en producción.
   * @param {Date} [fechaCierre] Cierre automático: al llegar, el proyecto se finaliza.
   * @param {Date} [fechaLimiteBusqueda] Hasta cuándo se aceptan postulaciones.
   * @param {string | null} [urlDonaciones] Enlace de donaciones (ej. Cafecito).
   */
  constructor(
    titulo,
    descripcion,
    perfiles,
    colectivo,
    urlSistema,
    fechaCierre = undefined,
    fechaLimiteBusqueda = undefined,
    urlDonaciones = null,
  ) {
    /** @type {Id | null} */
    this.id = null;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.perfiles = perfiles;
    this.colectivo = colectivo;
    this.urlSistema = urlSistema;
    /** @type {import("./logro.js").Logro[]} */
    this.logros = [];
    this.finalizado = false;
    this.fechaCierre = fechaCierre;
    this.busquedaCerrada = false;
    this.fechaLimiteBusqueda = fechaLimiteBusqueda;
    this.urlDonaciones = urlDonaciones && urlDonaciones !== "" ? urlDonaciones : null;
  }
}
