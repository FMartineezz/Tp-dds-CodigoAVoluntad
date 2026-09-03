import Habilidad from '../entities/habilidad.js';
//Pasar las validaciones al controller; y usar ===
export class HabilidadRespository{
    constructor(){
         this.habilidades = [];
    }

    agregarHabilidad(habilidad){
        if (!habilidad instanceof Habilidad) {
            throw new Error("La habilidad debe ser una instancia de la clase Habilidad");
        }
        this.habilidades.push(habilidad);
    }

    obtenerHabilidades(){
        return this.habilidades;
    }

    obtenerHabilidadPorId(id){
        if (Number.isNaN(id)) {
            throw new Error("El id debe ser numérico");
        }  
    
    for(const habilidad of this.habilidades){
            if(habilidad.id == id ){
                return habilidad;
            }
        }
    return null;
    }
}