/**
 * Notificaciones de quien tiene la sesión, de la más nueva a la más vieja.
 *
 * USO: const { cargando, notificaciones } = useNotificaciones();
 *   → notificaciones = [{ id, texto, cuando }]   ([] si no hay sesión o si falló el pedido)
 * Cada rol tiene su endpoint: colaborador GET /colaboradoras/:id/notificaciones y
 * organización GET /colectivos/:id/notificaciones. Lo usan la campana y «Última actividad».
 */
import { useAuth } from '../contexto/Auth.js';
import { usePedido } from './usePedido.js';
import { obtenerNotificaciones } from '../api/colaboradora.js';
import { obtenerNotificacionesDelColectivo } from '../api/organizacion.js';

// Qué pedido corresponde a cada rol.
const PEDIDO_POR_ROL = {
  col: obtenerNotificaciones,
  org: obtenerNotificacionesDelColectivo,
};

export function useNotificaciones() {
  const { rol, id } = useAuth();
  const pedir = PEDIDO_POR_ROL[rol];

  // Sin sesión (o con un rol sin notificaciones) no se pide nada.
  // Si falla, queda la lista vacía en vez de romper la pantalla.
  const { cargando, datos } = usePedido(
    () => (pedir && id ? pedir(id).catch(() => []) : Promise.resolve([])),
    [rol, id]
  );

  return { cargando, notificaciones: datos ?? [] };
}
