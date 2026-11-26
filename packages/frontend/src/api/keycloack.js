import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url:
    import.meta.env.VITE_KEYCLOAK_URL ||
    (import.meta.env.DEV ? "http://localhost:8080" : undefined),
  realm: import.meta.env.VITE_KEYCLOAK_REALM || "CodigoAVoluntad",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "mi-frontend",
});

export default keycloak;
