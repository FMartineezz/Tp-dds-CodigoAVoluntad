/**
 * PANTALLA Info
 * Ruta: /terminos · /accesibilidad · /api-estadisticas · /contacto   ·   Quién la ve: Todas
 * Qué muestra: Páginas de texto informativo (el prop "tema" elige cuál).
 * Para modificarla: un tema nuevo = un bloque {tema === "x" && …} y su ruta en App.js.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   · CLAUSULAS / CAMPOS_DE_LA_API / USOS_DE_LA_API → textos fijos de términos y de la API.
 *   · Terminos (componente chico) → documento con índice al costado y cláusulas numeradas.
 *   · ApiDeEstadisticas (componente chico) → para qué sirve, qué devuelve cada campo y
 *                        ejemplos (curl, JavaScript y la respuesta real en vivo).
 *   · EstadisticasEnVivo (componente chico) → pide GET /estadisticas y muestra la respuesta
 *                        real; solo se dibuja en la pestaña «Respuesta en vivo» (así no se
 *                        gastan pedidos: el backend permite 5 cada 20 minutos).
 *   1. DATOS Y ESTADO  → el prop `tema` y lo que viene de la sesión para el modo daltónico.
 *   4. LO QUE SE DIBUJA → la página que pide `tema` y, siempre, el botón «Volver al inicio».
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Icon, Text } from '../../atomos';
import { Alert, RowsSkeleton, Tabs } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { obtenerEstadisticas } from '../../api/estadisticas.js';
import { mensajeDeError } from '../../api/errores.js';
import s from './Info.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Fecha de la última vez que cambiaron los términos. Actualizala si cambiás una cláusula.
const TERMINOS_ACTUALIZADOS = '25/11/2026';

// Cláusulas de los términos: cada una tiene un id (para el índice), un título y su texto.
const CLAUSULAS = [
  {
    id: 'plataforma',
    titulo: 'La plataforma',
    texto:
      'Código a Voluntad es una plataforma sin fines de lucro que conecta organizaciones sociales con personas que donan su tiempo y su oficio en tecnología.',
  },
  {
    id: 'proyectos',
    titulo: 'Proyectos',
    texto:
      'Todo proyecto publicado tiene que ser de código abierto. No se aceptan proyectos de organizaciones con fines de lucro.',
  },
  {
    id: 'colaborar',
    titulo: 'Colaborar',
    texto:
      'Las colaboraciones son voluntarias. Cada perfil buscado aclara si es gratuito, si ofrece un incentivo económico o una posible contratación.',
  },
  {
    id: 'datos',
    titulo: 'Tus datos',
    texto:
      'Tus datos de contacto solo se comparten con una organización si acepta tu postulación. Podés colaborar de forma anónima.',
  },
  {
    id: 'bajas',
    titulo: 'Bajas',
    texto:
      'Podés dar de baja tu cuenta cuando quieras. Las colaboraciones y valoraciones que ya existían se conservan como historial de los proyectos.',
  },
];

// Para qué sirve la API, en ejemplos concretos (ícono de atomos/Icon + texto).
const USOS_DE_LA_API = [
  { icono: 'proyectos', texto: 'Un contador en la web de tu organización: «ya hay 22 proyectos buscando gente».' },
  { icono: 'colectivos', texto: 'Un mapa de en qué provincias hay colectivos usando la plataforma.' },
  { icono: 'postulaciones', texto: 'Un informe o un trabajo práctico con datos reales y actualizados.' },
];

// Qué significa cada campo de la respuesta (los nombres son los que manda el backend).
const CAMPOS_DE_LA_API = [
  ['estadisticasProyectos.proyectos.total', 'Proyectos publicados, abiertos o no.'],
  ['estadisticasProyectos.proyectos.activos', 'Proyectos que todavía no terminaron.'],
  ['estadisticasProyectos.proyectos.finalizados', 'Proyectos que ya terminaron.'],
  ['estadisticasProyectos.postulacionesPorProyecto', 'Por cada proyecto: cuántas postulaciones tuvo y cuántas se aceptaron, rechazaron o siguen pendientes.'],
  ['estadisticasColectivos.total', 'Colectivos registrados.'],
  ['estadisticasColectivos.porUbicacion', 'Cuántos colectivos hay en cada provincia.'],
  ['estadisticasColaboraciones.total', 'Colaboraciones en curso o terminadas.'],
  ['estadisticasColaboraciones.anonimas', 'De esas, cuántas son de personas que eligieron no mostrar su nombre.'],
];

const URL_DE_LA_API = `${import.meta.env.VITE_API_URL}/estadisticas`;

// Ejemplos de código para cada pestaña (texto fijo que se muestra tal cual).
const EJEMPLO_CURL = `curl ${URL_DE_LA_API}

# Si pasaste el límite responde 429: esperá unos minutos.`;
const EJEMPLO_JS = `const respuesta = await fetch('${URL_DE_LA_API}');
const datos = await respuesta.json();

console.log(datos.estadisticasProyectos.proyectos.total); // ej. 22`;

// ═════ COMPONENTE AUXILIAR: Terminos ═════
// Índice a la izquierda (enlaces a cada cláusula) y las cláusulas numeradas a la derecha.
function Terminos() {
  return (
    <>
      <Heading level={1}>Términos y condiciones</Heading>
      <div className={s.documento}>
        <nav className={s.indice} aria-label="Índice de los términos">
          <ol>
            {CLAUSULAS.map((clausula) => (
              <li key={clausula.id}>
                <a href={`#${clausula.id}`}>{clausula.titulo}</a>
              </li>
            ))}
          </ol>
        </nav>
        <div className={s.clausulas}>
          {CLAUSULAS.map((clausula, posicion) => (
            <section key={clausula.id} id={clausula.id} className={s.clausula}>
              <b className={s.numero} aria-hidden="true">{posicion + 1}</b>
              <div>
                <Heading level={2} size="h3">{clausula.titulo}</Heading>
                <Text>{clausula.texto}</Text>
              </div>
            </section>
          ))}
          <Text variant="muted">Última actualización: {TERMINOS_ACTUALIZADOS}</Text>
        </div>
      </div>
    </>
  );
}

// ═════ COMPONENTE AUXILIAR: ApiDeEstadisticas ═════
// Primero el «para qué» (para quien no programa) y después la referencia técnica.
function ApiDeEstadisticas() {
  // Pestaña de ejemplos elegida: 'curl', 'js' o 'vivo'.
  const [pestana, setPestana] = useState('curl');

  return (
    <>
      <Heading level={1}>API pública de estadísticas</Heading>

      {/* BLOQUE: Para qué sirve */}
      <section className={s.intro} aria-labelledby="h-para-que">
        <Text variant="lead">
          Números globales de la plataforma, sin datos personales, para usarlos donde quieras.
          No hace falta crear una cuenta ni pedir permiso.
        </Text>
        <Heading level={2} size="h3" id="h-para-que">¿Para qué sirve?</Heading>
        <ul className={s.usos}>
          {USOS_DE_LA_API.map((uso) => (
            <li key={uso.texto}>
              <span className={s.usoIcono}><Icon name={uso.icono} size={22} /></span>
              {uso.texto}
            </li>
          ))}
        </ul>
      </section>

      {/* BLOQUE: Referencia — endpoint, límite y qué es cada campo */}
      <section className={s.referencia} aria-labelledby="h-referencia">
        <Heading level={2} size="h3" id="h-referencia">Cómo se usa</Heading>
        <p className={s.endpoint}>
          <span className={s.metodo}>GET</span>
          <code>/estadisticas</code>
          <span className={s.limite}>5 pedidos cada 20 minutos</span>
        </p>
        <Text>Devuelve los totales de la plataforma en este momento, en formato JSON.</Text>
        <div className={s.tablaConScroll}>
          <table className={sh.table}>
            <thead>
              <tr>
                <th>Campo</th>
                <th>Qué es</th>
              </tr>
            </thead>
            <tbody>
              {CAMPOS_DE_LA_API.map(([campo, explicacion]) => (
                <tr key={campo}>
                  <td><code className={s.campo}>{campo}</code></td>
                  <td>{explicacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* BLOQUE: Ejemplos — la respuesta en vivo solo se pide al abrir su pestaña */}
      <section aria-labelledby="h-ejemplos">
        <Heading level={2} size="h3" id="h-ejemplos">Ejemplos</Heading>
        <Tabs
          tabs={[
            { id: 'curl', label: 'curl' },
            { id: 'js', label: 'JavaScript' },
            { id: 'vivo', label: 'Respuesta en vivo' },
          ]}
          value={pestana}
          onChange={setPestana}
        >
          {pestana === 'curl' && <pre className={s.codigo}><code>{EJEMPLO_CURL}</code></pre>}
          {pestana === 'js' && <pre className={s.codigo}><code>{EJEMPLO_JS}</code></pre>}
          {pestana === 'vivo' && <EstadisticasEnVivo />}
        </Tabs>
      </section>
    </>
  );
}

// ═════ COMPONENTE AUXILIAR: EstadisticasEnVivo ═════
// Pide las estadísticas al backend y las muestra tal cual llegan (JSON con sangría).
// Está aparte porque un hook (usePedido) no se puede llamar «solo a veces»: como este
// componente se dibuja solo en su pestaña, el pedido se hace solo ahí.
function EstadisticasEnVivo() {
  const { cargando, datos: estadisticas, error } = usePedido(() => obtenerEstadisticas(), []);

  if (cargando) return <RowsSkeleton n={4} />;
  if (error) {
    return (
      <Alert kind="error" title="No pudimos traer las estadísticas">
        {mensajeDeError(error)}
      </Alert>
    );
  }
  // `crudo` es la respuesta del backend sin adaptar; JSON.stringify(…, null, 2) la indenta.
  const json = JSON.stringify(estadisticas.crudo, null, 2);
  return (
    <pre className={s.codigo}>
      <code>GET {URL_DE_LA_API}{'\n\n'}{json}</code>
    </pre>
  );
}

// Recibe un único prop: `tema`, que puede ser 'terminos', 'accesibilidad', 'api' o 'contacto'.
// Se lo define en App.js, una vez por cada ruta (ver packages/frontend/docs/GLOSARIO.md → Props).
export default function Info({ tema }) {
  // ───── 1. DATOS Y ESTADO ─────
  // `dalt` es true si el modo daltónico está activado, y `toggleDalt` lo prende o apaga.
  const { dalt, toggleDalt } = useAuth();

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      {tema === 'terminos' && <Terminos />}

      {tema === 'api' && <ApiDeEstadisticas />}

      {/* BLOQUE: Accesibilidad — se ve solo si tema === 'accesibilidad' */}
      {tema === 'accesibilidad' && (
        <>
          <Heading level={1}>Accesibilidad</Heading>
          <Text variant="prose">
            La plataforma busca cumplir WCAG AA: contraste de texto de al menos 4,5:1,
            navegación completa por teclado, etiquetas ARIA, textos y botones grandes y
            respeto por la preferencia de movimiento reducido.
          </Text>
          <Text variant="prose">
            El modo daltónico reemplaza los pares rojo y verde por una paleta segura. Los
            estados nunca dependen solo del color: siempre llevan texto e ícono.
          </Text>
          <div>
            {/* Interruptor del modo daltónico: el texto dice en qué estado quedó */}
            <Button variant="secondary" role="switch" aria-checked={dalt} onClick={toggleDalt}>
              Modo daltónico: {dalt ? 'activado' : 'desactivado'}
            </Button>
          </div>
        </>
      )}

      {/* BLOQUE: Contacto — se ve solo si tema === 'contacto' */}
      {tema === 'contacto' && (
        <>
          <Heading level={1}>Contacto</Heading>
          <Text variant="prose">
            Escribinos a contacto@codigoavoluntad.org. Respondemos dentro de los cinco días
            hábiles.
          </Text>
        </>
      )}

      {/* BLOQUE: Volver — botón que se ve siempre, sea cual sea el tema */}
      <div><Button as={Link} to="/" variant="secondary">Volver al inicio</Button></div>
    </div>
  );
}
