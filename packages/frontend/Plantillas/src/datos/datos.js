/**
 * Datos de prueba (mock). Reemplazalos por llamadas a la API cuando exista.
 *
 * USO: Cada export es un array u objeto.
 * SI LO CAMBIÁS O SACÁS: Las pantallas importan desde acá: si renombrás algo, buscá sus usos.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Dato nuevo: exportá otra constante y usala con import { NUEVO } from '../../datos'.
 */
export const HABILIDADES = ['React', 'Node', 'UX / UI', 'MongoDB', 'Testing', 'DevOps', 'Accesibilidad', 'Datos'];

export const PROYECTOS = [
  { id: 50, titulo: 'Boletín digital del barrio', colectivo: 'Asamblea Barrial Norte', colectivoId: 1, estado: 'abierto', habilidades: ['React', 'UX / UI'], tiempo: '3 h por semana', modalidad: ['Incentivo económico', 'Posible contratación'], avance: 0 },
  { id: 49, titulo: 'Mapa de comedores y merenderos', colectivo: 'Asamblea Barrial Norte', colectivoId: 1, estado: 'cerrado', habilidades: ['Datos', 'Node'], tiempo: '2 h por semana', modalidad: ['Gratuita'], avance: 100 },
  { id: 48, titulo: 'App de turnos para el comedor', colectivo: 'Asamblea Barrial Norte', colectivoId: 1, estado: 'abierto', habilidades: ['React', 'Node', 'UX / UI'], tiempo: '4 h por semana', modalidad: ['Incentivo económico'], avance: 30 },
  { id: 47, titulo: 'Padrón digital de familias', colectivo: 'Fundación Manos Unidas', colectivoId: 2, estado: 'abierto', habilidades: ['MongoDB', 'Node', 'Datos'], tiempo: '6 h por semana', modalidad: ['Gratuita'], avance: 55 },
  { id: 46, titulo: 'Sitio accesible para la radio comunitaria', colectivo: 'Radio La Esquina', colectivoId: 3, estado: 'abierto', habilidades: ['React', 'Accesibilidad'], tiempo: '3 h por semana', modalidad: ['Gratuita'], avance: 10 },
  { id: 45, titulo: 'Tablero de donaciones', colectivo: 'Red de Ollas Populares', colectivoId: 4, estado: 'abierto', habilidades: ['Datos', 'React'], tiempo: '5 h por semana', modalidad: ['Posible contratación'], avance: 75 },
  { id: 44, titulo: 'Pruebas automáticas del sistema de socios', colectivo: 'Cooperativa Rayuela', colectivoId: 5, estado: 'cerrado', habilidades: ['Testing', 'Node'], tiempo: '2 h por semana', modalidad: ['Gratuita'], avance: 100 },
  { id: 43, titulo: 'Despliegue del campus virtual', colectivo: 'Biblioteca Popular del Sur', colectivoId: 6, estado: 'cerrado', habilidades: ['DevOps'], tiempo: '4 h por semana', modalidad: ['Gratuita'], avance: 100 },
];

export const ESTADISTICAS = { proyectos: 120, colectivos: 48, finalizados: 35 };

export const DETALLE = {
  descripcion: 'Necesitamos una herramienta simple para organizar quién retira la vianda y en qué horario, sin papeles ni planillas compartidas. Lo usan voluntarias con poca experiencia con tecnología, así que tiene que ser clara y rápida desde el celular.',
  busqueda: { abierta: true, hasta: '30/11/2026' },
  cierreAuto: '31/12/2026',
  hitos: [
    { nombre: 'Relevamiento con el equipo del comedor', peso: 20, hecho: true },
    { nombre: 'Diseño de pantallas', peso: 20, hecho: true },
    { nombre: 'API de turnos', peso: 30, hecho: false },
    { nombre: 'Interfaz y pruebas con voluntarias', peso: 30, hecho: false },
  ],
  perfiles: [
    { rol: 'Front-end', descripcion: 'Arma la interfaz de turnos para voluntarias, pensada para celular.', requeridas: ['React', 'Accesibilidad'], opcionales: ['Testing'], compromiso: '4 h por semana', modalidad: ['Incentivo económico'], cupo: 2, ocupantes: [{ persona: 1 }] },
    { rol: 'Back-end', descripcion: 'Diseña la API de turnos y la base de datos.', requeridas: ['Node', 'MongoDB'], opcionales: ['DevOps'], compromiso: '6 h por semana', modalidad: ['Gratuita'], cupo: 2, ocupantes: [{ persona: 2 }, { anonima: true }] },
    { rol: 'Diseño de interfaz', descripcion: 'Prototipa y prueba las pantallas con quienes las van a usar.', requeridas: ['UX / UI'], opcionales: ['Accesibilidad'], compromiso: '10 h por mes', modalidad: ['Gratuita', 'Posible contratación'], cupo: 1, ocupantes: [] },
  ],
};

export const TIPOS = ['Fundación', 'Asociación barrial', 'ONG', 'Asamblea'];
export const UBICACIONES = ['Argentina', 'CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'];
export const CAUSAS = ['Alimentación', 'Educación', 'Salud', 'Cultura', 'Trabajo'];
export const COLECTIVOS = [
  { id: 1, nombre: 'Asamblea Barrial Norte', tipo: 'Asamblea', ubicacion: 'Buenos Aires', causas: ['Alimentación'], abiertos: 2, desde: 2021, descripcion: 'Vecinas y vecinos que sostienen un comedor comunitario y una huerta. Coordinan turnos, viandas y donaciones.' },
  { id: 2, nombre: 'Aldea Digital', tipo: 'ONG', ubicacion: 'CABA', causas: ['Educación'], abiertos: 0, desde: 2018, descripcion: 'Talleres de programación para adolescentes de barrios populares.' },
  { id: 3, nombre: 'Asociación Barrial Sur', tipo: 'Asociación barrial', ubicacion: 'CABA', causas: ['Educación', 'Cultura'], abiertos: 0, desde: 2012, descripcion: 'Apoyo escolar, biblioteca y actividades culturales.' },
  { id: 4, nombre: 'Colectivo Cuidar', tipo: 'ONG', ubicacion: 'Córdoba', causas: ['Salud'], abiertos: 0, desde: 2020, descripcion: 'Acompañamiento a personas mayores y red de cuidados.' },
  { id: 5, nombre: 'Cooperativa Rayuela', tipo: 'Asociación barrial', ubicacion: 'CABA', causas: ['Trabajo'], abiertos: 0, desde: 2014, descripcion: 'Cooperativa de trabajo que ofrece servicios de imprenta y diseño.' },
  { id: 6, nombre: 'Fundación Manos Unidas', tipo: 'Fundación', ubicacion: 'CABA', causas: ['Educación', 'Salud'], abiertos: 1, desde: 2016, descripcion: 'Acompañan a familias con niñas y niños en situación de vulnerabilidad.' },
  { id: 7, nombre: 'Radio La Esquina', tipo: 'Asociación barrial', ubicacion: 'Buenos Aires', causas: ['Cultura'], abiertos: 1, desde: 2019, descripcion: 'Radio comunitaria con programación hecha por el barrio.' },
  { id: 8, nombre: 'Red de Ollas Populares', tipo: 'Asamblea', ubicacion: 'Santa Fe', causas: ['Alimentación'], abiertos: 1, desde: 2020, descripcion: 'Red de ollas que coordinan insumos y turnos entre barrios.' },
  { id: 9, nombre: 'Biblioteca Popular del Sur', tipo: 'Fundación', ubicacion: 'Misiones', causas: ['Educación', 'Cultura'], abiertos: 0, desde: 2008, descripcion: 'Biblioteca abierta con préstamo de libros y sala de estudio.' },
];



export const PASOS = [
  { n: '01', titulo: 'Creá tu cuenta', texto: 'Elegís si sos una persona colaboradora o una organización. Tarda dos minutos.' },
  { n: '02', titulo: 'Encontrá o publicá', texto: 'Las organizaciones publican proyectos con los perfiles que necesitan. Las colaboradoras buscan por habilidad.' },
  { n: '03', titulo: 'Postulate y conversá', texto: 'La organización revisa tu perfil, te acepta y coordinan por mensajes dentro de la plataforma.' },
  { n: '04', titulo: 'Seguí el avance', texto: 'El proyecto se divide en hitos con un peso. El avance total se calcula solo.' },
];

/* ---- personas (solo las ve una organización con sesión) ---- */
export const COLABORADORAS = [
  { id: 1, nombre: 'Ana Pérez', habilidades: ['React', 'Node'], mensajes: true, pronombres: 'ella', github: 'anaperez', contactos: [['Correo', 'ana@ejemplo.org'], ['WhatsApp', '+54 11 5555-0101']], bio: 'Desarrolladora front con ocho años de oficio. Me gusta que las herramientas sean simples para quien las usa.', logros: ['3 proyectos', 'Mentora'] },
  { id: 2, nombre: 'Beto Ruiz', habilidades: ['Node', 'MongoDB'], mensajes: false, pronombres: 'él', github: 'betoruiz', contactos: [['Correo', 'beto@ejemplo.org']], bio: 'Back-end. Trabajo con APIs y bases de datos documentales.', logros: ['1 proyecto'] },
  { id: 3, nombre: 'Cami Soto', habilidades: ['UX / UI', 'Accesibilidad'], mensajes: true, pronombres: 'elle', github: 'camisoto', contactos: [['Correo', 'cami@ejemplo.org'], ['SMS', '+54 11 5555-0102']], bio: 'Diseño interfaces accesibles y hago pruebas con personas usuarias.', logros: ['2 proyectos'] },
  { id: 4, nombre: 'Dani Vega', habilidades: ['DevOps', 'Testing'], mensajes: true, bio: 'Automatizo despliegues y pruebas.', logros: ['4 proyectos', 'Mentor'] },
  { id: 5, nombre: 'Eli Gómez', habilidades: ['Datos', 'React'], mensajes: true, pronombres: 'ella', github: 'eligomez', contactos: [['Correo', 'eli@ejemplo.org']], bio: 'Tableros y visualización de datos para organizaciones.', logros: [] },
  { id: 6, nombre: 'Fran Díaz', habilidades: ['Testing', 'Node'], mensajes: false, bio: 'QA y pruebas automáticas.', logros: ['1 proyecto'] },
  { id: 7, nombre: 'Gaby Luna', habilidades: ['React', 'UX / UI'], mensajes: true, bio: 'Front y diseño.', logros: [] },
];

export const POSTULACIONES_COL = [
  { id: 'p1', proyecto: 47, perfil: 'Back-end', estado: 'pendiente' },
  { id: 'p2', proyecto: 48, perfil: 'Front-end', estado: 'aceptada' },
  { id: 'p3', proyecto: 46, perfil: 'UX', estado: 'rechazada' },
  { id: 'p4', proyecto: 45, perfil: 'Datos', estado: 'aceptada' },
];

export const POSTULACIONES_ORG = [
  { id: 'o1', persona: 1, perfil: 'Front-end', estado: 'pendiente' },
  { id: 'o2', persona: 2, perfil: 'Back-end', estado: 'pendiente' },
  { id: 'o3', persona: 3, perfil: 'Diseño de interfaz', estado: 'pendiente' },
  { id: 'o4', persona: 4, perfil: 'Back-end', estado: 'rechazada' },
];

export const EQUIPO = [
  { id: 1, perfil: 'Front-end' },
  { id: 3, perfil: 'Diseño de interfaz' },
  { id: 5, perfil: 'Datos' },
];

export const HITOS_EDIT = [
  { nombre: 'Relevamiento con el equipo del comedor', peso: 20, hecho: true },
  { nombre: 'Diseño de pantallas', peso: 30, hecho: true },
  { nombre: 'Primer deploy', peso: 50, hecho: false },
];

export const MENSAJES_COL = {
  rels: ['Todos', 'Me postulé', 'Me contactaron'],
  chats: [
    { id: 1, con: 'Asamblea Barrial Norte', proyecto: 'App de turnos para el comedor', rel: 'Me postulé', hora: '10:42', nuevos: 2, msgs: [['ellos', '¿Podés sumarte al proyecto?'], ['yo', 'Sí, ¿cuándo arrancan?'], ['ellos', 'La semana que viene.']] },
    { id: 2, con: 'Fundación Manos Unidas', proyecto: 'Padrón digital de familias', rel: 'Me contactaron', hora: 'Ayer', nuevos: 0, msgs: [['ellos', 'Nos gustó tu perfil, ¿hablamos?']] },
    { id: 3, con: 'Red de Ollas Populares', proyecto: 'Tablero de donaciones', rel: 'Me postulé', hora: 'Lun', nuevos: 0, msgs: [['ellos', 'Gracias por postularte.']] },
  ],
};
export const MENSAJES_ORG = {
  rels: ['Todos', 'Se postuló', 'La contacté'],
  chats: [
    { id: 1, con: 'Ana Pérez', proyecto: 'App de turnos para el comedor', rel: 'Se postuló', hora: '10:42', nuevos: 1, msgs: [['ellos', 'Hola, quedé a disposición.']] },
    { id: 2, con: 'Cami Soto', proyecto: 'App de turnos para el comedor', rel: 'La contacté', hora: 'Ayer', nuevos: 0, msgs: [['yo', '¿Podés sumarte al diseño?'], ['ellos', 'Sí, ¿cuándo arrancan?']] },
    { id: 3, con: 'Eli Gómez', proyecto: 'Boletín digital del barrio', rel: 'Se postuló', hora: 'Lun', nuevos: 0, msgs: [['ellos', 'Adjunto mi repositorio.']] },
  ],
};

export const FAQ = [
  ['¿Es gratis?', 'Sí. Es una plataforma sin fines de lucro: no se cobra a organizaciones ni a colaboradoras.'],
  ['¿Cuánto tiempo hay que dedicar?', 'Cada proyecto indica las horas por semana que necesita. Vos elegís el que te quede cómodo.'],
  ['¿Quién ve mis datos?', 'Tus datos de contacto no son públicos. Solo las organizaciones con sesión ven tu perfil, y te escriben por mensajes internos si no los desactivaste.'],
];

export const VALORACIONES = {
  colectivo: { 1: [{ de: 'Ana P.', puntaje: 5, texto: 'Se comunican claro y respetan los tiempos.' }, { de: 'Cami S.', puntaje: 4, texto: 'Buena experiencia, las reuniones fueron cortas y útiles.' }] },
  colaboradora: { 1: [{ de: 'Asamblea Barrial Norte', puntaje: 5, texto: 'Entregó a tiempo y explicó cada decisión.' }] },
};

export const NOTIFICACIONES = {
  col: [
    { id: 1, texto: 'Tu postulación a «App de turnos para el comedor» fue aceptada.', cuando: 'Hace 2 h' },
    { id: 2, texto: 'Hay un proyecto nuevo que encaja con tus habilidades: «Boletín digital del barrio».', cuando: 'Ayer' },
    { id: 3, texto: 'Asamblea Barrial Norte te escribió un mensaje.', cuando: 'Lun' },
  ],
  org: [
    { id: 1, texto: '3 postulaciones nuevas en «App de turnos para el comedor».', cuando: 'Hace 1 h' },
    { id: 2, texto: 'Hay una colaboradora que encaja con el perfil Front-end.', cuando: 'Ayer' },
  ],
};

export const PROYECTOS_POR_MES = [['Jun', 6], ['Jul', 9], ['Ago', 12], ['Sep', 15], ['Oct', 21], ['Nov', 27]];
export const COLABORACIONES_POR_PERFIL = [['Front-end', 38], ['Back-end', 29], ['Diseño', 17], ['Datos', 12], ['DevOps', 8]];
export const MOTIVOS_DENUNCIA = ['Mal trato o comportamiento', 'Incumple lo acordado', 'Pide dinero o datos personales', 'Otro'];
