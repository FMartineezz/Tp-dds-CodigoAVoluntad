/* eslint-disable react/prop-types */
/* eslint-disable react/react-in-jsx-scope */
/**
 * Sesión simulada (rol: null | 'col' | 'org') y modo daltónico.
 *
 * USO: useAuth() → { rol, entrar(rol), salir(), dalt, toggleDalt }.  <Privada rol="org"> protege una ruta.
 * SI LO CAMBIÁS O SACÁS: Cuando exista login real: reemplazá entrar/salir por la llamada a la API y guardá el token (Axios).
 */
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Navigate, useLocation } from "react-router-dom";
import keycloak from "../api/keycloack.js"; // Asegurate de que esta ruta apunte a tu archivo keycloak.js

const Ctx = createContext(null);

// Normaliza el rol que devuelve tu backend al formato que esperan tus rutas ('col' | 'org')
export const normalizarRol = (rolBackend) => {
  if (!rolBackend) return null;
  const r = rolBackend.toLowerCase();
  if (r === "col" || r === "org") return r;
  return null;
};

export function AuthProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [perfilCompletado, setPerfilCompletado] = useState(false);
  const [usuario, setUsuario] = useState(null);
  const [rol, setRol] = useState(null);
  const isRun = useRef(false);

  // Conservamos intacto el modo daltónico de tu aplicación
  const [dalt, setDalt] = useState(() => {
    try {
      return localStorage.getItem("cav-daltonico") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dalt ? "daltonico" : "estandar";
    try {
      localStorage.setItem("cav-daltonico", dalt ? "1" : "0");
    } catch {
      /* sin storage */
    }
  }, [dalt]);

  // Consulta tu endpoint GET /auth/estado en Express
  const cargarEstadoPerfil = async () => {
    if (!keycloak.authenticated || !keycloak.token) {
      setPerfilCompletado(false);
      setUsuario(null);
      setRol(null);
      return null;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/estado`, {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setPerfilCompletado(data.perfilCompletado);
        if (data.perfilCompletado) {
          setRol(normalizarRol(data.rol));
          setUsuario(data.datos || null);
        } else {
          setRol(null);
          setUsuario(null);
        }
        return data;
      }
    } catch (error) {
      console.error("Error al verificar perfil en el backend:", error);
    }
    return null;
  };

  useEffect(() => {
    if (isRun.current) return;
    isRun.current = true;

    keycloak
      .init({
        onLoad: "check-sso",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then(async (auth) => {
        setAuthenticated(auth);
        if (auth) {
          await cargarEstadoPerfil();
        }
        setIsReady(true);
      })
      .catch((err) => {
        console.error("Error inicializando Keycloak:", err);
        setIsReady(true);
      });
  }, []);

  const entrar = () => {
    keycloak.login({
      redirectUri: window.location.origin + "/comprobar-perfil",
    });
  };

  const salir = () => {
    setRol(null);
    setUsuario(null);
    setPerfilCompletado(false);
    keycloak.logout({
      redirectUri: window.location.origin,
    });
  };

  if (!isReady) {
    return <div>Cargando sesión...</div>;
  }

  return (
    <Ctx.Provider
      value={{
        rol,
        entrar,
        salir,
        dalt,
        toggleDalt: () => setDalt((d) => !d),
        keycloak,
        token: keycloak.token,
        authenticated,
        perfilCompletado,
        usuario,
        recargarPerfil: cargarEstadoPerfil,
        id: usuario?._id,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

/** Ruta privada: sin sesión va a Ingresar; sin perfil va a Registro; con otro rol va a sin-permiso. */
export function Privada({ rol, children }) {
  const a = useAuth();
  const loc = useLocation();

  if (!a.authenticated) {
    return <Navigate to={`/ingresar?volver=${encodeURIComponent(loc.pathname)}`} replace />;
  }

  if (!a.perfilCompletado) {
    return <Navigate to="/registro" replace />;
  }

  if (rol && a.rol !== rol) {
    return <Navigate to="/sin-permiso" replace />;
  }

  return children;
}
