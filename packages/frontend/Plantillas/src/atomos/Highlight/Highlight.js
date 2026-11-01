/**
 * Marcador de color para una palabra clave dentro de un párrafo.
 *
 * USO: <Highlight>oficio</Highlight>
 * SI LO CAMBIÁS O SACÁS: El color es --color-fill (estilos/colores-semanticos.css).
 */
import s from './Highlight.module.css';

export default function Highlight({ children }) {
  return <mark className={s.mark}>{children}</mark>;
}
