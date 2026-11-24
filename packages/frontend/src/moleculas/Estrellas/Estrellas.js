/**
 * Puntaje de 1 a 5 con estrellas (valoraciones).
 *
 * USO: <Estrellas valor={4} />
 * SI LO CAMBIÁS O SACÁS: Lleva aria-label "4 de 5".
 */
import { Icon } from '../../atomos';
import s from './Estrellas.module.css';

export function Estrellas({ valor }) {
  return (
    <span className={s.estrellas} role="img" aria-label={`${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Icon key={n} name="estrella" size={16} />).map((x, i) => <span key={i} className={i < valor ? s.on : s.off}>{x}</span>)}
    </span>
  );
}
