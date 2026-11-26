// src/components/ComprobarPerfil.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import keycloak from "../../api/keycloack.js";
import { normalizarRol, useAuth } from "../../contexto/Auth.js";

const ComprobarPerfil = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const { rol } = useAuth()
  useEffect(() => {
    const verificarUsuario = async () => {
      // Si por alguna razón llegó sin sesión activa, lo mandamos a ingresar
      if (!keycloak.authenticated || !keycloak.token) {
        navigate("/ingresar", { replace: true });
        return;
      }

      try {
        const response = await fetch("http://localhost:3000/auth/estado", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("No se pudo verificar el estado del perfil");
        }

        const data = await response.json();

        // Primer ingreso -> va a elegir si es Colaboradora o Colectivo
        if (!data.perfilCompletado) {
          navigate('/registro', { replace: true });
          return
        }
        // Ya tiene cuenta activa -> va directo a su panel    
        if (normalizarRol(data.rol) == "col") {
          navigate('/panel', { replace: true });   
          return;
        }
        if (normalizarRol(data.rol) == "org") {
          navigate('/org', { replace: true });
          return;
        }
        // Si perfilCompletado es true pero rol vino null, hubo un desajuste en el nombre del campo
        console.error("Perfil completado pero rol no reconocido:", rol);
        navigate('/sin-permiso', { replace: true });   
      } catch (err) {
        console.error(err);
        setError("Hubo un problema al verificar tu cuenta. Intentá nuevamente.");
      }
    };

    verificarUsuario();
  }, [navigate]);

  if (error) {
    return (
      <div>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );
  }

  return <div>Verificando tu cuenta...</div>;
};

export default ComprobarPerfil;
