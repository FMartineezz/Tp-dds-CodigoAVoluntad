/**
 * Sesión simulada (rol: null | 'col' | 'org') y modo daltónico.
 *
 * USO: useAuth() → { rol, entrar(rol), salir(), dalt, toggleDalt }.  <Privada rol="org"> protege una ruta.
 * SI LO CAMBIÁS O SACÁS: Cuando exista login real: reemplazá entrar/salir por la llamada a la API y guardá el token (Axios).
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const Ctx = createContext(null);

/** Sesión simulada: rol = null | 'col' | 'org'. Solo para el prototipo. */
export function AuthProvider({ children }) {
  const [rol, setRol] = useState(() => {
    try { return sessionStorage.getItem('cav-rol') || null; } catch { return null; }
  });
  const set = (r) => {
    setRol(r);
    try { r ? sessionStorage.setItem('cav-rol', r) : sessionStorage.removeItem('cav-rol'); } catch { /* sin storage */ }
  };
  const [dalt, setDalt] = useState(() => {
    try { return localStorage.getItem('cav-daltonico') === '1'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = dalt ? 'daltonico' : 'estandar';
    try { localStorage.setItem('cav-daltonico', dalt ? '1' : '0'); } catch { /* sin storage */ }
  }, [dalt]);
  return <Ctx.Provider value={{ rol, entrar: set, salir: () => set(null), dalt, toggleDalt: () => setDalt((d) => !d) }}>{children}</Ctx.Provider>;
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
