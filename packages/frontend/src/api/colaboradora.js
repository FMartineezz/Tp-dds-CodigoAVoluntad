/**
 * SERVICIO del panel de la colaboradora: todo lo que pide «lo mío» una persona colaboradora
 * (su perfil, sus postulaciones, sus proyectos, sus notificaciones…).
 *
 * USO (siempre con el id de la sesión: const { id } = useAuth()):
 *   const perfil = await obtenerPerfil(id);                → ver aPerfilDeLaVista
 *   await guardarPerfil(id, perfil, { contactos });        → PATCH /colaboradoras/:id
 *   const postulaciones = await obtenerPostulaciones(id);  → [{ id, proyecto, perfil, estado, anonima }]
 *   const colaboraciones = await obtenerMisColaboraciones(id);
 *   await darseDeBaja(idColaboracion);  await valorarColectivo(idColaboracion, { puntaje, texto });
 *   const avisos = await obtenerNotificaciones(id);        → [{ id, texto, cuando }]
 *   const panel = await obtenerPanel(id);                  → todo lo que muestra /panel
 * Cada función devuelve los datos YA TRADUCIDOS a la forma que usan las pantallas
 * (los «adaptadores» de abajo). Si el backend cambia un nombre, se arregla solo acá.
 */
import { api } from "./cliente.js";
import { nombresDeHabilidades, obtenerHabilidades, titulos } from "./habilidades.js";
import { aProyectoDeLaVista } from "./proyectos.js";

// ───── Ayudas ─────

// «Hace 2 h», «Ayer», «Hace 5 días»… a partir de una fecha del backend (texto ISO).
export function haceCuanto(fecha) {
  if (!fecha) return "";
  const minutos = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
  if (minutos < 1) return "Recién";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "Ayer";
  if (dias < 30) return `Hace ${dias} días`;
  return new Date(fecha).toLocaleDateString("es-AR");
}

// Nombres que ve la persona en el editor de contactos ↔ tipos que entiende el backend.
const TIPOS_DE_CONTACTO = { Correo: "email", WhatsApp: "whatsapp", SMS: "sms" };

// ───── 1. Perfil ─────

// ADAPTADOR: colaboradora del backend → datos del formulario «Mi perfil».
// `nombres` es el Map id → título de habilidades. Los contactos NO vienen: el backend nunca
// los devuelve en un GET (son privados).
function aPerfilDeLaVista(c, nombres) {
  // Las redes llegan como lista [{ tipo, url }]; buscamos la de LinkedIn para su campo.
  const redes = c.redesSociales ?? [];
  const linkedin = redes.find((red) => red.tipo === "linkedin");
  return {
    fantasia: c.nombreFantasia ?? "",
    nombre: c.nombre ?? "",
    apellido: c.apellido ?? "",
    // El backend guarda los pronombres como lista (['ella', 'la']); el campo los muestra «ella/la».
    pronombres: (c.pronombres ?? []).join("/"),
    github: c.git ?? "",
    linkedin: linkedin?.url ?? "",
    bio: c.presentacion ?? "",
    // El backend pregunta lo contrario: «¿bloquear mensajes?». `!` lo da vuelta.
    mensajes: !c.bloquearMensajeInterno,
    habilidades: titulos(c.habilidades, nombres),
    // Se guardan tal cual para no perder las otras redes (GitHub, Instagram…) al guardar.
    redes,
  };
}

// GET /colaboradoras/:id → el perfil, listo para el formulario.
export async function obtenerPerfil(id) {
  const [{ data }, nombres] = await Promise.all([
    api.get(`/colaboradoras/${id}`),
    nombresDeHabilidades(),
  ]);
  return aPerfilDeLaVista(data, nombres);
}

// PATCH /colaboradoras/:id → guarda el formulario. `perfil` tiene la forma de
// aPerfilDeLaVista; `contactos` (opcional) es la lista [[tipo, dato]] del editor: si viene,
// REEMPLAZA todos los contactos que la persona tenía guardados.
export async function guardarPerfil(id, perfil, { contactos } = {}) {
  // El backend pide las habilidades por CÓDIGO (no por título ni por id).
  const catalogo = await obtenerHabilidades();
  const codigoDe = new Map(catalogo.map((h) => [h.titulo, h.codigo]));

  // La lista de redes se manda entera: las que no son LinkedIn quedan como estaban y LinkedIn
  // se agrega solo si el campo tiene algo.
  const redes = perfil.redes.filter((red) => red.tipo !== "linkedin");
  if (perfil.linkedin.trim()) redes.push({ tipo: "linkedin", url: perfil.linkedin.trim() });

  const cuerpo = {
    nombreFantasia: perfil.fantasia.trim(),
    git: perfil.github.trim(),
    nombre: perfil.nombre.trim(),
    apellido: perfil.apellido.trim(),
    // «ella/la» → ['ella', 'la'] (sin vacíos).
    pronombres: perfil.pronombres
      .split("/")
      .map((p) => p.trim())
      .filter(Boolean),
    presentacion: perfil.bio.trim(),
    bloquearMensajeInterno: !perfil.mensajes,
    habilidades: perfil.habilidades.map((titulo) => codigoDe.get(titulo)).filter(Boolean),
    redesSociales: redes,
  };
  if (contactos) {
    // [['WhatsApp', '+54 11 5555-0199']] → [{ tipo: 'whatsapp', valor: '541155550199' }]
    // A los teléfonos se les sacan espacios, guiones y el «+»: el backend pide solo dígitos.
    cuerpo.contactos = contactos.map(([tipo, valor]) => {
      const tipoBackend = TIPOS_DE_CONTACTO[tipo] ?? tipo;
      return {
        tipo: tipoBackend,
        valor: tipoBackend === "email" ? valor.trim() : valor.replace(/\D/g, ""),
      };
    });
  }
  const [{ data }, nombres] = await Promise.all([
    api.patch(`/colaboradoras/${id}`, cuerpo),
    nombresDeHabilidades(),
  ]);
  return aPerfilDeLaVista(data, nombres);
}

// ───── 2. Postulaciones ─────

// GET /colaboradoras/:id/postulaciones → todas, en cualquier estado.
// El backend manda `proyecto` como TÍTULO y `perfil` como DESCRIPCIÓN (para mostrar), y además
// `proyectoId` y `perfilId` (para enlazar y comparar).
export async function obtenerPostulaciones(id) {
  const { data } = await api.get(`/colaboradoras/${id}/postulaciones`);
  return data.map((p) => ({
    id: p.id ?? p._id,
    proyecto: p.proyecto,
    proyectoId: p.proyectoId,
    perfil: p.perfil,
    perfilId: p.perfilId,
    estado: p.estado,
    anonima: Boolean(p.anonima),
  }));
}

// ───── 3. Mis proyectos (colaboraciones) ─────

// GET /colaboradoras/:id/colaboraciones → su historial completo: activas, dadas de baja y
// también las anónimas. El proyecto viene adentro, con el nombre del colectivo.
export async function obtenerMisColaboraciones(id) {
  const [{ data }, nombres, valoradas] = await Promise.all([
    api.get(`/colaboradoras/${id}/colaboraciones`),
    nombresDeHabilidades(),
    idsDeColaboracionesValoradas(id),
  ]);
  // Si el proyecto se borró, `proyecto` llega null: esas se saltean.
  const mias = data.filter((c) => c.proyecto);

  return mias.map((c) => {
    const proyecto = aProyectoDeLaVista(c.proyecto, nombres);
    // El rol es la descripción del perfil al que se sumó (el perfil llega como id).
    const perfil = proyecto.perfiles.find((pf) => String(pf.id) === String(c.perfil));
    return {
      id: c._id,
      proyecto,
      rol: perfil?.descripcion ?? "Sin perfil",
      anonima: Boolean(c.anonima),
      // false si se dio de baja (ella o el colectivo); bajaPor dice quién: 'persona' | 'colectivo'
      activa: Boolean(c.activo),
      bajaPor: c.bajaPor ?? null,
      valorada: valoradas.has(String(c._id)),
    };
  });
}

// GET /personaColaboradora/:id/valoraciones?direccion=emitidas → ids de las colaboraciones
// que la persona ya valoró (para no ofrecer «Valorar» dos veces).
async function idsDeColaboracionesValoradas(id) {
  const { data } = await api.get(`/personaColaboradora/${id}/valoraciones`, {
    params: { direccion: "emitidas" },
  });
  return new Set(data.map((v) => String(v.colaboracion)));
}

// DELETE /colaboraciones/:id → baja lógica (permanente: habría que volver a postularse).
export async function darseDeBaja(idColaboracion) {
  // ?por=persona deja registrado que la baja la dio ella (no el colectivo)
  await api.delete(`/colaboraciones/${idColaboracion}`, { params: { por: "persona" } });
}

// POST /valoraciones → la persona valora al colectivo de una colaboración terminada.
// El backend calcula solo quién valora a quién a partir de la colaboración y `evaluador`.
export async function valorarColectivo(idColaboracion, { puntaje, texto }) {
  const cuerpo = { colaboracionId: idColaboracion, evaluador: "persona", puntaje };
  // El comentario es opcional: si quedó vacío no se manda.
  if (texto?.trim()) cuerpo.comentario = texto.trim();
  await api.post("/valoraciones", cuerpo);
}

// ───── 4. Notificaciones ─────

// GET /colaboradoras/:id/notificaciones → avisos automáticos, del más nuevo al más viejo.
export async function obtenerNotificaciones(id) {
  const { data } = await api.get(`/colaboradoras/${id}/notificaciones`);
  return data.map((n) => ({
    id: n._id,
    texto: n.texto,
    cuando: haceCuanto(n.createdAt),
    proyectoId: n.proyecto?._id ?? n.proyecto ?? null,
  }));
}

// ───── 5. Proyectos acordes ─────

// GET /colaboradoras/:id/proyectos-acordes?pagina=&limite= → página de proyectos no
// finalizados que buscan alguna de sus habilidades.
export async function obtenerProyectosAcordes(id, { pagina = 1, limite = 20 } = {}) {
  const [{ data }, nombres] = await Promise.all([
    api.get(`/colaboradoras/${id}/proyectos-acordes`, { params: { pagina, limite } }),
    nombresDeHabilidades(),
  ]);
  return { ...data, resultados: data.resultados.map((p) => aProyectoDeLaVista(p, nombres)) };
}

// ───── 6. Panel ─────

// Junta en un solo pedido todo lo que muestra /panel. Promise.all lanza los pedidos a la vez
// y espera a que terminen todos (si uno falla, falla todo y la pantalla muestra el error).
export async function obtenerPanel(id) {
  // Las notificaciones no van acá: las pide «Última actividad» (hooks/useNotificaciones.js).
  const [perfil, postulaciones, colaboraciones, mensajes, acordes] =
    await Promise.all([
      api.get(`/colaboradoras/${id}`).then(({ data }) => data),
      obtenerPostulaciones(id),
      obtenerMisColaboraciones(id),
      api.get(`/colaboradoras/${id}/mensajes`).then(({ data }) => data),
      obtenerProyectosAcordes(id, { pagina: 1, limite: 20 }),
    ]);
  return {
    nombre: perfil.nombreFantasia,
    pendientes: postulaciones.filter((p) => p.estado === "pendiente").length,
    proyectosActivos: colaboraciones.filter((c) => c.activa && !c.proyecto.finalizado).length,
    mensajes: mensajes.filter((m) => m.emisor === "colectivo" && !m.leido).length,
    // Como mucho tres (una fila de tarjetas). El backend ya manda solo los que aceptan
    // postulaciones; el filtro es por las dudas (ej. si la fecha límite vence justo ahora).
    sugeridos: acordes.resultados.filter((p) => p.estado === "abierto").slice(0, 3),
  };
}
