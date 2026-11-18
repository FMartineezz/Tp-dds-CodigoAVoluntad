/**
 * Gráfico de barras horizontales accesible (es una lista).
 *
 * USO: titulo, datos=[[etiqueta, valor]], unidad (lo lee el lector de pantalla).
 * SI LO CAMBIÁS O SACÁS: Para gráficos más complejos reemplazá por una biblioteca, pero mantené una alternativa en texto.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Una barra más: una fila más en el array datos.
 */
import s from './Barras.module.css';

export function Barras({ titulo, datos, unidad }) {
  const max = Math.max(...datos.map((d) => d[1]));
  return (
    <figure className={s.fig}>
      <figcaption>{titulo}</figcaption>
      <ul>
        {datos.map(([k, v]) => (
          <li key={k}>
            <span className={s.bk}>{k}</span>
            <span className={s.bt} aria-hidden="true"><span style={{ width: `${(v / max) * 100}%` }} /></span>
            <b>{v}<span className="sr-only"> {unidad}</span></b>
          </li>
        ))}
      </ul>
    </figure>
  );
}
