class Habilidad {
    static #contadorid = 0; 
    constructor(titulo, descripcion) {
        this.id = Habilidad.#contadorid++;
        this.titulo = titulo;
        this.codigo = this.normalizarTitulo(titulo);
        this.descripcion = descripcion;
    }

    normalizarTitulo(titulo){
        return titulo
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") //quita tildes
        .replace(/\W+/g, " ")                             //quita caracteres especiales
        .trim()                                           
        .split(/ |\B(?=[A-Z])/)                           
        .map(word => word.toLowerCase())                  
        .join('_');
    }

}

export default Habilidad;