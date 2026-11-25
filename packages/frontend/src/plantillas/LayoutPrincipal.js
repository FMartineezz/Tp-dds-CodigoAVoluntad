import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button, Logo, NavItem } from "../atomos";
import { BottomNav, Campana, Footer, MenuUsuario, Navbar } from "../organismos";
import { useAuth } from "../contexto";
import { obtenerCantidadNoLeidos } from "../api/mensajes.js";
import { ENLACES_PIE, MENUS, destinosMovil } from "./menus.js";
import s from "./LayoutPrincipal.module.css";

export function LayoutPrincipal() {
  const { rol, id, dalt, toggleDalt } = useAuth();
  const { pathname } = useLocation();
  const [noLeidos, setNoLeidos] = useState(0);
  const menu = MENUS[rol];

  useEffect(() => {
    if (!rol || !id) {
      setNoLeidos(0);
      return undefined;
    }

    let activo = true;
    const actualizar = () => {
      obtenerCantidadNoLeidos(rol, id)
        .then((cantidad) => activo && setNoLeidos(cantidad))
        .catch(() => {});
    };

    actualizar();
    window.addEventListener("cav-mensajes-actualizados", actualizar);
    return () => {
      activo = false;
      window.removeEventListener("cav-mensajes-actualizados", actualizar);
    };
  }, [rol, id, pathname]);

  return (
    <div className={rol ? s.conBarraInferior : undefined}>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>

      <Navbar
        logo={<Logo as={Link} to="/" />}
        actions={
          rol ? (
            <>
              <Campana />
              <MenuUsuario />
            </>
          ) : (
            <>
              <Button as={Link} to="/ingresar" variant="secondary">
                Ingresar
              </Button>
              <Button as={Link} to="/registro">
                Crear cuenta
              </Button>
            </>
          )
        }
      >
        {menu.map(([to, label, end]) => (
          <NavItem key={to} as={NavLink} to={to} end={end}>
            {label}
            {label === "Mensajes" && rol && noLeidos > 0 && (
              <>
                <span className={s.badge} aria-hidden="true">
                  {noLeidos}
                </span>
                <span className="sr-only"> ({noLeidos} sin leer)</span>
              </>
            )}
          </NavItem>
        ))}
      </Navbar>

      <main id="contenido" data-area={rol ? "app" : undefined}>
        <Outlet />
      </main>

      <Footer enlaces={ENLACES_PIE} dalt={dalt} onToggleDalt={toggleDalt} />
      {rol && <BottomNav items={destinosMovil(rol, noLeidos)} />}
    </div>
  );
}
