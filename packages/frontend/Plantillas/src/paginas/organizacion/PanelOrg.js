/**
 * PANTALLA PanelOrg
 * Ruta: /org   ·   Quién la ve: Organización
 * Qué muestra: Cifras, aviso de postulaciones pendientes y proyectos abiertos.
 * Para modificarla: el aviso es .sh.bar; para otro aviso copiá ese bloque.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: esta pantalla no recuerda nada; solo pregunta si está cargando.
 *   2. CÁLCULOS: de «mis proyectos» se separan los que están abiertos.
 *   3. ACCIONES: no hay (los botones son enlaces a otras pantallas).
 *   4. LO QUE SE DIBUJA: título, cifras, aviso, proyectos abiertos y botón de alta.
 */
import { Link } from 'react-router-dom';
import { Button, Heading, Icon } from '../../atomos';
import { CardsSkeleton, Grid } from '../../moleculas';
import { ProyectoCard } from '../../organismos';
import { useLoading } from '../../hooks';
import { MIS } from './auxiliares.js';
import sh from '../../plantillas/disposicion.module.css';

export default function PanelOrg() {
  // ───── 1. DATOS Y ESTADO ─────

  // `cargando` es true un instante (simula la espera de datos) y después false.
  // Mientras es true se muestran bloques grises en lugar de las tarjetas.
  const cargando = useLoading();

  // ───── 2. CÁLCULOS ─────

  // Se queda solo con los proyectos de la organización cuyo estado es 'abierto'.
  // (.filter → docs/GLOSARIO.md → Métodos de arrays)
  const abiertos = MIS.filter((proyecto) => proyecto.estado === 'abierto');

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué mostrar en «Mis proyectos». Hay tres casos posibles.
  let proyectosAbiertos;
  if (cargando) {
    // Caso 1: todavía está cargando, se muestran tarjetas grises de relleno.
    proyectosAbiertos = <CardsSkeleton n={2} />;
  } else if (abiertos.length > 0) {
    // Caso 2: hay proyectos abiertos, se dibuja una tarjeta por cada uno.
    // `key` le permite a React distinguir cada tarjeta
    // (ver docs/GLOSARIO.md → Listas con map y key).
    proyectosAbiertos = (
      <Grid>
        {abiertos.map((proyecto) => (
          <ProyectoCard
            key={proyecto.id}
            p={proyecto}
            footer={
              <Button as={Link} to={`/org/proyectos/${proyecto.id}/editar`} variant="secondary">
                Editar
              </Button>
            }
          />
        ))}
      </Grid>
    );
  } else {
    // Caso 3: no hay proyectos abiertos, se invita a crear el primero.
    proyectosAbiertos = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">Todavía no publicaste proyectos</Heading>
        <Button as={Link} to="/org/proyectos/nuevo">Crear el primero</Button>
      </div>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Panel de Asamblea Barrial Norte</Heading>

      {/* BLOQUE: Cifras — tres recuadros con proyectos, postulaciones y mensajes */}
      {/* Las cifras de postulaciones (5) y mensajes (2) son fijas: es un prototipo. */}
      <div className={sh.stats}>
        <div className={sh.stat}><b>{MIS.length}</b><span>proyectos</span></div>
        <div className={sh.stat}><b>5</b><span>postulaciones</span></div>
        <div className={sh.stat}><b>2</b><span>mensajes</span></div>
      </div>

      {/* BLOQUE: Aviso — franja que avisa que hay postulaciones esperando respuesta */}
      <div className={sh.bar}>
        <span>5 postulaciones esperan respuesta</span>
        <Button as={Link} to="/org/proyectos/48/postulaciones">Revisar</Button>
      </div>

      {/* BLOQUE: Mis proyectos — tarjetas de los proyectos abiertos */}
      {/* Muestra relleno gris si carga; las tarjetas si hay abiertos; si no, el aviso vacío. */}
      <Heading level={2}>Mis proyectos</Heading>
      {proyectosAbiertos}

      {/* BLOQUE: Alta — botón para crear un proyecto nuevo */}
      <div>
        <Button as={Link} to="/org/proyectos/nuevo" iconRight={<Icon name="mas" size={14} />}>
          Nuevo proyecto
        </Button>
      </div>
    </div>
  );
}
