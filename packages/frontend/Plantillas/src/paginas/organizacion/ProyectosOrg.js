/**
 * PANTALLA ProyectosOrg
 * Ruta: /org/proyectos   ·   Quién la ve: Organización
 * Qué muestra: Tabla de proyectos con búsqueda, estado y acciones (Editar, Equipo, Borrar).
 * Para modificarla: COLUMNA NUEVA: agregá un <th> en <thead> y un <td data-l="Nombre">
 * en cada fila. Botón nuevo: otro <Button> dentro de la celda de acciones.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: la lista de proyectos, lo que se escribió en el buscador, el
 *      filtro de estado, qué proyecto se quiere borrar y el aviso de éxito.
 *   2. CÁLCULOS: de la lista completa se sacan los proyectos que coinciden con los filtros.
 *   3. ACCIONES: confirmar el borrado de un proyecto.
 *   4. LO QUE SE DIBUJA: título, aviso, filtros, tabla (o mensaje vacío) y el diálogo
 *      de confirmación.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Heading, Icon, StatusBadge, Text } from '../../atomos';
import { Alert, ConfirmDialog, RowsSkeleton } from '../../moleculas';
import { useLoading } from '../../hooks';
import { MIS } from './auxiliares.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

export default function ProyectosOrg() {
  // ───── 1. DATOS Y ESTADO ─────
  // (ver docs/GLOSARIO.md → Estado (useState))

  // Lista de proyectos que se muestra. Arranca con todos los míos; solo cambia cuando
  // se confirma un borrado (alConfirmarBorrado).
  const [proyectos, setProyectos] = useState(MIS);

  // Texto del buscador. Empieza vacío; cambia cada vez que se escribe en el campo «Buscar».
  const [busqueda, setBusqueda] = useState('');

  // Filtro de estado: 'todos' | 'abierto' | 'cerrado'. Lo cambia el desplegable «Estado».
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Id del proyecto que se quiere borrar, o null si no hay ninguno.
  // Al hacer clic en «Borrar» se guarda el id (y se abre el diálogo); al cancelar vuelve a null.
  const [idParaBorrar, setIdParaBorrar] = useState(null);

  // Mensaje verde de éxito. Texto vacío = no se muestra. Se completa al borrar un proyecto
  // y se vacía al cerrar el aviso.
  const [aviso, setAviso] = useState('');

  // true un instante (simula la espera de datos) y después false.
  const cargando = useLoading();

  // ───── 2. CÁLCULOS ─────

  // Proyectos que cumplen los dos filtros a la vez: el estado elegido y el texto buscado
  // dentro del título (sin importar mayúsculas ni espacios de los costados).
  // (.filter, .includes y .trim → docs/GLOSARIO.md → Métodos de arrays)
  const textoBuscado = busqueda.trim().toLowerCase();
  const proyectosVisibles = proyectos.filter((proyecto) => {
    const cumpleEstado = filtroEstado === 'todos' || proyecto.estado === filtroEstado;
    const cumpleTexto = proyecto.titulo.toLowerCase().includes(textoBuscado);
    return cumpleEstado && cumpleTexto;
  });

  // ───── 3. ACCIONES ─────

  // Se ejecuta al tocar «Sí, borrar» en el diálogo: quita el proyecto de la lista,
  // cierra el diálogo y avisa cuál se eliminó.
  function alConfirmarBorrado() {
    const proyectoBorrado = proyectos.find((proyecto) => proyecto.id === idParaBorrar);
    // Se arma una lista nueva SIN ese proyecto (React exige copiar, no modificar).
    setProyectos((actuales) => actuales.filter((proyecto) => proyecto.id !== idParaBorrar));
    setIdParaBorrar(null);
    // Plantilla de texto: mete el título dentro de la frase
    // (ver docs/GLOSARIO.md → Plantillas de texto).
    setAviso(`Eliminaste «${proyectoBorrado.titulo}».`);
  }

  // Devuelve lo que va en la celda «Postulaciones» de un proyecto.
  // Solo el proyecto 48 tiene postulaciones de ejemplo; los demás muestran un guion.
  function celdaDePostulaciones(proyecto) {
    if (proyecto.id === 48) {
      return <Link to="/org/proyectos/48/postulaciones">3 nuevas</Link>;
    }
    return '—';
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué se ve en el lugar de la lista. Hay tres casos posibles.
  let contenidoDeLaLista;
  if (cargando) {
    // Caso 1: está cargando, se muestran filas grises de relleno.
    contenidoDeLaLista = <RowsSkeleton />;
  } else if (proyectosVisibles.length === 0) {
    // Caso 2: ningún proyecto coincide con los filtros (o no hay ninguno).
    contenidoDeLaLista = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">No hay proyectos para mostrar</Heading>
        <Button as={Link} to="/org/proyectos/nuevo">Nuevo proyecto</Button>
      </div>
    );
  } else {
    // Caso 3: hay proyectos, se dibuja la tabla con una fila por proyecto.
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
                  <Button variant="danger" onClick={() => setIdParaBorrar(proyecto.id)}>
                    Borrar
                  </Button>
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

      {/* BLOQUE: Aviso de éxito — aparece solo si `aviso` tiene texto (después de borrar) */}
      {aviso && (
        <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>
      )}

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

      {/* BLOQUE: Lista — relleno gris si carga, mensaje si no hay proyectos, o la tabla */}
      {contenidoDeLaLista}

      {/* BLOQUE: Confirmación de borrado — diálogo abierto solo si hay un proyecto elegido */}
      {/* `!!idParaBorrar` convierte el id en true/false: hay id = abierto, null = cerrado. */}
      <ConfirmDialog
        open={!!idParaBorrar}
        danger
        title="¿Borrar el proyecto?"
        confirmLabel="Sí, borrar"
        onCancel={() => setIdParaBorrar(null)}
        onConfirm={alConfirmarBorrado}
      >
        <Text>Se elimina junto con sus postulaciones. No se puede deshacer.</Text>
      </ConfirmDialog>
    </div>
  );
}
