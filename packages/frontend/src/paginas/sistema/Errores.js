/**
 * PANTALLA Errores
 * Ruta: * · /sin-permiso   ·   Quién la ve: Todas
 * Qué muestra: 404 (ERR-CSR-001 u otro código) y 403 (ERR-PER-001) con el mismo diseño.
 * Para modificarla: un error nuevo = otra función que use <Pantalla big=… code=… />.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. Pantalla (interna): el diseño común de cualquier error: número grande,
 *      código, título, mensaje, botones y un sello.
 *   2. NoEncontrado (export): el error 404. La ruta «*» (cualquier dirección
 *      que no exista) lo muestra; también se le pueden pasar otro código,
 *      título o mensaje.
 *   3. SinPermiso (export): el error 403. Elige a dónde mandar según quién
 *      tenga la sesión.
 */

// ───── Imports ─────
import { Link } from 'react-router-dom';
import { Button, Heading, Stamp, Text } from '../../atomos';
import { useAuth } from '../../contexto'; // da acceso a la sesión (quién está logueado)
import s from './Errores.module.css';

// ───── 1. Pantalla (diseño común, no se exporta) ─────
// Recibe por props lo que cambia entre un error y otro. `children` son los botones
// que van entre la apertura y el cierre de <Pantalla>…</Pantalla>.
// Las llaves { } en los parámetros «desestructuran» las props (ver docs/GLOSARIO.md →
// Desestructurar).
function Pantalla({ big, code, titulo, msg, children }) {
  return (
    <div className={`container ${s.err}`}>
      {/* BLOQUE: número gigante — decorativo, por eso aria-hidden (los lectores de pantalla
         lo saltean) */}
      <div className={s.big} aria-hidden="true">{big}</div>
      {/* BLOQUE: texto — código del error, título, mensaje y botones */}
      <div className={s.body}>
        <span className={s.code}>{code}</span>
        <Heading level={1} size="h1">{titulo}</Heading>
        <Text>{msg}</Text>
        <div className={s.btns}>{children}</div>
      </div>
      {/* BLOQUE: sello — adorno visual «Fuera de mapa» */}
      <Stamp className={s.stamp}>Fuera<br />de<br />mapa</Stamp>
    </div>
  );
}

// ───── 2. NoEncontrado (404) ─────
// Se muestra cuando la dirección no existe. Los valores con `=` son «por defecto»:
// si quien lo usa no pasa esa prop, se usa el texto de la derecha.
export function NoEncontrado({
  code = 'ERR-CSR-001',
  titulo = 'Esta página no existe',
  msg = 'El recurso solicitado no fue encontrado',
}) {
  return (
    <Pantalla big="404" code={code} titulo={titulo} msg={msg}>
      <Button as={Link} to="/">Volver al inicio</Button>
      <Button as={Link} to="/proyectos" variant="secondary">Ver proyectos</Button>
    </Pantalla>
  );
}

// ───── 3. SinPermiso (403) ─────
// Se muestra cuando alguien entra a una zona que su cuenta no puede ver.
export function SinPermiso() {
  // rol de la sesión: 'col' (colaboradora), 'org' (organización) o null (sin sesión)
  const { rol } = useAuth();

  // Elige a dónde lleva el botón principal según quién tenga la sesión.
  let rutaDelBotonPrincipal;
  if (rol === 'org') {
    rutaDelBotonPrincipal = '/org';
  } else if (rol === 'col') {
    rutaDelBotonPrincipal = '/panel';
  } else {
    rutaDelBotonPrincipal = '/ingresar';
  }

  return (
    <Pantalla
      big="403"
      code="ERR-PER-001"
      titulo="No tenés permiso"
      msg="No podés ver este contenido con tu cuenta"
    >
      {/* Con sesión dice «Ir a mi panel»; sin sesión (rol null) dice «Ingresar» */}
      <Button as={Link} to={rutaDelBotonPrincipal}>{rol ? 'Ir a mi panel' : 'Ingresar'}</Button>
      <Button as={Link} to="/" variant="secondary">Inicio</Button>
    </Pantalla>
  );
}
