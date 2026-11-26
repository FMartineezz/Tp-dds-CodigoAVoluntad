/**
 * Lleva a la persona hasta el primer campo con error de un formulario y lo enfoca.
 *
 * USO: if (hayErrores) { llevarAlPrimerError(evento.currentTarget); return; }
 *      (recibe el <form>; los campos con error tienen aria-invalid="true", ver Field).
 * Si el error no es de un campo (ej. un aviso del formulario), va al primer aviso rojo.
 */
export function llevarAlPrimerError(formulario) {
  // Esperamos un cuadro: React tiene que pintar los campos en rojo antes de buscarlos
  requestAnimationFrame(() => {
    const primero = formulario?.querySelector('[aria-invalid="true"], [role="alert"]');
    if (!primero) return;
    primero.scrollIntoView({ behavior: 'smooth', block: 'center' });
    primero.focus?.({ preventScroll: true });
  });
}
