/**
 * PANTALLA DetalleColectivo
 * Ruta: /colectivos/:id   ·   Quién la ve: Todas
 * Qué muestra: Datos del colectivo, sus proyectos y valoraciones. Permite denunciar a quien participó.
 * De dónde salen los datos (todo del backend):
 *   · el colectivo           → GET /colectivos/:id                      (api/colectivos.js)
 *   · sus proyectos          → GET /colectivos/:id/proyectos?pagina=&limite= (api/proyectos.js)
 *   · sus valoraciones       → GET /colectivo/:id/valoraciones           (api/colectivos.js)
 *   · si la colaboradora participó (para denunciar) → GET /colaboradoras/:id/colaboraciones (api/denuncias.js)
 *   · la denuncia            → POST /colaboraciones/:id/denuncia         (api/denuncias.js)
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → qué colectivo se está mirando (se pide al backend con el id de la
 *                        dirección), sus proyectos y valoraciones (otros pedidos), quién tiene
 *                        la sesión y lo que la pantalla recuerda: página de proyectos, si la
 *                        ventana de denuncia está abierta y los avisos.
 *      ESPERA Y ERRORES → mientras llega la respuesta, filas grises; si el backend dice 404,
 *                        la pantalla de «no existe»; ante cualquier otro error, un aviso.
 *   2. CÁLCULOS        → los proyectos de esta página, las valoraciones y si la persona
 *                        puede denunciarlo.
 *   3. ACCIONES        → funciones para abrir, confirmar y cancelar la denuncia.
 *   4. LO QUE SE DIBUJA → migas de pan, avisos, cabecera con datos del colectivo, lista de
 *                        proyectos (o mensaje de vacío), valoraciones y la ventana de denuncia.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Heading, Tag, Text } from '../../atomos';
import { Alert, CardsSkeleton, Crumbs, Estrellas, Grid, Pager, RowsSkeleton } from '../../moleculas';
import { DenunciaDialog, ProyectoCard } from '../../organismos';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { obtenerColectivo, obtenerValoracionesDelColectivo } from '../../api/colectivos.js';
import { obtenerProyectosDeColectivo } from '../../api/proyectos.js';
import { denunciarColaboracion, obtenerColaboracionesDePersona } from '../../api/denuncias.js';
import { mensajeDeError } from '../../api/errores.js';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import s from './Colectivos.module.css';
import d from './DetalleColectivo.module.css';
import { fotoDe } from '../../datos/fotos.js';

// Cuántas tarjetas de proyecto se piden por página.
const PROYECTOS_POR_PAGINA = 6;

export default function DetalleColectivo() {
  // ───── 1. DATOS Y ESTADO ─────
  // `id` es la parte variable de la dirección: en /colectivos/6650f… vale '6650f…' (siempre
  // texto). (ver docs/GLOSARIO.md → useParams y Desestructurar)
  const { id } = useParams();
  // Rol de la sesión: 'col' (colaboradora), 'org' (organización) o null (visitante),
  // y el id real de esa cuenta en el backend.
  const { rol, id: idCuenta } = useAuth();
  // Página de «Sus proyectos» (empieza en 1). La cambia el paginador de esa sección.
  const [paginaDeProyectos, setPaginaDeProyectos] = useState(1);
  // Pide el colectivo al backend. Se vuelve a pedir si cambia el `id` (por eso [id]).
  // `datos: colectivo` = «lo que viene en `datos` guardalo con el nombre `colectivo`».
  const { cargando, datos: colectivo, error } = usePedido(() => obtenerColectivo(id), [id]);
  // Sus proyectos, de a una página. Pedido aparte: si falla, el resto de la pantalla sigue.
  const pedidoDeProyectos = usePedido(
    () => obtenerProyectosDeColectivo(id, { pagina: paginaDeProyectos, limite: PROYECTOS_POR_PAGINA }),
    [id, paginaDeProyectos]
  );
  // Las valoraciones que recibió. Pedido aparte por el mismo motivo.
  const pedidoDeValoraciones = usePedido(() => obtenerValoracionesDelColectivo(id), [id]);
  // Si es colaboradora: sus colaboraciones, activas o no (para saber si puede denunciar).
  // Para cualquier otra persona no se pide nada (Promise.resolve([]) = «ya está, lista vacía»).
  const pedidoDeColaboraciones = usePedido(
    () => (rol === 'col' && idCuenta ? obtenerColaboracionesDePersona(idCuenta) : Promise.resolve([])),
    [rol, idCuenta]
  );
  // true = la ventana «Denunciar» está abierta. La abre el botón «Denunciar»
  // y la cierran sus botones de cancelar / confirmar.
  const [denunciaAbierta, setDenunciaAbierta] = useState(false);
  // true mientras viaja la denuncia al backend.
  const [enviando, setEnviando] = useState(false);
  // Aviso verde («Denuncia enviada») o rojo (motivo del backend). '' = no se muestra.
  const [denunciaEnviada, setDenunciaEnviada] = useState(false);
  const [errorDeDenuncia, setErrorDeDenuncia] = useState('');

  // ───── ESPERA Y ERRORES ─────
  // Cada caso dibuja otra cosa y corta acá con `return`.
  // (Los hooks de arriba tienen que ir antes de estos `return`, siempre en el mismo orden.)

  // Caso 1: todavía no llegó la respuesta → filas grises de relleno.
  if (cargando) {
    return (
      <div className={`container ${s.page}`}>
        <RowsSkeleton n={3} />
      </div>
    );
  }

  // Caso 2: el backend respondió 404 → ese colectivo no existe. El código y el mensaje
  // son los del catálogo de errores del backend (error.response.data).
  // `?.` corta sin romper si lo de la izquierda no existe (backend apagado = sin response).
  if (error?.response?.status === 404) {
    const { code, message } = error.response.data;
    return <NoEncontrado code={code} titulo="Ese colectivo no existe" msg={message} />;
  }

  // Caso 3: cualquier otro error (backend apagado, error 500, sin internet…) → aviso.
  if (error) {
    return (
      <div className={`container ${s.page}`}>
        <Alert kind="error" title="No pudimos cargar el colectivo">
          {mensajeDeError(error)}
        </Alert>
      </div>
    );
  }

  // ───── 2. CÁLCULOS ─────
  // Proyectos de la página actual. El backend los manda con el colectivo como id: se le
  // pone el nombre para que la tarjeta lo muestre. `?? []` = lista vacía mientras carga.
  const proyectosDelColectivo = (pedidoDeProyectos.datos?.resultados ?? []).map((proyecto) => ({
    ...proyecto,
    colectivo: proyecto.colectivo || colectivo.nombre,
  }));
  const paginasDeProyectos = pedidoDeProyectos.datos?.totalPaginas ?? 1;
  // Las valoraciones que recibió (lista vacía si todavía no llegaron o si falló el pedido).
  const valoraciones = pedidoDeValoraciones.datos ?? [];
  // La colaboración de la persona en algún proyecto de ESTE colectivo. El backend denuncia
  // sobre una colaboración y deduce solo a qué colectivo corresponde.
  const miColaboracion = (pedidoDeColaboraciones.datos ?? []).find(
    (colaboracion) => String(colaboracion.colectivoId) === String(colectivo.id)
  );
  const puedeDenunciar = rol === 'col' && Boolean(miColaboracion);

  // ───── 3. ACCIONES ─────
  // Se ejecuta al tocar «Denunciar»: abre la ventana de denuncia.
  function alTocarDenunciar() {
    setDenunciaAbierta(true);
  }

  // Se ejecuta al confirmar la denuncia: la manda al backend (el motivo va adelante del
  // texto) y muestra el aviso verde, o el rojo con el motivo si el backend la rechazó.
  async function alConfirmarDenuncia({ motivo, texto }) {
    setDenunciaAbierta(false);
    setDenunciaEnviada(false);
    setErrorDeDenuncia('');
    setEnviando(true);
    try {
      await denunciarColaboracion(miColaboracion.id, `${motivo}: ${texto}`);
      setDenunciaEnviada(true);
    } catch (errorDelBackend) {
      setErrorDeDenuncia(mensajeDeError(errorDelBackend));
    } finally {
      setEnviando(false);
    }
  }

  // Se ejecuta al cancelar la ventana de denuncia: se cierra sin enviar nada.
  function alCancelarDenuncia() {
    setDenunciaAbierta(false);
  }

  // Se ejecuta al cerrar el aviso verde con su X: lo oculta.
  function alCerrarAviso() {
    setDenunciaEnviada(false);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Crumbs items={[{ label: 'Colectivos', to: '/colectivos' }, { label: colectivo.nombre }]} />

      {/* Avisos de la denuncia: verde si salió bien, rojo con el motivo si no (`&&`: si es
          verdadero se dibuja; ver docs/GLOSARIO.md → Renderizado condicional) */}
      {denunciaEnviada && (
        <Alert kind="success" onClose={alCerrarAviso}>
          Denuncia enviada. El equipo administrativo la va a evaluar.
        </Alert>
      )}
      {errorDeDenuncia && (
        <Alert kind="error" title="No se pudo enviar la denuncia" onClose={() => setErrorDeDenuncia('')}>
          {errorDeDenuncia}
        </Alert>
      )}

      {/* BLOQUE: Cabecera — nombre, descripción, etiquetas, enlaces, acciones y avatar */}
      <header className={d.head}>
        <div className={d.info}>
          <Heading level={1} size="h2">{colectivo.nombre}</Heading>
          <Text variant="prose">{colectivo.descripcion}</Text>
          <div className={d.tags}>
            <Tag>{colectivo.tipo}</Tag>
            {colectivo.ubicacionTexto && <Tag>{colectivo.ubicacionTexto}</Tag>}
            {/* PENDIENTE (backend): el colectivo no tiene «causas» todavía; cuando las tenga,
                una <Tag tone="sand"> por cada una. */}
          </div>
          {/* Un enlace por cada red social que cargó el colectivo; si no cargó ninguna,
              no se dibuja el bloque */}
          {colectivo.redes.length > 0 && (
            <div className={d.links}>
              {colectivo.redes.map((red) => (
                <a key={red.tipo} href={red.url} target="_blank" rel="noopener noreferrer">
                  {red.tipo}
                </a>
              ))}
            </div>
          )}
          {/* PENDIENTE (backend): el botón «Invitar un cafecito» se sacó porque el colectivo no
              tiene enlace de donaciones propio (solo los proyectos tienen urlDonaciones). */}
          {/* «Denunciar» aparece solo si es una colaboradora que participa con este colectivo */}
          {puedeDenunciar && (
            <div className={d.acciones}>
              <Button variant="link" disabled={enviando} onClick={alTocarDenunciar}>Denunciar</Button>
            </div>
          )}
        </div>
        <Avatar nombre={colectivo.nombre} size={120} square foto={fotoDe(colectivo.id)} />
      </header>

      {/* BLOQUE: Sus proyectos — tarjetas de los proyectos del colectivo */}
      <Heading level={2}>Sus proyectos</Heading>
      {/* Cuatro casos, solo se ve uno: cargando → tarjetas grises; falló → aviso; tiene
          proyectos → sus tarjetas y paginador; no tiene ninguno → mensaje y enlace al listado. */}
      {pedidoDeProyectos.cargando && <CardsSkeleton n={2} />}

      {pedidoDeProyectos.error && (
        <Alert kind="error" title="No pudimos cargar sus proyectos">
          {mensajeDeError(pedidoDeProyectos.error)}
        </Alert>
      )}

      {!pedidoDeProyectos.cargando && !pedidoDeProyectos.error && proyectosDelColectivo.length > 0 && (
        <>
          <Grid>
            {proyectosDelColectivo.map((proyecto) => (
              <ProyectoCard key={proyecto.id} p={proyecto} />
            ))}
          </Grid>
          <Pager page={paginaDeProyectos} pages={paginasDeProyectos} onChange={setPaginaDeProyectos} />
        </>
      )}

      {!pedidoDeProyectos.cargando && !pedidoDeProyectos.error && proyectosDelColectivo.length === 0 && (
        <div className={s.empty}>
          <Heading level={2} size="h3">Todavía no publicó proyectos</Heading>
          <Button as={Link} to="/proyectos" variant="secondary">Ver otros proyectos</Button>
        </div>
      )}

      {/* BLOQUE: Valoraciones — opiniones recibidas; se ve solo si hay al menos una.
          Por privacidad el backend no dice quién escribió cada valoración. */}
      {valoraciones.length > 0 && (
        <section aria-labelledby="vals" className={d.valoraciones}>
          <Heading level={2} id="vals">Valoraciones</Heading>
          <ul>
            {valoraciones.map((valoracion) => (
              <li key={valoracion.id}>
                <div className={d.valoracionCabecera}>
                  <b>
                    Una colaboradora
                    {valoracion.fecha && ` · ${valoracion.fecha.toLocaleDateString('es-AR')}`}
                  </b>
                  <Estrellas valor={valoracion.puntaje} />
                </div>
                {valoracion.comentario && <Text variant="prose">{valoracion.comentario}</Text>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* BLOQUE: Nota final — cómo contactar al colectivo */}
      <Text variant="small">
        Para contactar a la organización, postulate a uno de sus proyectos: se escriben por
        mensajes internos.
      </Text>

      {/* BLOQUE: Ventana de denuncia — se ve solo cuando `denunciaAbierta` es true */}
      <DenunciaDialog
        open={denunciaAbierta}
        a={colectivo.nombre}
        onCancel={alCancelarDenuncia}
        onConfirm={alConfirmarDenuncia}
      />
    </div>
  );
}
