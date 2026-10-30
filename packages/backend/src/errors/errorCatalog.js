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

  PROYECTO_PORCENTAJE_MAXIMO: {
    code: "ERR-EST-113",
    message: "El porcentaje de un proyecto no puede superar el 100%",
  },

  PROYECTO_LOGRO_NO_ENCONTRADO: {
    code: "ERR-NOT-114",
    message: (id) => `El proyecto no contiene el logro ${id}`,
  },

  PROYECTO_URL_SISTEMA_INVALIDA: {
    code: "ERR-VAL-115",
    message: "La URL del sistema debe ser una URL válida",
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

  HABILIDADES_INEXISTENTES_GENERICO: {
    code: "ERR-VAL-207",
    message: (codigos) => `Las habilidades de codigo: ${codigos.join(', ')} no existen`,
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

  COLECTIVO_YA_DADO_DE_BAJA: {
    code: "ERR-EST-508",
    message: (id) => `El colectivo ${id} ya fue dado de baja`,
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

  COLABORADORA_BLOQUEAR_MENSAJE_INTERNO_INVALIDO: {
    code: "ERR-VAL-407",
    message: "El campo bloquear mensaje interno debe ser un booleano",
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

  COLABORACION_ANONIMA_FORMATO: {
    code: "ERR-VAL-504",
    message: "El campo anonima debe ser un booleano",
  },

  COLABORACION_PROYECTO_FINALIZADO: {
    code: "ERR-EST-505",
    message: "No se puede colaborar en un proyecto finalizado",
  },

  COLABORACION_NO_ENCONTRADA: {
    code: "ERR-NOT-506",
    message: (id) => `La colaboración ${id} no fue encontrada`,
  },

  COLABORACION_CUPO_COMPLETO: {
    code: "ERR-EST-507",
    message: "Se acabo el cupo maximo de colaboraciones del perfil",
  },

  COLABORACION_YA_DADA_DE_BAJA: {
    code: "ERR-EST-508",
    message: (id) => `La colaboración ${id} ya fue dada de baja`,
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

  // =========================
  // MEDIO DE CONTACTO
  // =========================

  MEDIO_CONTACTO_FORMATO: {
    code: "ERR-VAL-701",
    message: "Los medios de contacto deben ser una lista",
  },

  MEDIO_CONTACTO_TIPO_REQUERIDO: {
    code: "ERR-VAL-702",
    message: "El tipo del medio de contacto es requerido",
  },

  MEDIO_CONTACTO_TIPO_INVALIDO: {
    code: "ERR-VAL-703",
    message: "El tipo del medio de contacto debe ser: email, whatsapp o sms",
  },

  MEDIO_CONTACTO_VALOR_REQUERIDO: {
    code: "ERR-VAL-704",
    message: "El valor del medio de contacto es requerido",
  },

  MEDIO_CONTACTO_VALOR_FORMATO: {
    code: "ERR-VAL-705",
    message: "El valor del medio de contacto debe ser un texto",
  },

  MEDIO_CONTACTO_EMAIL_INVALIDO: {
    code: "ERR-VAL-706",
    message: "El email del medio de contacto no tiene un formato válido",
  },

  MEDIO_CONTACTO_TELEFONO_INVALIDO: {
    code: "ERR-VAL-707",
    message: "El teléfono debe tener 10 dígitos juntos, sin espacios ni símbolos (ej: 1127891234)",
  },

  // =========================
  // MENSAJES
  // =========================

  MENSAJE_DESTINATARIA_NO_ACEPTA: {
    code: "ERR-EST-801",
    message: (nombre) => `La colaboradora ${nombre} no acepta mensajes internos`,
  },

  MENSAJE_PERSONA_COLABORADORA_REQUERIDO: {
    code: "ERR-VAL-802",
    message: "La persona colaboradora destinataria es requerida",
  },

  MENSAJE_TEXTO_REQUERIDO: {
    code: "ERR-VAL-803",
    message: "El texto del mensaje es requerido",
  },

  MENSAJE_TEXTO_FORMATO: {
    code: "ERR-VAL-804",
    message: "El texto del mensaje debe ser un texto",
  },

  // =========================
  // LOGROS
  // =========================

  LOGRO_DESCRIPCION_INVALIDA: {
    code: "ERR-VAL-901",
    message: "La descripción del logro es requerida y debe ser un texto",
  },

  LOGRO_PORCENTAJE_INVALIDO: {
    code: "ERR-VAL-902",
    message: "El porcentaje debe ser un numero positivo y menor o igual a 100",
  },

  LOGRO_URL_INVALIDA: {
    code: "ERR-VAL-903",
    message: "La URL del código fuente debe ser una URL válida",
  },

  // =========================
  // POSTULACION
  // =========================

  POSTULACION_PERSONA_REQUERIDA: {
    code: "ERR-VAL-1001",
    message: "La persona colaboradora que se postula es requerida",
  },

  POSTULACION_ANONIMA_FORMATO: {
    code: "ERR-VAL-1002",
    message: "El campo anonima debe ser true o false",
  },

  POSTULACION_ESTADO_REQUERIDO: {
    code: "ERR-VAL-1003",
    message: "El estado de la postulación es requerido",
  },

  POSTULACION_ESTADO_INVALIDO: {
    code: "ERR-VAL-1004",
    message: "El estado debe ser: aceptada o rechazada",
  },

  POSTULACION_PROYECTO_FINALIZADO: {
    code: "ERR-EST-1005",
    message: (id) => `El proyecto ${id} está finalizado y ya no acepta postulaciones`,
  },
  POSTULACION_BUSQUEDA_CERRADA: {
    code: "ERR-EST-1006",
    message: (id) => `La búsqueda del proyecto ${id} está cerrada`,
  },
  POSTULACION_HABILIDAD_REQUERIDA: {
    code: "ERR-VAL-1007",
    message: (nombreFantasia) =>
      `${nombreFantasia} no tiene ninguna de las habilidades requeridas por el perfil`,
  },
  POSTULACION_DUPLICADA: {
    code: "ERR-EST-1008",
    message: (nombreFantasia, perfilDescripcion) =>
      `Ya existe una postulación pendiente de ${nombreFantasia} para el perfil: ${perfilDescripcion}`,
  },
  POSTULACION_NO_ENCONTRADA: {
    code: "ERR-NOT-1009",
    message: (id) => `La postulacion id : ${id} no fue encontrada`,
  },
  POSTULACION_YA_RESUELTA: {
    code: "ERR-EST-1010",
    message:
      "La Postulacion ya fue resuelta, asegurese de resolver postuaciones con estado PENDIENTE",
  },

  // =========================
  // REDES SOCIALES
  // =========================

  RED_SOCIAL_FORMATO: {
    code: "ERR-VAL-1101",
    message: "Las redes sociales deben ser una lista",
  },

  RED_SOCIAL_TIPO_REQUERIDO: {
    code: "ERR-VAL-1102",
    message: "El tipo de red social es requerido",
  },

  RED_SOCIAL_TIPO_INVALIDO: {
    code: "ERR-VAL-1103",
    message: (tipo) =>
      tipo ? `El tipo de red social ${tipo} no es válido` : "El tipo de red social no es válido",
  },

  RED_SOCIAL_URL_REQUERIDA: {
    code: "ERR-VAL-1104",
    message: "La URL de la red social es requerida",
  },

  RED_SOCIAL_URL_INVALIDA: {
    code: "ERR-VAL-1105",
    message: (url) =>
      url
        ? `La URL ${url} no es válida, debe utilizar protocolo HTTP o HTTPS`
        : "La URL de la red social debe ser una URL válida con protocolo HTTP o HTTPS",
  },

  RED_SOCIAL_TIPO_DUPLICADO: {
    code: "ERR-VAL-1106",
    message: (tipo) =>
      tipo
        ? `No se permiten tipos de redes sociales duplicados: ${tipo}`
        : "No se permiten dos enlaces correspondientes al mismo tipo de red social",
  },
});

export default ErrorCatalog;
