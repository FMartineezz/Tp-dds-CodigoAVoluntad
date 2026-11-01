/**
 * Abrir/cerrar un panel flotante: se cierra con Escape y al hacer clic afuera.
 *
 * USO: const { open, setOpen, ref } = useDisclosure();
 * SI LO CAMBIÁS O SACÁS: Lo usan Campana y MenuUsuario.
 */
import { useEffect, useRef, useState } from 'react';

/** Cierra con Escape y al hacer clic fuera. */
export function useDisclosure() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const fuera = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const esc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc); };
  }, [open]);
  return { open, setOpen, ref };
}
