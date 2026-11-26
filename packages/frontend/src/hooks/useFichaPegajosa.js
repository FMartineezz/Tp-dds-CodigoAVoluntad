/**
 * Hace que una columna pegajosa (position: sticky) termine alineada con la otra columna
 * al llegar al final de la página.
 *
 * USO: const fichaRef = useFichaPegajosa();   <aside ref={fichaRef} className={s.ficha}>
 *      y en el CSS: top: max(var(--space-5), var(--ficha-top, 0px));
 * POR QUÉ: sticky frena la ficha recién al final de su columna. Si la ficha es corta, la
 * página se termina antes y la ficha queda flotando más arriba que la última tarjeta.
 * Este hook la baja lo justo (--ficha-top) para que, con todo scrolleado, las dos
 * columnas terminen a la misma altura.
 */
import { useEffect, useRef } from 'react';

export function useFichaPegajosa() {
  const ref = useRef(null);

  useEffect(() => {
    function acomodar() {
      const ficha = ref.current;
      if (!ficha) return; // todavía está cargando
      // Lo que queda de página debajo de las dos columnas (pie, márgenes…)
      const finDeLasColumnas = ficha.parentElement.getBoundingClientRect().bottom + window.scrollY;
      const restoDeLaPagina = document.documentElement.scrollHeight - finDeLasColumnas;
      // Dónde tiene que estar arriba la ficha para que su borde de abajo caiga justo donde
      // terminan las columnas cuando ya no se puede bajar más
      const top = window.innerHeight - restoDeLaPagina - ficha.offsetHeight;
      ficha.style.setProperty('--ficha-top', `${top}px`);
    }

    acomodar();
    window.addEventListener('resize', acomodar);
    // También cuando cambia el alto de la página (llegan datos, se abre un desplegable…)
    const observador = new ResizeObserver(acomodar);
    observador.observe(document.body);
    return () => {
      window.removeEventListener('resize', acomodar);
      observador.disconnect();
    };
  }, []);

  return ref;
}
