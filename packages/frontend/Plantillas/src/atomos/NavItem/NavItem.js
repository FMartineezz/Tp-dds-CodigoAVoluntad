/**
 * Ítem de menú de la barra de navegación.
 *
 * USO: <NavItem as={NavLink} to="/proyectos">Proyectos</NavItem>  (NavLink marca la página actual solo).
 * SI LO CAMBIÁS O SACÁS: Se usa dentro de Navbar. El subrayado de 'página actual' sale de --red-500.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Para agregar un ítem al menú NO toques este archivo: agregá una fila en plantillas/menus.js.
 */
import s from './NavItem.module.css';
import { cx } from '../../utilidades/cx.js';

export default function NavItem({ as: Tag = 'a', active = false, className, children, ...rest }) {
  return (
    <Tag
      className={cx(s.item, active && s.active, className)}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {children}
    </Tag>
  );
}
