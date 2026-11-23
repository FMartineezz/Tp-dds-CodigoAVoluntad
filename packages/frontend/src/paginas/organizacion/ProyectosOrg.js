/**
 * PANTALLA ProyectosOrg
 * Ruta: /org/proyectos   ·   Quién la ve: Organización
 * Qué muestra: Tabla de proyectos con búsqueda, estado y acciones (Editar, Postulaciones,
 * Equipo, Finalizar).
 * De dónde salen los datos: del backend (GET /colectivos/:id/proyectos y
 *   GET /colectivos/:id/postulaciones?estado=pendiente, ver api/organizacion.js).
 *   «Finalizar» hace PATCH /proyectos/:id con { finalizado: true }.
 *   PENDIENTE (backend): no existe DELETE /proyectos/:id, por eso no hay botón «Borrar».
 * Para modificarla: COLUMNA NUEVA: agregá un <th> en <thead> y un <td data-l="Nombre">
 * en cada fila. Botón nuevo: otro <Button> dentro de la celda de acciones.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: proyectos y postulaciones del backend, lo que se escribió en el
 *      buscador, el filtro de estado, qué proyecto se quiere finalizar y los avisos.
 *   2. CÁLCULOS: los proyectos que coinciden con los filtros y las pendientes de cada uno.
 *   3. ACCIONES: confirmar la finalización de un proyecto.
 *   4. LO QUE SE DIBUJA: título, avisos, filtros, tabla (o mensaje vacío) y el diálogo
 *      de confirmación.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Heading, Icon, StatusBadge, Text } from '../../atomos';
import { Alert, ConfirmDialog, RowsSkeleton } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { mensajeDeError } from '../../api/errores.js';
import {
  actualizarProyecto,
  obtenerPostulacionesDelColectivo,
  obtenerProyectosDelColectivo,
} from '../../api/organizacion.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Pide a la vez los proyectos del colectivo y sus postulaciones pendientes.
async function cargarProyectos(colectivoId) {
  const [proyectos, pendientes] = await Promise.all([
    obtenerProyectosDelColectivo(colectivoId),
    obtenerPostulacionesDelColectivo(colectivoId, 'pendiente'),
  ]);
  return { proyectos, pendientes };
}

export default function ProyectosOrg() {
  // ───── 1. DATOS Y ESTADO ─────
  // (ver docs/GLOSARIO.md → Estado (useState))

  // Id del colectivo con sesión.
  const { id } = useAuth();

  // Contador para VOLVER A PEDIR los datos: está en la lista de dependencias de usePedido,
  // así que sumarle 1 dispara el pedido otra vez (se usa después de finalizar un proyecto).
  const [version, setVersion] = useState(0);

  // Proyectos y postulaciones pendientes del backend.
  const { cargando, datos, error } = usePedido(() => cargarProyectos(id), [id, version]);

  // Texto del buscador. Empieza vacío; cambia cada vez que se escribe en el campo «Buscar».
  const [busqueda, setBusqueda] = useState('');

  // Filtro de estado: 'todos' | 'abierto' | 'cerrado'. Lo cambia el desplegable «Estado».
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Proyecto que se quiere finalizar, o null si no hay ninguno.
  // Al tocar «Finalizar» se guarda el proyecto (y se abre el diálogo); al cancelar vuelve a null.
  const [paraFinalizar, setParaFinalizar] = useState(null);

  // true mientras el backend procesa la finalización (el botón del diálogo espera).
  const [enviando, setEnviando] = useState(false);

  // Mensaje verde de éxito y mensaje rojo de error de la acción. Texto vacío = no se ve.
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  // ───── 2. CÁLCULOS ─────

  // Mientras carga (o si falló) se usan listas vacías.
  const proyectos = datos?.proyectos ?? [];
  const pendientes = datos?.pendientes ?? [];

  // Proyectos que cumplen los dos filtros a la vez: el estado elegido y el texto buscado
  // dentro del título (sin importar mayúsculas ni espacios de los costados).
  // (.filter, .includes y .trim → docs/GLOSARIO.md → Métodos de arrays)
  const textoBuscado = busqueda.trim().toLowerCase();
  const proyectosVisibles = proyectos.filter((proyecto) => {
    const cumpleEstado = filtroEstado === 'todos' || proyecto.estado === filtroEstado;
    const cumpleTexto = proyecto.titulo.toLowerCase().includes(textoBuscado);
    return cumpleEstado && cumpleTexto;
  });

  // Cuántas postulaciones pendientes tiene un proyecto. Las postulaciones traen el TÍTULO
  // del proyecto (no su id); el título no se repite dentro de un mismo colectivo.
  function pendientesDe(proyecto) {
    return pendientes.filter((postulacion) => postulacion.proyecto === proyecto.titulo).length;
  }

  // ───── 3. ACCIONES ─────

  // Se ejecuta al tocar «Sí, finalizar» en el diálogo: le pide al backend que finalice el
  // proyecto. Si sale bien avisa y vuelve a pedir la lista; si sale mal muestra el error.
  // `async/await`: espera la respuesta del backend antes de seguir (ver docs/GLOSARIO.md).
  async function alConfirmarFinalizar() {
    setEnviando(true);
    setErrorAccion('');
    try {
      await actualizarProyecto(paraFinalizar.id, { finalizado: true });
      setAviso(`Finalizaste «${paraFinalizar.titulo}».`);
      setVersion((v) => v + 1); // vuelve a pedir los proyectos
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
    } finally {
      // `finally` corre siempre, haya salido bien o mal.
      setEnviando(false);
      setParaFinalizar(null);
    }
  }

  // Devuelve lo que va en la celda «Postulaciones» de un proyecto.
  function celdaDePostulaciones(proyecto) {
    const cantidad = pendientesDe(proyecto);
    return (
      <Link to={`/org/proyectos/${proyecto.id}/postulaciones`}>
        {cantidad > 0 ? `${cantidad} pendientes` : 'Ver'}
      </Link>
    );
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué se ve en el lugar de la lista. Hay cuatro casos posibles.
  let contenidoDeLaLista;
  if (cargando) {
    // Caso 1: está cargando, se muestran filas grises de relleno.
    contenidoDeLaLista = <RowsSkeleton />;
  } else if (error) {
    // Caso 2: el pedido falló (backend apagado, error 500…).
    contenidoDeLaLista = (
      <Alert kind="error" title="No pudimos cargar tus proyectos">{mensajeDeError(error)}</Alert>
    );
  } else if (proyectosVisibles.length === 0) {
    // Caso 3: ningún proyecto coincide con los filtros (o no hay ninguno).
    contenidoDeLaLista = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">No hay proyectos para mostrar</Heading>
        <Button as={Link} to="/org/proyectos/nuevo">Nuevo proyecto</Button>
      </div>
    );
  } else {
    // Caso 4: hay proyectos, se dibuja la tabla con una fila por proyecto.
    contenidoDeLaLista = (
      <table className={sh.table}>
        <thead>
          <tr><th>Proyecto</th><th>Estado</th><th>Postulaciones</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {proyectosVisibles.map((proyecto) => (
            <tr key={proyecto.id}>
              <td data-l="Proyecto"><b>{proyecto.titulo}</b></td>
              <td data-l="Estado"><StatusBadge status={proyecto.estado} /></td>
              <td data-l="Postulaciones">{celdaDePostulaciones(proyecto)}</td>
              <td className={sh.act}>
                <div className={sh.row}>
                  <Button
                    as={Link}
                    to={`/org/proyectos/${proyecto.id}/editar`}
                    variant="secondary"
                  >
                    Editar
                  </Button>
                  <Button
                    as={Link}
                    to={`/org/proyectos/${proyecto.id}/equipo`}
                    variant="secondary"
                  >
                    Equipo
                  </Button>
                  {/* «Finalizar» solo si todavía no está finalizado (no se puede reabrir). */}
                  {!proyecto.finalizado && (
                    <Button variant="danger" onClick={() => setParaFinalizar(proyecto)}>
                      Finalizar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Encabezado — título y botón para crear un proyecto */}
      <div className={`${sh.row} ${sh.sb}`}>
        <Heading level={1}>Mis proyectos</Heading>
        <Button as={Link} to="/org/proyectos/nuevo" iconRight={<Icon name="mas" size={14} />}>
          Nuevo proyecto
        </Button>
      </div>

      {/* BLOQUE: Avisos — éxito o error de la última acción */}
      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorAccion && <Alert kind="error" onClose={() => setErrorAccion('')}>{errorAccion}</Alert>}

      {/* BLOQUE: Filtros — buscador por nombre y desplegable de estado */}
      <div className={s.buscar}>
        <Field
          label="Buscar"
          type="search"
          placeholder="Nombre del proyecto"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Field
          as="select"
          label="Estado"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="abierto">Abiertos</option>
          <option value="cerrado">Cerrados</option>
        </Field>
      </div>

      {/* BLOQUE: Lista — relleno gris si carga, error, mensaje si no hay proyectos, o la tabla */}
      {contenidoDeLaLista}

      {/* BLOQUE: Confirmación de finalización — diálogo abierto solo si hay un proyecto elegido */}
      {/* `!!paraFinalizar` convierte el proyecto en true/false: hay = abierto, null = cerrado. */}
      <ConfirmDialog
        open={!!paraFinalizar}
        danger
        title="¿Finalizar el proyecto?"
        confirmLabel="Sí, finalizar"
        loading={enviando}
        onCancel={() => setParaFinalizar(null)}
        onConfirm={alConfirmarFinalizar}
      >
        <Text>
          Ya no se van a poder sumar colaboradoras ni cargar logros. No se puede volver a abrir.
        </Text>
      </ConfirmDialog>
    </div>
  );
}
