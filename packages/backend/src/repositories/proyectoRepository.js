class ProyectoRepository {
    constructor() {
        this.proyectos = []; 
        this.id = 1;
    }

    guardar(proyecto) {
        proyecto.id = this.id;
        this.id++;
        this.proyectos.push(proyecto);
        return proyecto;
    }

    obtenerTodos() {
        return this.proyectos;
    }

    obtenerPorId(id) {
        return this.proyectos.find(proyecto => proyecto.id === id);
    }

    obtenerPorTituloYColectivo(titulo, colectivo){
        return this.proyectos.find(proyecto => proyecto.titulo === titulo && proyecto.colectivo === colectivo);
    }
}

export default new ProyectoRepository();