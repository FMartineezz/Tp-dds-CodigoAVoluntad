class ProyectoRepository {
  constructor() {
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
}

export default new ProyectoRepository();
