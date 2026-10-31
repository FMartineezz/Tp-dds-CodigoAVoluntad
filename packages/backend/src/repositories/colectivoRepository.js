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

    async eliminar(id) {
    const colectivo = await this.model.findOneAndUpdate(
      { _id: id, activo: true },
      { $set: { activo: false } },
      { new: true }
    );

    if (colectivo) {
      return { actualizado: true };
    }

    const existe = await this.model.findById(id);
    if (!existe) {
      return { actualizado: false, razon: 'NO_ENCONTRADO' };
    }

    return { actualizado: false, razon: 'YA_DADO_DE_BAJA' };
  }
}
