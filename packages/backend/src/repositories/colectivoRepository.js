import { Colectivo } from "../models/colectivo.js";

class ColectivoRepository {
    constructor(){
        this.colectivos = [];
        this.id = 1;
    }
    
    agregarColectivo(colectivo){
        colectivo.id = this.id;
        this.id++;
        this.colectivos.push(colectivo);
    }

    obtenerColectivos(){
        return this.colectivos;
    }

    obtenerColectivoPorId(id){
        return this.colectivos.find(c => c.id === id) ?? null;
    }

    obtenerColectivoPorNombre(nombre){
        return this.colectivos.find((colectivo) => colectivo.nombre === nombre) || null;
    }
}

export default new ColectivoRepository();

