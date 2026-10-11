import { HabilidadModel } from "../schemas/habilidadSchema.js";

export class HabilidadRespository {
  constructor() {
    this.model = HabilidadModel;
  }

  async guardar(habilidad) {
    const nuevaHabilidad = new this.model(habilidad);
    return await nuevaHabilidad.save();
  }

  async obtenerTodas() {
    return await this.model.find().lean();
  }

  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  async obtenerPorTitulo(titulo) {
    return await this.model.findOne({ titulo }).lean();
  }

  async obtenerPorCodigo(codigo) {
    return await this.model.findOne({ codigo }).lean();
  }

  async obtenerPorCodigos(codigos) {
    return await this.model.find({ codigo: { $in: codigos } }).lean();
  }
}
/*   constructor() {
    this.habilidades = [];
    this.id = 1;
  }

  agregarHabilidad(habilidad) {
    habilidad.id = this.id;
    this.id++;
    this.habilidades.push(habilidad);
  }

  findAll() {
    return this.habilidades;
  }

  findById(id) {
    for (const habilidad of this.habilidades) {
      if (habilidad.id === id) {
        return habilidad;
      }
    }
    return null;
  }

  buscarPorTitulo(titulo) {
    return (
      this.habilidades.find(
        (habilidad) => habilidad.titulo.trim().toLowerCase() === titulo.trim().toLowerCase(),
      ) || null
    );
  }

  buscarPorCodigo(codigo) {
    return this.habilidades.find((habilidad) => habilidad.codigo === codigo) || null;
  } */
