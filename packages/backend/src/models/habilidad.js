import Lodash from "lodash";

export class Habilidad {
  constructor(titulo, descripcion) {
    this.id = null;
    this.titulo = titulo;
    this.codigo = Lodash.snakeCase(titulo);
    this.descripcion = descripcion;
  }
}
