/**
 * SERVICIO del panel de ORGANIZACIÓN (colectivo con sesión): una función por endpoint y los
 * ADAPTADORES que traducen lo que manda el backend a la forma que usan las pantallas de
 * src/paginas/organizacion.
 *
 * USO (siempre con el id del colectivo que tiene la sesión, el `id` de useAuth()):
 *   const colectivo = await obtenerMiColectivo(id);
 *   const proyectos = await obtenerProyectosDelColectivo(id);       → [proyecto…]
 *   const postulaciones = await obtenerPostulacionesDelColectivo(id); → [postulación…]
 *   await resolverPostulacion(idPostulacion, 'aceptada');
 * Las funciones que MODIFICAN algo (crear, actualizar, borrar) devuelven la respuesta del
 * backend; si falla, Axios lanza el error y la pantalla lo muestra con mensajeDeError(error).
 * SI EL BACKEND CAMBIA UN NOMBRE: se arregla solo acá, en el adaptador correspondiente.
 */
import { api } from "./cliente.js";
import { aProyectoDeLaVista } from "./proyectos.js";
import { nombresDeHabilidades, obtenerHabilidades, titulos } from "./habilidades.js";
import { textoDeCuando } from "./mensajes.js";

// ───── VALORES QUE ACEPTA EL BACKEND ─────
// El backend guarda tipos y ubicaciones en minúsculas y sin tildes; la pantalla los muestra
// lindos. Cada opción es { valor: lo que viaja al backend, texto: lo que se ve }.

export const TIPOS_DE_COLECTIVO = [
  { valor: "fundacion", texto: "Fundación" },
  { valor: "ong", texto: "ONG" },
  { valor: "asociacion barrial", texto: "Asociación barrial" },
  { valor: "asamblea", texto: "Asamblea" },
];

export const UBICACIONES = [
  ["argentina", "Argentina"],
  ["caba", "CABA"],
  ["buenos aires", "Buenos Aires"],
  ["catamarca", "Catamarca"],
  ["chaco", "Chaco"],
  ["chubut", "Chubut"],
  ["cordoba", "Córdoba"],
  ["corrientes", "Corrientes"],
  ["entre rios", "Entre Ríos"],
  ["formosa", "Formosa"],
  ["jujuy", "Jujuy"],
  ["la pampa", "La Pampa"],
  ["la rioja", "La Rioja"],
  ["mendoza", "Mendoza"],
  ["misiones", "Misiones"],
  ["neuquen", "Neuquén"],
  ["rio negro", "Río Negro"],
  ["salta", "Salta"],
  ["san juan", "San Juan"],
  ["san luis", "San Luis"],
  ["santa cruz", "Santa Cruz"],
  ["santa fe", "Santa Fe"],
  ["santiago del estero", "Santiago del Estero"],
  ["tierra del fuego", "Tierra del Fuego"],
  ["tucuman", "Tucumán"],
].map(([valor, texto]) => ({ valor, texto }));

// Redes sociales que acepta el backend (enum TipoRedSocial).
export const REDES_SOCIALES = [
  { valor: "instagram", texto: "Instagram" },
  { valor: "facebook", texto: "Facebook" },
  { valor: "linkedin", texto: "LinkedIn" },
  { valor: "github", texto: "GitHub" },
  { valor: "x", texto: "X" },
  { valor: "youtube", texto: "YouTube" },
  { valor: "tiktok", texto: "TikTok" },
];

// ───── COLECTIVO ─────

// ADAPTADOR: colectivo del backend → datos que usa el panel. Los valores quedan como los
// guarda el backend (por ejemplo tipo 'fundacion') porque el formulario los vuelve a mandar.
function aMiColectivo(c) {
  return {
    id: c._id,
    nombre: c.nombre,
    descripcion: c.descripcion ?? "",
    tipo: c.tipoDeColectivo ?? "",
    ubicacion: c.ubicacion ?? "",
    redes: c.redesSociales ?? [],
    proyectos: c.proyectos ?? [],
  };
}

// GET /colectivos/:id
export async function obtenerMiColectivo(colectivoId) {
  const { data } = await api.get(`/colectivos/${colectivoId}`);
  return aMiColectivo(data);
}

// PATCH /colectivos/:id → `cambios` con nombres del backend: { nombre, descripcion,
// tipoDeColectivo, ubicacion, redesSociales: [{ tipo, url }] }. Devuelve el colectivo nuevo.
export async function actualizarColectivo(colectivoId, cambios) {
  const { data } = await api.patch(`/colectivos/${colectivoId}`, cambios);
  return aMiColectivo(data);
}

// ───── PROYECTOS DEL COLECTIVO ─────

// GET /colectivos/:colectivoId/proyectos → todos los proyectos del colectivo (cualquier
// estado), con la forma de ProyectoCard. Se piden de a 100 (el máximo que acepta el backend)
// y se siguen pidiendo páginas hasta tenerlos todos.
// (Cuando src/api/proyectos.js exponga obtenerProyectosDeColectivo, se puede usar esa.)
export async function obtenerProyectosDelColectivo(colectivoId) {
  const nombres = await nombresDeHabilidades();
  const proyectos = [];
  let pagina = 1;
  let totalPaginas = 1;
  do {
    const { data } = await api.get(`/colectivos/${colectivoId}/proyectos`, {
      params: { pagina, limite: 100 },
    });
    proyectos.push(...data.resultados.map((p) => aProyectoDeLaVista(p, nombres)));
    totalPaginas = data.totalPaginas;
    pagina += 1;
  } while (pagina <= totalPaginas);
  return proyectos;
}

// POST /proyectos → crea un proyecto. `proyecto` ya viene con los nombres del backend
// (titulo, descripcion, colectivo = NOMBRE del colectivo, urlSistema, perfiles…).
export async function crearProyecto(proyecto) {
  const { data } = await api.post("/proyectos", proyecto);
  return data;
}

// PATCH /proyectos/:id → solo acepta { finalizado: true }, { fechaCierre } y { urlDonaciones }.
export async function actualizarProyecto(proyectoId, cambios) {
  const { data } = await api.patch(`/proyectos/${proyectoId}`, cambios);
  return data;
}

// Perfiles: POST, PATCH y DELETE /proyectos/:idProyecto/perfiles[/:idPerfil].
// Las habilidades viajan como CÓDIGOS (ver codigosDeHabilidades).
export async function agregarPerfil(proyectoId, perfil) {
  const { data } = await api.post(`/proyectos/${proyectoId}/perfiles`, perfil);
  return data;
}
export async function actualizarPerfil(proyectoId, perfilId, cambios) {
  const { data } = await api.patch(`/proyectos/${proyectoId}/perfiles/${perfilId}`, cambios);
  return data;
}
export async function eliminarPerfil(proyectoId, perfilId) {
  const { data } = await api.delete(`/proyectos/${proyectoId}/perfiles/${perfilId}`);
  return data;
}

// Logros: POST, PATCH y DELETE /proyectos/:proyectoId/logros[/:logroId].
// Cada logro es { descripcion, porcentaje, urlCodigoFuente }.
export async function agregarLogro(proyectoId, logro) {
  const { data } = await api.post(`/proyectos/${proyectoId}/logros`, logro);
  return data;
}
export async function actualizarLogro(proyectoId, logroId, cambios) {
  const { data } = await api.patch(`/proyectos/${proyectoId}/logros/${logroId}`, cambios);
  return data;
}
export async function eliminarLogro(proyectoId, logroId) {
  const { data } = await api.delete(`/proyectos/${proyectoId}/logros/${logroId}`);
  return data;
}

// El backend recibe las habilidades por CÓDIGO, pero la pantalla las muestra por título.
// Devuelve un Map título → código armado con el catálogo (GET /habilidades).
export async function codigosDeHabilidades() {
  const habilidades = await obtenerHabilidades();
  return new Map(habilidades.map((h) => [h.titulo, h.codigo]));
}

// ───── POSTULACIONES ─────

// ADAPTADOR: postulación del backend → fila de la tabla.
// El backend manda el TÍTULO del proyecto y la DESCRIPCIÓN del perfil (para mostrar) y
// también proyectoId y perfilId (para filtrar y comparar).
function aPostulacionDeLaVista(p) {
  const persona = p.personaColaboradora ?? {};
  return {
    id: p.id ?? p._id,
    estado: p.estado,
    proyecto: p.proyecto,
    proyectoId: p.proyectoId,
    perfil: p.perfil,
    perfilId: p.perfilId,
    persona: {
      id: persona.id ?? persona._id,
      nombre: persona.nombreFantasia ?? "Colaboradora",
      habilidades: (persona.habilidades ?? []).map((h) => h.titulo),
      presentacion: persona.presentacion ?? "",
    },
  };
}

// GET /colectivos/:colectivoId/postulaciones[?estado=pendiente]
export async function obtenerPostulacionesDelColectivo(colectivoId, estado) {
  const { data } = await api.get(`/colectivos/${colectivoId}/postulaciones`, {
    params: estado ? { estado } : {},
  });
  return data.map(aPostulacionDeLaVista);
}

// PATCH /postulaciones/:postulacionId con { estado: 'aceptada' | 'rechazada' }.
// Aceptar crea la colaboración (el backend controla el cupo del perfil).
export async function resolverPostulacion(postulacionId, estado) {
  const { data } = await api.patch(`/postulaciones/${postulacionId}`, { estado });
  return data;
}

// ───── EQUIPO (COLABORACIONES) ─────

// GET /proyectos/:id/colaboraciones → el equipo del proyecto (activas y dadas de baja).
// Acá se quedan las activas: son las que forman el equipo hoy.
// Si la colaboración es anónima, `persona` queda en null.
export async function obtenerEquipoDelProyecto(proyectoId) {
  const { data } = await api.get(`/proyectos/${proyectoId}/colaboraciones`);
  return data
    .filter((c) => c.activo)
    .map((c) => ({
      id: c._id,
      perfilId: c.perfil,
      anonima: Boolean(c.anonima),
      persona: c.personaColaboradora ? aColaboradoraDeLaVista(c.personaColaboradora) : null,
    }));
}

// DELETE /colaboraciones/:id → baja lógica (libera el cupo del perfil).
export async function darDeBajaColaboracion(colaboracionId) {
  // ?por=colectivo deja registrado que la baja la dio la organización
  const { data } = await api.delete(`/colaboraciones/${colaboracionId}`, {
    params: { por: "colectivo" },
  });
  return data;
}

// ───── VALORACIONES ─────

// POST /valoraciones: el colectivo valora a la persona de una colaboración ya terminada.
export async function valorarColaboracion(colaboracionId, { puntaje, texto }) {
  const cuerpo = { colaboracionId, evaluador: "colectivo", puntaje };
  if (texto?.trim()) cuerpo.comentario = texto.trim();
  const { data } = await api.post("/valoraciones", cuerpo);
  return data;
}

// GET /colectivo/:colectivoId/valoraciones?direccion=emitidas → ids de las colaboraciones
// que el colectivo YA valoró (para no ofrecer «Valorar» dos veces).
export async function colaboracionesYaValoradas(colectivoId) {
  const { data } = await api.get(`/colectivo/${colectivoId}/valoraciones`, {
    params: { direccion: "emitidas" },
  });
  return new Set(data.map((v) => String(v.colaboracion)));
}

// GET /personaColaboradora/:id/valoraciones → las que recibió de los colectivos.
// El backend no dice QUÉ colectivo la escribió (no expone el autor).
export async function obtenerValoracionesDeColaboradora(personaId) {
  const { data } = await api.get(`/personaColaboradora/${personaId}/valoraciones`);
  return data.map((v) => ({
    id: v._id,
    puntaje: v.puntaje,
    texto: v.comentario ?? "",
    fecha: v.createdAt,
  }));
}

// ───── COLABORADORAS ─────

// ADAPTADOR: persona colaboradora del backend → forma de la vista.
// `nombres` (opcional) es el Map id → título de habilidades para traducirlas.
// Si el backend ya trae las habilidades como objetos { titulo }, se usan esos títulos.
export function aColaboradoraDeLaVista(p, nombres) {
  const completo = [p.nombre, p.apellido].filter(Boolean).join(" ");
  const habilidades = (p.habilidades ?? []).map((h) =>
    typeof h === "object" && h?.titulo ? h.titulo : nombres ? titulos([h], nombres)[0] : null,
  );
  return {
    id: p._id ?? p.id,
    alias: p.nombreFantasia ?? "",
    // Lo que se muestra como nombre: nombre y apellido si los cargó; si no, su alias.
    nombre: completo || p.nombreFantasia || "Colaboradora",
    pronombres: Array.isArray(p.pronombres) ? p.pronombres.join("/") : (p.pronombres ?? ""),
    bio: p.presentacion ?? "",
    git: p.git ?? "",
    redes: p.redesSociales ?? [],
    habilidades: habilidades.filter(Boolean),
    // true = acepta mensajes internos de los colectivos.
    mensajes: !p.bloquearMensajeInterno,
  };
}

// Una página de colaboradoras ya adaptadas: { resultados, pagina, totalPaginas, total }.
async function paginaDeColaboradoras(ruta, { pagina, limite }) {
  const [{ data }, nombres] = await Promise.all([
    api.get(ruta, { params: { pagina, limite } }),
    nombresDeHabilidades(),
  ]);
  return { ...data, resultados: data.resultados.map((p) => aColaboradoraDeLaVista(p, nombres)) };
}

// GET /colaboradoras?pagina=&limite=
export function obtenerColaboradoras({ pagina = 1, limite = 10 } = {}) {
  return paginaDeColaboradoras("/colaboradoras", { pagina, limite });
}

// GET /proyectos/:idProyecto/perfiles/:idPerfil/colaboradoras-acordes?pagina=&limite=
export function obtenerColaboradorasAcordes(
  proyectoId,
  perfilId,
  { pagina = 1, limite = 10 } = {},
) {
  return paginaDeColaboradoras(
    `/proyectos/${proyectoId}/perfiles/${perfilId}/colaboradoras-acordes`,
    { pagina, limite },
  );
}

// GET /colaboradoras/:id
export async function obtenerColaboradora(personaId) {
  const [{ data }, nombres] = await Promise.all([
    api.get(`/colaboradoras/${personaId}`),
    nombresDeHabilidades(),
  ]);
  return aColaboradoraDeLaVista(data, nombres);
}

// ───── NOTIFICACIONES ─────

// GET /colectivos/:colectivoId/notificaciones → [{ id, texto, cuando }] para la campana.
export async function obtenerNotificacionesDelColectivo(colectivoId) {
  const { data } = await api.get(`/colectivos/${colectivoId}/notificaciones`);
  return data.map((n) => ({ id: n._id, texto: n.texto, cuando: textoDeCuando(n.createdAt) }));
}
