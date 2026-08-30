class PersonaColaboradora {
    constructor(nombreFantasia, git, nombre = null, apellido = null, habilidades=[], presentacion) {
        this.nombreFantasia = nombreFantasia;
        this.git = git;
        this.nombre = nombre;
        this.apellido = apellido;
        this.habilidades = habilidades;
        this.presentacion = presentacion;
    }
} 

module.exports = {PersonaColaboradora};