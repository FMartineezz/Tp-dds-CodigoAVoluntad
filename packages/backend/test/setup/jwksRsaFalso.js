/**
 * Reemplazo de jwks-rsa en los tests (ver "moduleNameMapper" en package.json).
 *
 * Por qué: jwks-rsa usa jose, que es solo ESM, y Jest no lo puede cargar con require. Además el
 * real le pide las claves a Keycloak. Este devuelve siempre la clave pública de tokenDeTest.js.
 */
import { clavePublicaDeTest } from "../utils/tokenDeTest.js";

export default function jwksClient() {
  return {
    getSigningKey: (kid, callback) => callback(null, { getPublicKey: () => clavePublicaDeTest }),
  };
}
