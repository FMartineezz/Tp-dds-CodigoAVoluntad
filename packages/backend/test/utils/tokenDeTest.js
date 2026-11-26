/**
 * Tokens JWT firmados con una clave RSA que solo existe en los tests.
 *
 * El middleware verifyToken (src/middlewares/auth.js) valida los tokens con la clave pública que
 * le da jwks-rsa. En los tests jwks-rsa se reemplaza por test/setup/jwksRsaFalso.js, que devuelve
 * la clave pública de acá: así verifyToken se prueba de verdad sin levantar Keycloak.
 */
import { generateKeyPairSync, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

export const clavePublicaDeTest = publicKey.export({ type: "spki", format: "pem" });

/**
 * Arma un token como los de Keycloak. Cada llamada es un usuario distinto (sub nuevo), porque
 * keycloackId es único: dos cuentas creadas con el mismo token chocarían.
 */
export function tokenDeTest({ roles = [] } = {}) {
  return jwt.sign(
    { sub: randomUUID(), email: "test@mail.com", realm_access: { roles } },
    privateKey,
    { algorithm: "RS256", keyid: "clave-de-test" },
  );
}

/** Header Authorization listo para supertest: request(app).post(...).set(conToken()). */
export const conToken = (opciones) => ({ Authorization: `Bearer ${tokenDeTest(opciones)}` });
