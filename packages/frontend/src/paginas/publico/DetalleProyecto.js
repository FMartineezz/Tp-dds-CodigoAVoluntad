/* eslint-disable react/react-in-jsx-scope */
/**
 * PANTALLA DetalleProyecto
 * Ruta: /proyectos/:id   ·   Quién la ve: Todas (acciones según rol)
 * Qué muestra: Resumen, Perfiles (cupo, equipo, postulación) y Avance (logros) en pestañas.
 * Para modificarla: una pestaña nueva = un objeto en el array de <Tabs> + un bloque {tab === "x" && …}.
 * De dónde salen los datos (todo del backend, ver api/proyectos.js y api/colectivos.js):
 *   · el proyecto con sus perfiles y logros → GET /proyectos/:id
 *   · el nombre del colectivo               → GET /colectivos/:id
 *   · quiénes ocupan cada perfil            → GET /proyectos/:id/colaboraciones (las activas)
 *   · si es colaboradora: a qué perfiles ya se postuló (GET /colaboradoras/:id/postulaciones)
 *     y si participó en el proyecto, para poder denunciar (GET /colaboradoras/:id/colaboraciones).
 *   · postularse → POST /proyectos/:proyectoId/perfiles/:perfilId/postulaciones
 *   · denunciar  → POST /colaboraciones/:id/denuncia
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   · cargarProyecto / cargarSesion (funciones chicas) → juntan varios pedidos en uno.
 *   1. DATOS Y ESTADO  → qué proyecto se está mirando (sale de la dirección), quién tiene la
 *                        sesión, los pedidos al backend y lo que la pantalla recuerda:
 *                        pestaña abierta, perfiles a los que se postuló, ventanas y avisos.
 *      ESPERA Y ERRORES → mientras llega la respuesta, filas grises; si el backend dice 404,
 *                        la pantalla de «no existe»; ante cualquier otro error, un aviso.
 *   2. CÁLCULOS        → si la búsqueda sigue abierta, quiénes ocupan cada perfil y
 *                        qué perfiles todavía tienen lugar.
 *   3. ACCIONES        → funciones para postularse, confirmar la postulación, denunciar
 *                        y decidir qué botón mostrar en cada fila de la tabla de perfiles.
 *   4. LO QUE SE DIBUJA → migas de pan, cabecera con botón de postular, avisos,
 *                        pestañas (Resumen / Perfiles / Avance) y las dos ventanas emergentes.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Heading, Icon, Progress, StatusBadge, Tag, Text } from '../../atomos';
import { Alert, Crumbs, RowsSkeleton, Tabs } from '../../moleculas';
import { DenunciaDialog, PostularDialog } from '../../organismos';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { obtenerOcupantesDelProyecto, obtenerProyecto, postularmeAPerfil } from '../../api/proyectos.js';
import { obtenerColectivo } from '../../api/colectivos.js';
import { obtenerPostulaciones } from '../../api/colaboradora.js';
import { denunciarColaboracion, obtenerColaboracionesDePersona } from '../../api/denuncias.js';
import { mensajeDeError } from '../../api/errores.js';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import s from './Detalle.module.css';

// Las tres pestañas de la pantalla: `id` es el valor interno, `label` el texto que se ve.
const PESTANAS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'perfiles', label: 'Perfiles' },
  { id: 'avance', label: 'Avance' },
];

// Fecha del backend ('2026-11-30T…') → texto corto en castellano ('30/11/2026').
function fechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR');
}

// ═════ PEDIDOS QUE SE JUNTAN ═════
// Pide el proyecto y, con el id de su colectivo, el nombre del colectivo y quiénes
// ocupan cada perfil. Si el proyecto no existe, el 404 sale de acá y la pantalla lo muestra.
// Si fallan los pedidos «de adorno» (colectivo, equipo) se sigue igual: `.catch(() => …)`
// los reemplaza por un valor vacío para no tirar abajo toda la pantalla.
async function cargarProyecto(id) {
  const proyecto = await obtenerProyecto(id);
  const [colectivo, ocupantes] = await Promise.all([
    obtenerColectivo(proyecto.colectivoId).catch(() => null),
    obtenerOcupantesDelProyecto(id).catch(() => null),
  ]);
  return {
    // GET /proyectos/:id trae el colectivo solo como id: se completa el nombre.
    proyecto: { ...proyecto, colectivo: proyecto.colectivo || colectivo?.nombre || 'Colectivo' },
    // null = no se pudo saber el equipo (se avisa en la tabla); {} = nadie todavía.
    ocupantes,
  };
}

// Solo para colaboradoras: sus postulaciones y sus colaboraciones activas.
// Para quien no es colaboradora devuelve listas vacías sin pedir nada.
async function cargarSesion(rol, idCuenta) {
  if (rol !== 'col' || !idCuenta) return { postulaciones: [], colaboraciones: [] };
  const [postulaciones, colaboraciones] = await Promise.all([
    obtenerPostulaciones(idCuenta).catch(() => []),
    obtenerColaboracionesDePersona(idCuenta).catch(() => []),
  ]);
  return { postulaciones, colaboraciones };
}

export default function DetalleProyecto() {
  // ───── 1. DATOS Y ESTADO ─────
  // `id` es la parte variable de la dirección: en /proyectos/6afe… vale '6afe…' (siempre texto).
  // (ver docs/GLOSARIO.md → useParams y Desestructurar)
  const { id } = useParams();
  // Rol de la sesión ('col', 'org' o null) y el id real de esa cuenta en el backend.
  const { rol, id: idCuenta } = useAuth();
  // Pedido principal: proyecto + colectivo + equipo. Se repite si cambia el `id`.
  const { cargando, datos, error } = usePedido(() => cargarProyecto(id), [id]);
  // Pedido de la sesión: a qué perfiles ya se postuló y si participó del proyecto.
  const { datos: sesion } = usePedido(() => cargarSesion(rol, idCuenta), [rol, idCuenta]);
  // Pestaña visible: 'resumen', 'perfiles' o 'avance'. Empieza en 'resumen'; la cambia <Tabs>.
  const [pestanaActiva, setPestanaActiva] = useState('resumen');
  // Perfiles a los que se postuló EN ESTA VISITA (los anteriores salen de `sesion`).
  // Objeto con el id del perfil como clave, ej. { '6afe…': true }. Lo cambia alConfirmarPostulacion.
  const [perfilesPostulados, setPerfilesPostulados] = useState({});
  // Id del perfil preseleccionado en la ventana «Postularme». null = ventana cerrada.
  const [perfilParaPostular, setPerfilParaPostular] = useState(null);
  // true mientras viaja un pedido al backend (postulación o denuncia): deshabilita botones.
  const [enviando, setEnviando] = useState(false);
  // Mensaje verde de éxito que se ve arriba. '' = no se muestra nada.
  const [aviso, setAviso] = useState('');
  // Mensaje rojo con el motivo que dio el backend si rechazó la postulación o la denuncia.
  const [errorDeEnvio, setErrorDeEnvio] = useState('');
  // true = la ventana «Denunciar al colectivo» está abierta. La abre el botón «Denunciar».
  const [denunciaAbierta, setDenunciaAbierta] = useState(false);

  // ───── ESPERA Y ERRORES ─────
  // Cada caso dibuja otra cosa y corta acá con `return`.
  // (Los hooks de arriba tienen que ir antes de estos `return`, siempre en el mismo orden.)

  // Caso 1: todavía no llegó la respuesta → filas grises de relleno.
  if (cargando) {
    return (
      <div className={`container ${s.page}`}>
        <RowsSkeleton n={4} />
      </div>
    );
  }

  // Caso 2: el backend respondió 404 → ese proyecto no existe. El código y el mensaje son
  // los del catálogo de errores del backend. `?.` corta sin romper si no hay response.
  if (error?.response?.status === 404) {
    const { code, message } = error.response.data;
    return <NoEncontrado code={code} titulo="Ese proyecto no existe" msg={message} />;
  }

  // Caso 3: cualquier otro error (backend apagado, error 500, sin internet…) → aviso.
  if (error) {
    return (
      <div className={`container ${s.page}`}>
        <Alert kind="error" title="No pudimos cargar el proyecto">
          {mensajeDeError(error)}
        </Alert>
      </div>
    );
  }

  // ───── 2. CÁLCULOS ─────
  const { proyecto, ocupantes } = datos;

  // ¿Se puede postular? El adaptador ya dice 'abierto' solo si no está finalizado, no se
  // cerró la búsqueda a mano y no venció la fecha límite.
  const busquedaAbierta = proyecto.estado === 'abierto';

  // Quiénes ocupan un perfil (lista vacía si nadie o si no se pudo saber).
  function ocupantesDe(perfil) {
    return ocupantes?.[perfil.id] ?? [];
  }

  // ¿El perfil tiene lugar? `cantidadMaxima` es el cupo; si el perfil no lo tiene, no hay límite.
  function tieneLugar(perfil) {
    return perfil.cantidadMaxima == null || ocupantesDe(perfil).length < perfil.cantidadMaxima;
  }

  // ¿Ya se postuló a este perfil? Puede ser de esta visita (perfilesPostulados) o de antes
  // (sesion.postulaciones, que traen proyectoId y perfilId para comparar).
  function yaSePostuloA(perfil) {
    if (perfilesPostulados[perfil.id]) return true;
    return (sesion?.postulaciones ?? []).some(
      (postulacion) =>
        String(postulacion.proyectoId) === String(proyecto.id) &&
        String(postulacion.perfilId) === String(perfil.id) &&
        postulacion.estado === 'pendiente'
    );
  }

  // Perfiles que todavía tienen lugar y a los que no se postuló: los que ofrece la ventana.
  const perfilesDisponibles = proyecto.perfiles.filter(
    (perfil) => tieneLugar(perfil) && !yaSePostuloA(perfil)
  );
  // ¿Se postuló a alguno? (para el cartel «pendiente» de la cabecera)
  const yaMePostule = proyecto.perfiles.some(yaSePostuloA);

  // La colaboración de la persona en ESTE proyecto (si participa). Sirve para denunciar:
  // el backend denuncia sobre una colaboración y deduce solo el colectivo.
  const miColaboracion = (sesion?.colaboraciones ?? []).find(
    (colaboracion) => String(colaboracion.proyectoId) === String(proyecto.id)
  );
  const puedeDenunciar = rol === 'col' && Boolean(miColaboracion);

  // ¿Qué botón principal va en la cabecera? Dos casos distintos (ver el bloque «Cabecera»):
  // - botón que abre la ventana: colaboradora, o cualquiera si la búsqueda está cerrada
  //   (en ese caso queda deshabilitado);
  // - botón que lleva a ingresar: visitante sin sesión con la búsqueda abierta.
  const mostrarBotonDeCabecera = rol !== 'org';
  const botonDeCabeceraAbreVentana = rol === 'col' || !busquedaAbierta;

  // ───── 3. ACCIONES ─────
  // Decide qué se ve en la última columna de la fila de un perfil que todavía tiene lugar.
  // Devuelve un botón, una etiqueta o null (= nada). Se llama una vez por fila.
  function accionDelPerfil(perfil) {
    // Una organización no se postula: no ve nada.
    if (rol === 'org') {
      return null;
    }
    // Si ya se postuló a este perfil, se ve la etiqueta «pendiente».
    if (yaSePostuloA(perfil)) {
      return <StatusBadge status="pendiente" />;
    }
    // Si la búsqueda está cerrada, no hay botón.
    if (!busquedaAbierta) {
      return null;
    }
    // Colaboradora con sesión: el botón abre la ventana con este perfil preseleccionado.
    if (rol === 'col') {
      return (
        <Button variant="secondary" disabled={enviando} onClick={() => setPerfilParaPostular(perfil.id)}>
          Postularme
        </Button>
      );
    }
    // Visitante sin sesión: el botón la lleva a ingresar y después vuelve a este proyecto.
    return (
      <Button as={Link} to={`/ingresar?volver=/proyectos/${proyecto.id}`} variant="secondary">
        Postularme
      </Button>
    );
  }

  // Se ejecuta al tocar el botón «Postularme» de la cabecera: abre la ventana con el
  // primer perfil disponible (el `?.` evita un error si no queda ninguno).
  function alPostularmeDesdeLaCabecera() {
    setPerfilParaPostular(perfilesDisponibles[0]?.id);
  }

  // Se ejecuta al confirmar la ventana de postulación. Recibe el id del perfil elegido y si
  // la persona quiere que su contribución sea pública. `async` permite esperar (`await`)
  // la respuesta del backend; si responde con error, salta al `catch`.
  async function alConfirmarPostulacion({ perfil: perfilId, publica }) {
    setPerfilParaPostular(null);
    setAviso('');
    setErrorDeEnvio('');
    setEnviando(true);
    try {
      await postularmeAPerfil(proyecto.id, perfilId, {
        personaColaboradoraId: idCuenta,
        anonima: !publica,
      });
      // Salió bien: se marca el perfil como postulado. `...anteriores` copia lo que había y
      // `[perfilId]: true` agrega este (ver docs/GLOSARIO.md → Copiar con cambios).
      setPerfilesPostulados((anteriores) => ({ ...anteriores, [perfilId]: true }));
      const perfil = proyecto.perfiles.find((candidato) => candidato.id === perfilId);
      const fraseAnonima = publica ? '' : 'Tu contribución será anónima. ';
      setAviso(
        `Postulación enviada al perfil «${perfil?.descripcion}». ${fraseAnonima}La organización la va a revisar.`
      );
    } catch (errorDelBackend) {
      // El backend explica el motivo: «no tenés ninguna habilidad requerida», «la búsqueda
      // está cerrada», «ya te postulaste»… Se muestra tal cual.
      setErrorDeEnvio(mensajeDeError(errorDelBackend));
    } finally {
      // `finally` corre siempre, haya salido bien o mal.
      setEnviando(false);
    }
  }

  // Se ejecuta al cancelar la ventana de postulación: se cierra sin enviar nada.
  function alCancelarPostulacion() {
    setPerfilParaPostular(null);
  }

  // Se ejecuta al confirmar la denuncia: la manda al backend sobre la colaboración de la
  // persona en este proyecto. El motivo elegido va adelante de la descripción.
  async function alConfirmarDenuncia({ motivo, texto }) {
    setDenunciaAbierta(false);
    setAviso('');
    setErrorDeEnvio('');
    setEnviando(true);
    try {
      await denunciarColaboracion(miColaboracion.id, `${motivo}: ${texto}`);
      setAviso('Denuncia enviada. El equipo administrativo la va a evaluar.');
    } catch (errorDelBackend) {
      setErrorDeEnvio(mensajeDeError(errorDelBackend));
    } finally {
      setEnviando(false);
    }
  }

  // Se ejecuta al cancelar la ventana de denuncia: se cierra sin enviar nada.
  function alCancelarDenuncia() {
    setDenunciaAbierta(false);
  }

  // Dibuja una fila de la tabla de «Perfiles» (se llama una vez por cada perfil del proyecto).
  function filaDePerfil(perfil) {
    const ocupantesDelPerfil = ocupantesDe(perfil);
    const perfilCompleto = !tieneLugar(perfil);
    const hayOcupantes = ocupantesDelPerfil.length > 0;
    const hayOpcionales = perfil.opcionales.length > 0;
    // Cupo: «1/2» si el perfil tiene máximo; si no, solo cuántos hay.
    const textoDeCupo =
      perfil.cantidadMaxima == null
        ? `${ocupantesDelPerfil.length}`
        : `${ocupantesDelPerfil.length}/${perfil.cantidadMaxima}`;

    return (
      <tr key={perfil.id}>
        {/* Columna 1: el perfil. El backend no tiene un «nombre» de perfil: se usa la descripción. */}
        <td data-l="Perfil">
          <b>{perfil.descripcion}</b>
        </td>

        {/* Columna 2: habilidades requeridas y, si hay, las opcionales */}
        <td data-l="Habilidades">
          <span className={s.tags}>
            {perfil.requeridas.map((habilidad) => (
              <Tag key={habilidad} tone="sand">{habilidad}</Tag>
            ))}
          </span>
          {/* Se ve solo si el perfil tiene habilidades opcionales */}
          {hayOpcionales && (
            <span className={s.opc}>Opcionales: {perfil.opcionales.join(', ')}</span>
          )}
        </td>

        {/* Columna 3: compromiso de tiempo y modalidad de trabajo */}
        <td data-l="Compromiso">
          {perfil.tiempo}
          <span className={s.tags}>
            <Tag>{perfil.modalidad}</Tag>
          </span>
        </td>

        {/* Columna 4: cuántos lugares están ocupados y quiénes son */}
        <td data-l="Equipo">
          <b>{textoDeCupo}</b>
          {/* Tres casos: no se pudo consultar el equipo / hay integrantes / no hay nadie */}
          {ocupantes === null ? (
            <span className={s.opc}>No pudimos consultar el equipo</span>
          ) : hayOcupantes ? (
            <ul className={s.ocup}>
              {ocupantesDelPerfil.map((ocupante) => (
                <li key={ocupante.colaboracionId}>{ocupante.nombre}</li>
              ))}
            </ul>
          ) : (
            <span className={s.opc}>Sin integrantes todavía</span>
          )}
        </td>

        {/* Columna 5: si el perfil está completo se ve «cerrado»;
            si no, el botón que corresponda */}
        <td className={s.act}>
          {perfilCompleto ? <StatusBadge status="cerrado" /> : accionDelPerfil(perfil)}
        </td>
      </tr>
    );
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Crumbs items={[{ label: 'Proyectos', to: '/proyectos' }, { label: proyecto.titulo }]} />

      {/* BLOQUE: Cabecera — título, estado, colectivo, etiquetas y botón de postulación */}
      <header className={s.top}>
        <div className={s.title}>
          <div className={s.row}>
            <Heading level={1} size="h2">{proyecto.titulo}</Heading>
            <StatusBadge status={proyecto.estado} />
          </div>
          <Text variant="small">
            <Link to={`/colectivos/${proyecto.colectivoId}`}>{proyecto.colectivo}</Link>
          </Text>
          <div className={s.tags}>
            {/* La etiqueta cambia según el estado de la búsqueda (con fecha límite si tiene) */}
            <Tag tone={busquedaAbierta ? 'sand' : 'outline'}>
              {proyecto.finalizado
                ? 'Proyecto finalizado'
                : !busquedaAbierta
                  ? 'Búsqueda cerrada'
                  : proyecto.fechaLimiteBusqueda
                    ? `Búsqueda abierta hasta ${fechaCorta(proyecto.fechaLimiteBusqueda)}`
                    : 'Búsqueda abierta'}
            </Tag>
            {/* Fecha de cierre automático: solo si el colectivo la cargó y todavía no terminó */}
            {proyecto.fechaCierre && !proyecto.finalizado && (
              <Tag>Cierra automáticamente el {fechaCorta(proyecto.fechaCierre)}</Tag>
            )}
            {/* «Denunciar al colectivo» aparece solo si es una colaboradora que participa
                en este proyecto (`&&`: si es verdadero se dibuja; ver
                docs/GLOSARIO.md → Renderizado condicional) */}
            {puedeDenunciar && (
              <Button variant="link" disabled={enviando} onClick={() => setDenunciaAbierta(true)}>
                Denunciar al colectivo
              </Button>
            )}
          </div>
        </div>

        <div className={s.right}>
          {/* Botón que abre la ventana de postulación: aparece si no es organización y es
              colaboradora o la búsqueda está cerrada. Si la búsqueda está cerrada o no quedan
              perfiles disponibles, queda deshabilitado. */}
          {mostrarBotonDeCabecera && botonDeCabeceraAbreVentana && (
            <Button
              disabled={!busquedaAbierta || perfilesDisponibles.length === 0 || enviando}
              loading={enviando}
              onClick={alPostularmeDesdeLaCabecera}
            >
              {busquedaAbierta ? 'Postularme' : 'Búsqueda cerrada'}
            </Button>
          )}
          {/* Botón que lleva a ingresar: visita sin sesión con la búsqueda abierta */}
          {mostrarBotonDeCabecera && !botonDeCabeceraAbreVentana && (
            <Button as={Link} to={`/ingresar?volver=/proyectos/${proyecto.id}`}>
              Postularme
            </Button>
          )}
          {/* Si ya se postuló a algún perfil se ve la etiqueta «pendiente» */}
          {rol === 'col' && yaMePostule && <StatusBadge status="pendiente" />}
          {/* Mensaje para visitantes sin sesión cuando la búsqueda está abierta */}
          {rol === null && busquedaAbierta && (
            <Text variant="small">Ingresá como colaboradora para postularte</Text>
          )}
        </div>
      </header>

      {/* BLOQUE: Avisos — verde si salió bien, rojo con el motivo del backend si no */}
      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorDeEnvio && (
        <Alert kind="error" title="No se pudo enviar" onClose={() => setErrorDeEnvio('')}>
          {errorDeEnvio}
        </Alert>
      )}

      {/* BLOQUE: Pestañas — Resumen / Perfiles / Avance; se ve el contenido de la activa */}
      <Tabs tabs={PESTANAS} value={pestanaActiva} onChange={setPestanaActiva}>
        {/* Pestaña «Resumen»: descripción, habilidades y modalidades del proyecto */}
        {pestanaActiva === 'resumen' && (
          <>
            <Text variant="prose">{proyecto.descripcion}</Text>
            <div className={s.tags}>
              {proyecto.habilidades.map((habilidad) => (
                <Tag key={habilidad} tone="sand">{habilidad}</Tag>
              ))}
            </div>
            <div className={s.tags}>
              {proyecto.modalidad.map((modalidad) => (
                <Tag key={modalidad}>{modalidad}</Tag>
              ))}
            </div>
            {/* Enlaces externos que cargó el colectivo (cada uno solo si existe) */}
            <div className={s.tags}>
              {proyecto.urlSistema && (
                <Button variant="link" as="a" href={proyecto.urlSistema} target="_blank" rel="noopener noreferrer">
                  Ver el sistema en funcionamiento
                </Button>
              )}
              {proyecto.urlDonaciones && (
                <Button variant="link" as="a" href={proyecto.urlDonaciones} target="_blank" rel="noopener noreferrer">
                  Colaborar con una donación
                </Button>
              )}
            </div>
          </>
        )}

        {/* Pestaña «Perfiles»: tabla con una fila por perfil (ver filaDePerfil) */}
        {pestanaActiva === 'perfiles' && (
          <table className={s.tabla}>
            <thead>
              <tr>
                <th>Perfil</th>
                <th>Habilidades</th>
                <th>Compromiso</th>
                <th>Equipo</th>
                <th><span className="sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {proyecto.perfiles.map(filaDePerfil)}
            </tbody>
          </table>
        )}

        {/* Pestaña «Avance»: porcentaje, barra de progreso y lista de logros.
            En el backend un logro es un hito YA cumplido con su porcentaje: el avance es la
            suma de esos porcentajes (ver avanceDelProyecto en api/proyectos.js). */}
        {pestanaActiva === 'avance' && (
          <>
            <div className={s.avance}><b>{proyecto.avance} %</b><span>finalizado</span></div>
            <Progress value={proyecto.avance} />
            {proyecto.logros.length === 0 ? (
              <Text variant="small">Todavía no se cargó ningún logro.</Text>
            ) : (
              <ul className={s.hitos}>
                {proyecto.logros.map((logro) => (
                  // Todos los logros están cumplidos: llevan la clase `done` y el tilde.
                  <li key={logro._id} className={s.done}>
                    <span className={s.check}>
                      <Icon name="check" size={12} />
                    </span>
                    <span>
                      {logro.descripcion}
                      <span className="sr-only"> (completado)</span>
                      {/* Enlace al código de ese logro, si lo cargaron */}
                      {logro.urlCodigoFuente && (
                        <>
                          {' · '}
                          <a href={logro.urlCodigoFuente} target="_blank" rel="noopener noreferrer">
                            código
                          </a>
                        </>
                      )}
                    </span>
                    <b>{logro.porcentaje} %</b>
                  </li>
                ))}
              </ul>
            )}
            <Text variant="small">
              El avance es la suma de los porcentajes de los logros cumplidos.
            </Text>
          </>
        )}
      </Tabs>

      {/* BLOQUE: Ventanas emergentes — postularse y denunciar
          (cada una se ve solo si está abierta) */}
      {/* La ventana muestra la descripción de cada perfil (`rol`) y devuelve su id (`valor`).
          `!!perfilParaPostular` convierte el valor en true/false: abierta si hay perfil elegido */}
      <PostularDialog
        open={!!perfilParaPostular}
        perfiles={perfilesDisponibles.map((perfil) => ({ rol: perfil.descripcion, valor: perfil.id }))}
        perfilInicial={perfilParaPostular || ''}
        onCancel={alCancelarPostulacion}
        onConfirm={alConfirmarPostulacion}
      />
      <DenunciaDialog
        open={denunciaAbierta}
        a={proyecto.colectivo}
        onCancel={alCancelarDenuncia}
        onConfirm={alConfirmarDenuncia}
      />
    </div>
  );
}
