/**
 * PANTALLA DetalleProyecto
 * Ruta: /proyectos/:id   ·   Quién la ve: Todas (acciones según rol)
 * Qué muestra: Todo en una página, en dos columnas. A la izquierda: título y estado,
 *   descripción, colectivo, avance y una tarjeta por perfil buscado (con su botón de
 *   postularse). A la derecha, la ficha: creado y estado de la búsqueda, enlaces, equipo y logros.
 * Para modificarla: un dato más de la ficha = otra <section> dentro de <aside>.
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
 *   4. LO QUE SE DIBUJA → migas de pan, avisos, cabecera,
 *                        cuerpo (perfiles + ficha) y las dos ventanas emergentes.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Heading, Icon, Progress, StatusBadge, Tag, Text } from '../../atomos';
import { Alert, Crumbs, RowsSkeleton } from '../../moleculas';
import { DenunciaDialog, PostularDialog } from '../../organismos';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { obtenerOcupantesDelProyecto, obtenerProyecto, postularmeAPerfil } from '../../api/proyectos.js';
import { obtenerColectivo } from '../../api/colectivos.js';
import { obtenerPostulaciones } from '../../api/colaboradora.js';
import { denunciarColaboracion, obtenerColaboracionesDePersona } from '../../api/denuncias.js';
import { mensajeDeError } from '../../api/errores.js';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { fotoDe } from '../../datos/fotos.js';
import s from './Detalle.module.css';

// Código del backend cuando la persona no tiene ninguna habilidad que pide el perfil
// (POSTULACION_HABILIDAD_REQUERIDA en el catálogo de errores).
const CODIGO_SIN_HABILIDADES = 'ERR-VAL-1007';

// Fecha del backend ('2026-11-30T…') → texto corto en castellano ('30/11/2026').
function fechaCorta(fecha) {
  return new Date(fecha).toLocaleDateString('es-AR');
}

// El backend no manda la fecha de creación, pero el _id de Mongo la trae adentro: los
// primeros 8 caracteres son los segundos desde 1970 escritos en hexadecimal.
function fechaDeCreacion(id) {
  return new Date(parseInt(String(id).slice(0, 8), 16) * 1000);
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
  // Perfiles a los que se postuló EN ESTA VISITA (los anteriores salen de `sesion`).
  // Objeto con el id del perfil como clave, ej. { '6afe…': true }. Lo cambia alConfirmarPostulacion.
  const [perfilesPostulados, setPerfilesPostulados] = useState({});
  // Id del perfil preseleccionado en la ventana «Postularme». null = ventana cerrada.
  const [perfilParaPostular, setPerfilParaPostular] = useState(null);
  // true mientras viaja un pedido al backend (postulación o denuncia): deshabilita botones.
  const [enviando, setEnviando] = useState(false);
  // Mensaje verde de éxito que se ve arriba. '' = no se muestra nada.
  const [aviso, setAviso] = useState('');
  // Error del backend si rechazó la postulación o la denuncia (null = no hay). Se guarda
  // entero, no solo el texto, para poder mirar su código (ver CODIGO_SIN_HABILIDADES).
  const [errorDeEnvio, setErrorDeEnvio] = useState(null);
  // true = la ventana «Denunciar al colectivo» está abierta. La abre el botón «Denunciar».
  const [denunciaAbierta, setDenunciaAbierta] = useState(false);
  // true si denunció en ESTA visita (las de antes vienen marcadas desde el backend).
  const [denuncioRecien, setDenuncioRecien] = useState(false);

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
  // La colaboración de la persona en ESTE proyecto (si participa). Sirve para denunciar:
  // el backend denuncia sobre una colaboración y deduce solo el colectivo.
  const miColaboracion = (sesion?.colaboraciones ?? []).find(
    (colaboracion) => String(colaboracion.proyectoId) === String(proyecto.id)
  );
  const puedeDenunciar = rol === 'col' && Boolean(miColaboracion);
  // El backend acepta una sola denuncia por colaboración: después el botón queda «Ya denunciado».
  const yaDenuncio = denuncioRecien || Boolean(miColaboracion?.denunciada);

  // Segunda línea de «Creado» en la ficha: en qué anda la búsqueda y, si hay, su fecha.
  // (El backend no guarda cuándo se finalizó: si fue por cierre automático, es esa fecha.)
  let estadoDeLaFicha;
  if (proyecto.finalizado) {
    estadoDeLaFicha = { texto: 'Proyecto finalizado', fecha: proyecto.fechaCierre };
  } else if (!busquedaAbierta) {
    estadoDeLaFicha = { texto: 'Búsqueda cerrada', fecha: null };
  } else {
    estadoDeLaFicha = { texto: 'Recibe postulaciones hasta', fecha: proyecto.fechaLimiteBusqueda };
  }

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
    // Si la búsqueda está cerrada, el botón queda deshabilitado y lo dice.
    if (!busquedaAbierta) {
      return <Button disabled>Búsqueda cerrada</Button>;
    }
    // Colaboradora con sesión: el botón abre la ventana con este perfil preseleccionado.
    if (rol === 'col') {
      return (
        <Button disabled={enviando} onClick={() => setPerfilParaPostular(perfil.id)}>
          Postularme
        </Button>
      );
    }
    // Visitante sin sesión: el botón la lleva a ingresar y después vuelve a este proyecto.
    return (
      <Button as={Link} to={`/ingresar?volver=/proyectos/${proyecto.id}`}>
        Postularme
      </Button>
    );
  }

  // Se ejecuta al confirmar la ventana de postulación. Recibe el id del perfil elegido y si
  // la persona quiere que su contribución sea pública. `async` permite esperar (`await`)
  // la respuesta del backend; si responde con error, salta al `catch`.
  async function alConfirmarPostulacion({ perfil: perfilId, publica }) {
    setPerfilParaPostular(null);
    setAviso('');
    setErrorDeEnvio(null);
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
      setErrorDeEnvio(errorDelBackend);
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
    setErrorDeEnvio(null);
    setEnviando(true);
    try {
      await denunciarColaboracion(miColaboracion.id, `${motivo}: ${texto}`);
      setDenuncioRecien(true);
      setAviso('Denuncia enviada. El equipo administrativo la va a evaluar.');
    } catch (errorDelBackend) {
      setErrorDeEnvio(errorDelBackend);
    } finally {
      setEnviando(false);
    }
  }

  // Se ejecuta al cancelar la ventana de denuncia: se cierra sin enviar nada.
  function alCancelarDenuncia() {
    setDenunciaAbierta(false);
  }

  // Dibuja la tarjeta de un perfil buscado (se llama una vez por cada perfil del proyecto).
  function tarjetaDePerfil(perfil) {
    const ocupantesDelPerfil = ocupantesDe(perfil);
    const perfilCompleto = !tieneLugar(perfil);
    // Lugares: «1 de 2 ocupados» si el perfil tiene cupo; si no, solo cuántos hay.
    const textoDeLugares =
      perfil.cantidadMaxima == null
        ? `${ocupantesDelPerfil.length} en el equipo · sin cupo máximo`
        : `${ocupantesDelPerfil.length} de ${perfil.cantidadMaxima} lugares ocupados`;

    // El botón (o la etiqueta «cerrado») que va al lado del nombre del perfil.
    const accion = perfilCompleto ? <StatusBadge status="cerrado" /> : accionDelPerfil(perfil);
    // Los perfiles que ya no reciben gente van plegados: se ve el nombre y se despliega el resto.
    const cerrado = perfilCompleto || !busquedaAbierta;

    const detalle = (
      <dl className={s.datos}>
        <dt>Habilidades</dt>
        <dd>
          <span className={s.tags}>
            {perfil.requeridas.map((habilidad) => (
              <Tag key={habilidad} tone="sand">{habilidad}</Tag>
            ))}
          </span>
          {perfil.opcionales.length > 0 && (
            <span className={s.nota}>Suman: {perfil.opcionales.join(', ')}</span>
          )}
        </dd>
        <dt>Tiempo</dt>
        <dd>{perfil.tiempo}</dd>
        <dt>Modalidad</dt>
        <dd>{perfil.modalidad}</dd>
        <dt>Lugares</dt>
        <dd>{textoDeLugares}</dd>
      </dl>
    );

    // Cerrado: un <details> nativo (se abre y cierra solo, con teclado incluido).
    if (cerrado) {
      return (
        <details key={perfil.id} className={s.perfil}>
          <summary className={s.perfilCabecera}>
            <Heading level={3} size="h3">{perfil.descripcion}</Heading>
            <span className={s.perfilAccion}>{accion}</span>
            <span className={s.flechita} aria-hidden="true">
              <Icon name="chevron-abajo" size={22} />
            </span>
          </summary>
          {detalle}
        </details>
      );
    }

    return (
      <article key={perfil.id} className={s.perfil}>
        {/* Arriba: el nombre del perfil (el backend usa la descripción) y su botón */}
        <div className={s.perfilCabecera}>
          <Heading level={3} size="h3">{perfil.descripcion}</Heading>
          <span className={s.perfilAccion}>{accion}</span>
        </div>
        {detalle}
      </article>
    );
  }

  // Todas las personas del equipo, de todos los perfiles (para la ficha del costado).
  const equipo = proyecto.perfiles.flatMap(ocupantesDe);

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Crumbs items={[{ label: 'Proyectos', to: '/proyectos' }, { label: proyecto.titulo }]} />

      {/* BLOQUE: Avisos — verde si salió bien, rojo con el motivo del backend si no */}
      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorDeEnvio && (
        <Alert kind="error" title="No se pudo enviar" onClose={() => setErrorDeEnvio(null)}>
          {mensajeDeError(errorDeEnvio)}
          {/* Si el problema son las habilidades, el arreglo está en su perfil */}
          {errorDeEnvio.response?.data?.code === CODIGO_SIN_HABILIDADES && (
            <>
              {' '}
              <Link to="/panel/perfil">Revisar mis habilidades</Link>
            </>
          )}
        </Alert>
      )}

      {/* BLOQUE: Cuerpo — dos columnas: a la izquierda qué es y dónde sumarse; a la
          derecha la ficha (fechas, enlaces, equipo y logros) */}
      <div className={s.cuerpo}>
        <div className={s.principal}>
          {/* Cabecera: título con su estado, descripción, colectivo y avance */}
          <header className={s.cabecera}>
            <div className={s.row}>
              <Heading level={1} size="h2">{proyecto.titulo}</Heading>
              <StatusBadge status={proyecto.estado} />
            </div>
            <Text variant="prose">{proyecto.descripcion}</Text>
            <div className={s.row}>
              <Link to={`/colectivos/${proyecto.colectivoId}`} className={s.colectivo}>
                <Avatar nombre={proyecto.colectivo} size={32} square foto={fotoDe(proyecto.colectivoId)} />
                {proyecto.colectivo}
              </Link>
              {/* «Denunciar al colectivo» aparece solo si es una colaboradora que participa */}
              {puedeDenunciar && (
                <Button
                  variant="link"
                  disabled={enviando || yaDenuncio}
                  onClick={() => setDenunciaAbierta(true)}
                >
                  {yaDenuncio ? 'Ya denunciado' : 'Denunciar al colectivo'}
                </Button>
              )}
            </div>
            {/* Avance: suma de los logros cumplidos */}
            <div className={s.avance}>
              <span>Avance</span>
              <Progress value={proyecto.avance} />
              <b>{proyecto.avance} %</b>
            </div>
          </header>

          <section className={s.perfiles} aria-labelledby="h-perfiles">
            <Heading level={2} size="h3" id="h-perfiles">Perfiles buscados</Heading>
            {proyecto.perfiles.map(tarjetaDePerfil)}
          </section>
        </div>

        <aside className={s.ficha} aria-label="Ficha del proyecto">
          {/* Creado: fecha grande y, abajo, en qué anda la búsqueda */}
          <section aria-labelledby="h-creado">
            <div className={s.fichaFila}>
              <Heading level={2} size="h4" id="h-creado">Creado</Heading>
              <b className={s.fechaGrande}>{fechaCorta(fechaDeCreacion(proyecto.id))}</b>
            </div>
            <div className={s.fichaFila}>
              <span>{estadoDeLaFicha.texto}</span>
              {estadoDeLaFicha.fecha && <span>{fechaCorta(estadoDeLaFicha.fecha)}</span>}
            </div>
            {/* Cierre automático: solo si el colectivo lo cargó y todavía no terminó */}
            {proyecto.fechaCierre && !proyecto.finalizado && (
              <div className={s.fichaFila}>
                <span>Cierra solo el</span>
                <span>{fechaCorta(proyecto.fechaCierre)}</span>
              </div>
            )}
          </section>

          {/* Enlaces externos que cargó el colectivo (cada uno solo si existe) */}
          {(proyecto.urlSistema || proyecto.urlDonaciones) && (
            <section aria-labelledby="h-enlaces">
              <Heading level={2} size="h4" id="h-enlaces">Enlaces</Heading>
              {proyecto.urlSistema && (
                <a href={proyecto.urlSistema} target="_blank" rel="noopener noreferrer">
                  Ver el sistema funcionando
                </a>
              )}
              {proyecto.urlDonaciones && (
                <a href={proyecto.urlDonaciones} target="_blank" rel="noopener noreferrer">
                  Colaborar con una donación
                </a>
              )}
            </section>
          )}

          <section aria-labelledby="h-equipo">
            <Heading level={2} size="h4" id="h-equipo">Equipo</Heading>
            {ocupantes === null && <Text variant="small">No pudimos consultar el equipo.</Text>}
            {ocupantes !== null && equipo.length === 0 && (
              <Text variant="small">Todavía nadie se sumó.</Text>
            )}
            {equipo.length > 0 && (
              <ul className={s.integrantes}>
                {equipo.map((integrante) => (
                  <li key={integrante.colaboracionId}>{integrante.nombre}</li>
                ))}
              </ul>
            )}
          </section>

          {/* Logros: en el backend un logro es un hito YA cumplido con su porcentaje; el
              avance de la cabecera es la suma (ver avanceDelProyecto en api/proyectos.js) */}
          <section aria-labelledby="h-logros">
            <Heading level={2} size="h4" id="h-logros">Logros</Heading>
            {proyecto.logros.length === 0 ? (
              <Text variant="small">Todavía no se cargó ningún logro.</Text>
            ) : (
              <ul className={s.hitos}>
                {proyecto.logros.map((logro) => (
                  <li key={logro._id}>
                    <span className={s.check}>
                      <Icon name="check" size={10} />
                    </span>
                    <span>
                      {logro.urlCodigoFuente ? (
                        <a href={logro.urlCodigoFuente} target="_blank" rel="noopener noreferrer">
                          {logro.descripcion}
                        </a>
                      ) : (
                        logro.descripcion
                      )}
                    </span>
                    <b>{logro.porcentaje} %</b>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

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
