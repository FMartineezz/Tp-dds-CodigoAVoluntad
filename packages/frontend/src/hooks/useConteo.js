/**
 * Cuenta de 0 hasta un número en ~1 segundo (la animación de las cifras de Inicio).
 *
 * USO: const mostrado = useConteo(22);   → 0, 3, 9, … 22
 * Si `final` no es un número (ej. «…» mientras carga) lo devuelve tal cual.
 * Con «reducir movimiento» activado en el sistema, muestra el número final de una.
 */
import { useEffect, useState } from 'react';

const DURACION_MS = 1000;

export function useConteo(final) {
  const esNumero = typeof final === 'number';
  const sinAnimacion =
    typeof window === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [actual, setActual] = useState(esNumero && !sinAnimacion ? 0 : final);

  useEffect(() => {
    if (!esNumero || sinAnimacion) {
      setActual(final);
      return;
    }
    const inicio = performance.now();
    let cuadro;
    function avanzar(ahora) {
      const progreso = Math.min(1, (ahora - inicio) / DURACION_MS);
      // Arranca rápido y frena al final, como un cuentakilómetros
      const frenado = 1 - (1 - progreso) ** 3;
      setActual(Math.round(final * frenado));
      if (progreso < 1) cuadro = requestAnimationFrame(avanzar);
    }
    cuadro = requestAnimationFrame(avanzar);
    return () => cancelAnimationFrame(cuadro); // si se va de la página a mitad, cortamos
  }, [final, esNumero, sinAnimacion]);

  return actual;
}
