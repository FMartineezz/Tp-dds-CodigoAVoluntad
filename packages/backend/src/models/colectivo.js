const UBICACION_VALIDA = new Set["argentina", "caba", "buenos aires", "catamarca", "chaco", "chubut", "cordoba", "corrientes", "entre rios", "formosa", 
                            "jujuy", "la pampa", "la rioja", "mendoza", "misiones", "neuquen", "rio negro", "salta", "san juan", 
                            "san luis", "santa cruz", "santa fe", "santiago del estero", "tierra del fuego", "tucuman"];

const TIPOS_COLECTIVO = Object.freeze({
                                       FUNDACION : "fundacion",                                   
                                       ONG : "ong",
                                       ASOCIACION_BARRIAL : "asociacion barrial",
                                       ASAMBLEAS : "asambleas"
                                    })

class Colectivo{
    constructor(nombre, descripcion, ubicacion = null, tipoDeColectivo){
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.ubicacion = ubicacion;
        this.tipoDeColectivo = tipoDeColectivo;
        this.proyectos = [];
    }

    cargarProyecto(proyecto){
        if (!proyecto instanceof Proyecto ){
            throw new Error ("El proyecto debe ser una instancia de la clase Proyecto");
        }
        proyecto.colectivo = this;
        this.proyectos.push(proyecto);
    }

}

module.exports = {UBICACION_VALIDA, 
                  TIPOS_COLECTIVO, 
                  Colectivo 
                };

