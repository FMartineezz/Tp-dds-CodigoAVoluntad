import { ColaboracionModel } from "../schemas/colaboracionSchema.js";

export class ColaboracionRepository {
  constructor(){
    this.model = ColaboracionModel
  }
  
  async guardar(colaboracion) {
    const nuevaColaboracion = new this.model(colaboracion);
    return await nuevaColaboracion.save();
  }
  
  async obtenerTodas() {
    return await this.model.find();
  }
  
  async obtenerPorId(id) {
    return await this.model.findById(id);
  }

  /*   constructor() {
    this.colaboraciones = [];
    this.id = 1;
  }

  guardar(colaboracion) {
    colaboracion.id = this.id;
    this.id++;
    this.colaboraciones.push(colaboracion);

    return colaboracion;
  }

  obtenerTodas() {
    return this.colaboraciones;
  }

  obtenerPorId(id) {
    return this.colaboraciones.find((colaboracion) => colaboracion.id === id);
  } */
}
