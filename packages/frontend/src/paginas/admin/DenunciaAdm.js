/**
 * PANTALLA DenunciaAdm
 * Ruta: /admin/denuncias/:id   ·   Quién la ve: Equipo administrativo
 * Qué muestra: Una denuncia: qué pasó, a qué colectivo, desde qué proyecto, quién la hizo
 *   (con sus contactos, por si hay que hablarle), los botones para cambiarle el estado y la
 *   medida sobre el colectivo: darlo de baja (con confirmación).
 * De dónde salen los datos: GET /admin/denuncias/:id; el cambio de estado hace
 *   PATCH /admin/denuncias/:id/estado y la baja DELETE /colectivos/:id (api/admin.js).
 *   Dar de baja también marca la denuncia como resuelta.
 * PENDIENTE (backend): no hay bloqueo temporal ni forma de reactivar un colectivo dado de baja.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: la denuncia (del backend), si se está guardando, si está abierto el
 *      diálogo de baja y los avisos.
 *      ESPERA Y ERRORES: cargando, «no existe» (404) o aviso de error.
 *   2. CÁLCULOS: a qué estados se puede pasar desde el actual.
 *   3. ACCIONES: cambiar el estado y dar de baja al colectivo.
 *   4. LO QUE SE DIBUJA: migas, avisos, texto de la denuncia, datos, botones de estado,
 *      medida sobre el colectivo y diálogo de confirmación.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Heading, Text } from '../../atomos';
import { Alert, ConfirmDialog, Crumbs } from '../../moleculas';
import { usePedido } from '../../hooks';
import { cambiarEstadoDenuncia, darDeBajaColectivo, fechaCorta, obtenerDenuncia } from '../../api/admin.js';
import { esError, mensajeDeError } from '../../api/errores.js';
import { NOMBRES_DE_CONTACTO } from '../../api/colaboradora.js';
import { NoEncontrado } from '../sistema/Errores.js';
import { EstadoTag, PantallaCargando, PantallaDeError } from './auxiliares.js';
import s from './Admin.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Botones para cambiar el estado: estado al que pasa → texto y variante del botón.
// «Pendiente» no está: el backend no deja volver una denuncia a pendiente.
const BOTONES = {
  en_revision: { texto: 'Marcar en revisión', variant: 'secondary' },
  resuelta: { texto: 'Marcar resuelta', variant: 'success' },
  descartada: { texto: 'Descartar', variant: 'danger' },
};

export default function DenunciaAdm() {
  // ───── 1. DATOS Y ESTADO ─────
  const { id } = useParams();

  // Sumarle 1 vuelve a pedir la denuncia (después de cambiarle el estado).
  const [version, setVersion] = useState(0);
  const { cargando, datos: denuncia, error } = usePedido(() => obtenerDenuncia(id), [id, version]);

  // Estado al que se está pasando (su botón muestra espera), o null.
  const [guardando, setGuardando] = useState(null);
  // true = el diálogo «¿Dar de baja?» está abierto.
  const [bajaAbierta, setBajaAbierta] = useState(false);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState(null);

  // ───── ESPERA Y ERRORES ─────
  if (cargando) return <PantallaCargando />;
  if (esError(error, 404)) {
    return <NoEncontrado titulo="Esa denuncia no existe" msg={error.response.data.message} />;
  }
  if (error) return <PantallaDeError titulo="No pudimos cargar la denuncia" error={error} />;

  // ───── 2. CÁLCULOS ─────
  // Se ofrecen todos los estados menos el que ya tiene.
  const estadosPosibles = Object.keys(BOTONES).filter((estado) => estado !== denuncia.estado);
  // Abierta = todavía no se resolvió ni se descartó. Si se da de baja al colectivo, queda resuelta.
  const denunciaAbierta = denuncia.estado === 'pendiente' || denuncia.estado === 'en_revision';

  // ───── 3. ACCIONES ─────
  async function alCambiarEstado(estado) {
    setGuardando(estado);
    setAviso('');
    setErrorAccion(null);
    try {
      await cambiarEstadoDenuncia(denuncia.id, estado);
      setAviso('Estado actualizado.');
      setVersion((v) => v + 1);
    } catch (e) {
      setErrorAccion(e);
    } finally {
      setGuardando(null);
    }
  }

  // Baja del colectivo denunciado. Si la denuncia seguía abierta, queda resuelta:
  // la baja es la respuesta a la denuncia.
  async function alConfirmarBaja() {
    setDandoDeBaja(true);
    setAviso('');
    setErrorAccion(null);
    try {
      await darDeBajaColectivo(denuncia.colectivoId);
      if (denunciaAbierta) await cambiarEstadoDenuncia(denuncia.id, 'resuelta');
      setAviso(
        denunciaAbierta
          ? `${denuncia.colectivo} quedó dado de baja y la denuncia, resuelta.`
          : `${denuncia.colectivo} quedó dado de baja.`
      );
      setVersion((v) => v + 1);
    } catch (e) {
      setErrorAccion(e);
    } finally {
      setDandoDeBaja(false);
      setBajaAbierta(false);
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Crumbs items={[{ label: 'Denuncias', to: '/admin/denuncias' }, { label: denuncia.colectivo }]} />
      <div className={`${sh.row} ${sh.spaceBetween}`}>
        <Heading level={1}>Denuncia a {denuncia.colectivo}</Heading>
        <EstadoTag estado={denuncia.estado} />
      </div>

      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorAccion && <Alert kind="error">{mensajeDeError(errorAccion)}</Alert>}

      {/* BLOQUE: qué pasó, tal como lo escribió la persona */}
      <blockquote className={s.cita}>{denuncia.descripcion}</blockquote>

      {/* BLOQUE: datos — fecha, colectivo, proyecto y quién denunció */}
      <dl className={s.datos}>
        <dt>Fecha</dt>
        <dd>{fechaCorta(denuncia.fecha)}</dd>
        <dt>Colectivo</dt>
        <dd>
          <Link to={`/colectivos/${denuncia.colectivoId}`}>{denuncia.colectivo}</Link>
          {' · '}
          <Link to={`/admin/denuncias?colectivo=${denuncia.colectivoId}`}>Ver sus denuncias</Link>
        </dd>
        <dt>Proyecto</dt>
        <dd>
          {denuncia.proyecto ? (
            <Link to={`/proyectos/${denuncia.proyecto.id}`}>{denuncia.proyecto.titulo}</Link>
          ) : (
            'Sin datos'
          )}
        </dd>
        <dt>Denunció</dt>
        <dd>{denuncia.persona?.nombre ?? 'Sin datos'}</dd>
        <dt>Contactos</dt>
        <dd>
          {denuncia.persona?.contactos.length ? (
            denuncia.persona.contactos.map((contacto) => (
              <div key={`${contacto.tipo}-${contacto.valor}`}>
                <b>{NOMBRES_DE_CONTACTO[contacto.tipo] ?? contacto.tipo}:</b> {contacto.valor}
              </div>
            ))
          ) : (
            <Text variant="small">No cargó medios de contacto.</Text>
          )}
        </dd>
      </dl>

      {/* BLOQUE: cambiar el estado */}
      <div className={sh.formActions}>
        {estadosPosibles.map((estado) => (
          <Button
            key={estado}
            variant={BOTONES[estado].variant}
            loading={guardando === estado}
            disabled={guardando !== null}
            onClick={() => alCambiarEstado(estado)}
          >
            {BOTONES[estado].texto}
          </Button>
        ))}
      </div>

      {/* BLOQUE: medida sobre el colectivo — darlo de baja, o aviso si ya lo está */}
      <section className={s.medidas} aria-labelledby="h-medidas">
        <Heading level={2} size="h4" id="h-medidas">Medidas sobre el colectivo</Heading>
        {denuncia.colectivoActivo ? (
          <>
            <Text variant="small">
              Si la denuncia es grave, podés dar de baja a {denuncia.colectivo}: deja de aparecer
              en la plataforma y no puede seguir buscando gente.
            </Text>
            <div>
              <Button variant="danger" disabled={guardando !== null} onClick={() => setBajaAbierta(true)}>
                Dar de baja al colectivo
              </Button>
            </div>
          </>
        ) : (
          <Alert kind="info">{denuncia.colectivo} ya está dado de baja.</Alert>
        )}
      </section>

      <ConfirmDialog
        open={bajaAbierta}
        title={`¿Dar de baja a ${denuncia.colectivo}?`}
        confirmLabel="Sí, dar de baja"
        danger
        loading={dandoDeBaja}
        onConfirm={alConfirmarBaja}
        onCancel={() => setBajaAbierta(false)}
      >
        Deja de aparecer en la plataforma y se borran sus datos de contacto. Sus proyectos y
        colaboraciones pasadas quedan en el historial.{denunciaAbierta && ' La denuncia queda resuelta.'}{' '}
        No se puede deshacer.
      </ConfirmDialog>
    </div>
  );
}
