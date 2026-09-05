export class HabilidadRespository{
    constructor(){
         this.habilidades = [];
    }

    agregarHabilidad(habilidad){
        this.habilidades.push(habilidad);
    }

    obtenerHabilidades(){
        return this.habilidades;
    }

    obtenerHabilidadPorId(id){
        for(const habilidad of this.habilidades){
                if(habilidad.id === id ){
                    return habilidad;
                }
            }
        return null;
    }

}