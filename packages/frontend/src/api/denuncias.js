/**
 * SERVICIO de denuncias (lo que usa una colaboradora; lo administrativo no va acá).
 *
 * USO: await denunciarColaboracion(colaboracionId, 'Qué pasó…');
 * La denuncia se hace SOBRE UNA COLABORACIÓN: el backend deduce solo a qué colectivo
 * se denuncia (colaboración → proyecto → colectivo).
 */
import { api } from './cliente.js';

// POST /colaboraciones/:id/denuncia → registra la denuncia (nace «pendiente»).
// Si ya se denunció esa colaboración, o no existe, Axios lanza el error { code, message }.
export async function denunciarColaboracion(colaboracionId, descripcion) {
  const { data } = await api.post(`/colaboraciones/${colaboracionId}/denuncia`, { descripcion });
  return data;
}

// Colaboraciones de una persona (para saber si puede denunciar y sobre cuál).
// GET /colaboradoras/:id/colaboraciones trae su historial completo: activas, dadas de baja y
// también las anónimas propias. Devuelve [{ id, proyectoId, colectivoId, denunciada }]
// (`denunciada` = ya tiene una denuncia: el backend acepta una sola por colaboración).
export async function obtenerColaboracionesDePersona(personaId) {
  const { data } = await api.get(`/colaboradoras/${personaId}/colaboraciones`);
  return data.map((c) => ({
    id: c._id,
    proyectoId: c.proyecto?._id ?? c.proyecto,
    colectivoId: c.proyecto?.colectivo?._id ?? c.proyecto?.colectivo ?? null,
    denunciada: Boolean(c.denunciada),
  }));
}
