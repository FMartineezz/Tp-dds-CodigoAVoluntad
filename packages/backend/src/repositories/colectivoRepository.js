import { Colectivo } from "../models/colectivo.js";

class ColectivoRepository {
    constructor(){
        this.colectivos = [];
        this.id = 1;
    }
    
    crearColectivo(nombre, descripcion, ubicacion, tipoDeColectivo, proyectos) {
        const colectivo = new Colectivo(this.id, nombre, descripcion, ubicacion, tipoDeColectivo, proyectos);
        this.id++;
        this.colectivos.push(colectivo);
        return colectivo;
    }

    obtenerColectivos(){
        return this.colectivos;
    }

    obtenerColectivoPorId(id){
        return this.colectivos.find(c => c.id == id) ?? null;
    }
}

export default ColectivoRepository

