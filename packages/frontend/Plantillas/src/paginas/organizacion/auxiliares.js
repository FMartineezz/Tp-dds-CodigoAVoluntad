/**
 * AUXILIARES de las pantallas de organización: constantes y funciones que usan
 * varias pantallas de esta carpeta.
 * Si cambiás algo acá, cambia en todas las pantallas que lo importan.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS: `MIS`, la lista de proyectos de la organización que tiene la sesión.
 *   2. FUNCIONES: `persona`, que busca una colaboradora a partir de su id.
 */
import { COLABORADORAS, PROYECTOS } from '../../datos';

// ───── 1. DATOS ─────

// MIS = «mis proyectos»: los proyectos del colectivo 1 (Asamblea Barrial Norte).
// En el prototipo la organización logueada es siempre la del colectivo 1; con una API
// real, esto vendría del servidor según quién inició sesión.
// Se usa en: PanelOrg (cifras y tarjetas) y ProyectosOrg (la tabla).
// Si se cambia el número 1, esas dos pantallas pasan a mostrar los proyectos de otro
// colectivo. (.filter se explica en docs/GLOSARIO.md → Métodos de arrays)
export const MIS = PROYECTOS.filter((proyecto) => proyecto.colectivoId === 1);

// ───── 2. FUNCIONES ─────

// persona(id) devuelve la colaboradora que tiene ese id, o `undefined` si no existe.
// Se usa en: FormProyecto, PostulacionesOrg, EquipoOrg y PerfilColaboradora.
// Si se cambia, todas esas pantallas cambian cómo encuentran a las personas; las que
// reciben `undefined` (por ejemplo PerfilColaboradora) muestran «no encontrada».
// (.find se explica en docs/GLOSARIO.md → Métodos de arrays)
export const persona = (id) =>
  COLABORADORAS.find((colaboradora) => colaboradora.id === id);
