/**
 * Devuelve el valor recién cuando dejó de cambiar por un rato.
 *
 * USO: const busquedaDemorada = useDemorado(busqueda, 300);
 * Sirve para no pedirle al backend en cada tecla: se pide una vez cuando la persona frena
 * de escribir (300 ms). Mientras escribe, devuelve el valor anterior.
 */
import { useEffect, useState } from 'react';

export function useDemorado(valor, milisegundos = 300) {
  const [demorado, setDemorado] = useState(valor);

  useEffect(() => {
    const temporizador = setTimeout(() => setDemorado(valor), milisegundos);
    // Si cambia antes de que se cumpla el tiempo, se cancela y arranca de nuevo
    return () => clearTimeout(temporizador);
  }, [valor, milisegundos]);

  return demorado;
}
