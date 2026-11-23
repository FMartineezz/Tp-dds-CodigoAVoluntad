/**
 * AUXILIARES de las pantallas de organización: pedidos que juntan varios endpoints y que
 * usan varias pantallas de esta carpeta.
 * Si cambiás algo acá, cambia en todas las pantallas que lo importan.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. PEDIDOS COMPUESTOS: `cargarPanel` (todo lo del panel) y `obtenerMiProyecto`
 *      (un proyecto, solo si es del colectivo con sesión).
 *   2. PANTALLA DE «NO EXISTE»: `esNoEncontrado`, para decidir cuándo mostrarla.
 */
import { obtenerProyecto } from '../../api/proyectos.js';
import {
  obtenerMiColectivo,
  obtenerPostulacionesDelColectivo,
  obtenerProyectosDelColectivo,
} from '../../api/organizacion.js';
import { obtenerConversaciones } from '../../api/mensajes.js';
import { esError } from '../../api/errores.js';

// ───── 1. PEDIDOS COMPUESTOS ─────

// Todo lo que muestra PanelOrg, pedido a la vez con Promise.all (los cuatro pedidos salen
// juntos y se espera a que lleguen todos). Si falla uno, falla todo y la pantalla avisa.
// Devuelve { colectivo, proyectos, pendientes, sinLeer }.
export async function cargarPanel(colectivoId) {
  const [colectivo, proyectos, pendientes, chats] = await Promise.all([
    obtenerMiColectivo(colectivoId),
    obtenerProyectosDelColectivo(colectivoId),
    obtenerPostulacionesDelColectivo(colectivoId, 'pendiente'),
    obtenerConversaciones('org', colectivoId),
  ]);
  // Mensajes sin leer = suma de los «nuevos» de cada conversación (.reduce acumula).
  const sinLeer = chats.reduce((total, chat) => total + chat.nuevos, 0);
  return { colectivo, proyectos, pendientes, sinLeer };
}

// Un proyecto (GET /proyectos/:id), pero SOLO si es del colectivo `colectivoId`.
// Si es de otra organización se responde igual que si no existiera: se lanza un error con
// la misma forma que un 404 de Axios, así la pantalla lo trata con el mismo `if`.
export async function obtenerMiProyecto(proyectoId, colectivoId) {
  const proyecto = await obtenerProyecto(proyectoId);
  if (String(proyecto.colectivoId) !== String(colectivoId)) {
    const error = new Error('El proyecto no es de esta organización');
    error.response = {
      status: 404,
      data: { code: 'ERR-NOT-108', message: 'El proyecto solicitado no fue encontrado' },
    };
    throw error;
  }
  return proyecto;
}

// ───── 2. PANTALLA DE «NO EXISTE» ─────

// true si el backend respondió 404 (o el proyecto es de otra organización).
export const esNoEncontrado = (error) => esError(error, 404);
