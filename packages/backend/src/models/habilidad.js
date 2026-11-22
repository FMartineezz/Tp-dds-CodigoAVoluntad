import Lodash from "lodash";

/**
 * Habilidad de desarrollo (la precarga el equipo administrativo). Su código es el título
 * normalizado en snake_case: "Desarrollo Web React" → "desarrollo_web_react".
 */
export class Habilidad {
  /**
   * @param {string} titulo
   * @param {string} descripcion
   */
  constructor(titulo, descripcion) {
    /** @type {string | null} */
    this.id = null;
    this.titulo = titulo;
    this.codigo = Lodash.snakeCase(titulo);
    this.descripcion = descripcion;
  }
}
