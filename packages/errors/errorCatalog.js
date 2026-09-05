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

    HABILIDAD_NO_ENCONTRADA: {
        code: "ERR-CSR-203",
        message: "La habilidad no fue encontrada"
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
        message: "El colectivo no fue encontrado"
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
    }


});

export default ErrorCatalog;