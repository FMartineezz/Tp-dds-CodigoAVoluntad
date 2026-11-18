/**
 * PANTALLA Info
 * Ruta: /terminos · /accesibilidad · /api-estadisticas · /contacto   ·   Quién la ve: Todas
 * Qué muestra: Páginas de texto informativo (el prop "tema" elige cuál).
 * Para modificarla: un tema nuevo = un bloque {tema === "x" && …} y su ruta en App.js.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → el prop `tema` (qué página mostrar) y lo que viene de la sesión
 *                        para el botón del modo daltónico.
 *   2. CÁLCULOS        → arma el texto JSON de ejemplo que se muestra en la página de la API.
 *   4. LO QUE SE DIBUJA → cuatro versiones posibles (términos, accesibilidad, API y contacto;
 *                        se ve solo la que pide `tema`) y, siempre, el botón «Volver al inicio».
 *   (No hay sección 3 · ACCIONES propia: el único botón que hace algo, el del modo daltónico,
 *   usa la función `toggleDalt` que ya viene de la sesión.)
 */
import { Link } from 'react-router-dom';
import { Button, Heading, Text } from '../../atomos';
import { ESTADISTICAS } from '../../datos';
import { useAuth } from '../../contexto';
import sh from '../../plantillas/disposicion.module.css';

// Estilo del recuadro oscuro donde se muestra el ejemplo de la API (un bloque de código).
// Los valores `var(--…)` son colores y medidas del diseño general del sitio.
const ESTILO_BLOQUE_DE_CODIGO = {
  background: 'var(--color-inverse-bg)',
  color: 'var(--color-inverse-text)',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius)',
  overflow: 'auto',
};

// Recibe un único prop: `tema`, que puede ser 'terminos', 'accesibilidad', 'api' o 'contacto'.
// Se lo define en App.js, una vez por cada ruta (ver docs/GLOSARIO.md → Props).
export default function Info({ tema }) {
  // ───── 1. DATOS Y ESTADO ─────
  // De la sesión se toman dos cosas (las llaves { } sacan solo esas piezas;
  // ver docs/GLOSARIO.md → Desestructurar):
  // `dalt` es true si el modo daltónico está activado, y `toggleDalt` lo prende o apaga.
  const { dalt, toggleDalt } = useAuth();

  // ───── 2. CÁLCULOS ─────
  // Las tres cifras globales que expone la «API» de estadísticas.
  const estadisticasPublicas = {
    proyectos: ESTADISTICAS.proyectos,
    colectivos: ESTADISTICAS.colectivos,
    finalizados: ESTADISTICAS.finalizados,
  };
  // Esas cifras convertidas a texto JSON, con sangría de 2 espacios para que se lea bien.
  // Se muestra tal cual en la página «API pública de estadísticas».
  const json = JSON.stringify(estadisticasPublicas, null, 2);

  // ───── 4. LO QUE SE DIBUJA ─────
  // Un solo return con cuatro bloques posibles: cada uno se dibuja únicamente si `tema`
  // vale lo que dice su condición (`&&`: si es verdadero se dibuja; ver
  // docs/GLOSARIO.md → Renderizado condicional). Los <>…</> agrupan sin agregar HTML extra.
  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Términos y condiciones — se ve solo si tema === 'terminos' */}
      {tema === 'terminos' && (
        <>
          <Heading level={1}>Términos y condiciones</Heading>
          <Text variant="prose">
            Código a Voluntad es una plataforma sin fines de lucro. Los proyectos publicados
            deben tener código abierto y no pueden ser de organizaciones con fines de lucro.
            Las colaboraciones son voluntarias y cada perfil indica si ofrece incentivo o
            posible contratación.
          </Text>
          <Text variant="prose">
            Al registrarte aceptás que tus datos de contacto solo se compartan con la
            organización si aceptan tu postulación.
          </Text>
        </>
      )}

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
            {/* Interruptor del modo daltónico: al tocarlo se prende o apaga (toggleDalt) y el
                texto del botón dice en qué estado quedó (`dalt` true = activado) */}
            <Button
              variant="secondary"
              role="switch"
              aria-checked={dalt}
              onClick={toggleDalt}
            >
              Modo daltónico: {dalt ? 'activado' : 'desactivado'}
            </Button>
          </div>
        </>
      )}

      {/* BLOQUE: API pública — se ve solo si tema === 'api' */}
      {tema === 'api' && (
        <>
          <Heading level={1}>API pública de estadísticas</Heading>
          <Text variant="prose">Métricas globales de la plataforma, sin datos personales.</Text>
          {/* Recuadro de código con el pedido de ejemplo y el JSON calculado arriba.
              `{'\n'}` es un salto de línea escrito como texto. */}
          <pre style={ESTILO_BLOQUE_DE_CODIGO}>
            <code>GET /api/estadisticas{'\n'}{json}</code>
          </pre>
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
