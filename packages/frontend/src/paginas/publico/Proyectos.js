/**
 * PANTALLA Proyectos
 * Ruta: /proyectos   ·   Quién la ve: Todas
 * Qué muestra: Listado paginado de proyectos (del más nuevo al más viejo). Una colaboradora
 *   puede pedir solo los que encajan con sus habilidades.
 * De dónde salen los datos: del backend, una página por vez:
 *   · GET /proyectos?pagina=&limite=                         (ver api/proyectos.js)
 *   · GET /colaboradoras/:id/proyectos-acordes?pagina=&limite= (ver api/colaboradora.js)
 *
 * ¿Y la búsqueda, los filtros por estado/colectivo/habilidad y el orden?
 *   PENDIENTE (backend): GET /proyectos no acepta filtros ni orden. Como el backend manda
 *   UNA página por vez, filtrar en el navegador solo filtraría esos 6 proyectos y el contador
 *   y el paginador quedarían mintiendo. Por eso se sacaron de la pantalla hasta que el backend
 *   acepte, por ejemplo: GET /proyectos?busqueda=&estado=abierto|cerrado&colectivo=:id
 *   &habilidades=id1,id2&orden=recientes|avance|titulo&pagina=&limite=
 *   Para sumar uno cuando exista: un useState para el valor, pasarlo a obtenerProyectos (y
 *   agregarlo a la lista de dependencias de usePedido) y un <Field> en la sección «Filtros».
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → página actual y casilla «solo los que encajan» (useState), la sesión,
 *                        y el pedido al backend (usePedido) que depende de esas dos cosas.
 *   2. CÁLCULOS        → textos del contador a partir de lo que respondió el backend.
 *   3. ACCIONES        → qué pasa al tildar la casilla.
 *   4. LO QUE SE DIBUJA → encabezado, filtros, contador y la lista: tarjetas grises mientras
 *                        carga, aviso si falló, mensaje si no hay proyectos o las tarjetas.
 */
import { useState } from 'react';
import { Checkbox, Heading, Text } from '../../atomos';
import { Alert, CardsSkeleton, Crumbs, Grid, Pager } from '../../moleculas';
import { ProyectoCard } from '../../organismos';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { obtenerProyectos } from '../../api/proyectos.js';
import { obtenerProyectosAcordes } from '../../api/colaboradora.js';
import { mensajeDeError } from '../../api/errores.js';
import s from './Proyectos.module.css';

// Cuántas tarjetas de proyecto entran en cada página del listado (es el `limite` que se
// le pide al backend).
const POR_PAGINA = 6;

export default function Proyectos() {
  // ───── 1. DATOS Y ESTADO ─────
  // Número de la página que se está viendo (empieza en 1). Lo cambia el paginador
  // y vuelve a 1 al tocar la casilla.
  const [pagina, setPagina] = useState(1);
  // true = mostrar solo proyectos que encajan con las habilidades de la colaboradora.
  // Lo cambia el checkbox (solo lo ve una colaboradora).
  const [soloQueEncajan, setSoloQueEncajan] = useState(false);

  // Rol e id de la sesión: rol 'col' (colaboradora), 'org' (organización) o null (visitante);
  // id = el _id real de esa cuenta en el backend.
  // Las llaves { } sacan solo las piezas que necesitamos (ver docs/GLOSARIO.md → Desestructurar).
  const { rol, id } = useAuth();
  // ¿Se usa el endpoint de «acordes»? Solo si es colaboradora y tildó la casilla.
  const usarAcordes = rol === 'col' && soloQueEncajan;

  // Pide UNA página al backend. Se vuelve a pedir cada vez que cambia algo de la lista
  // [pagina, usarAcordes, id] (por ejemplo, al tocar el paginador).
  // `datos: respuesta` = «lo que viene en `datos` guardalo con el nombre `respuesta`».
  // La respuesta es { resultados: [proyectos…], pagina, limite, total, totalPaginas }.
  const { cargando, datos: respuesta, error } = usePedido(
    () =>
      usarAcordes
        ? obtenerProyectosAcordes(id, { pagina, limite: POR_PAGINA })
        : obtenerProyectos({ pagina, limite: POR_PAGINA }),
    [pagina, usarAcordes, id]
  );

  // ───── 2. CÁLCULOS ─────
  // Mientras carga (o si falló) `respuesta` es null: `?.` corta sin romper y `??` pone
  // un valor por defecto (ver docs/GLOSARIO.md → Operadores).
  const proyectos = respuesta?.resultados ?? [];
  // `total` es la cantidad de proyectos en TODAS las páginas, no solo en esta.
  const total = respuesta?.total ?? 0;
  const cantidadPaginas = respuesta?.totalPaginas ?? 1;
  const hayResultados = proyectos.length > 0;
  // Texto del contador, con singular o plural: «1 proyecto», «66 proyectos».
  const textoContador = `${total} ${total === 1 ? 'proyecto' : 'proyectos'}`;

  // ───── 3. ACCIONES ─────
  // Se ejecuta al tildar o destildar «solo proyectos que encajan con mis habilidades».
  // `evento.target.checked` es true o false según quedó la casilla. Vuelve a la página 1.
  function alCambiarEncaje(evento) {
    setSoloQueEncajan(evento.target.checked);
    setPagina(1);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Crumbs items={[{ label: 'Proyectos' }]} />

      {/* BLOQUE: Encabezado — título de la página y frase de invitación */}
      <header className={s.head}>
        <Heading level={1}>Proyectos</Heading>
        <Text variant="lead">Elegí uno que te quede cómodo y postulate. Cada hora cuenta.</Text>
      </header>

      {/* BLOQUE: Filtros — por ahora solo el de «encaje», que el backend sí resuelve.
          Aparece solo si quien mira es una colaboradora (rol 'col'). `&&` significa: si lo
          de la izquierda es verdadero, se dibuja lo de la derecha
          (ver docs/GLOSARIO.md → Renderizado condicional). */}
      {rol === 'col' && (
        <section className={s.filters} aria-label="Filtros">
          <div className={s.encaje}>
            <Checkbox checked={soloQueEncajan} onChange={alCambiarEncaje}>
              Mostrar solo proyectos abiertos que encajan con mis habilidades
            </Checkbox>
          </div>
        </section>
      )}

      {/* BLOQUE: Contador — «Cargando…» o cuántos proyectos hay en total */}
      <p className={s.count} role="status">
        {cargando ? 'Cargando…' : !error && textoContador}
      </p>

      {/* BLOQUE: Resultados — cuatro casos posibles, solo se ve uno a la vez */}
      {/* Caso 1: todavía cargando → tarjetas grises de relleno. */}
      {cargando && <CardsSkeleton />}

      {/* Caso 2: el pedido falló (backend apagado, error 500…) → aviso con el motivo. */}
      {error && (
        <Alert kind="error" title="No pudimos cargar los proyectos">
          {mensajeDeError(error)}
        </Alert>
      )}

      {/* Caso 3: llegó la página y trae proyectos → tarjetas + paginador. */}
      {!cargando && !error && hayResultados && (
        <>
          <Grid>
            {proyectos.map((proyecto) => (
              <ProyectoCard key={proyecto.id} p={proyecto} />
            ))}
          </Grid>
          <Pager page={pagina} pages={cantidadPaginas} onChange={setPagina} />
        </>
      )}

      {/* Caso 4: llegó la página pero vino vacía → mensaje. */}
      {!cargando && !error && !hayResultados && (
        <div className={s.empty}>
          <Heading level={2} size="h3">No hay proyectos para mostrar</Heading>
          <Text>
            {usarAcordes
              ? 'Todavía no hay proyectos abiertos que pidan tus habilidades.'
              : 'Todavía no se publicó ningún proyecto.'}
          </Text>
        </div>
      )}
    </div>
  );
}
