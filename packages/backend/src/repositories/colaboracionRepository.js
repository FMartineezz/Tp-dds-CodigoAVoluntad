class ColaboracionRepository {
    constructor() {
        this.colaboraciones = [];
        this.id = 1;
    }

    guardar(colaboracion) {
        colaboracion.id = this.id;
        this.id++;

        this.colaboraciones.push(colaboracion);

        return colaboracion;
    }

    obtenerTodas() {
        return this.colaboraciones;
    }

    obtenerPorId(id) {
        return this.colaboraciones.find(colaboracion => colaboracion.id === id);
    }
}

export default new ColaboracionRepository();