class ProyectoRepository {
    constructor() {
        this.proyectos = []; 
    }

    guardar(proyecto) {
        this.proyectos.push(proyecto);
        return proyecto;
    }

    obtenerTodos() {
        return this.proyectos;
    }

    obtenerPorId(id) {
        return this.proyectos.find(
            proyecto => proyecto.id === id
        );
    }

    obtenerPorTituloYColectivo(titulo, colectivo){
        return this.proyectos.find(proyecto => proyecto.titulo === titulo && proyecto.colectivo === colectivo);
    }
}

export default new ProyectoRepository();