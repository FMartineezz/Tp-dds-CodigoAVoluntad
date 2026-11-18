/**
 * PANTALLA Info
 * Ruta: /terminos · /accesibilidad · /api-estadisticas · /contacto   ·   Quién la ve: Todas
 * Qué muestra: Páginas de texto informativo (el prop "tema" elige cuál).
 * Para modificarla: un tema nuevo = un bloque {tema === "x" && …} y su ruta en App.js.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   · EstadisticasEnVivo (componente chico) → pide GET /estadisticas y muestra la respuesta
 *                        real; solo se usa en el tema 'api' (así las otras páginas no gastan
 *                        pedidos: el backend permite 5 cada 20 minutos).
 *   1. DATOS Y ESTADO  → el prop `tema` (qué página mostrar) y lo que viene de la sesión
 *                        para el botón del modo daltónico.
 *   4. LO QUE SE DIBUJA → cuatro versiones posibles (términos, accesibilidad, API y contacto;
 *                        se ve solo la que pide `tema`) y, siempre, el botón «Volver al inicio».
 *   (No hay sección 3 · ACCIONES propia: el único botón que hace algo, el del modo daltónico,
 *   usa la función `toggleDalt` que ya viene de la sesión.)
 */
import { Link } from 'react-router-dom';
import { Button, Heading, Text } from '../../atomos';
import { Alert, RowsSkeleton } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { obtenerEstadisticas } from '../../api/estadisticas.js';
import { mensajeDeError } from '../../api/errores.js';
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

// ═════ COMPONENTE AUXILIAR: EstadisticasEnVivo ═════
// Pide las estadísticas al backend y las muestra tal cual llegan (JSON con sangría).
// Está aparte porque un hook (usePedido) no se puede llamar «solo a veces» dentro de Info:
// como este componente se dibuja solo con tema === 'api', el pedido se hace solo ahí.
function EstadisticasEnVivo() {
  const { cargando, datos: estadisticas, error } = usePedido(() => obtenerEstadisticas(), []);

  // Mientras llega → filas grises. Si falló (por ejemplo, 429 por pasar el límite) → aviso.
  if (cargando) return <RowsSkeleton n={4} />;
  if (error) {
    return (
      <Alert kind="error" title="No pudimos traer las estadísticas">
        {mensajeDeError(error)}
      </Alert>
    );
  }
  // `crudo` es la respuesta del backend sin adaptar. JSON.stringify(…, null, 2) la convierte
  // en texto con sangría de 2 espacios para que se lea bien.
  const json = JSON.stringify(estadisticas.crudo, null, 2);
  // `{'\n'}` es un salto de línea escrito como texto.
  return (
    <pre style={ESTILO_BLOQUE_DE_CODIGO}>
      <code>GET {import.meta.env.VITE_API_URL}/estadisticas{'\n'}{json}</code>
    </pre>
  );
}

// Recibe un único prop: `tema`, que puede ser 'terminos', 'accesibilidad', 'api' o 'contacto'.
// Se lo define en App.js, una vez por cada ruta (ver docs/GLOSARIO.md → Props).
export default function Info({ tema }) {
  // ───── 1. DATOS Y ESTADO ─────
  // De la sesión se toman dos cosas (las llaves { } sacan solo esas piezas;
  // ver docs/GLOSARIO.md → Desestructurar):
  // `dalt` es true si el modo daltónico está activado, y `toggleDalt` lo prende o apaga.
  const { dalt, toggleDalt } = useAuth();

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
          <Text variant="prose">
            Métricas globales de la plataforma, sin datos personales. Esta es la respuesta
            real del backend en este momento. Sin API key se pueden hacer hasta 5 consultas
            cada 20 minutos.
          </Text>
          <EstadisticasEnVivo />
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
