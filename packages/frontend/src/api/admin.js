/**
 * SERVICIO del equipo administrativo: denuncias, reportes de problemas y bajas de cuentas.
 *
 * USO:
 *   const denuncias = await obtenerDenuncias({ estado: 'pendiente', colectivoId });
 *   const denuncia = await obtenerDenuncia(id);
 *   await cambiarEstadoDenuncia(id, 'resuelta');
 *   const reportes = await obtenerReportes('nuevo');
 *   await cambiarEstadoReporte(id, 'resuelto');
 *   await darDeBajaColectivo(id);   await eliminarColaboradora(id);
 * Las listas de colectivos, proyectos y colaboradoras salen de las mismas funciones que usa
 * el resto del sitio (api/colectivos.js, api/proyectos.js, api/organizacion.js).
 * PENDIENTE (login): las rutas /admin/… todavía no están protegidas en el backend.
 */
import { api, sinVacios } from './cliente.js';

// Estados de una denuncia: valor del backend → texto que se ve.
export const ESTADOS_DE_DENUNCIA = {
  pendiente: 'Pendiente',
  en_revision: 'En revisión',
  resuelta: 'Resuelta',
  descartada: 'Descartada',
};

// Estados de un reporte de problema: valor del backend → texto que se ve.
export const ESTADOS_DE_REPORTE = {
  nuevo: 'Nuevo',
  en_revision: 'En revisión',
  resuelto: 'Resuelto',
};

// ───── Denuncias ─────

// ADAPTADOR: denuncia del backend → lo que usan las pantallas.
function aDenunciaDeLaVista(d) {
  return {
    id: d._id ?? d.id,
    descripcion: d.descripcion,
    fecha: new Date(d.fecha),
    estado: d.estado,
    colectivoId: d.colectivoId,
    colectivo: d.colectivoNombre ?? '',
  };
}

// GET /admin/denuncias?estado=&colectivoId= → las más nuevas primero.
export async function obtenerDenuncias({ estado, colectivoId } = {}) {
  const { data } = await api.get('/admin/denuncias', { params: sinVacios({ estado, colectivoId }) });
  return data.map(aDenunciaDeLaVista);
}

// GET /admin/denuncias/:id → la denuncia con quién la hizo y desde qué proyecto.
// La persona puede venir null (la colaboración se borró) y su nombre puede ser el alias.
export async function obtenerDenuncia(id) {
  const { data } = await api.get(`/admin/denuncias/${id}`);
  const persona = data.colaboracion?.personaColaboradora;
  const proyecto = data.colaboracion?.proyecto;
  return {
    ...aDenunciaDeLaVista(data),
    persona: persona
      ? {
          id: persona._id,
          nombre: persona.nombreFantasia,
          contactos: persona.contactos ?? [],
        }
      : null,
    proyecto: proyecto ? { id: proyecto._id, titulo: proyecto.titulo } : null,
  };
}

// PATCH /admin/denuncias/:id/estado → en_revision | resuelta | descartada.
export async function cambiarEstadoDenuncia(id, estado) {
  const { data } = await api.patch(`/admin/denuncias/${id}/estado`, { estado });
  return aDenunciaDeLaVista(data);
}

// ───── Reportes de problemas ─────

// GET /admin/reportes?estado= → los más nuevos primero.
export async function obtenerReportes(estado) {
  const { data } = await api.get('/admin/reportes', { params: sinVacios({ estado }) });
  return data.map((r) => ({
    id: r._id,
    tipo: r.tipo,
    descripcion: r.descripcion,
    pantalla: r.pantalla,
    correo: r.correo,
    estado: r.estado,
    fecha: new Date(r.fecha),
  }));
}

// PATCH /admin/reportes/:id/estado → nuevo | en_revision | resuelto.
export async function cambiarEstadoReporte(id, estado) {
  await api.patch(`/admin/reportes/${id}/estado`, { estado });
}

// ───── Bajas ─────

// DELETE /colectivos/:id → baja lógica: deja de listarse y se borran sus contactos.
export async function darDeBajaColectivo(id) {
  await api.delete(`/colectivos/${id}`);
}

// DELETE /colaboradoras/:id → la cuenta se anonimiza (sus datos públicos se borran).
export async function eliminarColaboradora(id) {
  await api.delete(`/colaboradoras/${id}`);
}

// Fecha corta para las tablas: «25/11/2026».
export const fechaCorta = (fecha) => fecha.toLocaleDateString('es-AR');
