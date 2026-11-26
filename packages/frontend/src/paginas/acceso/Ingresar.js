import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexto/Auth.js";

export default function IngresarK() {
  const { keycloak, authenticated } = useAuth();

  useEffect(() => {
    // Si no está autenticado, lo redirigimos automáticamente a Keycloak
    if (!authenticated) {
      keycloak.login({
        redirectUri: window.location.origin + "/comprobar-perfil",
      });
    }
  }, []);

  if (authenticated) {
    return <Navigate to="/comprobar-perfil" replace />;
  }

  return <p>Redirigiendo al inicio de sesión...</p>;
}
