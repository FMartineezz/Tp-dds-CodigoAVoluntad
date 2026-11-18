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

  async obtenerPorIdParaAdmin(id) {
    return await this.model
      .findById(id)
      .populate({ path: "personaColaboradora", select: "+contactos" });
  }

  async obtenerPorIdCompleto(id) {
    return await this.model
      .findById(id)
      .populate("personaColaboradora")
      .populate("proyecto")
      .lean();
  }

  // Todas las colaboraciones de una persona (activas y dadas de baja, también las anónimas:
  // es su propio historial), con el proyecto y el nombre del colectivo
  async obtenerDePersona(personaId) {
    return await this.model
      .find({ personaColaboradora: personaId })
      .sort({ _id: -1 })
      .populate({
        path: "proyecto",
        select: "titulo colectivo finalizado busquedaCerrada logros perfiles",
        populate: { path: "colectivo", select: "nombre" },
      })
      .lean();
  }

  // El equipo de un proyecto (activas y dadas de baja). En las anónimas no se muestra la persona.
  async obtenerDeProyecto(proyectoId) {
    return await this.model
      .find(
        { proyecto: proyectoId },
        {
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
        },
      )
      .sort({ _id: -1 })
      .populate({ path: "personaColaboradora", select: "nombreFantasia habilidades presentacion" })
      .lean();
  }

  async obtenerPorPersonaColaboradoraId(personaColaboradoraId) {
    return await this.model.find({ personaColaboradora: personaColaboradoraId }).lean();
  }

  async obtenerPorProyectoIds(proyectoIds) {
    return await this.model.find({ proyecto: { $in: proyectoIds } }).lean();
  }

  async contarActivasPorPerfil(proyectoId, perfilId) {
    return await this.model.countDocuments({
      proyecto: proyectoId,
      perfil: perfilId,
      activo: true,
    });
  }

  async desactivar(id, bajaPor) {
    return await this.model.findByIdAndUpdate(
      id,
      {
        activo: false,
        fechaBaja: new Date(),
        ...(bajaPor && { bajaPor }),
      },
      { new: true },
    );
  }

  //Estadisticas
  async contarTotalYAnonimas() {
    return await this.model.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          anonimas: { $sum: { $cond: ["$anonima", 1, 0] } },
        },
      },
      { $project: { _id: 0, total: 1, anonimas: 1 } },
    ]);
  }
}
