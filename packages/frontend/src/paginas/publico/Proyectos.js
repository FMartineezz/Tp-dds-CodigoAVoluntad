/**
 * PANTALLA Proyectos
 * Ruta: /proyectos   ·   Quién la ve: Todas
 * Qué muestra: Listado paginado de proyectos (del más nuevo al más viejo). Una colaboradora
 *   puede pedir solo los que encajan con sus habilidades.
 * De dónde salen los datos: del backend, una página por vez:
 *   · GET /proyectos?pagina=&limite=                         (ver api/proyectos.js)
 *   · GET /colaboradoras/:id/proyectos-acordes?pagina=&limite= (ver api/colaboradora.js)
 *
 * Filtros (como en LinkedIn): búsqueda, estado, modalidad y habilidad. Los resuelve el
 *   backend (GET /proyectos?busqueda=&estado=&modalidad=&habilidad=), así el contador y el
 *   paginador cuentan solo lo filtrado. Para sumar uno: un campo más en FILTROS_VACIOS,
 *   un <Field> en la sección «Filtros» y que el backend lo acepte.
 *   Con «solo los que encajan» se usa el endpoint de acordes, que no tiene filtros: por eso
 *   los filtros se deshabilitan mientras esa casilla está tildada.
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
import { Button, Checkbox, Field, Heading, Text } from '../../atomos';
import { Alert, CardsSkeleton, Crumbs, Grid, Pager } from '../../moleculas';
import { ProyectoCard } from '../../organismos';
import { useAuth } from '../../contexto';
import { useDemorado, usePedido } from '../../hooks';
import { MODALIDADES, obtenerProyectos } from '../../api/proyectos.js';
import { obtenerHabilidades } from '../../api/habilidades.js';
import { obtenerProyectosAcordes } from '../../api/colaboradora.js';
import { mensajeDeError } from '../../api/errores.js';
import s from './Proyectos.module.css';

// Cuántas tarjetas de proyecto entran en cada página del listado (es el `limite` que se
// le pide al backend).
const POR_PAGINA = 6;

// Filtros sin completar: '' en un filtro significa «todos» (no viaja al backend).
const FILTROS_VACIOS = { busqueda: '', estado: '', modalidad: '', habilidad: '' };

// Opciones del filtro de estado: valor que entiende el backend → texto que se ve.
const ESTADOS = { abierto: 'Buscan gente', en_curso: 'En curso', finalizado: 'Finalizados' };

export default function Proyectos() {
  // ───── 1. DATOS Y ESTADO ─────
  // Número de la página que se está viendo (empieza en 1). Lo cambia el paginador
  // y vuelve a 1 al tocar la casilla.
  const [pagina, setPagina] = useState(1);
  // true = mostrar solo proyectos que encajan con las habilidades de la colaboradora.
  // Lo cambia el checkbox (solo lo ve una colaboradora).
  const [soloQueEncajan, setSoloQueEncajan] = useState(false);
  // Lo que eligió en cada filtro (ver FILTROS_VACIOS).
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  // La búsqueda viaja recién cuando deja de escribir, no en cada tecla.
  const busquedaDemorada = useDemorado(filtros.busqueda);
  // Catálogo de habilidades para el desplegable (título que se ve, código que viaja).
  const { datos: habilidades } = usePedido(() => obtenerHabilidades(), []);

  // Rol e id de la sesión: rol 'col' (colaboradora), 'org' (organización) o null (visitante);
  // id = el _id real de esa cuenta en el backend.
  // Las llaves { } sacan solo las piezas que necesitamos (ver packages/frontend/docs/GLOSARIO.md → Desestructurar).
  const { rol, id } = useAuth();
  // ¿Se usa el endpoint de «acordes»? Solo si es colaboradora y tildó la casilla.
  const usarAcordes = rol === 'col' && soloQueEncajan;

  // Pide UNA página al backend. Se vuelve a pedir cada vez que cambia algo de la lista
  // de dependencias (por ejemplo, al tocar el paginador o cambiar un filtro).
  // `datos: respuesta` = «lo que viene en `datos` guardalo con el nombre `respuesta`».
  // La respuesta es { resultados: [proyectos…], pagina, limite, total, totalPaginas }.
  const { cargando, datos: respuesta, error } = usePedido(
    () =>
      usarAcordes
        ? obtenerProyectosAcordes(id, { pagina, limite: POR_PAGINA })
        : obtenerProyectos({
            pagina,
            limite: POR_PAGINA,
            busqueda: busquedaDemorada.trim(),
            estado: filtros.estado,
            modalidad: filtros.modalidad,
            habilidad: filtros.habilidad,
          }),
    [pagina, usarAcordes, id, busquedaDemorada, filtros.estado, filtros.modalidad, filtros.habilidad]
  );

  // ───── 2. CÁLCULOS ─────
  // Mientras carga (o si falló) `respuesta` es null: `?.` corta sin romper y `??` pone
  // un valor por defecto (ver packages/frontend/docs/GLOSARIO.md → Operadores).
  const proyectos = respuesta?.resultados ?? [];
  // `total` es la cantidad de proyectos en TODAS las páginas, no solo en esta.
  const total = respuesta?.total ?? 0;
  const cantidadPaginas = respuesta?.totalPaginas ?? 1;
  const hayResultados = proyectos.length > 0;
  // Texto del contador, con singular o plural: «1 proyecto», «66 proyectos».
  const textoContador = `${total} ${total === 1 ? 'proyecto' : 'proyectos'}`;
  // ¿Tocó algún filtro? (para el botón «Limpiar» y el mensaje de lista vacía)
  const hayFiltros = Object.values(filtros).some((valor) => valor !== '');

  // ───── 3. ACCIONES ─────
  // Se ejecuta al tildar o destildar «solo proyectos que encajan con mis habilidades».
  // `evento.target.checked` es true o false según quedó la casilla. Vuelve a la página 1.
  function alCambiarEncaje(evento) {
    setSoloQueEncajan(evento.target.checked);
    setPagina(1);
  }

  // Devuelve la función que guarda el valor de un filtro y vuelve a la página 1.
  // Ej: onChange={alCambiarFiltro('estado')}
  function alCambiarFiltro(campo) {
    return (evento) => {
      setFiltros({ ...filtros, [campo]: evento.target.value });
      setPagina(1);
    };
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_VACIOS);
    setPagina(1);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Crumbs items={[{ label: 'Proyectos' }]} />

      {/* BLOQUE: Encabezado — título de la página y frase de invitación */}
      <header className={s.head}>
        <Heading level={1}>Proyectos</Heading>
        <Text variant="lead">Tu oficio puede sostener un comedor, una radio o una huerta. Elegí un proyecto y postulate: cada hora que donás cuenta.</Text>
      </header>

      {/* BLOQUE: Filtros — búsqueda, estado, modalidad y habilidad. La casilla de «encaje»
          aparece solo si quien mira es una colaboradora (rol 'col'). */}
      <section className={s.filters} aria-label="Filtros">
        <Field
          label="Buscar"
          type="search"
          placeholder="Título o descripción"
          value={filtros.busqueda}
          onChange={alCambiarFiltro('busqueda')}
          disabled={usarAcordes}
        />
        <Field as="select" label="Estado" value={filtros.estado} onChange={alCambiarFiltro('estado')} disabled={usarAcordes}>
          <option value="">Todos</option>
          {Object.entries(ESTADOS).map(([valor, texto]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </Field>
        <Field as="select" label="Modalidad" value={filtros.modalidad} onChange={alCambiarFiltro('modalidad')} disabled={usarAcordes}>
          <option value="">Todas</option>
          {Object.entries(MODALIDADES).map(([valor, texto]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </Field>
        <Field as="select" label="Habilidad" value={filtros.habilidad} onChange={alCambiarFiltro('habilidad')} disabled={usarAcordes}>
          <option value="">Todas</option>
          {(habilidades ?? []).map((habilidad) => (
            <option key={habilidad.codigo} value={habilidad.codigo}>{habilidad.titulo}</option>
          ))}
        </Field>
        <div className={s.encaje}>
          {rol === 'col' && (
            <Checkbox checked={soloQueEncajan} onChange={alCambiarEncaje}>
              Mostrar solo proyectos abiertos que encajan con mis habilidades
              {usarAcordes && ' (los otros filtros no se aplican)'}
            </Checkbox>
          )}
          {hayFiltros && !usarAcordes && (
            <Button variant="link" onClick={limpiarFiltros}>Limpiar filtros</Button>
          )}
        </div>
      </section>

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
              : hayFiltros
                ? 'Ningún proyecto coincide con esos filtros. Probá sacando alguno.'
                : 'Todavía no se publicó ningún proyecto.'}
          </Text>
        </div>
      )}
    </div>
  );
}
