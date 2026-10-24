import { ColaboracionModel } from "../schemas/colaboracionSchema.js";
import { EstadoColaboracion } from "../models/colaboracion.js";

export class ColaboracionRepository {
  constructor() {
    this.model = ColaboracionModel;
  }

  async guardar(colaboracion) {
    const nuevaColaboracion = new this.model(colaboracion);
    return await nuevaColaboracion.save();
  }

  async obtenerTodas() {
    return await this.model.find().populate("personaColaboradora").populate("proyecto").lean();
  }

  async obtenerPorId(id) {
    return await this.model
      .findById(id)
      .populate("personaColaboradora")
      .populate("proyecto")
      .lean();
  }

  async contarActivasPorPerfil(proyectoId, perfilId) {
    return await this.model.countDocuments({
      proyecto: proyectoId,
      perfil: perfilId,
      estado: EstadoColaboracion.ACTIVA,
    });
  }

  async desactivar(id) {
  return await this.model.findByIdAndUpdate(
    id,
    {
      estado: EstadoColaboracion.BAJA,
      fechaBaja: new Date(),
      //bajaPor: OrigenBaja.ADMIN, // resolver cuando se implemente la autenticación y autorización para obtener el usuario que realiza la baja
    },
    { new: true }
  );
  }
}