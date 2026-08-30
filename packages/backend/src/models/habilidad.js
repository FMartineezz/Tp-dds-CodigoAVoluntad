
class Habilidad {
    constructor(titulo, descripcion) {
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
