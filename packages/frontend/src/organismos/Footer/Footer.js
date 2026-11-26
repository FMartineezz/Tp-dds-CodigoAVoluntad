/**
 * Pie de página con enlaces e interruptor de modo daltónico.
 *
 * USO: enlaces=[{to,label}], dalt, onToggleDalt.
 * SI LO CAMBIÁS O SACÁS: El enunciado pide accesibilidad: dejá el interruptor.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un enlace más: una fila más en ENLACES_PIE (plantillas/menus.js).
 */
import { Link, useLocation } from 'react-router-dom';
import { Logo } from '../../atomos';
import s from './Footer.module.css';

export function Footer({ enlaces, dalt, onToggleDalt }) {
  const { pathname } = useLocation();
  // Algunos enlaces (ej. «Reportar un problema») llevan la pantalla actual en ?desde=
  // (salvo que ya estés en esa pantalla: no tiene sentido decir que el problema fue ahí).
  const destino = (enlace) =>
    enlace.conPantallaActual && pathname !== enlace.to
      ? `${enlace.to}?desde=${encodeURIComponent(pathname)}`
      : enlace.to;

  return (
    <footer className={s.footer}>
      <div className={`container ${s.contenido}`}>
        <Logo as="span" />
        <nav aria-label="Información" className={s.enlaces}>
          {enlaces.map((e) => <Link key={e.to} to={destino(e)}>{e.label}</Link>)}
          <button type="button" role="switch" aria-checked={dalt} onClick={onToggleDalt}>Modo daltónico: {dalt ? 'sí' : 'no'}</button>
        </nav>
      </div>
    </footer>
  );
}
