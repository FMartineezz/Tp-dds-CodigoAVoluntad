/**
 * PANTALLA Inicio
 * Ruta: /   ·   Quién la ve: Todas
 * Qué muestra: Hero a ~90% de alto, cinta de habilidades, cifras, proyectos abiertos, gráficos y pasos.
 * Para modificarla: cada bloque es una <section> independiente: borrá o reordená una sin afectar a las demás.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → los textos fijos de los 3 pasos y el aviso de «cargando» (useLoading).
 *   2. CÁLCULOS        → se eligen los 3 primeros proyectos abiertos para mostrar como tarjetas.
 *   4. LO QUE SE DIBUJA → seis bloques apilados: hero, cinta de habilidades, cifras,
 *                         proyectos abiertos, gráficos y «Cómo funciona».
 *   (No hay sección 3 · ACCIONES: esta pantalla no tiene botones que cambien datos;
 *   los botones y enlaces solo llevan a otras rutas.)
 */
import { Link } from 'react-router-dom';
import {
  Button,
  Eyebrow,
  Heading,
  Highlight,
  Overprint,
  Stamp,
  Stat,
  StatusBadge,
  Tag,
  Text,
} from '../../atomos';
import { Barras, CardsSkeleton, Grid, Marquee, Ticket, TicketRow } from '../../moleculas';
import { ProyectoCard } from '../../organismos';
import {
  COLABORACIONES_POR_PERFIL,
  ESTADISTICAS,
  HABILIDADES,
  PROYECTOS,
  PROYECTOS_POR_MES,
} from '../../datos';
import { useLoading } from '../../hooks';
import s from './Inicio.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Los tres pasos de «Cómo funciona». Son texto fijo: nunca cambian mientras se usa la página.
// Cada paso es un objeto con su número, su título corto y su explicación.
const PASOS = [
  {
    numero: '1',
    titulo: 'Publicá',
    descripcion: 'Una organización cuenta qué necesita y qué perfiles busca.',
  },
  {
    numero: '2',
    titulo: 'Postulate',
    descripcion: 'Una persona con oficio levanta la mano para el perfil que le queda cómodo.',
  },
  {
    numero: '3',
    titulo: 'Construyan',
    descripcion: 'Coordinan por mensajes y siguen el avance por hitos.',
  },
];

export default function Inicio() {
  // ───── 1. DATOS Y ESTADO ─────
  // `cargando` vale true un instante al entrar (simula la espera de datos) y después false.
  // Lo cambia el propio hook useLoading, no hay que tocarlo a mano.
  const cargando = useLoading();

  // ───── 2. CÁLCULOS ─────
  // Los proyectos que se muestran en «Proyectos abiertos»: solo los de estado «abierto»
  // y, de esos, únicamente los 3 primeros (.filter se queda con los que cumplen,
  // .slice(0, 3) corta la lista; ver docs/GLOSARIO.md → Métodos de arrays).
  const proyectosAbiertos = PROYECTOS
    .filter((proyecto) => proyecto.estado === 'abierto')
    .slice(0, 3);

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <>
      {/* BLOQUE: Hero — título grande, bajada, botones de registro y un ticket de ejemplo */}
      <section className={s.hero} aria-labelledby="h-hero">
        <div className={`container ${s.heroIn}`}>
          {/* Columna izquierda: textos y llamados a la acción */}
          <div className={s.text}>
            <Eyebrow tag="Red solidaria IT">Código abierto · 100% voluntario</Eyebrow>
            <Heading level={1} size="display" id="h-hero">
              Tu código<br />puede <Overprint>cambiar</Overprint><br />algo.
            </Heading>
            <Text variant="lead">
              Asambleas, fundaciones y colectivos necesitan tecnología. Vos tenés el{' '}
              <Highlight>oficio</Highlight>. Acá se encuentran.
            </Text>
            <div className={s.btns}>
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
            <div className={s.ticketWrap}>
              <Ticket
                tilt
                meta="Proyecto #048"
                status={<StatusBadge status="abierto" />}
                title="App de turnos para el comedor"
                stamp={<Stamp>Sin<br />fines<br />de lucro</Stamp>}
                footer={
                  <Button as={Link} to="/proyectos/48" variant="secondary" fullWidth>
                    Ver proyecto →
                  </Button>
                }
              >
                <TicketRow label="Colectivo">Asamblea Barrial Norte</TicketRow>
                <TicketRow label="Buscamos">
                  <Tag tone="sand">React</Tag>
                  <Tag tone="blue">Node</Tag>
                  <Tag>UX</Tag>
                </TicketRow>
                <TicketRow label="Tiempo">4 h por semana</TicketRow>
              </Ticket>
            </div>
          </div>
        </div>
      </section>

      {/* BLOQUE: Cinta de habilidades — tira que se desplaza con todas las habilidades */}
      <Marquee items={HABILIDADES} />

      {/* BLOQUE: Cifras — tres números globales de la plataforma */}
      <section className={`container ${s.stats}`} aria-label="Cifras de la plataforma">
        <Stat value={ESTADISTICAS.proyectos} label="proyectos" />
        <Stat value={ESTADISTICAS.colectivos} label="colectivos" />
        <Stat value={ESTADISTICAS.finalizados} label="finalizados" />
      </section>

      {/* BLOQUE: Proyectos abiertos — hasta 3 tarjetas y un enlace al listado completo */}
      <section className={`container ${s.sec}`} aria-labelledby="h-abiertos">
        <Heading level={2} id="h-abiertos">Proyectos abiertos</Heading>
        {/* Mientras «cargando» es true se ven 3 tarjetas grises (skeleton);
            cuando termina, se ven las tarjetas reales de los proyectos abiertos. */}
        {cargando ? (
          <CardsSkeleton n={3} />
        ) : (
          <Grid>
            {proyectosAbiertos.map((proyecto) => (
              <ProyectoCard key={proyecto.id} p={proyecto} />
            ))}
          </Grid>
        )}
        <Button as={Link} to="/proyectos" variant="link" iconRight="→">Ver todos</Button>
      </section>

      {/* BLOQUE: La plataforma en números — dos gráficos de barras */}
      <section className={`container ${s.sec}`} aria-labelledby="h-num">
        <Heading level={2} id="h-num">La plataforma en números</Heading>
        <div className={s.charts}>
          <Barras
            titulo="Proyectos publicados por mes"
            datos={PROYECTOS_POR_MES}
            unidad="proyectos"
          />
          <Barras
            titulo="Colaboraciones por perfil"
            datos={COLABORACIONES_POR_PERFIL}
            unidad="colaboraciones"
          />
        </div>
      </section>

      {/* BLOQUE: Cómo funciona — lista numerada con los 3 pasos (salen de PASOS, arriba) */}
      <section className={`container ${s.sec}`} aria-labelledby="h-como">
        <Heading level={2} id="h-como">Cómo funciona</Heading>
        <ol className={s.pasos}>
          {/* .map dibuja un <li> por cada paso; `key` ayuda a React a distinguirlos
              (ver docs/GLOSARIO.md → Listas con map y key) */}
          {PASOS.map((paso) => (
            <li key={paso.numero} className={sh.stat}>
              <b>{paso.numero}</b>
              <span>{paso.titulo}</span>
              <Text variant="small">{paso.descripcion}</Text>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
