/**
 * SERVICIO de personas colaboradoras: una función por endpoint del backend.
 *
 * USO:
 *   const pagina = await obtenerColaboradoras({ pagina: 1, limite: 100 });
 *     → { resultados: [{ id, nombreFantasia, … }], pagina, limite, total, totalPaginas }
 *   const creada = await crearColaboradora({ nombreFantasia, git, habilidades, presentacion, … });
 * Los medios de contacto nunca vienen en los GET (son privados).
 * (Lo del panel de la colaboradora —perfil, postulaciones, colaboraciones— está en
 * api/colaboradora.js, en singular.)
 */
import { api } from './cliente.js';

// ADAPTADOR (versión corta, lo que usan las pantallas públicas y de acceso).
function aColaboradoraDeLaVista(c) {
  return {
    // El GET trae `_id`; la respuesta del POST trae `id`.
    id: c._id ?? c.id,
    nombreFantasia: c.nombreFantasia,
    nombre: c.nombre ?? '',
    apellido: c.apellido ?? '',
  };
}

// GET /colaboradoras?pagina=&limite= → una página de colaboradoras (de la más nueva a la más vieja).
export async function obtenerColaboradoras({ pagina = 1, limite = 20 } = {}) {
  const { data } = await api.get('/colaboradoras', { params: { pagina, limite } });
  return { ...data, resultados: data.resultados.map(aColaboradoraDeLaVista) };
}

// POST /colaboradoras → registra una colaboradora. `datos` tiene que venir como lo pide el
// backend: habilidades como CÓDIGOS (no títulos ni ids), contactos como { tipo, valor }.
// Si algo no valida, Axios lanza el error con { code, message } del backend.
export async function crearColaboradora(datos) {
  const { data } = await api.post('/colaboradoras', datos);
  return aColaboradoraDeLaVista(data);
}

