import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  jwksUri:
    process.env.KEYCLOAK_JWKS_URI ||
    "http://localhost:8080/realms/CodigoAVoluntad/protocol/openid-connect/certs",
});

const KEYCLOAK_ISSUER =
  process.env.KEYCLOAK_ISSUER || "http://localhost:8080/realms/CodigoAVoluntad";

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err, null);
    callback(null, key.getPublicKey());
  });
}

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no provisto" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, getKey, { algorithms: ["RS256"], issuer: KEYCLOAK_ISSUER }, (err, decoded) => {
    if (err) {
      // Solo logueamos el tipo de error, no el stack/objeto completo
      console.warn("Token rechazado:", err.name);
      return res.status(401).json({ message: "Token inválido o expirado" });
    }

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      username: decoded.preferred_username,
      roles: decoded.realm_access?.roles || [],
    };
    next();
  });
};

// Resuelve la identidad real desde la BD (fuente de verdad)
export const crearCargarCuenta = ({ personaColaboradoraRepository, colectivoRepository }) => {
  return async (req, res, next) => {
    try {
      if (req.user?.roles?.includes("admin")) {
        req.cuenta = { tipo: "adm", id: null };
        return next();
      }

      const keycloakId = req.user?.id;
      if (!keycloakId) {
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const colaboradora = await personaColaboradoraRepository.obtenerPorKeycloack(keycloakId);
      if (colaboradora) {
        req.cuenta = { tipo: "col", id: colaboradora._id.toString() };
        return next();
      }

      const colectivo = await colectivoRepository.obtenerPorKeycloack(keycloakId);
      if (colectivo) {
        req.cuenta = { tipo: "org", id: colectivo._id.toString() };
        return next();
      }

      return res.status(403).json({ message: "Cuenta inexistente o dada de baja" });
    } catch (error) {
      next(error);
    }
  };
};

// Reemplaza a checkRole: valida contra req.cuenta.tipo y no filtra roles en la respuesta
export const exigirRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.cuenta || !rolesPermitidos.includes(req.cuenta.tipo)) {
      return res.status(403).json({ message: "Acceso denegado: permisos insuficientes" });
    }
    next();
  };
};
