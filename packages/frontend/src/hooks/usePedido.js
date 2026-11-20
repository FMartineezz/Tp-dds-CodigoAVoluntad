/**
 * Hace un pedido al backend y recuerda en qué estado está.
 *
 * USO: const { cargando, datos, error } = usePedido(() => obtenerColectivo(id), [id]);
 *   · cargando → true mientras se espera la respuesta (mostrar esqueletos).
 *   · datos    → lo que devolvió la función cuando salió bien (null mientras tanto).
 *   · error    → el error de Axios si salió mal; error.response.status trae el código HTTP
 *                y error.response.data el cuerpo { code, message } del backend.
 *                Si el backend está apagado, error.response es undefined.
 * El segundo parámetro es la lista de valores que, si cambian, disparan el pedido de nuevo
 * (igual que en useEffect). Reemplaza a useLoading en las pantallas ya conectadas.
 */
import { useEffect, useState } from 'react';

export function usePedido(pedir, dependencias) {
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: null });

  useEffect(() => {
    // `vigente` pasa a false cuando la pantalla se va o cambian las dependencias:
    // así la respuesta de un pedido viejo no pisa la del pedido nuevo.
    let vigente = true;
    setEstado({ cargando: true, datos: null, error: null });
    pedir()
      .then((datos) => vigente && setEstado({ cargando: false, datos, error: null }))
      .catch((error) => vigente && setEstado({ cargando: false, datos: null, error }));
    return () => {
      vigente = false;
    };
  }, dependencias);

  return estado;
}
