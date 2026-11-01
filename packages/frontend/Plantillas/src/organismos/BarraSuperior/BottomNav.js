/* BottomNav: ver el comentario de Campana.js (mismas piezas, mismo CSS). */
import { NavLink } from 'react-router-dom';
import { Icon } from '../../atomos';
import s from './BarraSuperior.module.css';

export function BottomNav({ items }) {
  return (
    <nav className={s.bottom} aria-label="Principal">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => (isActive ? s.act : undefined)}>
          <span className={s.ico}><Icon name={it.icon} size={20} />{it.badge > 0 && <span className={s.count} aria-hidden="true">{it.badge}</span>}</span>
          <span>{it.label}</span>
          {it.badge > 0 && <span className="sr-only">{it.badge} sin leer</span>}
        </NavLink>
      ))}
    </nav>
  );
}
