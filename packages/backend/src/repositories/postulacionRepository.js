import { PostulacionModel } from "../schemas/postulacionSchema.js";
import { EstadoPostulacion } from "../models/postulacion.js";

export class PostulacionRepository {
  constructor() {
    this.model = PostulacionModel;
  }

  async guardar(postulacion) {
    const nuevaPostulacion = new this.model(postulacion);
    return await nuevaPostulacion.save();
  }

  async obtenerPostulacionPorId(id) {
    return await this.model.findById(id).lean();
  }

  async obtenerPorPersonaProyectoPerfil(personaId, proyectoId, perfilId) {
    return await this.model.exists({
      personaColaboradora: personaId,
      proyecto: proyectoId,
      perfil: perfilId,
    });
  }

  async obtenerPorPersona(personaId) {
    return await this.model
      .find({ personaColaboradora: personaId })
      .populate("proyecto", "titulo perfiles")
      .lean();
  }

  async obtenerPorColectivo(colectivoId, estado) {
    const filtro = { colectivo: colectivoId };
    if (estado) filtro.estado = estado;

    return await this.model
      .find(filtro)
      .populate({
        path: "personaColaboradora",
        select: "nombreFantasia habilidades presentacion",
        populate: { path: "habilidades", select: "titulo codigo" },
      })
      .populate("proyecto", "titulo perfiles")
      .lean();
  }

  async actualizarPostulacion(id, nuevoEstado) {
    return await this.model
      .findByIdAndUpdate(
        id,
        {
          $set: {
            estado: nuevoEstado,
          },
        },
        { new: true },
      )
      .lean();
  }

  async obtenerEstadisticas() {
    return await this.model.aggregate([
      {
        $group: {
          _id: "$proyecto",
          cantidadPostulaciones: { $sum: 1 },
          cantidadPostulacionesAceptadas: {
            $sum: { $cond: [{ $eq: ["$estado", EstadoPostulacion.ACEPTADA] }, 1, 0] },
          },
          cantidadPostulacionesPendientes: {
            $sum: { $cond: [{ $eq: ["$estado", EstadoPostulacion.PENDIENTE] }, 1, 0] },
          },
          cantidadPostulacionesRechazadas: {
            $sum: { $cond: [{ $eq: ["$estado", EstadoPostulacion.RECHAZADA] }, 1, 0] },
          },
        },
      },
      { $sort: { cantidadPostulaciones: -1 } },
      { $lookup: { from: "proyectos", localField: "_id", foreignField: "_id", as: "proyecto" } },
      { $unwind: "$proyecto" },
      {
        $project: {
          _id: 0,
          proyecto: "$proyecto.titulo",
          cantidadPostulaciones: 1,
          cantidadPostulacionesAceptadas: 1,
          cantidadPostulacionesPendientes: 1,
          cantidadPostulacionesRechazadas: 1,
        },
      },
    ]);
  }
}
