/**
 * Simula la espera del backend para mostrar skeletons.
 *
 * USO: const cargando = useLoading(550);
 * SI LO CAMBIÁS O SACÁS: Cuando haya API real, reemplazalo por el estado 'loading' de la petición (Axios).
 */
import { useEffect, useState } from 'react';

export function useLoading(ms = 550) {
  const [cargando, setCargando] = useState(true);
  useEffect(() => { const t = setTimeout(() => setCargando(false), ms); return () => clearTimeout(t); }, [ms]);
  return cargando;
}
