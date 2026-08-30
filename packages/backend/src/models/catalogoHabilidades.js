class CatalogoHabilidades {
    constructor() {
        this.habilidades = [];
    }   

    agregarHabilidad(habilidad) {
        if (!habilidad instanceof Habilidad) {
            throw new Error("La habilidad debe ser una instancia de la clase Habilidad");
        }
        this.habilidades.push(habilidad);
    }  

}