import Colectivo from "../entities/colectivo.js";

class ColectivoRepository {
    constructor(){
        this.colectivos = [];
    }
    
    crearColectivo(nombre, descripcion, ubcacion, tipoDeColectivo, proyectos) {
        const colectivo = new Colectivo(nombre, descripcion, ubcacion, tipoDeColectivo, proyectos);
        this.colectivos.push(colectivo);
        return colectivo;
    }

    obtenerColectivos(){
        return this.colectivos;
    }

    obtenerColectivoPorId(id){
        const colectivo = this.colectivos.find( c => {c.id == id})
        if (colectivo == undefined) {
            return null;       
        }
        return colectivo
    }
}

export default ColectivoRepository

