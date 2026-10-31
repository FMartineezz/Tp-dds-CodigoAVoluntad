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

  async guardarDenuncia(colectivoId, denuncia) {
    const colectivo = await this.model.findById(colectivoId).select("+denuncias");
    if (!colectivo) return null;
    colectivo.denuncias.push(denuncia);
    await colectivo.save();
    return colectivo.denuncias[colectivo.denuncias.length - 1];
  }

  async existeDenunciaParaColaboracion(colaboracionId) {
    const count = await this.model.countDocuments({
      "denuncias.colaboracionId": colaboracionId,
    });
    return count > 0;
  }

  async obtenerTodasLasDenuncias(filtro = {}) {
    const pipeline = [{ $unwind: "$denuncias" }];
    if (filtro.estado) {
      pipeline.push({ $match: { "denuncias.estado": filtro.estado } });
    }
    pipeline.push({
      $project: {
        _id: "$denuncias._id",
        descripcion: "$denuncias.descripcion",
        fecha: "$denuncias.fecha",
        estado: "$denuncias.estado",
        colaboracionId: "$denuncias.colaboracionId",
        colectivoId: "$_id",
        colectivoNombre: "$nombre",
      },
    });
    return await this.model.aggregate(pipeline);
  }

  async obtenerDenunciaPorId(denunciaId) {
    const colectivo = await this.model
      .findOne(
        { "denuncias._id": denunciaId },
        { "denuncias.$": 1, nombre: 1, _id: 1 },
      )
      .lean();
    if (!colectivo || !colectivo.denuncias || colectivo.denuncias.length === 0) {
      return null;
    }
    const denuncia = colectivo.denuncias[0];
    return {
      ...denuncia,
      colectivoId: colectivo._id,
      colectivoNombre: colectivo.nombre,
    };
  }

  async actualizarEstadoDenuncia(denunciaId, nuevoEstado) {
    const colectivo = await this.model
      .findOneAndUpdate(
        { "denuncias._id": denunciaId },
        { $set: { "denuncias.$.estado": nuevoEstado } },
        { new: true, select: "+denuncias" },
      )
      .lean();

    if (!colectivo) {
      return null;
    }

    const denuncia = colectivo.denuncias?.find(
      (d) => String(d._id) === String(denunciaId),
    );
    if (!denuncia) return null;

    return {
      ...denuncia,
      colectivoId: colectivo._id,
      colectivoNombre: colectivo.nombre,
    };
  }
}
