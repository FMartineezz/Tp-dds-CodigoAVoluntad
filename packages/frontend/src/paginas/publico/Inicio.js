/**
 * PANTALLA Inicio
 * Ruta: /   ·   Quién la ve: Todas
 * Qué muestra: Hero a ~90% de alto, cinta de habilidades, cifras, proyectos abiertos, gráficos y pasos.
 * Para modificarla: cada bloque es una <section> independiente: borrá o reordená una sin afectar a las demás.
 *
 * De dónde salen los datos (todo del backend):
 *   · cifras y gráficos   → GET /estadisticas   (api/estadisticas.js; ojo: máx. 5 pedidos
 *                           cada 20 min por IP, por eso se guarda la respuesta)
 *   · proyectos abiertos  → GET /proyectos?pagina=1&limite=20 (api/proyectos.js)
 *   · cinta de habilidades → GET /habilidades   (api/habilidades.js)
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → los textos fijos de los 3 pasos y los tres pedidos al backend
 *                        (usePedido), cada uno con su propio cargando/error.
 *   2. CÁLCULOS        → se eligen los 3 primeros proyectos abiertos para mostrar como
 *                        tarjetas y se recortan los datos de los gráficos.
 *   4. LO QUE SE DIBUJA → seis bloques apilados: hero, cinta de habilidades, cifras,
 *                         proyectos abiertos, gráficos y «Cómo funciona».
 *   (No hay sección 3 · ACCIONES: esta pantalla no tiene botones que cambien datos;
 *   los botones y enlaces solo llevan a otras rutas.)
 */
import { Link } from "react-router-dom";
import {
  Button,
  Eyebrow,
  Heading,
  Highlight,
  Icon,
  Overprint,
  Stamp,
  Stat,
  StatusBadge,
  Tag,
  Text,
} from "../../atomos";
import { Alert, Barras, CardsSkeleton, Grid, Marquee, Ticket, TicketRow } from "../../moleculas";
import { ProyectoCard } from "../../organismos";
import { usePedido } from "../../hooks";
import { obtenerEstadisticas } from "../../api/estadisticas.js";
import { obtenerProyectos } from "../../api/proyectos.js";
import { obtenerHabilidades } from "../../api/habilidades.js";
import { mensajeDeError } from "../../api/errores.js";
import s from "./Inicio.module.css";

// Los tres pasos de «Cómo funciona». Son texto fijo: nunca cambian mientras se usa la página.
// Cada paso es un objeto con su número, su ícono (ver atomos/Icon), su título y su explicación.
const PASOS = [
  {
    numero: "1",
    icono: "megafono",
    titulo: "Publicá",
    descripcion: "Una organización cuenta qué necesita y qué perfiles busca.",
  },
  {
    numero: "2",
    icono: "mano",
    titulo: "Postulate",
    descripcion: "Una persona con oficio levanta la mano para el perfil donde más puede aportar.",
  },
  {
    numero: "3",
    icono: "codigo",
    titulo: "Construyan",
    descripcion: "Coordinan por mensajes y siguen el avance por hitos.",
  },
];

export default function Inicio() {
  // ───── 1. DATOS Y ESTADO ─────
  // Tres pedidos independientes: si uno falla, los otros bloques se ven igual.
  // El `[]` del final significa «pedilo una sola vez, al entrar».
  // `datos: estadisticas` = «lo que viene en `datos` guardalo con el nombre `estadisticas`».
  const {
    cargando: cargandoCifras,
    datos: estadisticas,
    error: errorCifras,
  } = usePedido(() => obtenerEstadisticas(), []);
  // Proyectos para «Proyectos abiertos»: la primera página (los 20 más nuevos).
  const {
    cargando: cargandoProyectos,
    datos: paginaDeProyectos,
    error: errorProyectos,
  } = usePedido(() => obtenerProyectos({ pagina: 1, limite: 20 }), []);
  // Catálogo de habilidades para la cinta que se desplaza.
  const { datos: habilidades } = usePedido(() => obtenerHabilidades(), []);

  // ───── 2. CÁLCULOS ─────
  // Los proyectos que se muestran en «Proyectos abiertos»: de los 20 más nuevos, los de
  // estado «abierto» y, de esos, únicamente los 3 primeros (.filter se queda con los que
  // cumplen, .slice(0, 3) corta la lista; ver docs/GLOSARIO.md → Métodos de arrays).
  // Es una selección de «destacados», no un filtro del listado: por eso alcanza con mirar
  // la primera página. PENDIENTE (backend): GET /proyectos?estado=abierto lo haría exacto.
  const proyectosAbiertos = (paginaDeProyectos?.resultados ?? [])
    .filter((proyecto) => proyecto.estado === "abierto")
    .slice(0, 3);
  // El primero de esos va en el «ticket» grande del hero (undefined si no hay ninguno).
  const proyectoDelHero = proyectosAbiertos[0];
  // Solo los títulos de las habilidades, para la cinta.
  const titulosDeHabilidades = (habilidades ?? []).map((habilidad) => habilidad.titulo);
  // Datos de los gráficos: listas [etiqueta, valor] ya ordenadas de mayor a menor por el
  // backend; se muestran las primeras 6 para que no queden gigantes.
  const colectivosPorUbicacion = estadisticas?.colectivosPorUbicacion.slice(0, 6) ?? [];
  const postulacionesPorProyecto = estadisticas?.postulacionesPorProyecto.slice(0, 6) ?? [];

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <>
      {/* BLOQUE: Hero — título grande, bajada, botones de registro y un ticket de ejemplo */}
      <section className={s.hero} aria-labelledby="h-hero">
        <div className={`container ${s.heroContenido}`}>
          {/* Columna izquierda: textos y llamados a la acción */}
          <div className={s.text}>
            <Eyebrow tag="Red solidaria IT">Código abierto · 100% voluntario</Eyebrow>
            <Heading level={1} size="display" id="h-hero">
              Tu código
              <br />
              puede <Overprint>cambiar</Overprint>
              <br />
              algo.
            </Heading>
            <Text variant="lead">
              Asambleas, fundaciones y colectivos necesitan tecnología. Vos tenés el{" "}
              <Highlight>oficio</Highlight>. Acá se encuentran.
            </Text>
            <div className={s.botones}>
              <Button as={Link} to="/registro/colaboradora" size="lg" iconRight="→">
                Quiero colaborar
              </Button>
              <Button as={Link} to="/registro/organizacion" variant="link">
                Somos una organización
              </Button>
            </div>
          </div>

          {/* Columna derecha: decoración + un «ticket» de ejemplo de proyecto (texto fijo) */}
          <div className={s.stage}>
            <div className={s.sun} aria-hidden="true" />
            <div className={s.dot} aria-hidden="true" />
            {/* El ticket muestra el proyecto abierto más nuevo; si todavía no llegó (o no hay
                ninguno abierto) no se dibuja y queda solo la decoración. */}
            {proyectoDelHero && (
              <div className={s.ticketWrap}>
                <Ticket
                  tilt
                  meta="Proyecto destacado"
                  status={<StatusBadge status="abierto" />}
                  title={proyectoDelHero.titulo}
                  stamp={
                    <Stamp>
                      Sin
                      <br />
                      fines
                      <br />
                      de lucro
                    </Stamp>
                  }
                  footer={
                    <Button
                      as={Link}
                      to={`/proyectos/${proyectoDelHero.id}`}
                      variant="secondary"
                      fullWidth
                    >
                      Ver proyecto →
                    </Button>
                  }
                >
                  <TicketRow label="Colectivo">{proyectoDelHero.colectivo}</TicketRow>
                  <TicketRow label="Buscamos">
                    {/* Hasta 3 habilidades, con un color distinto cada una */}
                    {proyectoDelHero.habilidades.slice(0, 3).map((habilidad, posicion) => (
                      <Tag key={habilidad} tone={["sand", "blue", undefined][posicion]}>
                        {habilidad}
                      </Tag>
                    ))}
                  </TicketRow>
                  <TicketRow label="Tiempo">{proyectoDelHero.tiempo}</TicketRow>
                </Ticket>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* BLOQUE: Cinta de habilidades — tira que se desplaza con todas las habilidades */}
      {/* Se dibuja recién cuando llegó el catálogo (con la lista vacía no tendría sentido). */}
      {titulosDeHabilidades.length > 0 && <Marquee items={titulosDeHabilidades} />}

      {/* BLOQUE: Cifras — tres números globales de la plataforma (GET /estadisticas).
          Mientras cargan se ve «…»; si fallaron (por ejemplo, el límite de pedidos), un aviso. */}
      <section className={`container ${s.stats}`} aria-label="Cifras de la plataforma">
        {errorCifras ? (
          <Alert kind="info" title="Las cifras no están disponibles ahora">
            {mensajeDeError(errorCifras)}
          </Alert>
        ) : (
          <>
            <Stat
              icon="proyectos"
              value={cargandoCifras ? "…" : estadisticas.proyectos}
              label="proyectos"
            />
            <Stat
              icon="colectivos"
              value={cargandoCifras ? "…" : estadisticas.colectivos}
              label="colectivos"
            />
            <Stat
              icon="check"
              value={cargandoCifras ? "…" : estadisticas.finalizados}
              label="proyectos finalizados"
            />
          </>
        )}
      </section>

      {/* BLOQUE: Proyectos abiertos — hasta 3 tarjetas y un enlace al listado completo */}
      <section className={`container ${s.seccion}`} aria-labelledby="h-abiertos">
        <Heading level={2} id="h-abiertos">
          Proyectos abiertos
        </Heading>
        {/* Cuatro casos: cargando → 3 tarjetas grises; falló → aviso; hay abiertos → sus
            tarjetas; no hay ninguno → texto. */}
        {cargandoProyectos && <CardsSkeleton n={3} />}
        {errorProyectos && (
          <Alert kind="error" title="No pudimos cargar los proyectos">
            {mensajeDeError(errorProyectos)}
          </Alert>
        )}
        {!cargandoProyectos && !errorProyectos && proyectosAbiertos.length > 0 && (
          <Grid>
            {proyectosAbiertos.map((proyecto) => (
              <ProyectoCard key={proyecto.id} p={proyecto} />
            ))}
          </Grid>
        )}
        {!cargandoProyectos && !errorProyectos && proyectosAbiertos.length === 0 && (
          <Text>Ahora mismo no hay proyectos buscando gente entre los más nuevos.</Text>
        )}
        <Button as={Link} to="/proyectos" variant="link" iconRight="→">
          Ver todos
        </Button>
      </section>

      {/* BLOQUE: La plataforma en números — dos gráficos de barras con datos de
          GET /estadisticas. Se ve solo si llegaron las estadísticas.
          PENDIENTE (backend): los gráficos de la maqueta («Proyectos publicados por mes» y
          «Colaboraciones por perfil») no tienen datos en /estadisticas; se reemplazaron por
          los que sí hay: colectivos por ubicación y postulaciones por proyecto. */}
      {estadisticas && (
        <section className={`container ${s.seccion}`} aria-labelledby="h-num">
          <Heading level={2} id="h-num">
            La plataforma en números
          </Heading>
          <div className={s.charts}>
            {/* Cada gráfico solo si tiene al menos una barra */}
            {colectivosPorUbicacion.length > 0 && (
              <Barras
                titulo="Colectivos por ubicación"
                datos={colectivosPorUbicacion}
                unidad="colectivos"
              />
            )}
            {postulacionesPorProyecto.length > 0 && (
              <Barras
                titulo="Proyectos con más postulaciones"
                datos={postulacionesPorProyecto}
                unidad="postulaciones"
              />
            )}
          </div>
        </section>
      )}

      {/* BLOQUE: Cómo funciona — lista numerada con los 3 pasos (salen de PASOS, arriba) */}
      <section className={`container ${s.seccion}`} aria-labelledby="h-como">
        <Heading level={2} id="h-como">
          Cómo funciona
        </Heading>
        <ol className={s.pasos}>
          {/* .map dibuja un <li> por cada paso; `key` ayuda a React a distinguirlos
              (ver docs/GLOSARIO.md → Listas con map y key) */}
          {PASOS.map((paso) => (
            <li key={paso.numero} className={s.paso}>
              <span className={s.pasoIcono}>
                <Icon name={paso.icono} size={30} />
              </span>
              <span className={s.pasoNumero}>Paso {paso.numero}</span>
              <Heading level={3} size="h3">{paso.titulo}</Heading>
              <Text variant="small">{paso.descripcion}</Text>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
