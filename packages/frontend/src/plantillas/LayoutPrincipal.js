/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Button, Logo, NavItem } from "../atomos";
import { BottomNav, Campana, Footer, MenuUsuario, Navbar } from "../organismos";
import { useAuth } from "../contexto";
import { obtenerCantidadNoLeidos } from "../api/mensajes.js";
import { ENLACES_PIE, MENUS, destinosMovil } from "./menus.js";
import s from "./LayoutPrincipal.module.css";

/**
 * Estructura común de todas las pantallas: navbar arriba, la página en el medio y el pie abajo.
 * Con sesión iniciada suma el menú del rol, el contador de mensajes sin leer y la barra inferior del celu.
 *
 * USO: en App.js, como <Route element={<LayoutPrincipal />}> que envuelve las rutas.
 */
export function LayoutPrincipal() {
  const { rol, id, dalt, toggleDalt } = useAuth();
  const { pathname } = useLocation();
  const [noLeidos, setNoLeidos] = useState(0);
  const menu = MENUS[rol];
  console.log(menu)

  /**
   * Cada pantalla nueva arranca arriba de todo. Si no, al tocar un enlace del pie la
   * pantalla siguiente aparece scrolleada hasta abajo y parece vacía.
   */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  /**
   * Mantiene al día el número de mensajes sin leer del menú. Se vuelve a pedir al cambiar de
   * pantalla y cuando Mensajes avisa que marcó un chat como leído. Sin sesión queda en 0.
   */
  useEffect(() => {
    if (!rol || !id) {
      setNoLeidos(0);
      return undefined;
    }

    // Si el efecto ya se limpió, la respuesta que llega tarde se descarta
    let activo = true;

    /**
     * Pide la cantidad de no leídos al back y la guarda. Si falla, deja el número que había:
     * no vale la pena mostrar un error por un contador.
     */
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
              {/* El admin no tiene notificaciones: sin campana */}
              {rol !== "adm" && <Campana />}
              <MenuUsuario />
            </>
          ) : (
            <>
              <Button as={Link} to="/ingresar" variant="secondary">
                Ingresar
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
