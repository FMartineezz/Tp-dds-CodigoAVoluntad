/**
 * AUXILIARES de las pantallas de colaboradora: constantes y funciones que usan varias
 * pantallas de esta carpeta.
 * Si cambiás algo acá, cambia en todas las pantallas que lo importan.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. proyecto: busca un proyecto de ejemplo por su id.
 */

// ───── Imports ─────
import { PROYECTOS } from '../../datos'; // lista de proyectos de ejemplo

// ───── 1. proyecto ─────
// Dado el id de un proyecto, devuelve el proyecto completo (título, colectivo, estado…)
// buscándolo en la lista PROYECTOS. `.find` devuelve el primero que coincide, o
// `undefined` si ese id no existe (ver docs/GLOSARIO.md → Métodos de arrays).
// Quién la usa: PanelCol (proyecto sugerido), PostulacionesCol (título de cada fila) y
// ProyectosCol (tarjetas, diálogos de baja y valoración).
// Si se cambia: cambia cómo las tres pantallas encuentran los datos de un proyecto;
// si devolviera otra cosa, esas pantallas podrían fallar al leer `.titulo`, etc.
export const proyecto = (id) => PROYECTOS.find((proyectoDeLaLista) => {
  return proyectoDeLaLista.id === id;
});
