import { ColectivoModel } from "../schemas/colectivoSchema.js";
import { paginar } from "./paginar.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").ColectivoGuardado} ColectivoGuardado */
/** @typedef {import("../types.js").DenunciaGuardada} DenunciaGuardada */
/** @typedef {import("../models/colectivo.js").Colectivo} Colectivo */
/** @typedef {import("../models/denuncia.js").Denuncia} Denuncia */
/** @typedef {typeof import("../models/denuncia.js").EstadoDenuncia[keyof typeof import("../models/denuncia.js").EstadoDenuncia]} EstadoDenunciaValor */

/**
 * Denuncia junto con los datos del colectivo denunciado.
 * @typedef {DenunciaGuardada & { colectivoId: import("mongoose").Types.ObjectId, colectivoNombre: string }} DenunciaConColectivo
 */

/** Acceso a la colección de colectivos (y sus denuncias, que viven embebidas). */
export class ColectivoRepository {
  constructor() {
    this.model = ColectivoModel;
  }

  /**
   * Guarda un colectivo nuevo.
   * @param {Colectivo} colectivo
   * @returns {Promise<import("mongoose").Document & ColectivoGuardado>} El documento de mongoose (sin lean).
   */
  async guardar(colectivo) {
    const nuevoColectivo = new this.model(colectivo);
    return await nuevoColectivo.save();
  }

  /**
   * Colectivos activos.
   * @returns {Promise<ColectivoGuardado[]>}
   */
  async obtenerTodos() {
    return await this.model.find({ activo: true }).lean();
  }

  /**
   * Una página de colectivos activos.
   * @param {import("../types.js").Paginacion} paginacion
   * @returns {Promise<import("../types.js").Pagina<ColectivoGuardado>>}
   */
  async obtenerPagina(paginacion) {
    return await paginar(this.model, { activo: true }, paginacion);
  }

  /**
   * Todos los colectivos, también los dados de baja.
   * @returns {Promise<ColectivoGuardado[]>}
   */
  async obtenerTodosConEliminados() {
    return await this.model.find().lean();
  }

  /**
   * Busca un colectivo por id (sin el campo `activo`).
   * @param {Id} id
   * @returns {Promise<ColectivoGuardado | null>}
   */
  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  async obtenerPorKeycloack(id) {
    return await this.model.findOne({ keycloackId: id }).lean();
  }

  // Igual que obtenerPorId pero trae `activo` (que por defecto no se lee: select false)
  /**
   * @param {Id} id
   * @returns {Promise<ColectivoGuardado | null>}
   */
  async obtenerPorIdConEstado(id) {
    return await this.model.findById(id).select("+activo").lean();
  }

  /**
   * Busca un colectivo por nombre exacto.
   * @param {string} nombre
   * @returns {Promise<ColectivoGuardado | null>}
   */
  async obtenerPorNombre(nombre) {
    return await this.model.findOne({ nombre }).lean();
  }

  /**
   * Agrega un proyecto a la lista del colectivo.
   * @param {Id} colectivoId
   * @param {Id} proyecto Id del proyecto.
   * @returns {Promise<(import("mongoose").Document & ColectivoGuardado) | null>} El documento
   *   ANTES del cambio (sin `new: true` ni lean), o null si no existe.
   */
  async agregarProyecto(colectivoId, proyecto) {
    return await this.model.findByIdAndUpdate(colectivoId, {
      $push: {
        proyectos: proyecto,
      },
    });
  }

  /**
   * Da de baja (lógica) un colectivo.
   * @param {Id} id
   * @returns {Promise<(import("mongoose").Document & ColectivoGuardado) | null>} El documento
   *   ANTES del cambio (sin `new: true` ni lean), o null si no existe.
   */
  async eliminarColectivo(id) {
    return await this.model.findByIdAndUpdate(id, {
      activo: false,
    });
  }

  /**
   * Actualiza campos de un colectivo (corre las validaciones del schema).
   * @param {Id} id
   * @param {Partial<Colectivo>} cambios
   * @returns {Promise<ColectivoGuardado | null>} El colectivo actualizado, o null si no existe.
   */
  async actualizar(id, cambios) {
    return await this.model
      .findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true })
      .lean();
  }

  /**
   * Agrega una denuncia al colectivo.
   * @param {Id} colectivoId
   * @param {Denuncia} denuncia
   * @returns {Promise<DenunciaGuardada | null>} La denuncia guardada (subdocumento de mongoose),
   *   o null si el colectivo no existe.
   */
  async guardarDenuncia(colectivoId, denuncia) {
    const colectivo = await this.model.findById(colectivoId).select("+denuncias");
    if (!colectivo) return null;
    colectivo.denuncias.push(denuncia);
    await colectivo.save();
    return colectivo.denuncias[colectivo.denuncias.length - 1];
  }

  /**
   * Indica si ya hay una denuncia hecha a partir de esa colaboración.
   * @param {Id} colaboracionId
   * @returns {Promise<boolean>}
   */
  async existeDenunciaParaColaboracion(colaboracionId) {
    const count = await this.model.countDocuments({
      "denuncias.colaboracionId": colaboracionId,
    });
    return count > 0;
  }

  /**
   * Todas las denuncias de todos los colectivos, opcionalmente filtradas por estado.
   * @param {{ estado?: EstadoDenunciaValor }} [filtro]
   * @returns {Promise<DenunciaConColectivo[]>}
   */
  async obtenerTodasLasDenuncias(filtro = {}) {
    /** @type {import("mongoose").PipelineStage[]} */
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

  /**
   * Busca una denuncia por id, con los datos de su colectivo.
   * @param {Id} denunciaId
   * @returns {Promise<DenunciaConColectivo | null>}
   */
  async obtenerDenunciaPorId(denunciaId) {
    const colectivo = await this.model
      .findOne({ "denuncias._id": denunciaId }, { "denuncias.$": 1, nombre: 1, _id: 1 })
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

  /**
   * Cambia el estado de una denuncia.
   * @param {Id} denunciaId
   * @param {EstadoDenunciaValor} nuevoEstado
   * @returns {Promise<DenunciaConColectivo | null>} La denuncia actualizada, o null si no existe.
   */
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

    const denuncia = colectivo.denuncias?.find((d) => String(d._id) === String(denunciaId));
    if (!denuncia) return null;

    return {
      ...denuncia,
      colectivoId: colectivo._id,
      colectivoNombre: colectivo.nombre,
    };
  }

  //Estadisticas
  /**
   * Cantidad de colectivos activos por ubicación, de mayor a menor.
   * @returns {Promise<Array<{ ubicacion: string | null, cantidad: number }>>}
   */
  async contarPorUbicacion() {
    return await this.model.aggregate([
      // Los colectivos dados de baja no cuentan (igual que en GET /colectivos)
      { $match: { activo: true } },
      { $group: { _id: "$ubicacion", cantidad: { $sum: 1 } } },
      { $sort: { cantidad: -1 } },
      { $project: { _id: 0, ubicacion: "$_id", cantidad: 1 } },
    ]);
  }
}
