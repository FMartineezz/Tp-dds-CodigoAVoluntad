/**
 * Sesión simulada (rol: null | 'col' | 'org' + id de la cuenta) y modo daltónico.
 *
 * USO: useAuth() → { rol, id, entrar(rol, id?), salir(), dalt, toggleDalt }.
 *      <Privada rol="org"> protege una ruta.
 *   · id → el _id real en el backend del colectivo (rol 'org') o de la colaboradora (rol 'col')
 *          que tiene la sesión. Las pantallas lo usan para pedir «lo mío» (mis proyectos,
 *          mis postulaciones…).
 *   · entrar(rol) sin id usa la cuenta de demo del .env.local (VITE_DEMO_COLECTIVO_ID o
 *     VITE_DEMO_COLABORADORA_ID). Esos ids existen porque el seed del backend les da ids fijos.
 * SI LO CAMBIÁS O SACÁS: Cuando exista login real (Keycloak): reemplazá entrar/salir por el
 * login real, el id sale del token, y el token se agrega a los pedidos en api/cliente.js.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const Ctx = createContext(null);

// Cuentas con las que se entra en la demo, según el rol (ver .env.example).
export const CUENTAS_DEMO = {
  org: import.meta.env.VITE_DEMO_COLECTIVO_ID,
  col: import.meta.env.VITE_DEMO_COLABORADORA_ID,
};

/** Sesión simulada: rol = null | 'col' | 'org'. Se reemplaza cuando se integre Keycloak. */
export function AuthProvider({ children }) {
  const [rol, setRol] = useState(() => {
    try { return sessionStorage.getItem('cav-rol') || null; } catch { return null; }
  });
  const [id, setId] = useState(() => {
    try { return sessionStorage.getItem('cav-id') || null; } catch { return null; }
  });
  // Abre (o cierra, con r = null) la sesión y la recuerda mientras la pestaña siga abierta.
  const set = (r, idCuenta) => {
    const nuevoId = r ? idCuenta || CUENTAS_DEMO[r] || null : null;
    setRol(r);
    setId(nuevoId);
    try {
      if (r) {
        sessionStorage.setItem('cav-rol', r);
        if (nuevoId) sessionStorage.setItem('cav-id', nuevoId);
      } else {
        sessionStorage.removeItem('cav-rol');
        sessionStorage.removeItem('cav-id');
      }
    } catch { /* sin storage */ }
  };
  const [dalt, setDalt] = useState(() => {
    try { return localStorage.getItem('cav-daltonico') === '1'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dalt ? 'daltonico' : 'estandar';
    try { localStorage.setItem('cav-daltonico', dalt ? '1' : '0'); } catch { /* sin storage */ }
  }, [dalt]);
  return <Ctx.Provider value={{ rol, id, entrar: set, salir: () => set(null), dalt, toggleDalt: () => setDalt((d) => !d) }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);

/** Ruta privada: sin sesión va a Ingresar con retorno; con otro rol va a 403. */
export function Privada({ rol, children }) {
  const a = useAuth();
  const loc = useLocation();
  if (!a.rol) return <Navigate to={`/ingresar?volver=${encodeURIComponent(loc.pathname)}`} replace />;
  if (a.rol !== rol) return <Navigate to="/sin-permiso" replace />;
  return children;
}
