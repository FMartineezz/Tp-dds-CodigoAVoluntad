export const MENUS = {
  null: [
    ["/proyectos", "Proyectos"],
    ["/colectivos", "Colectivos"],
    ["/como-funciona", "Cómo funciona"],
  ],
  col: [
    ["/panel", "Mi panel", true],
    ["/proyectos", "Proyectos"],
    ["/panel/postulaciones", "Postulaciones"],
    ["/panel/mensajes", "Mensajes"],
  ],
  org: [
    ["/org", "Panel", true],
    ["/org/proyectos", "Mis proyectos"],
    ["/org/colaboradoras", "Colaboradoras"],
    ["/org/mensajes", "Mensajes"],
  ],
};

// Un ícono por ítem de MENUS[rol], EN EL MISMO ORDEN (los usa la barra inferior del móvil).
export const ICONOS = {
  col: ["panel", "proyectos", "postulaciones", "mensajes"],
  org: ["panel", "proyectos", "colaboradoras", "mensajes"],
};

// Etiquetas más cortas para la barra inferior del móvil (opcional).
export const ETIQUETA_MOVIL = { "Mis proyectos": "Proyectos", Colaboradoras: "Personas" };

// Enlaces del pie de página.
export const ENLACES_PIE = [
  { to: "/terminos", label: "Términos y condiciones" },
  { to: "/accesibilidad", label: "Accesibilidad" },
  { to: "/api-estadisticas", label: "API de estadísticas" },
  { to: "/contacto", label: "Contacto" },
];

/** Convierte el menú de un rol en los destinos de la barra inferior (móvil). */
export function destinosMovil(rol, noLeidos = 0) {
  return MENUS[rol].map(([to, label, end], i) => ({
    to,
    end,
    label: ETIQUETA_MOVIL[label] || label,
    icon: ICONOS[rol][i],
    badge: label === "Mensajes" ? noLeidos : 0,
  }));
}
