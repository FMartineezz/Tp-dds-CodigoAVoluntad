/**
 * Paginación numerada.
 *
 * USO: page, pages, onChange(n). No se muestra si hay una sola página.
 * SI LO CAMBIÁS O SACÁS: El tamaño de página lo define cada pantalla (constante POR_PAGINA).
 */
import { Icon } from '../../atomos';
import s from './Pager.module.css';

export function Pager({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav aria-label="Paginación" className={s.pager}>
      <button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => onChange(page - 1)}><Icon name="chevron-izq" /></button>
      {Array.from({ length: pages }, (_, i) => (
        <button key={i} type="button" aria-current={page === i + 1 ? 'page' : undefined} aria-label={`Página ${i + 1}`} onClick={() => onChange(i + 1)}>{i + 1}</button>
      ))}
      <button type="button" aria-label="Página siguiente" disabled={page === pages} onClick={() => onChange(page + 1)}><Icon name="chevron-der" /></button>
    </nav>
  );
}
