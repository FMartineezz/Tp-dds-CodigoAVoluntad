//el id conviene que lo tenga el repo
class Habilidad {
    static #contadorid = 0; 
    constructor(titulo, descripcion) {
        this.id = Habilidad.#contadorid++;
        this.titulo = titulo;
        this.codigo = this.normalizarTitulo(titulo);
        this.descripcion = descripcion;
    }

    normalizarTitulo(titulo){
        titulo = titulo.trim().toLowerCase();
        const palabras = [];
        let palabraActual = "";
        for(let i = 0 ; i < titulo.length ; i++){
            if(titulo[i] === " " || titulo[i] === "," || titulo[i] === "-" || titulo[i] === "."){
                if(palabraActual != ""){
                palabras.push(palabraActual);
                palabraActual = "";
                }
            }
            else{
                palabraActual += titulo[i];
            }
        }
        if(palabraActual != ""){
            palabras.push(palabraActual);
        }
    return palabras.join('_');
    }    
}

export default Habilidad;