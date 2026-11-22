import { ProyectoModel } from "../schemas/proyectoSchema.js";
import { paginar } from "./paginar.js";

/** @typedef {import("../types.js").Id} Id */
/** @typedef {import("../types.js").ProyectoGuardado} ProyectoGuardado */
/** @typedef {import("../types.js").PerfilGuardado} PerfilGuardado */
/** @typedef {import("../types.js").LogroGuardado} LogroGuardado */
/** @typedef {import("../models/proyecto.js").Proyecto} Proyecto */
/** @typedef {import("../models/perfil.js").Perfil} Perfil */
/** @typedef {import("../models/logro.js").Logro} Logro */
/** @typedef {import("../types.js").Paginacion} Paginacion */
/** @typedef {import("../types.js").Pagina<ProyectoGuardado>} PaginaDeProyectos */

/** Acceso a la colección de proyectos (y sus perfiles y logros, que viven embebidos). */
export class ProyectoRepository {
  constructor() {
    this.model = ProyectoModel;
  }

  /**
   * Guarda un proyecto nuevo.
   * @param {Proyecto} proyecto
   * @returns {Promise<import("mongoose").Document & ProyectoGuardado>} El documento de mongoose (sin lean).
   */
  async guardar(proyecto) {
    const nuevoProyecto = new this.model(proyecto);
    return await nuevoProyecto.save();
  }

  /**
   * Todos los proyectos.
   * @returns {Promise<ProyectoGuardado[]>}
   */
  async obtenerTodos() {
    return await this.model.find().lean();
  }

  // El listado trae el nombre del colectivo, para mostrarlo sin un pedido extra por proyecto
  /**
   * @param {Paginacion} paginacion
   * @returns {Promise<PaginaDeProyectos>} Con `colectivo` poblado (solo `nombre`).
   */
  async obtenerPagina(paginacion) {
    return await paginar(this.model, {}, paginacion, {
      populate: { path: "colectivo", select: "nombre" },
    });
  }

  // Proyectos publicados por un colectivo (todos sus estados), del más nuevo al más viejo
  /**
   * @param {Id} colectivoId
   * @param {Paginacion} paginacion
   * @returns {Promise<PaginaDeProyectos>} Con `colectivo` poblado (solo `nombre`).
   */
  async obtenerPaginaDeColectivo(colectivoId, paginacion) {
    return await paginar(this.model, { colectivo: colectivoId }, paginacion, {
      populate: { path: "colectivo", select: "nombre" },
    });
  }

  /**
   * Busca un proyecto por id.
   * @param {Id} id
   * @returns {Promise<ProyectoGuardado | null>}
   */
  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  /**
   * Busca un proyecto de un colectivo por título exacto.
   * @param {string} titulo
   * @param {Id} colectivoId
   * @returns {Promise<ProyectoGuardado | null>}
   */
  async obtenerPorTituloYColectivo(titulo, colectivoId) {
    return await this.model
      .findOne({
        titulo,
        colectivo: colectivoId,
      })
      .lean();
  }

  /**
   * Agrega un perfil al proyecto.
   * @param {Id} proyectoId
   * @param {Perfil} perfil
   * @returns {Promise<PerfilGuardado | null>} El perfil guardado (subdocumento de mongoose), o
   *   null si el proyecto no existe.
   */
  async guardarPerfil(proyectoId, perfil) {
    const proyecto = await this.model.findById(proyectoId);

    if (!proyecto) return null;

    proyecto.perfiles.push(perfil);
    await proyecto.save();

    return proyecto.perfiles[proyecto.perfiles.length - 1];
  }

  /**
   * Busca un perfil dentro de un proyecto.
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @returns {Promise<PerfilGuardado | null>} null si no existe el proyecto o el perfil.
   */
  async obtenerPerfilPorId(proyectoId, perfilId) {
    const proyecto = await this.obtenerPorId(proyectoId);

    if (!proyecto) return null;

    return proyecto.perfiles.find((perfil) => String(perfil._id) === String(perfilId)) ?? null;
  }

  /**
   * Actualiza los campos permitidos de un perfil; si no hay ninguno, lo devuelve sin cambios.
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @param {Partial<Perfil>} cambios
   * @returns {Promise<PerfilGuardado | null>} El perfil actualizado, o null si no existe.
   */
  async actualizarPerfil(proyectoId, perfilId, cambios) {
    const actualizaciones = {};
    const camposPermitidos = [
      "descripcion",
      "habilidadesRequeridas",
      "habilidadesOpcionales",
      "horas",
      "tipoDeCompromiso",
      "modalidadDeColaboracion",
      "cantidadMaxima",
    ];

    for (const campo of camposPermitidos) {
      if (cambios[campo] !== undefined) {
        actualizaciones[`perfiles.$.${campo}`] = cambios[campo];
      }
    }

    if (Object.keys(actualizaciones).length === 0) {
      return await this.obtenerPerfilPorId(proyectoId, perfilId);
    }

    const proyecto = await this.model
      .findOneAndUpdate(
        { _id: proyectoId, "perfiles._id": perfilId },
        { $set: actualizaciones },
        { new: true, runValidators: true },
      )
      .lean();

    return proyecto?.perfiles.find((perfil) => String(perfil._id) === String(perfilId)) ?? null;
  }

  /**
   * Quita un perfil del proyecto.
   * @param {Id} proyectoId
   * @param {Id} perfilId
   * @returns {Promise<PerfilGuardado | null>} El perfil eliminado, o null si no existía.
   */
  async eliminarPerfil(proyectoId, perfilId) {
    const perfil = await this.obtenerPerfilPorId(proyectoId, perfilId);

    if (!perfil) return null;

    await this.model.findOneAndUpdate(
      { _id: proyectoId, "perfiles._id": perfilId },
      { $pull: { perfiles: { _id: perfilId } } },
    );

    return perfil;
  }

  /**
   * Actualiza campos de un proyecto (corre las validaciones del schema).
   * @param {Id} id
   * @param {Partial<Proyecto>} cambios
   * @returns {Promise<ProyectoGuardado | null>} El proyecto actualizado, o null si no existe.
   */
  async actualizarProyecto(id, cambios) {
    return await this.model
      .findByIdAndUpdate(id, { $set: cambios }, { new: true, runValidators: true })
      .lean();
  }

  /**
   * Marca un proyecto como finalizado.
   * @param {Id} id
   * @returns {Promise<ProyectoGuardado | null>}
   */
  async finalizarProyecto(id) {
    return await this.actualizarProyecto(id, { finalizado: true });
  }

  /**
   * Proyectos no finalizados que requieren alguna de las habilidades, con el colectivo poblado.
   * @param {Id[]} idsHabilidad
   * @returns {Promise<ProyectoGuardado[]>}
   */
  async obtenerPorAlgunaHabilidad(idsHabilidad) {
    return await this.model
      .find({
        finalizado: { $ne: true },
        "perfiles.habilidadesRequeridas": { $in: idsHabilidad },
      })
      .populate("colectivo")
      .lean();
  }

  /**
   * Una página de proyectos que buscan gente con alguna de las habilidades, con el colectivo poblado.
   * @param {Id[]} idsHabilidad
   * @param {Paginacion} paginacion
   * @returns {Promise<PaginaDeProyectos>}
   */
  async obtenerPaginaPorAlgunaHabilidad(idsHabilidad, paginacion) {
    return await paginar(
      this.model,
      {
        // Solo proyectos que todavía buscan gente: no finalizados, con la búsqueda abierta
        // y sin fecha límite vencida
        finalizado: { $ne: true },
        busquedaCerrada: { $ne: true },
        $or: [{ fechaLimiteBusqueda: null }, { fechaLimiteBusqueda: { $gt: new Date() } }],
        "perfiles.habilidadesRequeridas": { $in: idsHabilidad },
      },
      paginacion,
      { populate: "colectivo" },
    );
  }

  /**
   * Agrega un logro al proyecto.
   * @param {Id} proyectoId
   * @param {Logro} logro
   * @returns {Promise<LogroGuardado | null>} El logro guardado (subdocumento de mongoose), o null
   *   si el proyecto no existe.
   */
  async guardarLogro(proyectoId, logro) {
    const proyecto = await this.model.findById(proyectoId);

    if (!proyecto) {
      return null;
    }

    proyecto.logros.push({
      descripcion: logro.descripcion,
      porcentaje: logro.porcentaje,
      urlCodigoFuente: logro.urlCodigoFuente,
    });

    await proyecto.save();

    return proyecto.logros[proyecto.logros.length - 1];
  }

  /**
   * Los logros de un proyecto.
   * @param {Id} proyectoId
   * @returns {Promise<LogroGuardado[] | null>} null si el proyecto no existe.
   */
  async obtenerLogros(proyectoId) {
    const proyecto = await this.model.findById(proyectoId).select("logros").lean();

    return proyecto?.logros ?? null;
  }

  /**
   * Busca un logro dentro de un proyecto.
   * @param {Id} proyectoId
   * @param {Id} logroId
   * @returns {Promise<LogroGuardado | null>} null si no existe el proyecto o el logro.
   */
  async obtenerLogroPorId(proyectoId, logroId) {
    const proyecto = await this.model.findById(proyectoId).lean();

    if (!proyecto) {
      return null;
    }

    return proyecto.logros.find((l) => l._id.toString() === logroId.toString()) ?? null;
  }

  /**
   * Actualiza descripción, porcentaje y/o URL de un logro; si no hay cambios, lo devuelve igual.
   * @param {Id} proyectoId
   * @param {Id} logroId
   * @param {Partial<Logro>} cambios
   * @returns {Promise<LogroGuardado | null>} El logro actualizado, o null si no existe.
   */
  async actualizarLogro(proyectoId, logroId, cambios) {
    const actualizaciones = {};

    for (const campo of ["descripcion", "porcentaje", "urlCodigoFuente"]) {
      if (cambios[campo] !== undefined) {
        actualizaciones[`logros.$.${campo}`] = cambios[campo];
      }
    }

    if (Object.keys(actualizaciones).length === 0) {
      return await this.obtenerLogroPorId(proyectoId, logroId);
    }

    const proyecto = await this.model
      .findOneAndUpdate(
        { _id: proyectoId, "logros._id": logroId },
        { $set: actualizaciones },
        { new: true, runValidators: true },
      )
      .lean();

    return proyecto?.logros.find((l) => String(l._id) === String(logroId)) ?? null;
  }

  /**
   * Quita un logro del proyecto.
   * @param {Id} proyectoId
   * @param {Id} logroId
   * @returns {Promise<LogroGuardado | null>} El logro eliminado, o null si no existía.
   */
  async eliminarLogro(proyectoId, logroId) {
    const logro = await this.obtenerLogroPorId(proyectoId, logroId);

    if (!logro) {
      return null;
    }

    await this.model.findOneAndUpdate(
      { _id: proyectoId, "logros._id": logroId },
      { $pull: { logros: { _id: logroId } } },
    );

    return logro;
  }

  /**
   * Finaliza los proyectos cuya fecha de cierre ya llegó.
   * @param {Date} fechaActual
   * @returns {Promise<import("mongoose").Types.ObjectId[]>} Los ids de los proyectos que se cerraron.
   */
  async cerrarProyectoSi(fechaActual) {
    const proyectosACerrar = await this.model
      .find(
        {
          finalizado: { $ne: true },
          fechaCierre: { $exists: true, $ne: null, $lte: fechaActual },
        },
        { _id: 1 },
      )
      .lean();

    const ids = proyectosACerrar.map((p) => p._id);

    if (ids.length > 0) {
      await this.model.updateMany({ _id: { $in: ids } }, { $set: { finalizado: true } });
    }

    return ids;
  }

  /**
   * Todos los proyectos de un colectivo.
   * @param {Id} colectivoId
   * @returns {Promise<ProyectoGuardado[]>}
   */
  async obtenerPorColectivoId(colectivoId) {
    return await this.model.find({ colectivo: colectivoId }).lean();
  }

  //Estadisticas
  /**
   * Total de proyectos y cuántos siguen activos (no finalizados).
   * @returns {Promise<Array<{ total: number, activos: number }>>} Un solo elemento, o vacío si no
   *   hay proyectos.
   */
  async contarTotalYActicvos() {
    return await this.model.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          activos: { $sum: { $cond: ["$finalizado", 0, 1] } },
        },
      },
      { $project: { _id: 0, total: 1, activos: 1 } },
    ]);
  }
}

/*   constructor() {
    this.proyectos = [];
    this.id = 1;
    this.perfilId = 1;
    this.logroId=1;
  }

  guardar(proyecto) {
    proyecto.id = this.id;
    this.id++;
    proyecto.perfiles.forEach((perfil) => {
      perfil.id = this.perfilId++;
    });
    this.proyectos.push(proyecto);
    return proyecto;
  }

  obtenerTodos() {
    return this.proyectos;
  }

  obtenerPorId(id) {
    return this.proyectos.find((proyecto) => proyecto.id === id);
  }

  obtenerPorTituloYColectivo(titulo, colectivo) {
    return this.proyectos.find(
      (proyecto) => proyecto.titulo === titulo && proyecto.colectivo.nombre === colectivo,
    );
  }

  guardarPerfil(proyectoId, perfil) {
    const proyecto = this.obtenerPorId(proyectoId);
    if (!proyecto) {
      return null;
    }
    perfil.id = this.perfilId++;
    proyecto.perfiles.push(perfil);
    return perfil;
  }

  obtenerPerfilPorId(proyectoId, perfilId) {
    const proyecto = this.obtenerPorId(proyectoId);
    if (!proyecto) {
      return null;
    }
    return proyecto.perfiles.find((perfil) => perfil.id === perfilId) ?? null;
  }
*/
