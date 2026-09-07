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
}

export default new ProyectoRepository();