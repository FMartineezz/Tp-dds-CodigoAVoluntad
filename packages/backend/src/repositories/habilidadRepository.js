export class HabilidadRespository{
    constructor(){
         this.habilidades = [];
    }

    agregarHabilidad(habilidad){
        this.habilidades.push(habilidad);
    }

    findAll(){
        return this.habilidades;
    }

    findById(id){
        for(const habilidad of this.habilidades){
                if(habilidad.id === id ){
                    return habilidad;
                }
            }
        return null;
    }

    buscarPorTituloYDescripcion(titulo, descripcion){
        return this.habilidades.find(
                (habilidad) => habilidad.titulo.trim().toLowerCase() === titulo.trim().toLowerCase() 
                && habilidad.descripcion.trim().toLowerCase() === descripcion.trim().toLowerCase()) || null;
    }

    buscarPorCodigo(codigo){
        return this.habilidades.find((habilidad) => habilidad.codigo === codigo) || null;
    }

}

export default new HabilidadRespository();