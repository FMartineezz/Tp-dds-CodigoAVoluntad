import Lodash from "lodash";

class Habilidad {
  constructor(titulo, descripcion) {
    this.id = null;
    this.titulo = titulo;
    this.codigo = Lodash.snakeCase(titulo);
    this.descripcion = descripcion;
  }
}

export default Habilidad;
