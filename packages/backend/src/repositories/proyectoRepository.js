import { trusted } from "mongoose";
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
}

/*   constructor() {
    this.proyectos = [];
    this.id = 1;
    this.perfilId = 1;
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

  obtenerPorAlgunaHabilidad(codigosDeHabilidad) {
    return this.proyectos.filter(
      (proyecto) =>
        !proyecto.finalizado &&
        proyecto.perfiles.some((perfil) =>
          perfil.habilidadesRequeridas.some((habilidad) =>
            codigosDeHabilidad.includes(habilidad.codigo),
          ),
        ),
    );
  }
  } */
