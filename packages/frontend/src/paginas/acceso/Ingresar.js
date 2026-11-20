/**
 * PANTALLA Ingresar
 * Ruta: /ingresar   ·   Quién la ve: Sin sesión
 * Qué muestra: Formulario de login (demo: colaboradora@demo.org u organizacion@demo.org
 *   + demo1234) y login social.
 * Para modificarla: cuando haya API real reemplazá el setTimeout por la llamada a Axios.
 * Cuenta de demo: un selector opcional con colectivos y colaboradoras REALES del backend
 *   (GET /colectivos y GET /colaboradoras, primera página de 100). Si se elige una, se entra
 *   con ese rol y ese id; si no, con la cuenta de demo del .env.local según el correo.
 *   PENDIENTE (backend): el login sigue simulado hasta que exista Keycloak.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: lo que la pantalla recuerda (correo, contraseña, cuenta de demo
 *      elegida, errores, si está «cargando» y si las credenciales fallaron), las listas
 *      de cuentas reales (pedidas al backend) y las herramientas de navegación y sesión.
 *   2. ACCIONES: qué pasa al enviar el formulario (validar → «llamar a la API» →
 *      entrar) y al usar el login social.
 *   3. LO QUE SE DIBUJA: el formulario con sus campos, botones y avisos.
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Field, Heading, Text } from '../../atomos';
import { Alert, PasswordField, SocialButtons } from '../../moleculas';
import { useAuth } from '../../contexto'; // sesión: `entrar(rol, id)` la inicia
import { usePedido } from '../../hooks';
import { obtenerColectivos } from '../../api/colectivos.js';
import { obtenerColaboradoras } from '../../api/colaboradoras.js';

// Pide a la vez las dos listas de cuentas para el selector «Cuenta de demo».
// Promise.all espera a las dos y devuelve [colectivos, colaboradoras].
async function cargarCuentas() {
  const [colectivos, colaboradoras] = await Promise.all([
    obtenerColectivos({ pagina: 1, limite: 100 }),
    obtenerColaboradoras({ pagina: 1, limite: 100 }),
  ]);
  return { colectivos: colectivos.resultados, colaboradoras: colaboradoras.resultados };
}
import s from './Ingresar.module.css';

export default function Ingresar() {
  // ───── 1. DATOS Y ESTADO ─────

  // Función para ir a otra pantalla desde código, ej. navegar('/panel')
  // (ver docs/GLOSARIO.md → useNavigate).
  const navegar = useNavigate();

  // `entrar(rol, id?)` abre la sesión con rol 'col' u 'org' y el id de esa cuenta (sin id,
  // la de demo del .env.local). Se saca del objeto con { } (ver docs/GLOSARIO.md → Desestructurar).
  const { entrar } = useAuth();

  // Listas de cuentas reales para el selector. Si fallan, el selector no se muestra y se
  // puede entrar igual con las cuentas de demo.
  const { datos: cuentas, error: errorDeCuentas } = usePedido(() => cargarCuentas(), []);

  // Cuenta de demo elegida en el selector: '' (ninguna) o 'rol:id', ej. 'org:c000…01'.
  const [cuentaElegida, setCuentaElegida] = useState('');

  // Lee lo que va después del «?» en la dirección; acá, el parámetro opcional «volver»
  // (adónde ir después de ingresar). Se usa solo el primer valor del array
  // (ver docs/GLOSARIO.md → useSearchParams).
  const [parametrosDeLaDireccion] = useSearchParams();

  // Texto del campo «Correo electrónico». Empieza vacío; lo cambia el onChange del campo.
  // (ver docs/GLOSARIO.md → useState)
  const [correo, setCorreo] = useState('');

  // Texto del campo «Contraseña». Empieza vacío; lo cambia el onChange del campo.
  const [contrasena, setContrasena] = useState('');

  // Mensajes de error por campo, ej. { correo: '…', contrasena: '…' }.
  // Empieza como objeto vacío {} (sin errores); lo cambia alEnviarFormulario.
  const [errores, setErrores] = useState({});

  // true mientras se «espera la respuesta» (el botón muestra su estado de carga).
  // Lo cambia alEnviarFormulario.
  const [cargando, setCargando] = useState(false);

  // true si las credenciales no coinciden (muestra el aviso rojo). Lo cambia alEnviarFormulario.
  const [fallo, setFallo] = useState(false);

  // ───── 3. ACCIONES ─────

  // Adónde ir después de ingresar: lo que diga «?volver=…» en la dirección;
  // si no hay, el panel que corresponda al rol. `||` significa «usá lo de la derecha
  // si lo de la izquierda está vacío».
  function rutaDeDestino(rutaPorDefecto) {
    return parametrosDeLaDireccion.get('volver') || rutaPorDefecto;
  }

  // Se ejecuta al apretar «Ingresar» (o Enter en un campo).
  // Primero valida; si hay errores corta acá y no «llama a la API».
  function alEnviarFormulario(evento) {
    // evita que el navegador recargue la página (comportamiento normal de un <form>)
    evento.preventDefault();

    // 1) Validación: se arma un objeto con un mensaje por cada campo mal completado.
    const erroresNuevos = {};
    if (!correo.trim()) {
      // .trim() saca los espacios de los costados: «   » cuenta como vacío
      erroresNuevos.correo = 'Ingresá tu correo electrónico.';
    } else if (!/^\S+@\S+\.\S+$/.test(correo)) {
      // la expresión regular pide «algo@algo.algo», sin espacios
      erroresNuevos.correo = 'Ingresá un correo válido.';
    }
    if (!contrasena) {
      erroresNuevos.contrasena = 'Ingresá tu contraseña.';
    }
    setErrores(erroresNuevos);
    setFallo(false); // cada intento limpia el aviso de «credenciales incorrectas» anterior

    // Object.keys(...) lista los campos con error; si hay alguno, no seguimos.
    const hayErrores = Object.keys(erroresNuevos).length > 0;
    if (hayErrores) {
      return;
    }

    // 2) Simulación de la API: setTimeout ejecuta la función de adentro tras 700 ms.
    // Se simula la espera para que se vea el estado «cargando»; en producción acá iría
    // la llamada real al servidor y esto se ejecutaría cuando responda.
    setCargando(true);
    setTimeout(() => {
      setCargando(false);

      // Credencial de demostración: cualquier correo válido con la clave «demo1234».
      if (contrasena !== 'demo1234') {
        setFallo(true);
        return;
      }

      // Si se eligió una cuenta de demo, se entra con su rol y su id. 'org:c00…'.split(':')
      // da ['org', 'c00…']. Si no, el rol sale del correo: si empieza con «org» (sin importar
      // mayúsculas) se entra como organización; si no, como colaboradora (con la cuenta del .env).
      const [rolElegido, idElegido] = cuentaElegida ? cuentaElegida.split(':') : [];
      const rol = rolElegido || (/^org/i.test(correo) ? 'org' : 'col');
      entrar(rol, idElegido);
      const panelDelRol = rol === 'org' ? '/org' : '/panel';
      // replace: true reemplaza esta pantalla en el historial (el botón «atrás» no vuelve al login)
      navegar(rutaDeDestino(panelDelRol), { replace: true });
    }, 700);
  }

  // Se ejecuta al usar un botón de login social (Google, etc.): en el prototipo entra
  // directo como colaboradora, sin pedir datos.
  function alEntrarConRedSocial() {
    entrar('col');
    navegar(rutaDeDestino('/panel'), { replace: true });
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      {/* noValidate: desactiva la validación del navegador; validamos nosotras en
         alEnviarFormulario */}
      <form className={s.form} onSubmit={alEnviarFormulario} noValidate>
        <Heading level={1}>Ingresar</Heading>

        {/* Aparece solo si `fallo` es true: la contraseña no coincidió (ver docs/GLOSARIO.md →
           Renderizado condicional) */}
        {fallo && (
          <Alert kind="error">
            Credenciales incorrectas. Revisá tu correo y tu contraseña.
          </Alert>
        )}

        {/* BLOQUE: campos — correo y contraseña (formularios controlados: el valor vive en el
           estado) */}
        {/* error={errores.correo}: el campo muestra el mensaje solo si existe (si no, es
           undefined) */}
        <Field
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="nombre@correo.org"
          value={correo}
          onChange={(evento) => setCorreo(evento.target.value)}
          error={errores.correo}
        />
        <PasswordField
          label="Contraseña"
          autoComplete="current-password"
          placeholder="••••••••"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
          error={errores.contrasena}
        />

        {/* BLOQUE: cuenta de demo — selector opcional con cuentas reales del backend; se ve
            cuando llegaron las listas (si fallaron, no se muestra). <optgroup> agrupa las
            opciones bajo un título. */}
        {cuentas && !errorDeCuentas && (
          <Field
            as="select"
            label="Cuenta de demo"
            optional
            value={cuentaElegida}
            onChange={(evento) => setCuentaElegida(evento.target.value)}
          >
            <option value="">La del correo (demo por defecto)</option>
            <optgroup label="Organizaciones">
              {cuentas.colectivos.map((colectivo) => (
                <option key={colectivo.id} value={`org:${colectivo.id}`}>{colectivo.nombre}</option>
              ))}
            </optgroup>
            <optgroup label="Colaboradoras">
              {cuentas.colaboradoras.map((colaboradora) => (
                <option key={colaboradora.id} value={`col:${colaboradora.id}`}>
                  {colaboradora.nombreFantasia}
                </option>
              ))}
            </optgroup>
          </Field>
        )}

        {/* BLOQUE: botón principal — en estado «cargando» el botón queda deshabilitado/animado */}
        <Button type="submit" size="lg" fullWidth loading={cargando}>Ingresar</Button>

        {/* BLOQUE: login social — botones de proveedores externos */}
        <SocialButtons onEntrar={alEntrarConRedSocial} />

        {/* BLOQUE: enlaces de ayuda — recuperar clave (pantalla «Pronto») y crear cuenta */}
        <Button variant="link" as={Link} to="/pronto" className={s.olvido}>
          ¿Olvidaste tu contraseña?
        </Button>
        <Text variant="small">¿No tenés cuenta? <Link to="/registro">Crear cuenta</Link></Text>

        {/* BLOQUE: aviso de prototipo — dice con qué datos de demostración se puede entrar */}
        <Alert kind="info" title="Prototipo">
          Entrá con <b>colaboradora@demo.org</b> u{' '}
          <b>organizacion@demo.org</b> y la contraseña <b>demo1234</b>. Para entrar como otra
          cuenta real, elegila en «Cuenta de demo» (con cualquier correo y la misma contraseña).
        </Alert>
      </form>
    </div>
  );
}
