/**
 * APP · mapa de rutas del sitio.
 * Cada <Route> une una dirección con una pantalla.
 *   • Pantalla nueva: 1) creala en paginas/<área>/, 2) importala acá, 3) agregá su <Route>.
 *   • Ruta protegida: envolvela en <Privada rol="col"> (colaboradora) o <Privada rol="org"> (organización).
 *   • Si la agregás al menú, sumala también en plantillas/menus.js.
 */
import { Route, Routes } from 'react-router-dom';
import { AuthProvider, Privada } from './contexto';
import { LayoutPrincipal } from './plantillas/LayoutPrincipal.js';

// Públicas
import Inicio from './paginas/publico/Inicio.js';
import Proyectos from './paginas/publico/Proyectos.js';
import DetalleProyecto from './paginas/publico/DetalleProyecto.js';
import Colectivos from './paginas/publico/Colectivos.js';
import DetalleColectivo from './paginas/publico/DetalleColectivo.js';
import ComoFunciona from './paginas/publico/ComoFunciona.js';
import Info from './paginas/publico/Info.js';
// Acceso
import Ingresar from './paginas/acceso/Ingresar.js';
import IngresarK from './paginas/acceso/IngresarK.js';
import ElegirTipoCuenta from './paginas/acceso/ElegirTipoCuenta.js';
import RegistroColaboradora from './paginas/acceso/RegistroColaboradora.js';
import RegistroOrganizacion from './paginas/acceso/RegistroOrganizacion.js';
// Sistema (errores)
import { NoEncontrado, SinPermiso } from './paginas/sistema/Errores.js';
import Pronto from './paginas/sistema/Pronto.js';
// Compartida entre roles
import Mensajes from './paginas/compartidas/Mensajes.js';
// Colaboradora
import PanelCol from './paginas/colaboradora/PanelCol.js';
import PostulacionesCol from './paginas/colaboradora/PostulacionesCol.js';
import ProyectosCol from './paginas/colaboradora/ProyectosCol.js';
import PerfilCol from './paginas/colaboradora/PerfilCol.js';
// Organización
import PanelOrg from './paginas/organizacion/PanelOrg.js';
import ProyectosOrg from './paginas/organizacion/ProyectosOrg.js';
import FormProyecto from './paginas/organizacion/FormProyecto.js';
import PostulacionesOrg from './paginas/organizacion/PostulacionesOrg.js';
import EquipoOrg from './paginas/organizacion/EquipoOrg.js';
import BuscarColaboradoras from './paginas/organizacion/BuscarColaboradoras.js';
import PerfilColaboradora from './paginas/organizacion/PerfilColaboradora.js';
import PerfilOrg from './paginas/organizacion/PerfilOrg.js';
import keycloak from './api/keycloack.js';
import { useEffect, useRef, useState } from 'react';
import ComprobarPerfil from './paginas/acceso/ComprobarPerfil.js';

export default function App() {
/* const [isKeycloakReady, setIsKeycloakReady] = useState(false);
  const isRun = useRef(false);

  useEffect(() => {
    // Evita la doble ejecución de init() por el StrictMode de React 18 en desarrollo
    if (isRun.current) return;
    isRun.current = true;

    keycloak
      .init({
        onLoad: 'check-sso', // Revisa si ya hay sesión activa
        pkceMethod: 'S256',   // Standard recomendado
      })
      .then((authenticated) => {
        console.log('Keycloak inicializado correctamente. Autenticado:', authenticated);
        setIsKeycloakReady(true);
      })
      .catch((err) => {
        console.error('Error al inicializar Keycloak:', err);
        // Marcamos como listo aunque falle para no dejar la pantalla en blanco
        setIsKeycloakReady(true);
      });
  }, []);

  if (!isKeycloakReady) {
    return <div>Cargando autenticación...</div>;
  } */

  return (
    <AuthProvider>
      <Routes>
        <Route element={<LayoutPrincipal />}>
          {/* Públicas */}
          <Route index element={<Inicio />} />
          <Route path="proyectos" element={<Proyectos />} />
          <Route path="proyectos/:id" element={<DetalleProyecto />} />
          <Route path="colectivos" element={<Colectivos />} />
          <Route path="colectivos/:id" element={<DetalleColectivo />} />
          <Route path="como-funciona" element={<ComoFunciona />} />
          <Route path="terminos" element={<Info tema="terminos" />} />
          <Route path="accesibilidad" element={<Info tema="accesibilidad" />} />
          <Route path="api-estadisticas" element={<Info tema="api" />} />
          <Route path="contacto" element={<Info tema="contacto" />} />

          {/* Acceso */}
          {/* <Route path="ingresar" element={<Ingresar />} /> */}
          <Route path="ingresar" element={<IngresarK />} />
          <Route path="comprobar-perfil" element={<ComprobarPerfil />} />
          <Route path="registro" element={<ElegirTipoCuenta />} />
          <Route path="registro/colaboradora" element={<RegistroColaboradora />} />
          <Route path="registro/organizacion" element={<RegistroOrganizacion />} />

          {/* Sistema */}
          <Route path="sin-permiso" element={<SinPermiso />} />
          <Route path="pronto" element={<Pronto />} />

          {/* Colaboradora (privadas) */}
          <Route path="panel" element={<Privada rol="colaboradora"><PanelCol /></Privada>} />
          <Route path="panel/postulaciones" element={<Privada rol="colaboradora"><PostulacionesCol /></Privada>} />
          <Route path="panel/proyectos" element={<Privada rol="colaboradora"><ProyectosCol /></Privada>} />
          <Route path="panel/mensajes" element={<Privada rol="colaboradora"><Mensajes rol="colaboradora" /></Privada>} />
          <Route path="panel/perfil" element={<Privada rol="colaboradora"><PerfilCol /></Privada>} />

          {/* Organización (privadas) */}
          <Route path="org" element={<Privada rol="colectivo"><PanelOrg /></Privada>} />
          <Route path="org/proyectos" element={<Privada rol="colectivo"><ProyectosOrg /></Privada>} />
          <Route path="org/proyectos/nuevo" element={<Privada rol="colectivo"><FormProyecto /></Privada>} />
          <Route path="org/proyectos/:id/editar" element={<Privada rol="colectivo"><FormProyecto edit /></Privada>} />
          <Route path="org/proyectos/:id/postulaciones" element={<Privada rol="colectivo"><PostulacionesOrg /></Privada>} />
          <Route path="org/proyectos/:id/equipo" element={<Privada rol="colectivo"><EquipoOrg /></Privada>} />
          <Route path="org/colaboradoras" element={<Privada rol="colectivo"><BuscarColaboradoras /></Privada>} />
          <Route path="org/colaboradoras/:id" element={<Privada rol="colectivo"><PerfilColaboradora /></Privada>} />
          <Route path="org/mensajes" element={<Privada rol="colectivo"><Mensajes rol="colectivo" /></Privada>} />
          <Route path="org/perfil" element={<Privada rol="colectivo"><PerfilOrg /></Privada>} />

          {/* Cualquier otra dirección */}
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
