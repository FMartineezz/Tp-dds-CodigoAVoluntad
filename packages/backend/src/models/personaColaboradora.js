class PersonaColaboradora {
    static #contadorid = 1;
    
    constructor(nombreFantasia, git, nombre = null, apellido = null, habilidades=[], pronombres = null, presentacion= null) {
        this.id = null
        this.nombreFantasia = nombreFantasia;
        this.git = git;
        this.nombre = nombre;
        this.apellido = apellido;
        this.habilidades = habilidades;
        this.pronombres= pronombres;
        this.presentacion = presentacion;
    }
} 

export default {PersonaColaboradora};