// Datos del seed. Las relaciones se indican por nombre (colectivos, colaboradoras), título
// (proyectos), descripción (perfiles) y código (habilidades: el título normalizado, como en la API).
// sembrar.js resuelve esos nombres a ids y verifica las reglas del dominio antes de guardar.

import { TipoColectivo } from "../src/models/colectivo.js";
import { TipoMedioDeContacto } from "../src/models/personaColaboradora.js";
import { TipoCompromiso, ModalidadColaboracion } from "../src/models/proyecto.js";
import { EstadoPostulacion } from "../src/models/postulacion.js";
import { OrigenBaja } from "../src/models/colaboracion.js";
import { TipoEvaluador } from "../src/models/valoracion.js";
import { EstadoDenuncia } from "../src/models/denuncia.js";
import { Emisor } from "../src/models/mensaje.js";
import { DestinatarioNotificacion } from "../src/models/notificacion.js";
import { TipoRedSocial } from "../src/models/redSocial.js";

export const habilidades = [
  [
    "Programacion en JavaScript",
    "Capacidad para desarrollar aplicaciones web y logica de negocio utilizando JS moderno.",
  ],
  ["Desarrollo con Node.js y Express", "Creacion de APIs RESTful, ruteo y manejo de middleware."],
  [
    "Control de versiones con Git",
    "Manejo de repositorios, ramas y flujo de trabajo colaborativo.",
  ],
  [
    "Disenio y Documentacion de APIs con OpenAPI",
    "Definicion de contratos de servicio RESTful, esquemas de datos y especificaciones OpenAPI/Swagger.",
  ],
  [
    "Pruebas de Integracion con Postman",
    "Disenio y ejecucion de colecciones de pruebas automatizadas para la verificacion de endpoints HTTP.",
  ],
  ["Desarrollo Web React", "Construccion de interfaces web con componentes de React."],
  ["Testing E2E con Cypress", "Automatizacion de pruebas de punta a punta sobre aplicaciones web."],
  ["Uso de Soap UI", "Pruebas funcionales de servicios SOAP y REST."],
  ["Conocimientos de Pandas", "Limpieza, transformacion y analisis de datos con Python y Pandas."],
];

export const colectivos = [
  {
    nombre: "Colectivo Ambiental CABA",
    descripcion:
      "Organizacion dedicada a promover el cuidado del medio ambiente y la sustentabilidad en la Ciudad de Buenos Aires.",
    ubicacion: "caba",
    tipo: TipoColectivo.FUNDACION,
    redesSociales: [
      { tipo: TipoRedSocial.INSTAGRAM, url: "https://instagram.com/colectivoambientalcaba" },
      { tipo: TipoRedSocial.GITHUB, url: "https://github.com/colectivo-ambiental" },
    ],
  },
  {
    nombre: "Red de Huertas de Palermo",
    descripcion:
      "Colectivo de vecinos enfocado en la agricultura urbana, el compostaje comunitario y el intercambio de semillas.",
    ubicacion: "caba",
    tipo: TipoColectivo.ASOCIACION_BARRIAL,
    redesSociales: [{ tipo: TipoRedSocial.FACEBOOK, url: "https://facebook.com/huertaspalermo" }],
  },
  {
    nombre: "Asamblea Abierta por los Espacios Verdes",
    descripcion:
      "Espacio horizontal de discusion y accion ciudadana para defender los parques publicos e impulsar proyectos ecologicos.",
    ubicacion: "buenos aires",
    tipo: TipoColectivo.ASAMBLEA,
  },
  {
    nombre: "Comedor Los Pibes",
    descripcion: "ONG que sostiene un comedor comunitario y talleres de oficios para jovenes.",
    ubicacion: "cordoba",
    tipo: TipoColectivo.ONG,
  },
  {
    // Recién registrado: todavía no cargó proyectos
    nombre: "Biblioteca Popular Sur",
    descripcion: "Biblioteca barrial con apoyo escolar y club de lectura.",
    ubicacion: "santa fe",
    tipo: TipoColectivo.ASOCIACION_BARRIAL,
  },
  {
    // Dio de baja su cuenta: su historial (proyecto, colaboraciones, valoraciones) se conserva
    nombre: "Fundación Huellas",
    descripcion: "Rescate y adopción responsable de animales en Mendoza.",
    ubicacion: "mendoza",
    tipo: TipoColectivo.FUNDACION,
    redesSociales: [
      { tipo: TipoRedSocial.INSTAGRAM, url: "https://instagram.com/fundacionhuellas" },
    ],
    eliminado: true,
  },
];

export const colaboradoras = [
  {
    nombreFantasia: "DevNeko",
    git: "https://github.com/devneko",
    nombre: "Lucía",
    apellido: "Gómez",
    habilidades: [
      "programacion_en_java_script",
      "desarrollo_web_react",
      "control_de_versiones_con_git",
    ],
    pronombres: "ella",
    presentacion:
      "Desarrolladora frontend apasionada por proyectos comunitarios y de código abierto.",
    contactos: [
      { tipo: TipoMedioDeContacto.EMAIL, valor: "devneko@mail.com" },
      { tipo: TipoMedioDeContacto.WHATSAPP, valor: "1127891234" },
    ],
    redesSociales: [{ tipo: TipoRedSocial.LINKEDIN, url: "https://linkedin.com/in/devneko" }],
  },
  {
    nombreFantasia: "BackendBeto",
    git: "https://gitlab.com/backendbeto",
    habilidades: [
      "desarrollo_con_node_js_y_express",
      "disenio_y_documentacion_de_ap_is_con_open_api",
    ],
    presentacion: "Backend developer. Prefiere no recibir mensajes internos.",
    contactos: [{ tipo: TipoMedioDeContacto.EMAIL, valor: "beto@mail.com" }],
    bloquearMensajeInterno: true,
  },
  {
    nombreFantasia: "QA Tincho",
    git: "https://github.com/qatincho",
    nombre: "Martín",
    habilidades: [
      "testing_e_2_e_con_cypress",
      "pruebas_de_integracion_con_postman",
      "uso_de_soap_ui",
    ],
    pronombres: "él",
    presentacion: "Tester con experiencia en automatización.",
    contactos: [{ tipo: TipoMedioDeContacto.SMS, valor: "1156781234" }],
  },
  {
    nombreFantasia: "DataSol",
    git: "https://github.com/datasol",
    habilidades: ["conocimientos_de_pandas"],
    presentacion: "Analista de datos. Me interesan proyectos con impacto social.",
    contactos: [{ tipo: TipoMedioDeContacto.EMAIL, valor: "datasol@mail.com" }],
  },
  {
    nombreFantasia: "FullstackFer",
    git: "https://github.com/fullstackfer",
    nombre: "Fernanda",
    apellido: "Ruiz",
    habilidades: [
      "programacion_en_java_script",
      "desarrollo_con_node_js_y_express",
      "desarrollo_web_react",
      "pruebas_de_integracion_con_postman",
    ],
    pronombres: "ella",
    presentacion: "Fullstack JS. Puedo dedicar algunas horas por semana.",
    contactos: [{ tipo: TipoMedioDeContacto.EMAIL, valor: "fer@mail.com" }],
    redesSociales: [{ tipo: TipoRedSocial.GITHUB, url: "https://github.com/fullstackfer" }],
  },
  {
    nombreFantasia: "Ana Docs",
    git: "https://github.com/anadocs",
    habilidades: [
      "disenio_y_documentacion_de_ap_is_con_open_api",
      "pruebas_de_integracion_con_postman",
    ],
    pronombres: "ella",
    presentacion: "Documentación técnica y diseño de APIs.",
    contactos: [{ tipo: TipoMedioDeContacto.WHATSAPP, valor: "1133334444" }],
  },
  {
    // Perfil mínimo: anónima, sin contactos, redes ni pronombres, y sin postulaciones
    nombreFantasia: "PixelPampa",
    git: "https://gitlab.com/pixelpampa",
    habilidades: ["desarrollo_web_react", "testing_e_2_e_con_cypress"],
  },
  {
    // Eliminó su cuenta: se anonimiza al final del seed (mismo método que usa la app)
    nombreFantasia: "ExVoluntaria",
    git: "https://github.com/exvoluntaria",
    nombre: "Carla",
    apellido: "Paz",
    habilidades: ["programacion_en_java_script", "control_de_versiones_con_git"],
    contactos: [{ tipo: TipoMedioDeContacto.EMAIL, valor: "carla@mail.com" }],
    eliminada: true,
  },
];

const perfil = (
  descripcion,
  requeridas,
  opcionales,
  horas,
  compromiso,
  modalidad,
  cantidadMaxima,
) => ({ descripcion, requeridas, opcionales, horas, compromiso, modalidad, cantidadMaxima });

// Fechas relativas al momento en que se corre el seed (en días; negativo = en el pasado).
// Los logros de cada proyecto no pueden sumar más de 100.
export const proyectos = [
  {
    titulo: "Plataforma de Donaciones Comunitarias",
    descripcion: "App web para gestionar entregas de alimentos e insumos en el barrio.",
    colectivo: "Colectivo Ambiental CABA",
    urlSistema: "https://donaciones.colectivoambiental.org",
    urlDonaciones: "https://cafecito.app/colectivoambiental",
    // Búsqueda abierta hasta dentro de 30 días; cierre automático dentro de 120
    diasLimiteBusqueda: 30,
    diasCierre: 120,
    perfiles: [
      perfil(
        "Desarrollo frontend",
        ["desarrollo_web_react"],
        ["control_de_versiones_con_git"],
        10,
        TipoCompromiso.SEMANAL,
        ModalidadColaboracion.GRATUITA,
        2,
      ),
      perfil(
        "Desarrollo backend",
        ["desarrollo_con_node_js_y_express"],
        ["disenio_y_documentacion_de_ap_is_con_open_api"],
        20,
        TipoCompromiso.MENSUAL,
        ModalidadColaboracion.INCENTIVO_ECONOMICO,
        1,
      ),
    ],
    logros: [
      [
        "Relevamiento de requerimientos con el colectivo",
        15,
        "https://github.com/colectivo-ambiental/donaciones",
      ],
      ["MVP con registro de donaciones", 30, "https://github.com/colectivo-ambiental/donaciones"],
    ],
  },
  {
    // Los perfiles del ejemplo del enunciado. Búsqueda abierta sin fecha límite y sin cupo de testers.
    titulo: "Mapa de Huertas Urbanas",
    descripcion: "Mapa colaborativo de huertas comunitarias y su producción.",
    colectivo: "Red de Huertas de Palermo",
    urlSistema: "https://mapa.huertaspalermo.org",
    perfiles: [
      perfil(
        "Tester",
        ["testing_e_2_e_con_cypress"],
        ["uso_de_soap_ui"],
        5,
        TipoCompromiso.MENSUAL,
        ModalidadColaboracion.GRATUITA,
      ),
      perfil(
        "Analista de Datos",
        ["conocimientos_de_pandas"],
        ["programacion_en_java_script"],
        15,
        TipoCompromiso.MENSUAL,
        ModalidadColaboracion.INCENTIVO_ECONOMICO,
        1,
      ),
    ],
    logros: [["Carga inicial de huertas relevadas", 20, "https://github.com/huertas/mapa"]],
  },
  {
    // Finalizado: no aparece en las búsquedas y no acepta postulaciones nuevas
    titulo: "Sitio de la Asamblea",
    descripcion: "Sitio institucional con agenda de actividades y petitorios.",
    colectivo: "Asamblea Abierta por los Espacios Verdes",
    urlSistema: "https://asambleaespaciosverdes.org",
    finalizado: true,
    perfiles: [
      perfil(
        "Desarrollo web",
        ["programacion_en_java_script"],
        ["desarrollo_web_react"],
        40,
        TipoCompromiso.TOTAL,
        ModalidadColaboracion.CONTRATACION_EVENTUAL,
        1,
      ),
    ],
    logros: [
      ["Diseño y maquetado", 40, "https://github.com/asamblea-ev/sitio"],
      ["Agenda de actividades", 35, "https://github.com/asamblea-ev/sitio"],
      ["Publicación en producción", 25, "https://github.com/asamblea-ev/sitio"],
    ],
  },
  {
    // En curso pero con la búsqueda cerrada: no acepta postulaciones nuevas
    titulo: "Sistema de Turnos del Comedor",
    descripcion: "Gestión de turnos de almuerzo e inscripción a talleres de oficios.",
    colectivo: "Comedor Los Pibes",
    urlSistema: "https://turnos.comedorlospibes.org",
    busquedaCerrada: true,
    perfiles: [
      perfil(
        "Backend de turnos",
        ["desarrollo_con_node_js_y_express"],
        ["pruebas_de_integracion_con_postman"],
        8,
        TipoCompromiso.SEMANAL,
        ModalidadColaboracion.GRATUITA,
        1,
      ),
      perfil(
        "Documentación de la API",
        ["disenio_y_documentacion_de_ap_is_con_open_api"],
        [],
        12,
        TipoCompromiso.TOTAL,
        ModalidadColaboracion.GRATUITA,
      ),
    ],
    logros: [["Modelo de datos y endpoints de turnos", 50, "https://github.com/lospibes/turnos"]],
  },
  {
    // En curso, sin logros, con la fecha límite de búsqueda ya vencida
    titulo: "Huerta Escolar Digital",
    descripcion: "Registro de siembras y cosechas para las escuelas del barrio.",
    colectivo: "Red de Huertas de Palermo",
    urlSistema: "https://escuelas.huertaspalermo.org",
    diasLimiteBusqueda: -5,
    perfiles: [
      perfil(
        "Desarrollo web",
        ["programacion_en_java_script"],
        ["desarrollo_web_react"],
        6,
        TipoCompromiso.SEMANAL,
        ModalidadColaboracion.GRATUITA,
        2,
      ),
    ],
    logros: [],
  },
  {
    // Finalizado por el cierre automático: venció su fecha de cierre y se rechazaron las pendientes
    titulo: "App de Adopciones",
    descripcion: "Catálogo de animales en adopción con seguimiento post adopción.",
    colectivo: "Fundación Huellas",
    urlSistema: "https://adopta.fundacionhuellas.org",
    urlDonaciones: "https://cafecito.app/fundacionhuellas",
    diasCierre: -10,
    finalizado: true,
    perfiles: [
      perfil(
        "Desarrollo frontend",
        ["desarrollo_web_react", "programacion_en_java_script"],
        [],
        30,
        TipoCompromiso.TOTAL,
        ModalidadColaboracion.INCENTIVO_ECONOMICO,
        2,
      ),
    ],
    logros: [
      ["Catálogo de animales", 60, "https://github.com/huellas/adopciones"],
      ["Formulario de adopción", 30, "https://github.com/huellas/adopciones"],
    ],
  },
];

// Cada postulación aceptada genera su colaboración. `baja` da de baja esa colaboración
// (desanotación permanente, hecha por la persona o por el colectivo).
export const postulaciones = [
  {
    colaboradora: "DevNeko",
    proyecto: "Plataforma de Donaciones Comunitarias",
    perfil: "Desarrollo frontend",
    estado: EstadoPostulacion.ACEPTADA,
    diasResolucion: -10,
  },
  {
    colaboradora: "FullstackFer",
    proyecto: "Plataforma de Donaciones Comunitarias",
    perfil: "Desarrollo frontend",
    estado: EstadoPostulacion.PENDIENTE,
  },
  {
    colaboradora: "FullstackFer",
    proyecto: "Plataforma de Donaciones Comunitarias",
    perfil: "Desarrollo backend",
    estado: EstadoPostulacion.RECHAZADA,
    diasResolucion: -6,
  },
  {
    // Ocupa el único lugar de backend
    colaboradora: "BackendBeto",
    proyecto: "Plataforma de Donaciones Comunitarias",
    perfil: "Desarrollo backend",
    estado: EstadoPostulacion.ACEPTADA,
    diasResolucion: -5,
  },
  {
    colaboradora: "QA Tincho",
    proyecto: "Mapa de Huertas Urbanas",
    perfil: "Tester",
    estado: EstadoPostulacion.ACEPTADA,
    anonima: true,
    diasResolucion: -12,
  },
  {
    colaboradora: "DataSol",
    proyecto: "Mapa de Huertas Urbanas",
    perfil: "Analista de Datos",
    estado: EstadoPostulacion.PENDIENTE,
  },
  {
    // Colaboración histórica en un proyecto que después se finalizó
    colaboradora: "DevNeko",
    proyecto: "Sitio de la Asamblea",
    perfil: "Desarrollo web",
    estado: EstadoPostulacion.ACEPTADA,
    diasResolucion: -60,
  },
  {
    colaboradora: "FullstackFer",
    proyecto: "Sistema de Turnos del Comedor",
    perfil: "Backend de turnos",
    estado: EstadoPostulacion.ACEPTADA,
    diasResolucion: -40,
    baja: { por: OrigenBaja.PERSONA, dias: -15 },
  },
  {
    colaboradora: "Ana Docs",
    proyecto: "Sistema de Turnos del Comedor",
    perfil: "Documentación de la API",
    estado: EstadoPostulacion.ACEPTADA,
    diasResolucion: -30,
    baja: { por: OrigenBaja.COLECTIVO, dias: -3 },
  },
  {
    colaboradora: "DevNeko",
    proyecto: "Huerta Escolar Digital",
    perfil: "Desarrollo web",
    estado: EstadoPostulacion.RECHAZADA,
    diasResolucion: -8,
  },
  {
    // La colaboradora después eliminó su cuenta: la colaboración queda, anonimizada
    colaboradora: "ExVoluntaria",
    proyecto: "App de Adopciones",
    perfil: "Desarrollo frontend",
    estado: EstadoPostulacion.ACEPTADA,
    diasResolucion: -90,
  },
  {
    // Pendiente al momento del cierre automático: quedó rechazada en la fecha de cierre
    colaboradora: "FullstackFer",
    proyecto: "App de Adopciones",
    perfil: "Desarrollo frontend",
    estado: EstadoPostulacion.RECHAZADA,
    diasResolucion: -10,
  },
];

// Solo sobre colaboraciones terminadas (dadas de baja o de proyectos finalizados).
// La colaboración se identifica por colaboradora + proyecto.
export const valoraciones = [
  {
    colaboradora: "DevNeko",
    proyecto: "Sitio de la Asamblea",
    evaluador: TipoEvaluador.COLECTIVO,
    puntaje: 5,
    comentario: "Excelente compromiso, cumplió todos los plazos.",
  },
  {
    colaboradora: "DevNeko",
    proyecto: "Sitio de la Asamblea",
    evaluador: TipoEvaluador.PERSONA,
    puntaje: 4,
    comentario: "Muy buena organización de la asamblea.",
  },
  {
    colaboradora: "Ana Docs",
    proyecto: "Sistema de Turnos del Comedor",
    evaluador: TipoEvaluador.PERSONA,
    puntaje: 2,
    comentario: "Me dieron de baja sin explicación.",
  },
  {
    // Sin comentario: solo puntaje
    colaboradora: "FullstackFer",
    proyecto: "Sistema de Turnos del Comedor",
    evaluador: TipoEvaluador.COLECTIVO,
    puntaje: 3,
  },
  {
    colaboradora: "ExVoluntaria",
    proyecto: "App de Adopciones",
    evaluador: TipoEvaluador.COLECTIVO,
    puntaje: 5,
    comentario: "Gran trabajo con el catálogo.",
  },
  {
    colaboradora: "ExVoluntaria",
    proyecto: "App de Adopciones",
    evaluador: TipoEvaluador.PERSONA,
    puntaje: 1,
    comentario: "Nunca pagaron el incentivo prometido.",
  },
];

// Las denuncias se guardan embebidas en el colectivo denunciado (el del proyecto).
export const denuncias = [
  {
    colaboradora: "Ana Docs",
    proyecto: "Sistema de Turnos del Comedor",
    descripcion: "Me desasociaron del proyecto sin aviso después de entregar la documentación.",
    estado: EstadoDenuncia.PENDIENTE,
    dias: -2,
  },
  {
    colaboradora: "QA Tincho",
    proyecto: "Mapa de Huertas Urbanas",
    descripcion: "Me piden horas extra fuera del compromiso mensual acordado.",
    estado: EstadoDenuncia.EN_REVISION,
    dias: -4,
  },
  {
    colaboradora: "ExVoluntaria",
    proyecto: "App de Adopciones",
    descripcion: "No se pagó el incentivo económico publicado en el perfil.",
    estado: EstadoDenuncia.RESUELTA,
    dias: -20,
  },
  {
    colaboradora: "DevNeko",
    proyecto: "Sitio de la Asamblea",
    descripcion: "Cambiaron el diseño sin consultarme.",
    estado: EstadoDenuncia.DESCARTADA,
    dias: -45,
  },
];

export const mensajes = [
  {
    colectivo: "Colectivo Ambiental CABA",
    colaboradora: "DevNeko",
    proyecto: "Plataforma de Donaciones Comunitarias",
    emisor: Emisor.COLECTIVO,
    texto: "¡Hola! Vimos tu perfil y encaja con nuestro proyecto de donaciones.",
    dias: -12,
    leido: true,
  },
  {
    colectivo: "Colectivo Ambiental CABA",
    colaboradora: "DevNeko",
    proyecto: "Plataforma de Donaciones Comunitarias",
    emisor: Emisor.PERSONA,
    texto: "¡Hola! Me interesa, ya me postulé al perfil de frontend.",
    dias: -11,
    leido: true,
  },
  {
    colectivo: "Red de Huertas de Palermo",
    colaboradora: "DataSol",
    proyecto: "Mapa de Huertas Urbanas",
    emisor: Emisor.COLECTIVO,
    texto: "Estamos buscando a alguien para analizar los datos de cosecha. ¿Te interesa?",
    dias: -1,
  },
  {
    colectivo: "Red de Huertas de Palermo",
    colaboradora: "PixelPampa",
    proyecto: "Mapa de Huertas Urbanas",
    emisor: Emisor.COLECTIVO,
    texto: "Tenés experiencia con Cypress, ¿te sumás como tester del mapa?",
    dias: -2,
  },
  {
    colectivo: "Comedor Los Pibes",
    colaboradora: "Ana Docs",
    proyecto: "Sistema de Turnos del Comedor",
    emisor: Emisor.COLECTIVO,
    texto: "Gracias por la documentación. Por ahora cerramos el perfil.",
    dias: -3,
    leido: true,
  },
  {
    colectivo: "Comedor Los Pibes",
    colaboradora: "Ana Docs",
    proyecto: "Sistema de Turnos del Comedor",
    emisor: Emisor.PERSONA,
    texto: "¿Podrían explicarme por qué me dieron de baja?",
    dias: -2,
  },
];

export const notificaciones = [
  {
    colaboradora: "DataSol",
    proyecto: "Mapa de Huertas Urbanas",
    destinatario: DestinatarioNotificacion.PERSONA,
    texto:
      'Hola DataSol!, se publico el proyecto "Mapa de Huertas Urbanas" del colectivo Red de Huertas de Palermo que busca perfiles acordes a tus habilidades',
  },
  {
    colaboradora: "FullstackFer",
    proyecto: "Plataforma de Donaciones Comunitarias",
    destinatario: DestinatarioNotificacion.COLECTIVO,
    texto:
      'Hola Colectivo Ambiental CABA!, hay una nueva persona colaboradora "FullstackFer" la cual tiene habilidades acordes al proyecto "Plataforma de Donaciones Comunitarias"',
  },
  {
    colaboradora: "PixelPampa",
    proyecto: "Mapa de Huertas Urbanas",
    destinatario: DestinatarioNotificacion.PERSONA,
    texto:
      'Hola PixelPampa!, se publico el proyecto "Mapa de Huertas Urbanas" del colectivo Red de Huertas de Palermo que busca perfiles acordes a tus habilidades',
  },
  {
    colaboradora: "PixelPampa",
    proyecto: "Mapa de Huertas Urbanas",
    destinatario: DestinatarioNotificacion.COLECTIVO,
    texto:
      'Hola Red de Huertas de Palermo!, hay una nueva persona colaboradora "PixelPampa" la cual tiene habilidades acordes al proyecto "Mapa de Huertas Urbanas"',
  },
];
