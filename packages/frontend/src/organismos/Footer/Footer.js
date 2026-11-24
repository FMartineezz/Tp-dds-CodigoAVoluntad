/**
 * Pie de página con enlaces e interruptor de modo daltónico.
 *
 * USO: enlaces=[{to,label}], dalt, onToggleDalt.
 * SI LO CAMBIÁS O SACÁS: El enunciado pide accesibilidad: dejá el interruptor.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un enlace más: una fila más en ENLACES_PIE (plantillas/menus.js).
 */
import { Link } from 'react-router-dom';
import { Logo } from '../../atomos';
import s from './Footer.module.css';

export function Footer({ enlaces, dalt, onToggleDalt }) {
  return (
    <footer className={s.footer}>
      <div className={`container ${s.footerIn}`}>
        <Logo as="span" />
        <nav aria-label="Información" className={s.flinks}>
          {enlaces.map((e) => <Link key={e.to} to={e.to}>{e.label}</Link>)}
          <button type="button" role="switch" aria-checked={dalt} onClick={onToggleDalt}>Modo daltónico: {dalt ? 'sí' : 'no'}</button>
        </nav>
      </div>
    </footer>
  );
}
