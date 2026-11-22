/** @typedef {import("../types.js").Id} Id */

/**
 * Rol que necesita un proyecto (ej. "Tester"), con sus habilidades, compromiso y modalidad.
 */
export class Perfil {
  /**
   * @param {string} descripcion
   * @param {Array<Id | { _id: Id }>} habilidadesRequeridas Al menos una.
   * @param {Array<Id | { _id: Id }>} habilidadesOpcionales
   * @param {number} horas
   * @param {import("./proyecto.js").TipoCompromisoValor} tipoDeCompromiso
   * @param {import("./proyecto.js").ModalidadColaboracionValor} modalidadDeColaboracion
   * @param {number} [cantidadMaxima] Cupo de colaboraciones; sin cupo si es undefined.
   */
  constructor(
    descripcion,
    habilidadesRequeridas,
    habilidadesOpcionales,
    horas,
    tipoDeCompromiso,
    modalidadDeColaboracion,
    cantidadMaxima = undefined,
  ) {
    /** @type {Id | null} */
    this.id = null;
    this.descripcion = descripcion;
    this.habilidadesRequeridas = habilidadesRequeridas;
    this.habilidadesOpcionales = habilidadesOpcionales;
    this.horas = horas;
    this.tipoDeCompromiso = tipoDeCompromiso; // "total", "semanal" o "mensual" (TipoCompromiso)
    this.modalidadDeColaboracion = modalidadDeColaboracion;
    this.cantidadMaxima = cantidadMaxima;
  }
}
