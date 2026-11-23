import { ColaboracionModel } from "../schemas/colaboracionSchema.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").ColaboracionGuardada} ColaboracionGuardada */
/** @typedef {import("../models/colaboracion.js").Colaboracion} Colaboracion */
/** @typedef {typeof import("../models/colaboracion.js").OrigenBaja[keyof typeof import("../models/colaboracion.js").OrigenBaja]} OrigenBajaValor */

/** Acceso a la colección de colaboraciones (la baja es lógica: activo = false). */
export class ColaboracionRepository {
  constructor() {
    this.model = ColaboracionModel;
  }

  /**
   * Guarda una colaboración nueva.
   * @param {Colaboracion} colaboracion
   * @returns {Promise<import("mongoose").Document & ColaboracionGuardada>} El documento de mongoose (sin lean).
   */
  async guardar(colaboracion) {
    const nuevaColaboracion = new this.model(colaboracion);
    return await nuevaColaboracion.save();
  }

  /**
   * Colaboraciones activas, con persona y proyecto poblados. En las anónimas la persona va null.
   * @returns {Promise<ColaboracionGuardada[]>}
   */
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

  /**
   * Busca una colaboración por id, con persona y proyecto poblados. Si es anónima la persona va null.
   * @param {Id} id
   * @returns {Promise<ColaboracionGuardada | null>}
   */
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

  /**
   * Busca una colaboración por id para el equipo administrativo: muestra la persona aunque sea
   * anónima, con sus contactos.
   * @param {Id} id
   * @returns {Promise<(import("mongoose").Document & ColaboracionGuardada) | null>} Documento de
   *   mongoose (sin lean), o null.
   */
  async obtenerPorIdParaAdmin(id) {
    return await this.model
      .findById(id)
      .populate({ path: "personaColaboradora", select: "+contactos" });
  }

  /**
   * Busca una colaboración por id con persona y proyecto poblados, sin ocultar a la persona.
   * @param {Id} id
   * @returns {Promise<ColaboracionGuardada | null>}
   */
  async obtenerPorIdCompleto(id) {
    return await this.model
      .findById(id)
      .populate("personaColaboradora")
      .populate("proyecto")
      .lean();
  }

  // Todas las colaboraciones de una persona (activas y dadas de baja, también las anónimas:
  // es su propio historial), con el proyecto y el nombre del colectivo
  /**
   * Historial de colaboraciones de una persona, de la más nueva a la más vieja.
   * @param {Id} personaId
   * @returns {Promise<ColaboracionGuardada[]>}
   */
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
  /**
   * Equipo de un proyecto, de la colaboración más nueva a la más vieja.
   * @param {Id} proyectoId
   * @returns {Promise<ColaboracionGuardada[]>}
   */
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

  /**
   * Todas las colaboraciones de una persona (sin poblar ni ocultar nada).
   * @param {Id} personaColaboradoraId
   * @returns {Promise<ColaboracionGuardada[]>}
   */
  async obtenerPorPersonaColaboradoraId(personaColaboradoraId) {
    return await this.model.find({ personaColaboradora: personaColaboradoraId }).lean();
  }

  /**
   * Colaboraciones de varios proyectos.
   * @param {Id[]} proyectoIds
   * @returns {Promise<ColaboracionGuardada[]>}
   */
  async obtenerPorProyectoIds(proyectoIds) {
    return await this.model.find({ proyecto: { $in: proyectoIds } }).lean();
  }

  /**
   * Cuántas colaboraciones activas tiene un perfil de un proyecto (para el cupo).
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @returns {Promise<number>}
   */
  async contarActivasPorPerfil(proyectoId, perfilId) {
    return await this.model.countDocuments({
      proyecto: proyectoId,
      perfil: perfilId,
      activo: true,
    });
  }

  /**
   * Da de baja (lógica) una colaboración.
   * @param {Id} id
   * @param {OrigenBajaValor} [bajaPor] Quién la dio de baja; si no viene, no se guarda.
   * @returns {Promise<(import("mongoose").Document & ColaboracionGuardada) | null>} El documento
   *   actualizado (sin lean), o null si no existe.
   */
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
  /**
   * Total de colaboraciones y cuántas son anónimas.
   * @returns {Promise<Array<{ total: number, anonimas: number }>>} Un solo elemento, o vacío si
   *   no hay colaboraciones.
   */
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
