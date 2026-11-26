/**
 * PANTALLA PanelOrg
 * Ruta: /org   ·   Quién la ve: Organización
 * Qué muestra: Cifras, aviso de postulaciones pendientes y proyectos abiertos.
 * De dónde salen los datos: del backend, con el id del colectivo que tiene la sesión
 *   (ver cargarPanel en auxiliares.js): el colectivo, sus proyectos, sus postulaciones
 *   pendientes y las conversaciones con mensajes sin leer.
 * Para modificarla: el aviso es .sh.bar; para otro aviso copiá ese bloque.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: se pide todo al backend con usePedido.
 *      ESPERA Y ERRORES: si falló el pedido, un aviso de error.
 *   2. CÁLCULOS: proyectos abiertos y a qué proyecto lleva «Revisar».
 *   3. ACCIONES: no hay (los botones son enlaces a otras pantallas).
 *   4. LO QUE SE DIBUJA: título, cifras, aviso, última actividad, proyectos abiertos y
 *      botón de alta.
 */
import { Link } from 'react-router-dom';
import { Button, Heading, Icon } from '../../atomos';
import { Alert, CardsSkeleton, Grid } from '../../moleculas';
import { ProyectoCard, UltimaActividad } from '../../organismos';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { mensajeDeError } from '../../api/errores.js';
import { cargarPanel } from './auxiliares.js';
import sh from '../../plantillas/disposicion.module.css';

export default function PanelOrg() {
  // ───── 1. DATOS Y ESTADO ─────

  // `id` es el id (del backend) del colectivo que tiene la sesión.
  const { id } = useAuth();

  // Pide todo lo del panel. Mientras espera, `cargando` es true y `panel` es null.
  // `datos: panel` = «lo que viene en `datos` guardalo con el nombre `panel`».
  const { cargando, datos: panel, error } = usePedido(() => cargarPanel(id), [id]);

  // ───── ESPERA Y ERRORES ─────
  if (error) {
    return (
      <div className={`container ${sh.page}`}>
        <Alert kind="error" title="No pudimos cargar el panel">{mensajeDeError(error)}</Alert>
      </div>
    );
  }

  // ───── 2. CÁLCULOS ─────

  // Mientras carga se usan listas vacías para que el resto del código no falle.
  // (`?.` corta sin romper si `panel` todavía es null; `??` pone el valor de la derecha.)
  const proyectos = panel?.proyectos ?? [];
  const pendientes = panel?.pendientes ?? [];

  // Se queda solo con los proyectos cuyo estado es 'abierto'.
  // (.filter → packages/frontend/docs/GLOSARIO.md → Métodos de arrays)
  const abiertos = proyectos.filter((proyecto) => proyecto.estado === 'abierto');

  // «Revisar» lleva al primer proyecto que tenga postulaciones pendientes. Las postulaciones
  // traen el TÍTULO del proyecto (no su id), y el título no se repite dentro del colectivo.
  const proyectoARevisar = proyectos.find((proyecto) =>
    pendientes.some((postulacion) => postulacion.proyecto === proyecto.titulo)
  );

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué mostrar en «Mis proyectos». Hay tres casos posibles.
  let proyectosAbiertos;
  if (cargando) {
    // Caso 1: todavía está cargando, se muestran tarjetas grises de relleno.
    proyectosAbiertos = <CardsSkeleton n={2} />;
  } else if (abiertos.length > 0) {
    // Caso 2: hay proyectos abiertos, se dibuja una tarjeta por cada uno.
    // `key` le permite a React distinguir cada tarjeta
    // (ver packages/frontend/docs/GLOSARIO.md → Listas con map y key).
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
    // Caso 3: no hay proyectos abiertos, se invita a crear uno.
    proyectosAbiertos = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">No tenés proyectos abiertos</Heading>
        <Button as={Link} to="/org/proyectos/nuevo">Crear un proyecto</Button>
      </div>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>{cargando ? 'Panel' : `Panel de ${panel.colectivo.nombre}`}</Heading>

      {/* BLOQUE: Cifras — proyectos, postulaciones pendientes y mensajes sin leer */}
      {/* Mientras carga se ve «…» en lugar del número. */}
      <div className={sh.stats}>
        <div className={sh.stat}><b>{cargando ? '…' : proyectos.length}</b><span>proyectos</span></div>
        <div className={sh.stat}><b>{cargando ? '…' : pendientes.length}</b><span>postulaciones pendientes</span></div>
        <div className={sh.stat}><b>{cargando ? '…' : panel.sinLeer}</b><span>mensajes sin leer</span></div>
      </div>

      {/* BLOQUE: Aviso — aparece solo si hay postulaciones esperando respuesta */}
      {!cargando && pendientes.length > 0 && (
        <div className={sh.bar}>
          <span>
            {pendientes.length === 1
              ? '1 postulación espera respuesta'
              : `${pendientes.length} postulaciones esperan respuesta`}
          </span>
          {proyectoARevisar && (
            <Button as={Link} to={`/org/proyectos/${proyectoARevisar.id}/postulaciones`}>
              Revisar
            </Button>
          )}
        </div>
      )}

      {/* BLOQUE: Última actividad — componente compartido de la plantilla (organismos/) */}
      <UltimaActividad />

      {/* BLOQUE: Mis proyectos — tarjetas de los proyectos abiertos */}
      <Heading level={2}>Mis proyectos abiertos</Heading>
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
