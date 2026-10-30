import { ColectivoModel } from "../schemas/colectivoSchema.js";

export class ColectivoRepository {
  constructor() {
    this.model = ColectivoModel;
  }

  async guardar(colectivo) {
    const nuevoColectivo = new this.model(colectivo);
    return await nuevoColectivo.save();
  }

  async obtenerTodos() {
    return await this.model.find({ activo: true }).lean();
  }

  async obtenerTodosConEliminados() {
    return await this.model.find().lean();
  }

  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  async obtenerPorNombre(nombre) {
    return await this.model.findOne({ nombre }).lean();
  }

  async agregarProyecto(colectivoId, proyecto) {
    return await this.model.findByIdAndUpdate(colectivoId, {
      $push: {
        proyectos: proyecto,
      },
    });
  }

  async eliminarColectivo(id) {
    return await this.model.findByIdAndUpdate(id, {
      activo: false,
    });
  }

  async actualizar(id, cambios) {
    return await this.model
      .findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true })
      .lean();
  }
}
