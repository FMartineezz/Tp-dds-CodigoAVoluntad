/**
 * SERVICIO de mensajes internos (colectivo ↔ persona colaboradora) y el ADAPTADOR que arma
 * las CONVERSACIONES.
 *
 * USO:
 *   const chats = await obtenerConversaciones('org', idColectivo);   (o 'col', idPersona)
 *   await enviarMensaje(chat, 'org', 'Hola');
 *   await marcarComoLeida(chat, 'org');
 * El backend devuelve una lista suelta de mensajes; una CONVERSACIÓN es el grupo de mensajes
 * con el mismo colectivo + persona + proyecto (así lo entiende el backend al responder).
 * Cada chat queda con la forma que dibuja la pantalla Mensajes:
 *   { id, colectivoId, personaId, proyectoId, con, proyecto, rel, hora, fecha, nuevos,
 *     msgs: [['yo' | 'ellos', texto], …] }
 */
import { api } from "./cliente.js";

// Quién escribe cada mensaje, como lo nombra el backend (campo `emisor`).
const EMISOR = { colectivo: "colectivo", colaboradora: "persona" };

// Relaciones para el filtro de la pantalla: la primera es «sin filtro».
// «Se postuló / Me postulé» = la persona tiene una postulación a ese proyecto;
// si no, la conversación la empezó el colectivo por su cuenta.
export const RELACIONES = {
  org: ["Todos", "Se postuló", "La contacté"],
  col: ["Todos", "Me postulé", "Me contactaron"],
};

// «Ahora», «Hace 5 min», «Hace 3 h», «Ayer» o la fecha corta (12/11).
// La usan también las notificaciones (api/organizacion.js).
export function textoDeCuando(fecha) {
  if (!fecha) return "";
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  if (minutos < 24 * 60) return `Hace ${Math.floor(minutos / 60)} h`;
  if (minutos < 48 * 60) return "Ayer";
  return new Date(fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

// Nombre para mostrar de una persona: nombre y apellido si los tiene; si no, su alias.
function nombreDePersona(p) {
  return [p?.nombre, p?.apellido].filter(Boolean).join(" ") || p?.nombreFantasia || "Colaboradora";
}

// Clave de una conversación: colectivo + persona + proyecto.
export function claveDeConversacion(colectivoId, personaId, proyectoId) {
  return `${colectivoId}-${personaId}-${proyectoId}`;
}

// ADAPTADOR: lista de mensajes del backend → lista de conversaciones (la más reciente
// primero). `rol` es quién mira ('org' o 'col'); `postulo(chat)` dice si la persona se
// postuló a ese proyecto (para la etiqueta de relación).
function aConversaciones(mensajes, rol, postulo) {
  const yo = EMISOR[rol];
  const grupos = new Map();
  // Del más viejo al más nuevo, para que los mensajes queden en orden dentro del chat.
  const ordenados = [...mensajes].sort((a, b) => new Date(a.date) - new Date(b.date));

  for (const m of ordenados) {
    const colectivoId = m.colectivo?._id ?? m.colectivo;
    const personaId = m.personaColaboradora?._id ?? m.personaColaboradora;
    const proyectoId = m.proyecto?._id ?? m.proyecto;
    const id = claveDeConversacion(colectivoId, personaId, proyectoId);
    // Si es el primer mensaje de esta conversación, se crea el chat vacío.
    if (!grupos.has(id)) {
      grupos.set(id, {
        id,
        colectivoId,
        personaId,
        proyectoId,
        // Con quién se habla: la org ve a la persona; la persona ve al colectivo.
        con:
          rol === "org"
            ? nombreDePersona(m.personaColaboradora)
            : (m.colectivo?.nombre ?? "Colectivo"),
        proyecto: m.proyecto?.titulo ?? "Proyecto",
        // Si la persona bloqueó los mensajes, el colectivo ya no le puede escribir.
        bloqueada: rol === "org" && Boolean(m.personaColaboradora?.bloquearMensajeInterno),
        nuevos: 0,
        msgs: [],
      });
    }
    const chat = grupos.get(id);
    const esMio = m.emisor === yo;
    chat.msgs.push([esMio ? "yo" : "ellos", m.texto]);
    // Sin leer = lo escribió la otra parte y todavía no lo marcó como leído.
    if (!esMio && !m.leido) chat.nuevos += 1;
    chat.fecha = m.date;
    chat.hora = textoDeCuando(m.date);
  }

  const chats = [...grupos.values()].map((chat) => ({
    ...chat,
    rel: RELACIONES[rol][postulo(chat) ? 1 : 2],
  }));
  // La conversación con el mensaje más reciente va primero.
  return chats.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// GET /colectivos/:id/mensajes (org) o GET /colaboradoras/:id/mensajes (col), más las
// postulaciones para saber la relación de cada chat. Devuelve la lista de conversaciones.
export async function obtenerConversaciones(rol, idCuenta) {
  if (rol === "org") {
    const [{ data: mensajes }, { data: postulaciones }] = await Promise.all([
      api.get(`/colectivos/${idCuenta}/mensajes`),
      api.get(`/colectivos/${idCuenta}/postulaciones`),
    ]);
    // El backend manda el TÍTULO del proyecto en la postulación (no su id).
    const postulo = (chat) =>
      postulaciones.some(
        (p) =>
          String(p.personaColaboradora?.id) === String(chat.personaId) &&
          p.proyecto === chat.proyecto,
      );
    return aConversaciones(mensajes, rol, postulo);
  }
  const [{ data: mensajes }, { data: postulaciones }] = await Promise.all([
    api.get(`/colaboradoras/${idCuenta}/mensajes`),
    api.get(`/colaboradoras/${idCuenta}/postulaciones`),
  ]);
  const postulo = (chat) => postulaciones.some((p) => p.proyecto === chat.proyecto);
  return aConversaciones(mensajes, rol, postulo);
}

// POST /mensajes → envía `texto` en la conversación `chat` de parte de `rol`.
// La persona solo puede responder conversaciones que ya empezó el colectivo (ERR 403).
export async function enviarMensaje(chat, rol, texto) {
  const { data } = await api.post("/mensajes", {
    colectivoId: chat.colectivoId,
    personaColaboradoraId: chat.personaId,
    proyectoId: chat.proyectoId,
    emisor: EMISOR[rol],
    texto,
  });
  return data;
}

// PATCH /mensajes → marca como leídos los mensajes que la OTRA parte escribió en `chat`.
// `lector` es quién los leyó ('colectivo' o 'persona').
export async function marcarComoLeida(chat, rol) {
  const { data } = await api.patch("/mensajes", {
    colectivoId: chat.colectivoId,
    personaColaboradoraId: chat.personaId,
    proyectoId: chat.proyectoId,
    lector: EMISOR[rol],
    leido: true,
  });
  return data;
}

// Cuenta los mensajes no leídos que escribió la OTRA parte (para la insignia del menú).
export async function obtenerCantidadNoLeidos(rol, idCuenta) {
  if (!rol || !idCuenta) return 0;
  const ruta =
    rol === "org" ? `/colectivos/${idCuenta}/mensajes` : `/colaboradoras/${idCuenta}/mensajes`;
  const otroEmisor = rol === "org" ? "persona" : "colectivo";
  const { data } = await api.get(ruta);
  return data.filter((m) => m.emisor === otroEmisor && !m.leido).length;
}
