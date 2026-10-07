import { ProyectoModel } from "../schemas/proyectoSchema.js";

export class ProyectoRepository {
    constructor(){
      this.model = ProyectoModel
    }
    
    async guardar(proyecto) {
      const nuevoProyecto = new this.model(proyecto);
      return await nuevoProyecto.save();
    }
    
    async obtenerTodos() {
      return await this.model.find();
    }
    
    async obtenerPorId(id) {
      return await this.model.findById(id);
    }


    //TODO
    async obtenerPorTituloYColectivo(titulo) {
      return await this.model.findOne({titulo});
    }

    async guardarPerfil(proyectoId, perfil) {
      return await this.model.findByIdAndUpdate(proyectoId, {
        $push: {
          perfiles: perfil
        }
      });
    }

    async obtenerPerfilPorId(proyectoId, perfilId) {
      const proyecto = await this.model.findById(proyectoId);
      return proyecto.perfiles.id(perfilId);
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
  } */
}
