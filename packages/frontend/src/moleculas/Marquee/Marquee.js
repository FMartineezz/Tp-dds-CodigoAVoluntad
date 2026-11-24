/**
 * Cinta negra inclinada con textos que se desplazan.
 *
 * USO: <Marquee items={['React','Node']} />
 * SI LO CAMBIÁS O SACÁS: Con 'reducir movimiento' queda quieta. Es decorativa.
 */
import s from './Marquee.module.css';

export default function Marquee({ items, label = 'Habilidades que buscamos' }) {
  const lista = items.map((t, i) => (
    <span key={t} className={s.item}>
      {t}
      <i aria-hidden="true" className={i % 3 === 2 ? s.red : undefined}>✺</i>
    </span>
  ));
  return (
    <div className={s.clip}>
      <div className={s.strip} role="group" aria-label={label}>
        <div className={s.track}>
          <span>{lista}</span>
          <span aria-hidden="true">{lista}</span>
        </div>
      </div>
    </div>
  );
}
