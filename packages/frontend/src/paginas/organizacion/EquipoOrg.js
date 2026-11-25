/**
 * PANTALLA EquipoOrg
 * Ruta: /org/proyectos/:id/equipo   ·   Quién la ve: Organización
 * Qué muestra: Integrantes del proyecto: contactar, desvincular (permanente) o valorar
 * si el proyecto finalizó.
 * De dónde salen los datos: el proyecto de GET /proyectos/:id, el equipo de
 *   GET /proyectos/:id/colaboraciones (las activas) y las valoraciones ya hechas de
 *   GET /colectivo/:id/valoraciones?direccion=emitidas (ver api/organizacion.js).
 *   Desvincular = DELETE /colaboraciones/:id?por=colectivo. Valorar = POST /valoraciones.
 * Para modificarla: un dato más en la tarjeta = otro elemento dentro de .identidad.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: proyecto, equipo y valoraciones del backend; a quién se quiere
 *      desvincular o valorar, si se está enviando y los avisos.
 *      ESPERA Y ERRORES: cargando, «no existe» (404) o aviso de error.
 *   2. CÁLCULOS: si el proyecto está finalizado y el nombre del perfil de cada integrante.
 *   3. ACCIONES: confirmar la valoración y confirmar la baja (hablan con el backend).
 *   4. LO QUE SE DIBUJA: migas, avisos, tarjetas del equipo y los dos diálogos.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Heading, Icon, Tag, Text } from '../../atomos';
import { Alert, CardsSkeleton, ConfirmDialog, Crumbs, Grid } from '../../moleculas';
import { ValoracionDialog } from '../../organismos';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { mensajeDeError } from '../../api/errores.js';
import {
  colaboracionesYaValoradas,
  darDeBajaColaboracion,
  obtenerEquipoDelProyecto,
  valorarColaboracion,
} from '../../api/organizacion.js';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { esNoEncontrado, obtenerMiProyecto } from './auxiliares.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';
import { fotoDe } from '../../datos/fotos.js';

// Pide a la vez el proyecto (solo si es mío), su equipo y las colaboraciones ya valoradas.
async function cargarEquipo(proyectoId, colectivoId) {
  const [proyecto, equipo, valoradas] = await Promise.all([
    obtenerMiProyecto(proyectoId, colectivoId),
    obtenerEquipoDelProyecto(proyectoId),
    colaboracionesYaValoradas(colectivoId),
  ]);
  return { proyecto, equipo, valoradas };
}

// Nombre para mostrar de un integrante (las colaboraciones anónimas no traen a la persona).
const nombreDe = (integrante) => integrante?.persona?.nombre ?? 'Colaborador anónimo';

export default function EquipoOrg() {
  // ───── 1. DATOS Y ESTADO ─────

  // Lee la parte variable de la dirección: /org/proyectos/6afe…/equipo → id = '6afe…'
  // (ver packages/frontend/docs/GLOSARIO.md → useParams)
  const { id } = useParams();
  const { id: idColectivo } = useAuth();

  // Sumarle 1 vuelve a pedir los datos (está en las dependencias de usePedido).
  const [version, setVersion] = useState(0);
  const { cargando, datos, error } = usePedido(
    () => cargarEquipo(id, idColectivo),
    [id, idColectivo, version]
  );

  // Integrante (colaboración) que se quiere desvincular o valorar, o null si ninguno.
  const [aDesvincular, setADesvincular] = useState(null);
  const [aValorar, setAValorar] = useState(null);

  // true mientras se espera la respuesta del backend en un diálogo.
  const [enviando, setEnviando] = useState(false);

  // Avisos verde (éxito) y rojo (error del backend). Texto vacío = no se muestra.
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState('');

  // ───── ESPERA Y ERRORES ─────
  if (esNoEncontrado(error)) {
    const { code, message } = error.response.data;
    return <NoEncontrado code={code} titulo="Ese proyecto no existe" msg={message} />;
  }
  if (error) {
    return (
      <div className={`container ${sh.page}`}>
        <Alert kind="error" title="No pudimos cargar el equipo">{mensajeDeError(error)}</Alert>
      </div>
    );
  }

  // ───── 2. CÁLCULOS ─────

  // Mientras carga, `datos` es null: se usan valores vacíos para que nada falle.
  const proyecto = datos?.proyecto;
  const equipo = datos?.equipo ?? [];
  const valoradas = datos?.valoradas ?? new Set();

  // true si el proyecto ya finalizó. En un proyecto finalizado se puede VALORAR al equipo
  // (el backend solo deja valorar colaboraciones terminadas); en uno activo, DESVINCULAR.
  const proyectoFinalizado = Boolean(proyecto?.finalizado);

  // Descripción del perfil de un integrante (la colaboración trae solo el id del perfil).
  function perfilDe(integrante) {
    const perfil = proyecto?.perfiles.find((p) => String(p.id) === String(integrante.perfilId));
    return perfil?.descripcion ?? 'Perfil';
  }

  // ───── 3. ACCIONES ─────

  // Corre una acción contra el backend con el patrón de siempre: marca «enviando», si sale
  // bien avisa y vuelve a pedir el equipo, si sale mal muestra el error. Al final cierra
  // los diálogos.
  async function ejecutar(accion, textoExito) {
    setEnviando(true);
    setAviso('');
    setErrorAccion('');
    try {
      await accion();
      setAviso(textoExito);
      setVersion((v) => v + 1);
    } catch (e) {
      setErrorAccion(mensajeDeError(e));
    } finally {
      setEnviando(false);
      setAValorar(null);
      setADesvincular(null);
    }
  }

  // Se ejecuta al publicar la valoración. El diálogo entrega { puntaje, texto }.
  function alConfirmarValoracion(valoracion) {
    ejecutar(() => valorarColaboracion(aValorar.id, valoracion), 'Valoración publicada.');
  }

  // Se ejecuta al tocar «Sí, desvincular»: da de baja la colaboración (es permanente).
  function alConfirmarBaja() {
    const nombre = nombreDe(aDesvincular);
    ejecutar(() => darDeBajaColaboracion(aDesvincular.id), `${nombre} fue desvinculada del proyecto.`);
  }

  // Devuelve el botón (o etiqueta) de la derecha de cada tarjeta, según el proyecto:
  //  - proyecto finalizado y ya valorada: etiqueta «Valoración enviada».
  //  - proyecto finalizado y sin valorar: botón «Valorar».
  //  - proyecto activo: botón «Desvincular».
  function accionDelIntegrante(integrante) {
    if (proyectoFinalizado) {
      if (valoradas.has(String(integrante.id))) {
        return <Tag tone="sand">Valoración enviada</Tag>;
      }
      return (
        <Button variant="secondary" onClick={() => setAValorar(integrante)}>
          Valorar
        </Button>
      );
    }
    return (
      <Button variant="danger" onClick={() => setADesvincular(integrante)}>
        Desvincular
      </Button>
    );
  }

  // Botón «Contactar» (lleva a Mensajes con la persona y el proyecto), o un aviso si la
  // persona desactivó los mensajes. Las anónimas no se pueden contactar.
  function contactoDelIntegrante(integrante) {
    if (!integrante.persona) return null;
    if (!integrante.persona.mensajes) {
      return (
        <span className={sh.muted}>
          <Icon name="candado" />Mensajes deshabilitados
        </span>
      );
    }
    return (
      <Button
        as={Link}
        to={`/org/mensajes?persona=${integrante.persona.id}&proyecto=${id}`}
        variant="secondary"
      >
        Contactar
      </Button>
    );
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué se ve como contenido principal. Hay tres casos posibles.
  let contenidoDelEquipo;
  if (cargando) {
    // Caso 1: está cargando, tarjetas grises de relleno.
    contenidoDelEquipo = <CardsSkeleton n={3} />;
  } else if (equipo.length === 0) {
    // Caso 2: no hay nadie en el equipo, se invita a revisar postulaciones.
    contenidoDelEquipo = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">Todavía no hay integrantes</Heading>
        <Button as={Link} to={`/org/proyectos/${id}/postulaciones`}>
          Revisar postulaciones
        </Button>
      </div>
    );
  } else {
    // Caso 3: hay integrantes, una tarjeta por cada uno.
    contenidoDelEquipo = (
      <Grid>
        {equipo.map((integrante) => (
          <div key={integrante.id} className={s.miembro}>
            <div className={s.identidad}>
              <Avatar nombre={nombreDe(integrante)} size={56} foto={fotoDe(integrante.persona?.id)} />
              <div>
                {/* Si no es anónima, el nombre lleva a su perfil. */}
                {integrante.persona ? (
                  <Link to={`/org/colaboradoras/${integrante.persona.id}`}>
                    <b>{nombreDe(integrante)}</b>
                  </Link>
                ) : (
                  <b>{nombreDe(integrante)}</b>
                )}
                <small>{perfilDe(integrante)}</small>
              </div>
            </div>
            <div className={sh.row}>
              {contactoDelIntegrante(integrante)}
              {accionDelIntegrante(integrante)}
            </div>
          </div>
        ))}
      </Grid>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Migas de pan y título */}
      <Crumbs
        items={[
          { label: 'Mis proyectos', to: '/org/proyectos' },
          { label: proyecto?.titulo ?? '…' },
          { label: 'Equipo' },
        ]}
      />
      <Heading level={1}>Equipo</Heading>

      {/* BLOQUE: Avisos — éxito o error del backend */}
      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorAccion && <Alert kind="error" onClose={() => setErrorAccion('')}>{errorAccion}</Alert>}

      {/* BLOQUE: Equipo — relleno gris si carga, mensaje si está vacío, o las tarjetas */}
      {contenidoDelEquipo}

      {/* BLOQUE: Diálogo de valoración — abierto solo si hay alguien elegida para valorar */}
      <ValoracionDialog
        open={!!aValorar}
        a={nombreDe(aValorar)}
        loading={enviando}
        onCancel={() => setAValorar(null)}
        onConfirm={alConfirmarValoracion}
      />

      {/* BLOQUE: Confirmación de baja — abierta solo si hay alguien elegida para desvincular */}
      <ConfirmDialog
        open={!!aDesvincular}
        danger
        loading={enviando}
        title={`¿Desvincular a ${nombreDe(aDesvincular).split(' ')[0]}?`}
        confirmLabel="Sí, desvincular"
        onCancel={() => setADesvincular(null)}
        onConfirm={alConfirmarBaja}
      >
        <Text>Es permanente: la colaboración queda dada de baja y se libera el cupo del perfil.</Text>
      </ConfirmDialog>
    </div>
  );
}
