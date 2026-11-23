/**
 * PANTALLA ElegirTipoCuenta
 * Ruta: /registro   ·   Quién la ve: Sin sesión
 * Qué muestra: Dos «puertas» a pantalla completa: colaboradora u organización.
 * Para modificarla: una opción más = otra <Link className={s.door}> en el contenedor .doors.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. LO QUE SE DIBUJA: es una pantalla «tonta»: no guarda datos ni reacciona a
 *      nada propio. Solo dibuja dos enlaces grandes; cada uno lleva a un
 *      formulario de registro distinto (el clic lo resuelve el <Link>).
 */

// ───── Imports ─────
import { Link } from 'react-router-dom'; // <Link>: enlace interno que no recarga la página
import { Heading, Icon, Text } from '../../atomos';
import s from './Registro.module.css'; // estilos propios de esta pantalla (s.algo)

/* variante "puertas": dos mitades a pantalla completa, una clara y otra en tinta */
export default function ElegirTipoCuenta() {
  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    // BLOQUE: contenedor — reparte la pantalla en dos mitades (las «puertas»)
    <div className={s.doors}>
      {/* BLOQUE: puerta 1 (clara) — lleva al registro de colaboradora */}
      {/* `${...} ${...}` es una plantilla de texto: junta dos clases CSS (ver
         docs/GLOSARIO.md → Plantillas de texto) */}
      <Link to="/registro/colaboradora" className={`${s.door} ${s.claro}`}>
        <div className={s.in}>
          <span className={s.op}>Opción 1</span>
          <Heading level={1} size="display" className={s.big}>
            Quiero<br />colaborar
          </Heading>
          <Text variant="prose">
            Tengo oficio en tecnología y quiero ponerlo al servicio de un proyecto.
          </Text>
          <span className={s.go}>Soy colaboradora <Icon name="flecha-izq" size={16} /></span>
        </div>
      </Link>

      {/* BLOQUE: puerta 2 (oscura, «en tinta») — lleva al registro de organización */}
      <Link to="/registro/organizacion" className={`${s.door} ${s.oscuro}`}>
        <div className={s.in}>
          <span className={s.op}>Opción 2</span>
          {/* as="p": se ve como título pero no es otro <h1>; el único h1 es el de la puerta 1 */}
          <Heading as="p" size="display" className={s.big}>
            Somos una<br />organización
          </Heading>
          <Text variant="prose">
            Representamos a un colectivo y necesitamos tecnología para una causa.
          </Text>
          <span className={s.go}>Registrar colectivo <Icon name="flecha-izq" size={16} /></span>
        </div>
      </Link>
    </div>
  );
}
