/**
 * SERVICIO de habilidades: el catálogo (GET /habilidades).
 *
 * USO:
 *   const habilidades = await obtenerHabilidades();      → [{ id, titulo, codigo, descripcion }]
 *   const nombres = await nombresDeHabilidades();        → Map id → título
 * El backend guarda las habilidades de proyectos y personas como ids: para mostrarlas hay que
 * traducirlas con este catálogo. Se pide UNA sola vez y se guarda (cambia muy poco).
 */
import { api } from './cliente.js';

// Promesa guardada: el primer pedido la crea y los siguientes reutilizan la misma.
let catalogo = null;

export function obtenerHabilidades() {
  if (!catalogo) {
    catalogo = api
      .get('/habilidades')
      .then(({ data }) =>
        data.map((h) => ({ id: h._id, titulo: h.titulo, codigo: h.codigo, descripcion: h.descripcion }))
      )
      .catch((error) => {
        // Si falló, se olvida para que el próximo intento vuelva a pedirlo.
        catalogo = null;
        throw error;
      });
  }
  return catalogo;
}

export async function nombresDeHabilidades() {
  const habilidades = await obtenerHabilidades();
  return new Map(habilidades.map((h) => [h.id, h.titulo]));
}

// Traduce una lista de ids a títulos con el Map de nombresDeHabilidades().
export function titulos(ids = [], nombres) {
  return ids.map((id) => nombres.get(String(id?._id ?? id)) ?? 'Habilidad');
}
