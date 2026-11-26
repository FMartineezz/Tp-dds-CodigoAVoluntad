/**
 * SERVICIO de proyectos: una función por endpoint y el ADAPTADOR de proyecto.
 *
 * USO:
 *   const pagina = await obtenerProyectos({ pagina: 1, limite: 6 });
 *     → { resultados: [proyecto…], pagina, limite, total, totalPaginas }
 *   const proyecto = await obtenerProyecto(id);
 *   const pagina = await obtenerProyectosDeColectivo(colectivoId, { pagina: 1, limite: 6 });
 *   await postularmeAPerfil(proyectoId, perfilId, { personaColaboradoraId, anonima });
 *   const ocupantes = await obtenerOcupantesDelProyecto(id);  → { [perfilId]: [ocupante…] }
 * Los proyectos salen con la forma que esperan ProyectoCard y las pantallas (ver aProyectoDeLaVista).
 * Otras áreas (panel de colaboradora, de organización) importan aProyectoDeLaVista de acá.
 */
import { api } from './cliente.js';
import { nombresDeHabilidades, titulos } from './habilidades.js';

export const COMPROMISOS = { total: 'en total', semanal: 'por semana', mensual: 'por mes' };
export const MODALIDADES = {
  gratuita: 'Gratuita',
  incentivo_economico: 'Incentivo económico',
  contratacion_eventual: 'Posible contratación',
};

// «3 h por semana» a partir de un perfil del backend.
export function textoDeTiempo(perfil) {
  if (!perfil?.horas) return 'A convenir';
  return `${perfil.horas} h ${COMPROMISOS[perfil.tipoDeCompromiso] ?? ''}`.trim();
}

// Estado que entiende StatusBadge: 'abierto' si todavía busca gente, 'cerrado' si no.
// Busca gente si no terminó, no se cerró la búsqueda a mano y no venció la fecha límite.
export function estadoDelProyecto(p) {
  const vencida = p.fechaLimiteBusqueda && new Date(p.fechaLimiteBusqueda) < new Date();
  return p.finalizado || p.busquedaCerrada || vencida ? 'cerrado' : 'abierto';
}

// Avance = suma de los porcentajes de los logros (hitos) cumplidos.
export function avanceDelProyecto(p) {
  return Math.min(100, (p.logros ?? []).reduce((total, logro) => total + (logro.porcentaje ?? 0), 0));
}

// Lista sin repetidos (para juntar habilidades y modalidades de todos los perfiles).
const sinRepetidos = (lista) => [...new Set(lista)];

// ADAPTADOR: proyecto del backend → proyecto como lo esperan los componentes.
// `nombres` es el Map id → título de habilidades (nombresDeHabilidades()).
// `colectivo` puede venir como id (texto) o como objeto { _id, nombre } si el backend lo trae.
export function aProyectoDeLaVista(p, nombres) {
  const perfiles = p.perfiles ?? [];
  const colectivo = p.colectivo && typeof p.colectivo === 'object' ? p.colectivo : null;
  return {
    id: p._id,
    titulo: p.titulo,
    descripcion: p.descripcion,
    colectivo: colectivo?.nombre ?? '',
    colectivoId: colectivo?._id ?? p.colectivo,
    estado: estadoDelProyecto(p),
    finalizado: Boolean(p.finalizado),
    busquedaCerrada: Boolean(p.busquedaCerrada),
    habilidades: sinRepetidos(perfiles.flatMap((perfil) => titulos(perfil.habilidadesRequeridas, nombres))),
    tiempo: perfiles.length ? textoDeTiempo(perfiles[0]) : 'A convenir',
    modalidad: sinRepetidos(perfiles.map((perfil) => MODALIDADES[perfil.modalidadDeColaboracion]).filter(Boolean)),
    avance: avanceDelProyecto(p),
    logros: p.logros ?? [],
    urlSistema: p.urlSistema ?? null,
    urlDonaciones: p.urlDonaciones ?? null,
    fechaCierre: p.fechaCierre ?? null,
    fechaLimiteBusqueda: p.fechaLimiteBusqueda ?? null,
    // Los perfiles quedan como vienen del backend, con las habilidades ya traducidas a títulos.
    perfiles: perfiles.map((perfil) => ({
      ...perfil,
      id: perfil._id,
      requeridas: titulos(perfil.habilidadesRequeridas, nombres),
      opcionales: titulos(perfil.habilidadesOpcionales, nombres),
      tiempo: textoDeTiempo(perfil),
      modalidad: MODALIDADES[perfil.modalidadDeColaboracion] ?? perfil.modalidadDeColaboracion,
    })),
  };
}

// GET /proyectos?pagina=&limite= → una página de proyectos (del más nuevo al más viejo).
export async function obtenerProyectos({ pagina = 1, limite = 20 } = {}) {
  const [{ data }, nombres] = await Promise.all([
    api.get('/proyectos', { params: { pagina, limite } }),
    nombresDeHabilidades(),
  ]);
  return { ...data, resultados: data.resultados.map((p) => aProyectoDeLaVista(p, nombres)) };
}

// GET /proyectos/:id → un proyecto. Si no existe, Axios lanza un error con status 404.
export async function obtenerProyecto(id) {
  const [{ data }, nombres] = await Promise.all([api.get(`/proyectos/${id}`), nombresDeHabilidades()]);
  return aProyectoDeLaVista(data, nombres);
}

// GET /colectivos/:colectivoId/proyectos?pagina=&limite= → una página con los proyectos de un
// colectivo (todos: abiertos, cerrados y finalizados). Si el colectivo no existe → 404.
// El backend manda el colectivo solo como id: si la pantalla ya sabe el nombre, lo pasa en
// `nombreColectivo` para que la tarjeta lo muestre.
export async function obtenerProyectosDeColectivo(colectivoId, { pagina = 1, limite = 20, nombreColectivo = '' } = {}) {
  const [{ data }, nombres] = await Promise.all([
    api.get(`/colectivos/${colectivoId}/proyectos`, { params: { pagina, limite } }),
    nombresDeHabilidades(),
  ]);
  return {
    ...data,
    resultados: data.resultados.map((p) => {
      const proyecto = aProyectoDeLaVista(p, nombres);
      return { ...proyecto, colectivo: proyecto.colectivo || nombreColectivo };
    }),
  };
}

// POST /proyectos/:proyectoId/perfiles/:perfilId/postulaciones → la colaboradora se postula a
// un perfil. Nace «pendiente» hasta que el colectivo la acepte o rechace.
// `anonima: true` = si la aceptan, la colaboración figura sin su nombre.
// Si el backend la rechaza (no tiene las habilidades, búsqueda cerrada, ya se postuló…),
// Axios lanza el error con { code, message } y la pantalla muestra ese mensaje.
export async function postularmeAPerfil(proyectoId, perfilId, { personaColaboradoraId, anonima = false }) {
  const { data } = await api.post(`/proyectos/${proyectoId}/perfiles/${perfilId}/postulaciones`, {
    personaColaboradoraId,
    anonima,
  });
  return data;
}

// Colaboraciones ACTIVAS de un proyecto, agrupadas por perfil: { [perfilId]: [ocupante…] }.
// Cada ocupante es { colaboracionId, personaId, nombre, anonima }.
// GET /proyectos/:id/colaboraciones trae el equipo (activas y dadas de baja): ocupan lugar
// solo las activas.
export async function obtenerOcupantesDelProyecto(proyectoId) {
  const { data } = await api.get(`/proyectos/${proyectoId}/colaboraciones`);
  const porPerfil = {};
  data
    .filter((c) => c.activo)
    .forEach((c) => {
      const perfilId = String(c.perfil?._id ?? c.perfil);
      const persona = c.personaColaboradora;
      // Si es anónima el backend manda personaColaboradora: null.
      const ocupante = {
        colaboracionId: c._id,
        personaId: persona?._id ?? null,
        nombre: c.anonima || !persona ? 'Contribución anónima' : persona.nombreFantasia,
        anonima: Boolean(c.anonima || !persona),
      };
      porPerfil[perfilId] = [...(porPerfil[perfilId] ?? []), ocupante];
    });
  return porPerfil;
}

