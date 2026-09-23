const ErrorCatalog = Object.freeze({
  // =========================
  // GENERALES
  // =========================

  ARGUMENTO_INVALIDO: {
    code: "ERR-VAL-001",
    message: (stringDelArgumento) => `El argumento ${stringDelArgumento} es inválido`,
  },

  RECURSO_NO_ENCONTRADO: {
    code: "ERR-CSR-001",
    message: "El recurso solicitado no fue encontrado",
  },

  ERROR_INTERNO: {
    code: "ERR-CSR-500",
    message: "Ocurrió un error interno",
  },

  // =========================
  // PROYECTOS
  // =========================

  PROYECTO_TITULO_REQUERIDO: {
    code: "ERR-VAL-101",
    message: "El título del proyecto es requerido",
  },

  PROYECTO_DESCRIPCION_REQUERIDA: {
    code: "ERR-VAL-102",
    message: "La descripción del proyecto es requerida",
  },

  PROYECTO_PERFILES_REQUERIDOS: {
    code: "ERR-VAL-103",
    message: "Los perfiles son obligatorios",
  },

  PROYECTO_COLECTIVO_REQUERIDO: {
    code: "ERR-VAL-107",
    message: "El colectivo es requerido",
  },

  PROYECTO_NO_ENCONTRADO: {
    code: "ERR-NOT-108",
    message: (id) => `El proyecto ${id} no fue encontrado`,
  },

  PROYECTO_FINALIZADO: {
    code: "ERR-EST-109",
    message: (id) => `El proyecto ${id} se encuentra finalizado`,
  },

  PROYECTO_YA_EXISTENTE: {
    code: "ERR-CSR-110",
    message: (titulo, id) => `Ya existe un proyecto con titulo ${titulo} para el colectivo ${id}`,
  },

  PROYECTO_COLECTIVO_FORMATO: {
    code: "ERR-VAL-112",
    message: "El colectivo debe ser el nombre del mismo",
  },

  // =========================
  // HABILIDADES
  // =========================

  HABILIDAD_TITULO_REQUERIDO: {
    code: "ERR-VAL-201",
    message: "El título de la habilidad es requerido",
  },

  HABILIDAD_DESCRIPCION_REQUERIDA: {
    code: "ERR-VAL-202",
    message: "La descripción de la habilidad es requerida",
  },

  HABILIDAD_NO_ENCONTRADA: {
    code: "ERR-CSR-203",
    message: "La habilidad no fue encontrado",
  },

  HABILIDAD_NO_ENCONTRADA_POR_ID: {
    code: "ERR-NOT-204",
    message: (id) => `La habilidad de id ${id} no fue encontrado`,
  },

  HABILIDAD_NO_ENCONTRADA_POR_CODIGO: {
    code: "ERR-NOT-205",
    message: (codigo) => `La habilidad de codigo ${codigo} no fue encontrado`,
  },

  HABILIDAD_YA_EXISTE: {
    code: "ERR-CSR-206",
    message: (id) => `Ya existe una habilidad con ese título y descripción, y su id es: ${id}`,
  },

  HABILIDAD_INEXISTENTE_GENERICO: {
    code: "ERR-VAL-207",
    message: (codigo) => `La habilidad de codigo ${codigo} no existe`,
  },

  // =========================
  // COLECTIVOS
  // =========================

  COLECTIVO_NOMBRE_REQUERIDO: {
    code: "ERR-VAL-301",
    message: "El nombre del colectivo es requerido",
  },

  COLECTIVO_DESCRIPCION_REQUERIDA: {
    code: "ERR-VAL-302",
    message: "La descripción del colectivo es requerida",
  },

  COLECTIVO_UBICACION_INVALIDA: {
    code: "ERR-VAL-303",
    message: "La ubicación del colectivo es inválida",
  },

  COLECTIVO_TIPO_REQUERIDO: {
    code: "ERR-VAL-304",
    message: "El tipo de colectivo es requerido",
  },

  COLECTIVO_NO_ENCONTRADO: {
    code: "ERR-NOT-305",
    message: (id) => `El colectivo de id ${id} no fue encontrado`,
  },

  COLECTIVO_NO_ENCONTRADO_POR_NOMBRE: {
    code: "ERR-NOT-306",
    message: (nombre) => `El colectivo de nombre ${nombre} no fue encontrado`,
  },

  COLECTIVO_TIPO_INVALIDO: {
    code: "ERR-VAL-307",
    message: "El tipo de colectivo tiene formato invalido, debe ser TipoColectivo",
  },

  COLECTIVO_YA_EXISTE: {
    code: "ERR-CSR-308",
    message: (nombre) => `Ya existe un colectivo con el nombre ${nombre}`,
  },

  // =========================
  // COLABORADORAS
  // =========================

  COLABORADORA_NOMBRE_FANTASIA_REQUERIDO: {
    code: "ERR-VAL-401",
    message: "El nombre de fantasía es requerido",
  },

  COLABORADORA_GIT_REQUERIDO: {
    code: "ERR-VAL-402",
    message: "El Git de la colaboradora es requerido",
  },

  COLABORADORA_HABILIDADES_REQUERIDAS: {
    code: "ERR-VAL-403",
    message: "Las habilidades de la colaboradora son requeridas",
  },

  COLABORADORA_PRESENTACION_REQUERIDA: {
    code: "ERR-VAL-404",
    message: "La presentación de la colaboradora es requerida",
  },

  COLABORADORA_NO_ENCONTRADA: {
    code: "ERR-NOT-405",
    message: "La colaboradora no fue encontrada",
  },

  COLABORADORA_HABILIDADES_FORMATO: {
    code: "ERR-VAL-406",
    message: "Las habilidades de la colaboradora deben ser un array del codigo de la habilidad",
  },

  // =========================
  // COLABORACIONES
  // =========================

  COLABORACION_PERSONA_REQUERIDA: {
    code: "ERR-VAL-501",
    message: "La persona colaboradora es requerida",
  },

  COLABORACION_PROYECTO_REQUERIDO: {
    code: "ERR-VAL-502",
    message: "El proyecto es requerido",
  },

  COLABORACION_HABILIDAD_REQUERIDA: {
    code: "ERR-VAL-503",
    message: (colaboradora, proyecto, colectivo) =>
      `La colaboradora: ${colaboradora} ,debe tener al menos una habilidad requerida por el proyecto: ${proyecto} del colectivo: ${colectivo}`,
  },

  COLABORACION_PROYECTO_FINALIZADO: {
    code: "ERR-EST-504",
    message: "No se puede colaborar en un proyecto finalizado",
  },

  COLABORACION_NO_ENCONTRADA: {
    code: "ERR-NOT-505",
    message: (id) => `La colaboración ${id} no fue encontrada`,
  },

  // =========================
  // Perfiles
  // =========================

  PERFIL_DESCRIPCION_REQUERIDO: {
    code: "ERR-VAL-601",
    message: "La descripcion del perfil es requerida",
  },

  PERFIL_HABILIDADES_REQUERIDAS: {
    code: "ERR-VAL-602",
    message: "Las habilidades requeridas son obligatorias",
  },

  PERFIL_HABILIDADES_OPCIONALES: {
    code: "ERR-VAL-603",
    message: "Las habilidades opcionales son obligatorias",
  },

  PERFIL_HORAS_REQUERIDAS: {
    code: "ERR-VAL-604",
    message: "Las horas son requeridas",
  },

  PERFIL_TIPO_COMPROMISO_REQUERIDO: {
    code: "ERR-VAL-605",
    message: "El tipo de compromiso es requerido",
  },

  PERFIL_MODALIDAD_REQUERIDA: {
    code: "ERR-VAL-606",
    message: "La modalidad de colaboración es requerida",
  },

  PERFIL_HABILIDADES_REQUERIDAS_FORMATO: {
    code: "ERR-VAL-607",
    message: "Las habilidades requeridas deben ser un array del codigo de la habilidad",
  },

  PERFIL_HABILIDADES_OPCIONALES_FORMATO: {
    code: "ERR-VAL-608",
    message: "Las habilidades opcionales deben ser un array del codigo de la habilidad",
  },

  PERFIL_TIPO_COMPROMISO_FORMATO: {
    code: "ERR-VAL-609",
    message: "El tipo de compromiso debe ser : total, mensual o semanal",
  },

  PERFIL_MODALIDAD_FORMATO: {
    code: "ERR-VAL-610",
    message:
      "La modalidad de colaboracion debe ser : gratuita, incentivo_economico o contratacion_eventual",
  },

  PERFIL_NO_ENCONTRADO: {
    code: "ERR-NOT-611",
    message: (id) => `El perfil ${id} no fue encontrado`,
  },
});

export default ErrorCatalog;
