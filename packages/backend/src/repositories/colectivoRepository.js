import { ColectivoModel } from "../schemas/colectivoSchema";

export class ColectivoRepository {
//normalizar nombres de metodos
    constructor(){
      this.model = ColectivoModel
    }
    
    async guardar(colectivo) {
      const nuevoColectivo = new this.model(colectivo);
      return await nuevoColectivo.save();
    }
    
    async obtenerTodos() {
      return await this.model.find();
    }
    
    async obtenerPorId(id) {
      return await this.model.findById(id);
    }

    async obtenerPorNombre(nombre) {
      return await this.model.findByOne({nombre});
    }

/*   constructor() {
    this.colectivos = [];
    this.id = 1;
  }

  agregarColectivo(colectivo) {
    colectivo.id = this.id;
    this.id++;
    this.colectivos.push(colectivo);
  }

  obtenerColectivos() {
    return this.colectivos;
  }

  obtenerColectivoPorId(id) {
    return this.colectivos.find((c) => c.id === id) ?? null;
  }

  obtenerColectivoPorNombre(nombre) {
    return this.colectivos.find((colectivo) => colectivo.nombre === nombre) || null;
  }
 */
}
