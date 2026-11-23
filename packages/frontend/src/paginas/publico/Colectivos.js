/**
 * PANTALLA Colectivos
 * Ruta: /colectivos   ·   Quién la ve: Todas
 * Qué muestra: Directorio paginado de colectivos (del más nuevo al más viejo), con su tipo,
 *   ubicación y cuántos proyectos publicó.
 * De dónde salen los datos: del backend, una página por vez: GET /colectivos?pagina=&limite=
 *   (ver api/colectivos.js).
 *
 * ¿Y los filtros (nombre, tipo, ubicación, causa) y el orden (A–Z, más abiertos)?
 *   PENDIENTE (backend): GET /colectivos no acepta filtros ni orden. Como el backend manda UNA
 *   página por vez, filtrar u ordenar en el navegador solo afectaría a esos 6 colectivos y
 *   el contador y el paginador quedarían mintiendo. Se sacaron hasta que el backend acepte,
 *   por ejemplo: GET /colectivos?nombre=&tipo=ong,asamblea&ubicacion=caba,cordoba&orden=az
 *   &pagina=&limite=  (las causas además no existen todavía en el modelo de colectivo, y
 *   «proyectos abiertos» tampoco: hoy solo se sabe cuántos proyectos publicó en total).
 *   Para sumar uno cuando exista: un useState para el valor, pasarlo a obtenerColectivos (y
 *   agregarlo a la lista de dependencias de usePedido) y su <Field> o <Checkbox>.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → la página actual (useState) y el pedido al backend (usePedido).
 *   2. CÁLCULOS        → textos del contador a partir de lo que respondió el backend.
 *   4. LO QUE SE DIBUJA → título, contador y la lista: filas grises mientras carga, aviso si
 *                        falló, mensaje si no hay colectivos o la lista + paginador.
 *   (No hay sección 3 · ACCIONES: el único cambio de estado es el del paginador, que llama
 *   directo a setPagina.)
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Heading, Icon, Text } from '../../atomos';
import { Alert, Pager, RowsSkeleton } from '../../moleculas';
import { usePedido } from '../../hooks';
import { obtenerColectivos } from '../../api/colectivos.js';
import { mensajeDeError } from '../../api/errores.js';
import s from './Colectivos.module.css';

// Cuántos colectivos entran en cada página del directorio (es el `limite` que se le pide
// al backend).
const POR_PAGINA = 6;

export default function Colectivos() {
  // ───── 1. DATOS Y ESTADO ─────
  // Número de la página que se ve (empieza en 1). Lo cambia el paginador.
  const [pagina, setPagina] = useState(1);
  // Pide UNA página al backend; se vuelve a pedir cada vez que cambia `pagina`.
  // La respuesta es { resultados: [colectivos…], pagina, limite, total, totalPaginas }.
  const { cargando, datos: respuesta, error } = usePedido(
    () => obtenerColectivos({ pagina, limite: POR_PAGINA }),
    [pagina]
  );

  // ───── 2. CÁLCULOS ─────
  // Mientras carga (o si falló) `respuesta` es null: `?.` y `??` dan valores por defecto.
  const colectivos = respuesta?.resultados ?? [];
  // `total` cuenta los colectivos de TODAS las páginas.
  const total = respuesta?.total ?? 0;
  const cantidadPaginas = respuesta?.totalPaginas ?? 1;
  // Texto del contador, con singular o plural: «1 colectivo», «41 colectivos».
  const textoContador = `${total} ${total === 1 ? 'colectivo' : 'colectivos'}`;

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Heading level={1}>Colectivos</Heading>
      <div className={s.dir}>
        {/* BLOQUE: Barra superior del directorio — contador */}
        <div className={s.barra}>
          <p className={s.count} role="status">
            {cargando ? 'Cargando…' : !error && textoContador}
          </p>
        </div>

        {/* BLOQUE: Listado — cuatro casos posibles, solo se ve uno a la vez */}
        {/* Caso 1: todavía cargando → 5 filas grises de relleno. */}
        {cargando && <RowsSkeleton n={5} />}

        {/* Caso 2: el pedido falló → aviso con el motivo. */}
        {error && (
          <Alert kind="error" title="No pudimos cargar los colectivos">
            {mensajeDeError(error)}
          </Alert>
        )}

        {/* Caso 3: llegó la página pero vino vacía → mensaje. */}
        {!cargando && !error && colectivos.length === 0 && (
          <div className={s.empty}>
            <Heading level={2} size="h3">Todavía no hay colectivos registrados</Heading>
          </div>
        )}

        {/* Caso 4: llegó la página con colectivos → la lista. */}
        {!cargando && !error && colectivos.length > 0 && (
          <ul className={s.lista}>
            {/* Una fila por colectivo; `key` identifica cada una
                (ver docs/GLOSARIO.md → Listas con map y key) */}
            {colectivos.map((colectivo) => (
              <li key={colectivo.id}>
                {/* Cada colectivo es un enlace a su pantalla de detalle */}
                <Link to={`/colectivos/${colectivo.id}`} className={s.row}>
                  <Avatar nombre={colectivo.nombre} size={56} square />
                  <span className={s.info}>
                    <b>{colectivo.nombre}</b>
                    <small>
                      {colectivo.tipo} · {colectivo.ubicacionTexto}
                    </small>
                  </span>
                  {/* Cuántos proyectos publicó (en total: el backend no dice cuántos siguen abiertos) */}
                  <span className={s.abiertos}>
                    <b>{colectivo.proyectos.length}</b>
                    <small>{colectivo.proyectos.length === 1 ? 'proyecto' : 'proyectos'}</small>
                  </span>
                  <Icon name="chevron-der" size={16} />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* BLOQUE: Paginador — se ve si hay más de una página */}
        {!error && <Pager page={pagina} pages={cantidadPaginas} onChange={setPagina} />}

        <Text variant="small">Se muestran del más nuevo al más viejo.</Text>
      </div>
    </div>
  );
}
