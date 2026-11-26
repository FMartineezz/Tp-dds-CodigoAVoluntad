/**
 * PANTALLA PerfilColaboradora
 * Ruta: /org/colaboradoras/:id   ·   Quién la ve: Organización
 * Qué muestra: Perfil público de una colaboradora, sus valoraciones, cómo escribirle y, si
 *   colabora en algún proyecto mío, sus contactos privados.
 * De dónde salen los datos: GET /colaboradoras/:id, GET /personaColaboradora/:id/valoraciones,
 *   GET /colaboradoras/:id/contactos (el backend responde 403 si no colabora conmigo) y mis
 *   proyectos (GET /colectivos/:id/proyectos) para elegir desde cuál escribirle
 *   (ver api/organizacion.js).
 *   PENDIENTE (backend): no hay «logros» de la persona ni el nombre del colectivo que
 *   escribió cada valoración.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: la persona, sus valoraciones, sus contactos y mis proyectos (del backend) y el
 *      proyecto elegido para escribirle.
 *      ESPERA Y ERRORES: cargando, «no existe» (404) o aviso de error.
 *   2. CÁLCULOS: los proyectos abiertos (para el desplegable).
 *   3. ACCIONES: no hay (el botón es un enlace a Mensajes).
 *   4. LO QUE SE DIBUJA: migas, credencial (con cómo escribirle), contactos y valoraciones.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Field, Heading, Tag, Text } from '../../atomos';
import { Alert, Crumbs, Estrellas, RowsSkeleton } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { mensajeDeError } from '../../api/errores.js';
import {
  obtenerColaboradora,
  obtenerContactosDeColaboradora,
  obtenerProyectosDelColectivo,
  obtenerValoracionesDeColaboradora,
} from '../../api/organizacion.js';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { esNoEncontrado } from './auxiliares.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';
import { fotoDe } from '../../datos/fotos.js';

// Pide a la vez la persona, sus valoraciones, sus contactos (null si no colabora conmigo) y
// mis proyectos.
async function cargarPerfil(personaId, colectivoId) {
  const [colaboradora, valoraciones, contactos, proyectos] = await Promise.all([
    obtenerColaboradora(personaId),
    obtenerValoracionesDeColaboradora(personaId),
    obtenerContactosDeColaboradora(personaId, colectivoId),
    obtenerProyectosDelColectivo(colectivoId),
  ]);
  return { colaboradora, valoraciones, contactos, proyectos };
}

export default function PerfilColaboradora() {
  // ───── 1. DATOS Y ESTADO ─────

  // Lee la parte variable de la dirección: /org/colaboradoras/a000… → id = 'a000…'
  // (ver packages/frontend/docs/GLOSARIO.md → useParams)
  const { id } = useParams();
  const { id: idColectivo } = useAuth();

  const { cargando, datos, error } = usePedido(
    () => cargarPerfil(id, idColectivo),
    [id, idColectivo]
  );

  // Proyecto desde el que se le va a escribir ('' = el primero de la lista).
  const [proyectoElegido, setProyectoElegido] = useState('');

  // ───── ESPERA Y ERRORES ─────
  if (cargando) {
    return (
      <div className={`container ${sh.page}`}>
        <RowsSkeleton n={4} />
      </div>
    );
  }
  if (esNoEncontrado(error)) {
    const { code, message } = error.response.data;
    return <NoEncontrado code={code} titulo="Ese colaborador no existe" msg={message} />;
  }
  if (error) {
    return (
      <div className={`container ${sh.page}`}>
        <Alert kind="error" title="No pudimos cargar el perfil">{mensajeDeError(error)}</Alert>
      </div>
    );
  }

  const { colaboradora, valoraciones, contactos, proyectos } = datos;

  // ───── 2. CÁLCULOS ─────

  // Solo se puede escribir desde un proyecto abierto (el mensaje queda asociado a él).
  const abiertos = proyectos.filter((proyecto) => proyecto.estado === 'abierto');
  // Promedio de estrellas con un decimal (null si no tiene valoraciones).
  const promedio = valoraciones.length
    ? (valoraciones.reduce((suma, v) => suma + v.puntaje, 0) / valoraciones.length).toFixed(1).replace('.', ',')
    : null;

  // Si todavía no se eligió ninguno, se usa el primero (si hay).
  const proyectoParaEscribir = proyectoElegido || abiertos[0]?.id;

  // ───── 4. LO QUE SE DIBUJA ─────

  // BLOQUE «Mensajes»: tres casos posibles.
  let contenidoDeMensajes;
  if (!colaboradora.mensajes) {
    // Caso 1: la persona desactivó los mensajes de organizaciones.
    contenidoDeMensajes = (
      <Alert kind="warning">
        Esta persona no recibe mensajes de organizaciones.
      </Alert>
    );
  } else if (abiertos.length === 0) {
    // Caso 2: no tengo proyectos abiertos desde donde escribirle.
    contenidoDeMensajes = (
      <Text variant="small">Para escribirle necesitás un proyecto abierto.</Text>
    );
  } else {
    // Caso 3: elijo el proyecto y voy a Mensajes con esa persona y ese proyecto.
    contenidoDeMensajes = (
      <div className={`${sh.bar} ${sh.barInfo}`}>
        <Field
          as="select"
          label="Desde el proyecto"
          value={proyectoParaEscribir}
          onChange={(e) => setProyectoElegido(e.target.value)}
        >
          {abiertos.map((proyecto) => (
            <option key={proyecto.id} value={proyecto.id}>{proyecto.titulo}</option>
          ))}
        </Field>
        <Button as={Link} to={`/org/mensajes?persona=${colaboradora.id}&proyecto=${proyectoParaEscribir}`}>
          Enviar mensaje
        </Button>
      </div>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Migas de pan */}
      <Crumbs
        items={[
          { label: 'Colaboradores', to: '/org/colaboradoras' },
          { label: colaboradora.nombre },
        ]}
      />

      {/* BLOQUE: Credencial — banda de puntos, foto, nombre, números, bio, habilidades,
          redes y cómo escribirle. Todo lo que hace falta para decidir, en una tarjeta. */}
      <header className={s.credencial}>
        <div className={s.credencialBanda} aria-hidden="true" />
        <div className={s.credencialCabeza}>
          <Avatar nombre={colaboradora.nombre} size={128} square foto={colaboradora.foto || fotoDe(colaboradora.id)} />
          <div>
            <Heading level={1} size="h2">
              {colaboradora.nombre}{' '}
              {/* Los pronombres se muestran solo si los cargó. */}
              {colaboradora.pronombres && <small className={s.pronombres}>({colaboradora.pronombres})</small>}
            </Heading>
            {colaboradora.alias && <Text variant="small">@{colaboradora.alias}</Text>}
          </div>
        </div>

        {/* Números que salen de lo que ya tenemos: valoraciones y habilidades */}
        <dl className={s.credencialNumeros}>
          <div>
            <dt>Valoraciones</dt>
            <dd>{valoraciones.length}</dd>
          </div>
          <div>
            <dt>Promedio</dt>
            <dd>{promedio ? `${promedio}★` : '—'}</dd>
          </div>
          <div>
            <dt>Habilidades</dt>
            <dd>{colaboradora.habilidades.length}</dd>
          </div>
        </dl>

        {colaboradora.bio && <Text variant="prose">{colaboradora.bio}</Text>}
        <span className={sh.tagsRow}>
          {colaboradora.habilidades.map((habilidad) => (
            <Tag key={habilidad} tone="sand">{habilidad}</Tag>
          ))}
        </span>
        {/* Enlaces: su cuenta de GitHub/GitLab y una por cada red social cargada. */}
        <div className={s.redes}>
          {colaboradora.git && (
            <a href={colaboradora.git} target="_blank" rel="noopener noreferrer">Repositorios</a>
          )}
          {colaboradora.redes.map((red) => (
            <a key={red.tipo} href={red.url} target="_blank" rel="noopener noreferrer">{red.tipo}</a>
          ))}
          {colaboradora.sitioWeb && (
            <a href={colaboradora.sitioWeb} target="_blank" rel="noopener noreferrer">Sitio web</a>
          )}
        </div>

        {/* Escribirle: va en la misma tarjeta para no tener que bajar a buscarlo */}
        <div className={s.credencialMensaje}>{contenidoDeMensajes}</div>
      </header>

      {/* BLOQUE: Contactos — privados: solo si colabora en algún proyecto mío (si no, null) */}
      <section className={sh.column} aria-labelledby="contactos">
        <Heading level={2} size="h3" id="contactos">Contactos</Heading>
        {contactos === null && (
          <Text variant="small">Vas a ver sus contactos cuando colabore en alguno de tus proyectos.</Text>
        )}
        {contactos?.length === 0 && <Text variant="small">No cargó medios de contacto.</Text>}
        {contactos?.length > 0 && (
          <ul className={s.contactos}>
            {contactos.map((contacto) => (
              <li key={`${contacto.tipo}-${contacto.valor}`}>
                <b>{contacto.tipo}</b>
                <span>{contacto.valor}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* BLOQUE: Valoraciones — las que recibió de colectivos (o un texto si no tiene) */}
      <section className={sh.column} aria-labelledby="vals">
        <Heading level={2} size="h3" id="vals">Valoraciones</Heading>
        {valoraciones.length === 0 && <Text variant="small">Todavía no recibió valoraciones.</Text>}
        {valoraciones.map((valoracion) => (
          <div key={valoracion.id} className={s.valoracion}>
            <div className={sh.row}>
              {/* El backend no dice qué colectivo la escribió: se muestra la fecha. */}
              <b>{new Date(valoracion.fecha).toLocaleDateString('es-AR')}</b>
              <Estrellas valor={valoracion.puntaje} />
            </div>
            {valoracion.texto && <Text variant="prose">{valoracion.texto}</Text>}
          </div>
        ))}
      </section>

    </div>
  );
}
