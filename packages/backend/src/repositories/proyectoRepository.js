import { ProyectoModel } from "../schemas/proyectoSchema.js";

export class ProyectoRepository {
  constructor() {
    this.model = ProyectoModel;
  }

  async guardar(proyecto) {
    const nuevoProyecto = new this.model(proyecto);
    return await nuevoProyecto.save();
  }

  async obtenerTodos() {
    return await this.model.find().lean();
  }

  async obtenerPorId(id) {
    return await this.model.findById(id).lean();
  }

  async obtenerPorTituloYColectivo(titulo, colectivoId) {
    return await this.model
      .findOne({
        titulo,
        colectivo: colectivoId,
      })
      .lean();
  }

  async guardarPerfil(proyectoId, perfil) {
    const proyecto = await this.model.findById(proyectoId);

    if (!proyecto) return null;

    proyecto.perfiles.push(perfil);
    await proyecto.save();

    return proyecto.perfiles[proyecto.perfiles.length - 1];
  }

  async obtenerPerfilPorId(proyectoId, perfilId) {
    const proyecto = await this.obtenerPorId(proyectoId);

    if (!proyecto) return null;

    return proyecto.perfiles.find((perfil) => String(perfil._id) === String(perfilId)) ?? null;
  }

  async actualizarPerfil(proyectoId, perfilId, cambios) {
    const actualizaciones = {};
    const camposPermitidos = [
      "descripcion",
      "habilidadesRequeridas",
      "habilidadesOpcionales",
      "horas",
      "tipoDeCompromiso",
      "modalidadDeColaboracion",
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

  async eliminarPerfil(proyectoId, perfilId) {
    const perfil = await this.obtenerPerfilPorId(proyectoId, perfilId);

    if (!perfil) return null;

    await this.model.findOneAndUpdate(
      { _id: proyectoId, "perfiles._id": perfilId },
      { $pull: { perfiles: { _id: perfilId } } },
    );

    return perfil;
  }

  async finalizarProyecto(id) {
    return await this.model
      .findByIdAndUpdate(
        id,
        {
          $set: {
            finalizado: true,
          },
        },
        { new: true },
      )
      .lean();
  }

  async obtenerPorAlgunaHabilidad(idsHabilidad) {
    return await this.model
      .find({
        finalizado: { $ne: true },
        "perfiles.habilidadesRequeridas": { $in: idsHabilidad },
      })
      .lean();
  }

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

  async obtenerLogros(proyectoId) {
    const proyecto = await this.model.findById(proyectoId).select("logros").lean();

    return proyecto?.logros ?? null;
  }

  async obtenerLogroPorId(proyectoId, logroId) {
    const proyecto = await this.model.findById(proyectoId).lean();

    if (!proyecto) {
      return null;
    }

    return proyecto.logros.find((l) => l._id.toString() === logroId.toString()) ?? null;
  }

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
  async cerrarProyectoSi(fechaActual) {
    const resultado = await this.model.updateMany(
      {
        finalizado: { $ne: true },
        fechaCierre: { $exists: true, $lte: fechaActual },
      },
      { $set: { finalizado: true } },
    );
    console.log(resultado);
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
