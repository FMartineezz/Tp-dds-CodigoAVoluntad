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

export default function App() {
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
          <Route path="ingresar" element={<Ingresar />} />
          <Route path="registro" element={<ElegirTipoCuenta />} />
          <Route path="registro/colaboradora" element={<RegistroColaboradora />} />
          <Route path="registro/organizacion" element={<RegistroOrganizacion />} />

          {/* Sistema */}
          <Route path="sin-permiso" element={<SinPermiso />} />
          <Route path="pronto" element={<Pronto />} />

          {/* Colaboradora (privadas) */}
          <Route path="panel" element={<Privada rol="col"><PanelCol /></Privada>} />
          <Route path="panel/postulaciones" element={<Privada rol="col"><PostulacionesCol /></Privada>} />
          <Route path="panel/proyectos" element={<Privada rol="col"><ProyectosCol /></Privada>} />
          <Route path="panel/mensajes" element={<Privada rol="col"><Mensajes rol="col" /></Privada>} />
          <Route path="panel/perfil" element={<Privada rol="col"><PerfilCol /></Privada>} />

          {/* Organización (privadas) */}
          <Route path="org" element={<Privada rol="org"><PanelOrg /></Privada>} />
          <Route path="org/proyectos" element={<Privada rol="org"><ProyectosOrg /></Privada>} />
          <Route path="org/proyectos/nuevo" element={<Privada rol="org"><FormProyecto /></Privada>} />
          <Route path="org/proyectos/:id/editar" element={<Privada rol="org"><FormProyecto edit /></Privada>} />
          <Route path="org/proyectos/:id/postulaciones" element={<Privada rol="org"><PostulacionesOrg /></Privada>} />
          <Route path="org/proyectos/:id/equipo" element={<Privada rol="org"><EquipoOrg /></Privada>} />
          <Route path="org/colaboradoras" element={<Privada rol="org"><BuscarColaboradoras /></Privada>} />
          <Route path="org/colaboradoras/:id" element={<Privada rol="org"><PerfilColaboradora /></Privada>} />
          <Route path="org/mensajes" element={<Privada rol="org"><Mensajes rol="org" /></Privada>} />
          <Route path="org/perfil" element={<Privada rol="org"><PerfilOrg /></Privada>} />

          {/* Cualquier otra dirección */}
          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
