export class ProyectoRepository {
  constructor() {
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

  guardarLogro(proyectoId, logro) {
    const proyecto = this.obtenerPorId(proyectoId);

    if (!proyecto) {
      return null;
    }

    logro.id = this.logroId++;
    proyecto.logros.push(logro);

    return logro;
  }

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


}
