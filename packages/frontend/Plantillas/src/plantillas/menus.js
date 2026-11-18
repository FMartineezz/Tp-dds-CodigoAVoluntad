/**
 * Configuración de los menús: qué ve cada rol.
 *
 * USO: MENUS[rol] = [[ruta, etiqueta, exacta?]]. La barra inferior móvil y el menú del header salen de acá.
 * SI LO CAMBIÁS O SACÁS: Sacar una fila quita el ítem de ambos menús.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   AGREGAR un ítem: sumá una fila al array del rol, ej. ['/panel/ayuda', 'Ayuda'], y su ícono en ICONOS.
 */
// Cada fila: [ruta, etiqueta, exacta?]   ('exacta' evita que «/panel» quede activo en «/panel/perfil»)
export const MENUS = {
  null: [['/proyectos', 'Proyectos'], ['/colectivos', 'Colectivos'], ['/como-funciona', 'Cómo funciona']],           // sin sesión
  col: [['/panel', 'Mi panel', true], ['/proyectos', 'Proyectos'], ['/panel/postulaciones', 'Postulaciones'], ['/panel/mensajes', 'Mensajes']], // colaboradora
  org: [['/org', 'Panel', true], ['/org/proyectos', 'Mis proyectos'], ['/org/colaboradoras', 'Colaboradoras'], ['/org/mensajes', 'Mensajes']],  // organización
};

// Un ícono por ítem de MENUS[rol], EN EL MISMO ORDEN (los usa la barra inferior del móvil).
export const ICONOS = {
  col: ['panel', 'proyectos', 'postulaciones', 'mensajes'],
  org: ['panel', 'proyectos', 'colaboradoras', 'mensajes'],
};

// Etiquetas más cortas para la barra inferior del móvil (opcional).
export const ETIQUETA_MOVIL = { 'Mis proyectos': 'Proyectos', Colaboradoras: 'Personas' };

// Mensajes sin leer por rol (insignia roja). Con backend real viene de la API.
export const NO_LEIDOS = { col: 2, org: 1 };

// Enlaces del pie de página.
export const ENLACES_PIE = [
  { to: '/terminos', label: 'Términos y condiciones' },
  { to: '/accesibilidad', label: 'Accesibilidad' },
  { to: '/api-estadisticas', label: 'API de estadísticas' },
  { to: '/contacto', label: 'Contacto' },
];

/** Convierte el menú de un rol en los destinos de la barra inferior (móvil). */
export function destinosMovil(rol) {
  return MENUS[rol].map(([to, label, end], i) => ({
    to,
    end,
    label: ETIQUETA_MOVIL[label] || label,
    icon: ICONOS[rol][i],
    badge: label === 'Mensajes' ? NO_LEIDOS[rol] : 0,
  }));
}
