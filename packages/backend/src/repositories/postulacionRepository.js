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
}
