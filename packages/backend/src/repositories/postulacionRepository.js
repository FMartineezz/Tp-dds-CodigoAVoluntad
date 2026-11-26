import { PostulacionModel } from "../schemas/postulacionSchema.js";
import { EstadoPostulacion } from "../models/postulacion.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").PostulacionGuardada} PostulacionGuardada */
/** @typedef {import("../models/postulacion.js").Postulacion} Postulacion */
/** @typedef {typeof EstadoPostulacion[keyof typeof EstadoPostulacion]} EstadoPostulacionValor */

/**
 * Proyecto poblado en una postulación (solo título y perfiles).
 * @typedef {Pick<import("../types.js").ProyectoGuardado, "_id" | "titulo"> & {
 *   perfiles: import("../types.js").PerfilGuardado[],
 * }} ProyectoDePostulacion
 */

/**
 * Persona poblada en una postulación (sin datos de contacto), con sus habilidades pobladas.
 * @typedef {Pick<import("../types.js").PersonaColaboradoraGuardada, "_id" | "nombreFantasia" | "presentacion"> & {
 *   habilidades: Array<Pick<import("../types.js").HabilidadGuardada, "_id" | "titulo" | "codigo">>,
 * }} PersonaDePostulacion
 */

/** Acceso a la colección de postulaciones. */
export class PostulacionRepository {
  constructor() {
    this.model = PostulacionModel;
  }

  /**
   * Guarda una postulación nueva.
   * @param {Postulacion} postulacion
   * @returns {Promise<import("mongoose").Document & PostulacionGuardada>} El documento de mongoose (sin lean).
   */
  async guardar(postulacion) {
    const nuevaPostulacion = new this.model(postulacion);
    return await nuevaPostulacion.save();
  }

  /**
   * Busca una postulación por id.
   * @param {Id} id
   * @returns {Promise<PostulacionGuardada | null>}
   */
  async obtenerPostulacionPorId(id) {
    return await this.model.findById(id).lean();
  }

  // Postulación vigente (pendiente o aceptada) de la persona a ese perfil, o null.
  // Usa findOne y no exists(): exists() devuelve solo el _id, y el service necesita el estado
  // para decidir si es un duplicado. Las rechazadas no cuentan: se puede volver a postular.
  /**
   * @param {Id} personaId
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @returns {Promise<{ _id: import("mongoose").Types.ObjectId, estado: EstadoPostulacionValor } | null>}
   *   Solo `_id` y `estado`.
   */
  async obtenerPorPersonaProyectoPerfil(personaId, proyectoId, perfilId) {
    return await this.model
      .findOne({
        personaColaboradora: personaId,
        proyecto: proyectoId,
        perfil: perfilId,
        estado: { $in: [EstadoPostulacion.PENDIENTE, EstadoPostulacion.ACEPTADA] },
      })
      .select("estado")
      .lean();
  }

  /**
   * Postulaciones de una persona, con título y perfiles del proyecto poblados.
   * @param {Id} personaId
   * @returns {Promise<Array<PostulacionGuardada & { proyecto: ProyectoDePostulacion, perfil: Id }>>}
   */
  async obtenerPorPersona(personaId) {
    return await this.model
      .find({ personaColaboradora: personaId })
      .populate("proyecto")
      .populate("perfil")
      .lean();
  }

  /**
   * Postulaciones recibidas por un colectivo, opcionalmente filtradas por estado, con la persona
   * (y sus habilidades) y el proyecto poblados.
   * @param {Id} colectivoId
   * @param {EstadoPostulacionValor} [estado]
   * @returns {Promise<Array<PostulacionGuardada & {
   *   personaColaboradora: PersonaDePostulacion,
   *   proyecto: ProyectoDePostulacion,
   *   perfil: Id,
   * }>>}
   */
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

  /**
   * Cambia el estado de una postulación y registra la fecha de resolución.
   * @param {Id} id
   * @param {EstadoPostulacionValor} nuevoEstado
   * @returns {Promise<PostulacionGuardada | null>} La postulación actualizada, o null si no existe.
   */
  async actualizarPostulacion(id, nuevoEstado) {
    return await this.model
      .findByIdAndUpdate(
        id,
        {
          $set: {
            estado: nuevoEstado,
            fechaResolucion: new Date(),
          },
        },
        { new: true },
      )
      .lean();
  }

  /**
   * Rechaza todas las postulaciones pendientes de esos proyectos.
   * @param {Id[]} proyectoIds
   * @returns {Promise<void>}
   */
  async rechazarPendientesPorProyectos(proyectoIds) {
    if (!proyectoIds || proyectoIds.length === 0) return;

    await this.model.updateMany(
      {
        proyecto: { $in: proyectoIds },
        estado: EstadoPostulacion.PENDIENTE,
      },
      {
        $set: {
          estado: EstadoPostulacion.RECHAZADA,
          fechaResolucion: new Date(),
        },
      },
    );
  }

  /**
   * Cantidad de postulaciones por proyecto (total y por estado), de mayor a menor.
   * @returns {Promise<Array<{ proyecto: string, cantidadPostulaciones: number, cantidadPostulacionesAceptadas: number, cantidadPostulacionesPendientes: number, cantidadPostulacionesRechazadas: number }>>}
   *   `proyecto` es el título.
   */
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
