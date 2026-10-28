import { ColaboracionModel } from "../schemas/colaboracionSchema.js";

export class ColaboracionRepository {
  constructor() {
    this.model = ColaboracionModel;
  }

  async guardar(colaboracion) {
    const nuevaColaboracion = new this.model(colaboracion);
    return await nuevaColaboracion.save();
  }

  async obtenerTodas() {
    return await this.model
      .find(
        { activo: true },
        {
          _id: 1,
          personaColaboradora: {
            $cond: { if: "$anonima", then: null, else: "$personaColaboradora" },
          },
          proyecto: 1,
          perfil: 1,
          anonima: 1,
          activo: 1,
        },
      )
      .populate("personaColaboradora")
      .populate("proyecto")
      .lean();
  }

  async obtenerPorId(id) {
    return await this.model
      .findById(id, {
        _id: 1,
        personaColaboradora: {
          $cond: { if: "$anonima", then: null, else: "$personaColaboradora" },
        },
        proyecto: 1,
        perfil: 1,
        anonima: 1,
        activo: 1,
        fechaBaja: 1,
        bajaPor: 1,
      })
      .populate("personaColaboradora")
      .populate("proyecto")
      .lean();
  }

  async contarActivasPorPerfil(proyectoId, perfilId) {
    return await this.model.countDocuments({
      proyecto: proyectoId,
      perfil: perfilId,
      activo: true,
    });
  }

  async desactivar(id) {
    return await this.model.findByIdAndUpdate(
      id,
      {
        activo: false,
        fechaBaja: new Date(),
        //bajaPor: OrigenBaja.ADMIN, // resolver cuando se implemente la autenticación y autorización para obtener el usuario que realiza la baja
      },
      { new: true },
    );
  }
}
