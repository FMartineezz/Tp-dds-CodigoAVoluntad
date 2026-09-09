const ErrorCatalog = Object.freeze({

    // =========================
    // GENERALES
    // =========================

    ARGUMENTO_INVALIDO: {
        code: "ERR-VAL-001",
        message: "El argumento es inválido"
    },

    RECURSO_NO_ENCONTRADO: {
        code: "ERR-CSR-001",
        message: "El recurso solicitado no fue encontrado"
    },

    ERROR_INTERNO: {
        code: "ERR-CSR-500",
        message: "Ocurrió un error interno"
    },


    // =========================
    // PROYECTOS
    // =========================

    PROYECTO_TITULO_REQUERIDO: {
        code: "ERR-VAL-101",
        message: "El título del proyecto es requerido"
    },

    PROYECTO_DESCRIPCION_REQUERIDA: {
        code: "ERR-VAL-102",
        message: "La descripción del proyecto es requerida"
    },

    PROYECTO_HABILIDADES_REQUERIDAS: {
        code: "ERR-VAL-103",
        message: "Las habilidades requeridas son obligatorias"
    },

    PROYECTO_HORAS_REQUERIDAS: {
        code: "ERR-VAL-104",
        message: "Las horas son requeridas"
    },

    PROYECTO_TIPO_COMPROMISO_REQUERIDO: {
        code: "ERR-VAL-105",
        message: "El tipo de compromiso es requerido"
    },

    PROYECTO_MODALIDAD_REQUERIDA: {
        code: "ERR-VAL-106",
        message: "La modalidad de colaboración es requerida"
    },

    PROYECTO_COLECTIVO_REQUERIDO: {
        code: "ERR-VAL-107",
        message: "El colectivo es requerido"
    },

    PROYECTO_NO_ENCONTRADO: {
        code: "ERR-CSR-108",
        message: "El proyecto no fue encontrado"
    },

    PROYECTO_FINALIZADO: {
        code: "ERR-EST-109",
        message: "El proyecto se encuentra finalizado"
    },

    PROYECTO_YA_EXISTENTE: {
        code: "ERR-CSR-110",
        message : "Ya existe un proyecto con ese titulo para ese colectivo"
    },

    PROYECTO_HABILIDADES_REQUERIDAS_FORMATO: {
        code : "ERR-VAL-111",
        message : "Las habilidades requeridas deben ser un array del codigo de la habilidad" 
    },

    PROYECTO_COLECTIVO_FORMATO:{
        code : "ERR-VAL-112",
        message : "El colectivo debe ser el nombre del mismo"
    },

    // =========================
    // HABILIDADES
    // =========================

    HABILIDAD_TITULO_REQUERIDO: {
        code: "ERR-VAL-201",
        message: "El título de la habilidad es requerido"
    },

    HABILIDAD_DESCRIPCION_REQUERIDA: {
        code: "ERR-VAL-202",
        message: "La descripción de la habilidad es requerida"
    },

    HABILIDAD_NO_ENCONTRADA:{
        code: "ERR-CSR-203",
        message:"La habilidad no fue encontrado"
    },

    HABILIDAD_NO_ENCONTRADA_POR_ID: {
        code: "ERR-CSR-204",
        message: (id) => `La habilidad de id ${id} no fue encontrado`
    },

    HABILIDAD_NO_ENCONTRADA_POR_CODIGO: {
        code: "ERR-CSR-205",
        message: (codigo) => `La habilidad de codigo ${codigo} no fue encontrado`
    },

    HABILIDAD_YA_EXISTE: {
    code: "ERR-CSR-206",
    message: (id) => `Ya existe una habilidad con ese título y descripción, y su id es: ${id}`
    },


    // =========================
    // COLECTIVOS
    // =========================

    COLECTIVO_NOMBRE_REQUERIDO: {
        code: "ERR-VAL-301",
        message: "El nombre del colectivo es requerido"
    },

    COLECTIVO_DESCRIPCION_REQUERIDA: {
        code: "ERR-VAL-302",
        message: "La descripción del colectivo es requerida"
    },

    COLECTIVO_UBICACION_INVALIDA: {
        code: "ERR-VAL-303",
        message: "La ubicación del colectivo es inválida"
    },

    COLECTIVO_TIPO_REQUERIDO: {
        code: "ERR-VAL-304",
        message: "El tipo de colectivo es requerido"
    },

    COLECTIVO_NO_ENCONTRADO: {
        code: "ERR-CSR-305",
        message: (id) => `El colectivo de id ${id} no fue encontrado`
    },

    COLECTIVO_NO_ENCONTRADO_POR_NOMBRE: {
        code: "ERR-CSR-306",
        message: (nombre) => `El colectivo de nombre ${nombre} no fue encontrado`
    },

    COLECTIVO_TIPO_INVALIDO:{
        code: "ERR-VAL-307",
        message: "El tipo de colectivo tiene formato invalido, debe ser TipoColectivo"
    },


    // =========================
    // COLABORADORAS
    // =========================

    COLABORADORA_NOMBRE_FANTASIA_REQUERIDO: {
        code: "ERR-VAL-401",
        message: "El nombre de fantasía es requerido"
    },

    COLABORADORA_GIT_REQUERIDO: {
        code: "ERR-VAL-402",
        message: "El Git de la colaboradora es requerido"
    },

    COLABORADORA_HABILIDADES_REQUERIDAS: {
        code: "ERR-VAL-403",
        message: "Las habilidades de la colaboradora son requeridas"
    },

    COLABORADORA_PRESENTACION_REQUERIDA: {
        code: "ERR-VAL-404",
        message: "La presentación de la colaboradora es requerida"
    },

    COLABORADORA_NO_ENCONTRADA: {
        code: "ERR-CSR-405",
        message: "La colaboradora no fue encontrada"
    },


    // =========================
    // COLABORACIONES
    // =========================

    COLABORACION_PERSONA_REQUERIDA: {
        code: "ERR-VAL-501",
        message: "La persona colaboradora es requerida"
    },

    COLABORACION_PROYECTO_REQUERIDO: {
        code: "ERR-VAL-502",
        message: "El proyecto es requerido"
    },

    COLABORACION_HABILIDAD_REQUERIDA: {
        code: "ERR-VAL-503",
        message: "La colaboradora debe tener al menos una habilidad requerida por el proyecto"
    },

    COLABORACION_PROYECTO_FINALIZADO: {
        code: "ERR-EST-504",
        message: "No se puede colaborar en un proyecto finalizado"
    },

    COLABORACION_NO_ENCONTRADA: {
    code: "ERR-NOT-505",
    message: "La colaboración no fue encontrada"
    }

});

export default ErrorCatalog;