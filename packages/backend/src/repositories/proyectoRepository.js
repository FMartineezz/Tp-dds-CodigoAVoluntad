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

  //TODO
  async obtenerPorTituloYColectivo(titulo) {
    return await this.model.findOne({ titulo });
  }

  async guardarPerfil(proyectoId, perfil) {
    return await this.model.findByIdAndUpdate(proyectoId, {
      $push: {
        perfiles: perfil,
      },
    });
  }

  async obtenerPerfilPorId(proyectoId, perfilId) {
    const proyecto = await this.obtenerPorId(proyectoId);

    return proyecto?.perfiles.find((perfil) => perfil._id.toString() === perfilId.toString());
  }

  async finalizarProyecto(id) {
    await this.model.findByIdAndUpdate(
      id,
      {
        $set: {
          finalizado: true,
        },
      },
      { new: true },
    );
  }

  async obtenerPorAlgunaHabilidad(idsHabilidad) {
    return await this.model
      .find({
        finalizado: { $ne: true },
        "perfiles.habilidadesRequeridas": { $in: idsHabilidad },
      })
      .lean();
  }

  /* guardarLogro(proyectoId, logro) {
    const proyecto = this.obtenerPorId(proyectoId);

    if (!proyecto) {
      return null;
    }

    logro.id = this.logroId++;
    proyecto.logros.push(logro);

    return logro;
  } ADAPTAR TODO AL SIGUIENTE FORMATO ↓ */

  async guardarLogro(proyectoId, logro) {
    const proyecto = await this.model
      .findByIdAndUpdate(
        proyectoId,
        {
          $push: {
            logros: logro,
          },
        },
        { new: true },
      )
      .lean();

    return proyecto?.logros.at(-1);
  } // TODO: pasar todos los siguientes a este formato

  obtenerLogros(proyectoId) {
    const proyecto = this.obtenerPorId(proyectoId);

    if (!proyecto) {
      return null;
    }

    return proyecto.logros;
  }

  obtenerLogroPorId(proyectoId, logroId) {
    const proyecto = this.obtenerPorId(proyectoId);

    if (!proyecto) {
      return null;
    }

    return proyecto.logros.find((l) => l.id === logroId) ?? null;
  }

  actualizarLogro(proyectoId, logroId, cambios) {
    const logro = this.obtenerLogroPorId(proyectoId, logroId);

    if (!logro) {
      return null;
    }

    Object.assign(logro, cambios);
    return logro;
  }

  eliminarLogro(proyectoId, logroId) {
    const proyecto = this.obtenerPorId(proyectoId);

    if (!proyecto) {
      return null;
    }

    const logro = this.obtenerLogroPorId(proyectoId, logroId);

    if (!logro) {
      return null;
    }

    proyecto.logros = proyecto.logros.filter((l) => l.id !== logroId);

    return logro;
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
}
