/**
 * Barra de navegación. En móvil se colapsa detrás del botón «Menú».
 *
 * USO: logo (slot), actions (slot, va a la derecha), children = los <NavItem/> del centro.
 * SI LO CAMBIÁS O SACÁS: Layout en 3 columnas: logo | menú centrado | acciones. Si cambiás grid-template-columns en Navbar.module.css se mueve todo.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un ítem de menú más: agregá una fila en plantillas/menus.js (NO acá).
 *   Un botón más a la derecha: ponelo dentro de actions={…} en plantillas/LayoutPrincipal.js.
 */
import { Children, useId, useState } from 'react';
import s from './Navbar.module.css';
import { cx } from '../../utilidades/cx.js';

export default function Navbar({ logo, actions, children }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  return (
    <header className={s.bar}>
      <div className={cx('container', s.inner)}>
        {logo}
        <button
          type="button"
          className={s.toggle}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? 'Cerrar' : 'Menú'}
        </button>
        <nav id={menuId} aria-label="Principal" className={cx(s.nav, open && s.open)}>
          <ul className={s.list}>
            {Children.map(children, (c) => (
              <li>{c}</li>
            ))}
          </ul>
          {actions && <div className={s.actions}>{actions}</div>}
        </nav>
      </div>
    </header>
  );
}
