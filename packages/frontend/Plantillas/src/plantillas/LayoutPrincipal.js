/**
 * Estructura de todas las páginas: Navbar + contenido + Footer (+ barra inferior móvil con sesión).
 *
 * USO: Las páginas se dibujan dentro de <Outlet/>.
 * SI LO CAMBIÁS O SACÁS: Ninguna pantalla tiene menú ni pie.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Botón nuevo en la navbar: agregalo dentro de actions={…}. Enlace nuevo en el pie: ENLACES_PIE en menus.js.
 */
import { Link, NavLink, Outlet } from 'react-router-dom';
import { Button, Logo, NavItem } from '../atomos';
import { BottomNav, Campana, Footer, MenuUsuario, Navbar } from '../organismos';
import { useAuth } from '../contexto';
import { ENLACES_PIE, MENUS, NO_LEIDOS, destinosMovil } from './menus.js';
import s from './LayoutPrincipal.module.css';

export function LayoutPrincipal() {
  const { rol, dalt, toggleDalt } = useAuth();
  const menu = MENUS[rol];
  return (
    <div className={rol ? s.conBottom : undefined}>
      <a className="skip-link" href="#contenido">Saltar al contenido</a>

      <Navbar
        logo={<Logo as={Link} to="/" />}
        /* actions = lo que va a la DERECHA. Para sumar un botón: agregalo en cualquiera de los dos grupos. */
        actions={
          rol ? (
            <>
              <Campana />
              <MenuUsuario />
            </>
          ) : (
            <>
              <Button as={Link} to="/ingresar" variant="secondary">Ingresar</Button>
              <Button as={Link} to="/registro">Crear cuenta</Button>
            </>
          )
        }
      >
        {/* Ítems del centro: salen de plantillas/menus.js */}
        {menu.map(([to, label, end]) => (
          <NavItem key={to} as={NavLink} to={to} end={end}>
            {label}
            {label === 'Mensajes' && rol && <span className={s.badge} aria-hidden="true">{NO_LEIDOS[rol]}</span>}
            {label === 'Mensajes' && rol && <span className="sr-only"> ({NO_LEIDOS[rol]} sin leer)</span>}
          </NavItem>
        ))}
      </Navbar>

      {/* data-area="app" activa los estilos del área de trabajo (ver estilos/base.css) */}
      <main id="contenido" data-area={rol ? 'app' : undefined}><Outlet /></main>

      <Footer enlaces={ENLACES_PIE} dalt={dalt} onToggleDalt={toggleDalt} />
      {rol && <BottomNav items={destinosMovil(rol)} />}
    </div>
  );
}
