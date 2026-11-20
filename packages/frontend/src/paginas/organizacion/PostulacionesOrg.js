/**
 * PANTALLA PostulacionesOrg
 * Ruta: /org/proyectos/:id/postulaciones   ·   Quién la ve: Organización
 * Qué muestra: Postulaciones a un proyecto por estado; aceptar o rechazar (con confirmación).
 * De dónde salen los datos: el proyecto de GET /proyectos/:id y las postulaciones de
 *   GET /colectivos/:id/postulaciones (ver api/organizacion.js). Aceptar y rechazar hacen
 *   PATCH /postulaciones/:id. El cupo de cada perfil lo controla el backend: si está lleno,
 *   responde un error (ERR-EST-507) y se muestra en el aviso rojo.
 *   PENDIENTE (backend): las postulaciones traen el TÍTULO del proyecto y no su id, por eso
 *   se filtran por título (sirve porque un colectivo no repite títulos).
 * Para modificarla: COLUMNA NUEVA: <th> en <thead> + <td data-l="…"> por fila.
 *
 * ESTADOS DE UNA POSTULACIÓN: 'pendiente' (esperando respuesta), 'aceptada' (la persona
 * ya es parte del equipo) y 'rechazada'. Cada pestaña muestra uno de esos tres.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: proyecto y postulaciones del backend, la pestaña elegida, cuál se
 *      quiere rechazar, si se está enviando y los avisos.
 *      ESPERA Y ERRORES: cargando, «no existe» (404) o aviso de error.
 *   2. CÁLCULOS: contadores por estado y la lista de la pestaña.
 *   3. ACCIONES: aceptar y confirmar el rechazo (las dos hablan con el backend).
 *   4. LO QUE SE DIBUJA: migas, avisos, pestañas con la tabla y el diálogo de rechazo.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Heading, Tag, Text } from '../../atomos';
import { Alert, ConfirmDialog, Crumbs, RowsSkeleton, Tabs } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { mensajeDeError } from '../../api/errores.js';
import { obtenerPostulacionesDelColectivo, resolverPostulacion } from '../../api/organizacion.js';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { esNoEncontrado, obtenerMiProyecto } from './auxiliares.js';
import sh from '../../plantillas/disposicion.module.css';

// Pide el proyecto (solo si es mío) y todas las postulaciones del colectivo, y se queda
// con las de este proyecto.
async function cargarPostulaciones(proyectoId, colectivoId) {
  const [proyecto, todas] = await Promise.all([
    obtenerMiProyecto(proyectoId, colectivoId),
    obtenerPostulacionesDelColectivo(colectivoId),
  ]);
  const postulaciones = todas.filter(
    (postulacion) => String(postulacion.proyectoId) === String(proyectoId)
  );
  return { proyecto, postulaciones };
}

export default function PostulacionesOrg() {
  // ───── 1. DATOS Y ESTADO ─────

  // Lee la parte variable de la dirección: /org/proyectos/6afe…/postulaciones → id = '6afe…'
  // (ver docs/GLOSARIO.md → useParams)
  const { id } = useParams();
  // `idColectivo` = el id de la cuenta con sesión (se renombra para no chocar con `id`).
  const { id: idColectivo } = useAuth();

  // Sumarle 1 vuelve a pedir los datos (está en las dependencias de usePedido).
  const [version, setVersion] = useState(0);
  const { cargando, datos, error } = usePedido(
    () => cargarPostulaciones(id, idColectivo),
    [id, idColectivo, version]
  );

  // Pestaña activa: 'pendientes' | 'aceptadas' | 'rechazadas'. La cambian las pestañas.
  const [pestana, setPestana] = useState('pendientes');

  // Postulación que se quiere rechazar, o null si no hay ninguna.
  // Al tocar «Rechazar» se guarda (y se abre el diálogo); al cancelar vuelve a null.
  const [aRechazar, setARechazar] = useState(null);

  // Id de la postulación que se está enviando al backend (o null): su botón muestra espera.
  const [enviandoId, setEnviandoId] = useState(null);

  // Avisos verde (éxito) y rojo (error del backend). Texto vacío = no se muestra.
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  // ───── ESPERA Y ERRORES ─────
  // (Los hooks de arriba tienen que ir antes de estos `return`, siempre en el mismo orden.)
  if (cargando) {
    return (
      <div className={`container ${sh.page}`}>
        <RowsSkeleton n={4} />
      </div>
    );
  }
  if (esNoEncontrado(error)) {
    const { code, message } = error.response.data;
    return <NoEncontrado code={code} titulo="Ese proyecto no existe" msg={message} />;
  }
  if (error) {
    return (
      <div className={`container ${sh.page}`}>
        <Alert kind="error" title="No pudimos cargar las postulaciones">
          {mensajeDeError(error)}
        </Alert>
      </div>
    );
  }

  const { proyecto, postulaciones } = datos;

  // ───── 2. CÁLCULOS ─────

  // Cuenta cuántas postulaciones tienen un estado dado ('pendiente', 'aceptada'…).
  function contarConEstado(estado) {
    return postulaciones.filter((postulacion) => postulacion.estado === estado).length;
  }

  // Traduce el nombre de cada pestaña al estado que muestra.
  const estadoDeCadaPestana = {
    pendientes: 'pendiente',
    aceptadas: 'aceptada',
    rechazadas: 'rechazada',
  };

  // Las postulaciones que se ven en la pestaña activa.
  const postulacionesDeLaPestana = postulaciones.filter(
    (postulacion) => postulacion.estado === estadoDeCadaPestana[pestana]
  );

  // Las tres pestañas con su contador entre paréntesis (plantilla de texto, ver
  // docs/GLOSARIO.md → Plantillas de texto).
  const pestanas = [
    { id: 'pendientes', label: `Pendientes (${contarConEstado('pendiente')})` },
    { id: 'aceptadas', label: `Aceptadas (${contarConEstado('aceptada')})` },
    { id: 'rechazadas', label: `Rechazadas (${contarConEstado('rechazada')})` },
  ];

  // ───── 3. ACCIONES ─────

  // Le pide al backend que cambie el estado de UNA postulación. Si sale bien muestra
  // `textoExito` y vuelve a pedir la lista; si sale mal, muestra el error del backend.
  // `async/await`: espera la respuesta antes de seguir (ver docs/GLOSARIO.md).
  async function resolver(postulacion, nuevoEstado, textoExito) {
    setEnviandoId(postulacion.id);
    setAviso('');
    setErrorAccion('');
    try {
      await resolverPostulacion(postulacion.id, nuevoEstado);
      setAviso(textoExito);
      setVersion((v) => v + 1);
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
    } finally {
      setEnviandoId(null);
    }
  }

  // Se ejecuta al tocar «Aceptar»: el backend crea la colaboración (si hay cupo).
  function alAceptar(postulacion) {
    resolver(postulacion, 'aceptada', `Aceptaste a ${postulacion.persona.nombre}. Ya es parte del equipo.`);
  }

  // Se ejecuta al tocar «Sí, rechazar» en el diálogo.
  async function alConfirmarRechazo() {
    const postulacion = aRechazar;
    setARechazar(null);
    await resolver(postulacion, 'rechazada', 'Postulación rechazada.');
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué va dentro de la pestaña activa: mensaje vacío o la tabla.
  let contenidoDeLaPestana;
  if (postulacionesDeLaPestana.length === 0) {
    // No hay postulaciones en este estado.
    contenidoDeLaPestana = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">No hay postulaciones en esta lista</Heading>
      </div>
    );
  } else {
    // Hay postulaciones: una fila por cada una.
    contenidoDeLaPestana = (
      <table className={sh.table}>
        <thead>
          <tr><th>Persona</th><th>Perfil</th><th>Habilidades</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {postulacionesDeLaPestana.map((postulacion) => {
            // La persona que se postuló (viene adentro de la postulación).
            const colaboradora = postulacion.persona;
            return (
              <tr key={postulacion.id}>
                <td data-l="Persona">
                  <Link to={`/org/colaboradoras/${colaboradora.id}`} className={sh.person}>
                    <Avatar nombre={colaboradora.nombre} size={36} />
                    {colaboradora.nombre}
                  </Link>
                </td>
                <td data-l="Perfil">{postulacion.perfil}</td>
                <td data-l="Habilidades">
                  <span className={sh.tagsRow}>
                    {colaboradora.habilidades.map((habilidad) => (
                      <Tag key={habilidad}>{habilidad}</Tag>
                    ))}
                  </span>
                </td>
                <td className={sh.act}>
                  <div className={sh.row}>
                    {/* Los botones aparecen solo si la postulación está pendiente; las
                        aceptadas y rechazadas ya no se pueden cambiar. */}
                    {postulacion.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="success"
                          loading={enviandoId === postulacion.id}
                          disabled={enviandoId !== null}
                          onClick={() => alAceptar(postulacion)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          variant="danger"
                          disabled={enviandoId !== null}
                          onClick={() => setARechazar(postulacion)}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Migas de pan y título */}
      <Crumbs
        items={[
          { label: 'Mis proyectos', to: '/org/proyectos' },
          { label: proyecto.titulo },
          { label: 'Postulaciones' },
        ]}
      />
      <Heading level={1}>Postulaciones</Heading>

      {/* BLOQUE: Avisos — éxito o error del backend (por ejemplo, cupo completo) */}
      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorAccion && <Alert kind="error" onClose={() => setErrorAccion('')}>{errorAccion}</Alert>}

      {/* BLOQUE: Pestañas — Pendientes / Aceptadas / Rechazadas, con la tabla adentro */}
      <Tabs tabs={pestanas} value={pestana} onChange={setPestana}>
        {contenidoDeLaPestana}
      </Tabs>

      {/* BLOQUE: Confirmación de rechazo — abierto solo si hay una postulación elegida */}
      <ConfirmDialog
        open={!!aRechazar}
        danger
        title="¿Rechazar la postulación?"
        confirmLabel="Sí, rechazar"
        onCancel={() => setARechazar(null)}
        onConfirm={alConfirmarRechazo}
      >
        <Text>La persona va a ver el estado «Rechazada».</Text>
      </ConfirmDialog>
    </div>
  );
}
