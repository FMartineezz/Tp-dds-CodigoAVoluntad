/**
 * PANTALLA PerfilColaboradoraAdm
 * Ruta: /admin/colaboradoras/:id   ·   Quién la ve: Equipo administrativo
 * Qué muestra: El perfil público de una persona colaboradora (foto, nombre, bio, habilidades
 *   y enlaces) y las valoraciones que recibió. Se llega desde «Personas».
 * De dónde salen los datos: GET /colaboradoras/:id y GET /personaColaboradora/:id/valoraciones
 *   (api/organizacion.js). Usa los estilos de la credencial de PerfilColaboradora (organización).
 * PENDIENTE (backend): sus contactos privados no se muestran: GET /colaboradoras/:id/contactos
 *   solo responde a la dueña y a los colectivos con los que colabora.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: la persona y sus valoraciones (del backend).
 *      ESPERA Y ERRORES: cargando, «no existe» (404) o aviso de error.
 *   2. CÁLCULOS: el promedio de estrellas.
 *   3. ACCIONES: no hay.
 *   4. LO QUE SE DIBUJA: migas, credencial y valoraciones.
 */
import { useParams } from 'react-router-dom';
import { Avatar, Heading, Tag, Text } from '../../atomos';
import { Crumbs, Estrellas } from '../../moleculas';
import { usePedido } from '../../hooks';
import { esError } from '../../api/errores.js';
import { obtenerColaboradora, obtenerValoracionesDeColaboradora } from '../../api/organizacion.js';
import { fotoDe } from '../../datos/fotos.js';
import { NoEncontrado } from '../sistema/Errores.js';
import { PantallaCargando, PantallaDeError } from './auxiliares.js';
import s from '../organizacion/Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Pide a la vez la persona y sus valoraciones.
async function cargarPerfil(id) {
  const [colaboradora, valoraciones] = await Promise.all([
    obtenerColaboradora(id),
    obtenerValoracionesDeColaboradora(id),
  ]);
  return { colaboradora, valoraciones };
}

export default function PerfilColaboradoraAdm() {
  // ───── 1. DATOS Y ESTADO ─────
  const { id } = useParams();
  const { cargando, datos, error } = usePedido(() => cargarPerfil(id), [id]);

  // ───── ESPERA Y ERRORES ─────
  if (cargando) return <PantallaCargando />;
  if (esError(error, 404)) {
    return <NoEncontrado titulo="Esa persona no existe" msg={error.response.data.message} />;
  }
  if (error) return <PantallaDeError titulo="No pudimos cargar el perfil" error={error} />;

  const { colaboradora, valoraciones } = datos;

  // ───── 2. CÁLCULOS ─────
  // Promedio de estrellas con un decimal (null si no tiene valoraciones).
  const promedio = valoraciones.length
    ? (valoraciones.reduce((suma, v) => suma + v.puntaje, 0) / valoraciones.length).toFixed(1).replace('.', ',')
    : null;

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Crumbs items={[{ label: 'Personas', to: '/admin/colaboradoras' }, { label: colaboradora.nombre }]} />

      {/* BLOQUE: Credencial — foto, nombre, números, bio, habilidades y enlaces */}
      <header className={s.credencial}>
        <div className={s.credencialBanda} aria-hidden="true" />
        <div className={s.credencialCabeza}>
          <Avatar nombre={colaboradora.nombre} size={128} square foto={colaboradora.foto || fotoDe(colaboradora.id)} />
          <div>
            <Heading level={1} size="h2">
              {colaboradora.nombre}{' '}
              {colaboradora.pronombres && <small className={s.pronombres}>({colaboradora.pronombres})</small>}
            </Heading>
            {colaboradora.alias && <Text variant="small">@{colaboradora.alias}</Text>}
          </div>
        </div>

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
      </header>

      {/* BLOQUE: Valoraciones que recibió de colectivos */}
      <section className={sh.column} aria-labelledby="vals">
        <Heading level={2} size="h3" id="vals">Valoraciones</Heading>
        {valoraciones.length === 0 && <Text variant="small">Todavía no recibió valoraciones.</Text>}
        {valoraciones.map((valoracion) => (
          <div key={valoracion.id} className={s.valoracion}>
            <div className={sh.row}>
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
