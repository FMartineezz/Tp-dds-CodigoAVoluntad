/**
 * SERVICIO de colectivos: una función por endpoint del backend.
 *
 * USO:
 *   const colectivo = await obtenerColectivo(id);
 *   const pagina = await obtenerColectivos({ pagina: 1, limite: 6 });
 *     → { resultados: [colectivo…], pagina, limite, total, totalPaginas }
 *   const valoraciones = await obtenerValoracionesDelColectivo(id);
 *   (Los proyectos de un colectivo están en api/proyectos.js → obtenerProyectosDeColectivo.)
 *   const creado = await crearColectivo({ nombre, descripcion, tipoDeColectivo, ubicacion });
 * Cada función devuelve los datos YA TRADUCIDOS a la forma que usan los componentes
 * (ver aColectivoDeLaVista). Si el backend cambia un nombre, se arregla solo acá.
 */
import { urlDeFotoSubida } from './fotos.js';
import { api } from './cliente.js';

// El backend guarda el tipo en minúsculas y sin tildes; la pantalla lo muestra lindo.
// La clave es el valor que acepta el backend (enum TipoColectivo); el valor, el texto lindo.
export const TIPOS = {
  fundacion: 'Fundación',
  ong: 'ONG',
  'asociacion barrial': 'Asociación barrial',
  asamblea: 'Asamblea',
};

// Lo mismo con la ubicación: el backend acepta solo estos valores (enum Ubicacion, en
// minúsculas y sin tildes) y la pantalla muestra el nombre con mayúsculas y tildes.
export const UBICACIONES = {
  argentina: 'Argentina',
  caba: 'CABA',
  'buenos aires': 'Buenos Aires',
  catamarca: 'Catamarca',
  chaco: 'Chaco',
  chubut: 'Chubut',
  cordoba: 'Córdoba',
  corrientes: 'Corrientes',
  'entre rios': 'Entre Ríos',
  formosa: 'Formosa',
  jujuy: 'Jujuy',
  'la pampa': 'La Pampa',
  'la rioja': 'La Rioja',
  mendoza: 'Mendoza',
  misiones: 'Misiones',
  neuquen: 'Neuquén',
  'rio negro': 'Río Negro',
  salta: 'Salta',
  'san juan': 'San Juan',
  'san luis': 'San Luis',
  'santa cruz': 'Santa Cruz',
  'santa fe': 'Santa Fe',
  'santiago del estero': 'Santiago del Estero',
  'tierra del fuego': 'Tierra del Fuego',
  tucuman: 'Tucumán',
};

// 'entre rios' → 'Entre Ríos'. Si llega un valor que no está en la tabla, se muestra tal cual.
export function textoDeUbicacion(ubicacion) {
  return UBICACIONES[ubicacion] ?? ubicacion ?? '';
}

// ADAPTADOR: colectivo como lo manda el backend → colectivo como lo esperan los componentes.
// `??` significa «lo de la izquierda, y si es null o undefined, lo de la derecha».
export function aColectivoDeLaVista(c) {
  return {
    // El GET trae `_id`; la respuesta del POST trae `id`.
    id: c._id ?? c.id,
    nombre: c.nombre,
    // URL de la foto que subió (null si no subió: se usa la del seed o la inicial).
    foto: urlDeFotoSubida('colectivos', c._id ?? c.id, c.fotoSubida),
    descripcion: c.descripcion,
    tipo: TIPOS[c.tipoDeColectivo] ?? c.tipoDeColectivo,
    // Valor del backend ('entre rios'), por si una pantalla lo necesita para editar.
    ubicacion: c.ubicacion,
    // Nombre lindo para mostrar ('Entre Ríos').
    ubicacionTexto: textoDeUbicacion(c.ubicacion),
    // Lista de { tipo: 'instagram', url: 'https://…' }
    redes: c.redesSociales ?? [],
    // Ids de los proyectos que publicó (el backend los guarda en el colectivo).
    proyectos: c.proyectos ?? [],
    // El backend todavía no tiene causas: lista vacía para que la pantalla no se rompa.
    causas: [],
  };
}

// GET /colectivos?pagina=&limite= → una página de colectivos (del más nuevo al más viejo).
export async function obtenerColectivos({ pagina = 1, limite = 20 } = {}) {
  const { data } = await api.get('/colectivos', { params: { pagina, limite } });
  return { ...data, resultados: data.resultados.map(aColectivoDeLaVista) };
}

// GET /colectivos/:id → un colectivo. Si no existe, Axios lanza un error con status 404.
export async function obtenerColectivo(id) {
  const { data } = await api.get(`/colectivos/${id}`);
  return aColectivoDeLaVista(data);
}

// GET /colectivo/:colectivoId/valoraciones → valoraciones que recibió (ojo: «colectivo» en
// singular en la ruta). Por privacidad el backend no dice quién escribió cada una.
export async function obtenerValoracionesDelColectivo(id) {
  const { data } = await api.get(`/colectivo/${id}/valoraciones`);
  return data.map((v) => ({
    id: v._id,
    puntaje: v.puntaje,
    comentario: v.comentario ?? '',
    fecha: v.createdAt ? new Date(v.createdAt) : null,
  }));
}

// POST /colectivos → crea un colectivo. `datos` ya tiene que venir con los valores que
// acepta el backend (tipoDeColectivo y ubicacion en minúsculas y sin tildes).
// Si algo no valida, Axios lanza el error con { code, message } del backend.
export async function crearColectivo(datos) {
  const { data } = await api.post('/colectivos', datos);
  return aColectivoDeLaVista(data);
}
