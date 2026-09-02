//los enum en un archivo aparte?
const TipoCompromiso = Object.freeze({
  TOTAL: "total",
  SEMANAL: "semanal",
  MENSUAL: "mensual"
});

const ModalidadColaboracion = Object.freeze({
  GRATUITA: "gratuita",
  INCENTIVO_ECONOMICO: "incentivo_economico",
  CONTRATACION_EVENTUAL: "contratacion_eventual"
});

class Proyecto{
    constructor(titulo, descripcion, habilidadesRequeridas, horas, tipoDeCompromiso, modalidadDeColaboracion, colectivo){
        this.titulo = titulo;
        this.descripcion = descripcion;
        if (!Array.isArray(habilidadesRequeridas)) {
            throw new Error("habilidadesRequeridas debe ser un array");
        }
        this.habilidadesRequeridas = habilidadesRequeridas;
        //Separo el campo compromiso esperado en dos campos: horas y tipo de horas
        this.horas = horas;
        this.tipoDeCompromiso = tipoDeCompromiso; // puede ser "semanales","mensuales" o "totales" 
        this.modalidadDeColaboracion = modalidadDeColaboracion;
        this.colectivo = colectivo;
        this.finalizado = false;
    }

}

export default {TipoCompromiso, ModalidadColaboracion, Proyecto};