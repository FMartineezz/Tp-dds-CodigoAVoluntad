import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const client = jwksClient({
  // En producción viene del compose (red interna de Docker); en local usa el Keycloak de desarrollo.
  jwksUri:
    process.env.KEYCLOAK_JWKS_URI ||
    "http://localhost:8080/realms/CodigoAVoluntad/protocol/openid-connect/certs",
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err, null);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no provisto" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, getKey, { algorithms: ["RS256"] }, (err, decoded) => {
    if (err) {
      console.error("Error real de jwt.verify:", err);
      return res.status(403).json({ message: "Token inválido o expirado" });
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

export const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user?.roles || [];

    const hasRole = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({
        message: "Acceso denegado: permisos insuficientes",
        rolesDelUsuario: userRoles,
      });
    }

    next();
  };
};
