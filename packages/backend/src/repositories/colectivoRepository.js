import { Colectivo } from "../models/colectivo.js";

class ColectivoRepository {
    constructor(){
        this.colectivos = [];
        this.id = 1;
    }
    
   // crearColectivo(nombre, descripcion, ubicacion, tipoDeColectivo, proyectos) {
     //   const colectivo = new Colectivo(this.id, nombre, descripcion, ubicacion, tipoDeColectivo, proyectos);
     //   this.id++;
     //   this.colectivos.push(colectivo);
     //   return colectivo;
   // }

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

