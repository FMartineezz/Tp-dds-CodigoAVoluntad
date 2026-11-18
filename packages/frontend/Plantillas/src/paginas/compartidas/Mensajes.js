/**
 * PANTALLA Mensajes
 * Ruta: /panel/mensajes · /org/mensajes   ·   Quién la ve: Colaboradora y organización
 * Qué muestra: Lista de conversaciones con filtros y la conversación abierta. En móvil son
 *   dos pantallas (lista / chat).
 * De dónde salen los datos (ver api/mensajes.js):
 *   · org: GET /colectivos/:id/mensajes · col: GET /colaboradoras/:id/mensajes. Los mensajes
 *     se agrupan en conversaciones (colectivo + persona + proyecto).
 *   · Enviar: POST /mensajes. Marcar como leída: PATCH /mensajes.
 *   · Escribirle a alguien nuevo (solo org): se llega con /org/mensajes?persona=ID&proyecto=ID
 *     (desde Equipo, Buscar colaboradoras o el perfil); si todavía no hay conversación se
 *     arma un chat vacío con la persona y el proyecto pedidos al backend.
 *   La persona colaboradora solo puede RESPONDER conversaciones que empezó un colectivo.
 * Para modificarla: el prop "rol" ('col' u 'org') decide los textos y de dónde se pide.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: las conversaciones del backend y todo lo que la pantalla recuerda
 *      (chat elegido, leídos, filtros, texto que se escribe, errores).
 *   2. CÁLCULOS: los proyectos para el filtro, la lista filtrada y el chat abierto.
 *   3. ACCIONES: abrir un chat (lo marca como leído) y enviar un mensaje.
 *   4. LO QUE SE DIBUJA: título, filtros, lista de chats y conversación.
 *
 * Cómo se ven una o dos pantallas: el HTML siempre dibuja las dos partes (lista y chat).
 * En pantallas de hasta 800 px (celular) el CSS oculta una de las dos con la clase
 * s.ocultoMovil (la regla vive en Mensajes.module.css). El estado `movilAbierto` decide
 * cuál: false = se ve la lista (se oculta el chat); true = se ve el chat (se oculta la
 * lista). En escritorio esa clase no tiene efecto: se ven lista y chat lado a lado.
 */

// ───── Imports ─────
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Field, Heading, Icon, Tag, Text } from '../../atomos';
import { Alert, RowsSkeleton } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { mensajeDeError } from '../../api/errores.js';
import {
  RELACIONES,
  claveDeConversacion,
  enviarMensaje,
  marcarComoLeida,
  obtenerConversaciones,
} from '../../api/mensajes.js';
import { obtenerColaboradora } from '../../api/organizacion.js';
import { obtenerProyecto } from '../../api/proyectos.js';
import s from './Mensajes.module.css';
import sh from '../../plantillas/disposicion.module.css';

// Pide las conversaciones. Si la org llegó con ?persona=&proyecto= y todavía no hay
// conversación con esa persona en ese proyecto, arma un chat vacío («borrador»).
async function cargarMensajes(rol, idCuenta, personaId, proyectoId) {
  const chats = await obtenerConversaciones(rol, idCuenta);
  if (rol !== 'org' || !personaId || !proyectoId) return chats;

  const clave = claveDeConversacion(idCuenta, personaId, proyectoId);
  if (chats.some((chat) => chat.id === clave)) return chats;

  const [persona, proyecto] = await Promise.all([
    obtenerColaboradora(personaId),
    obtenerProyecto(proyectoId),
  ]);
  const borrador = {
    id: clave,
    colectivoId: idCuenta,
    personaId,
    proyectoId,
    con: persona.nombre,
    proyecto: proyecto.titulo,
    rel: RELACIONES.org[2],
    hora: 'Nueva',
    nuevos: 0,
    msgs: [],
    bloqueada: !persona.mensajes,
  };
  // El borrador va primero en la lista.
  return [borrador, ...chats];
}

/* Escritorio: lista + chat. Móvil: dos pantallas (lista de chats / chat abierto con
   flecha para volver). */
export default function Mensajes({ rol }) {
  // ───── 1. DATOS Y ESTADO ─────

  // Id de la cuenta con sesión (colectivo o colaboradora, según el rol).
  const { id } = useAuth();

  // Parámetros de la dirección (lo que va después del «?»): ?persona=…&proyecto=…
  const [parametros] = useSearchParams();
  const personaPedida = parametros.get('persona');
  const proyectoPedido = parametros.get('proyecto');

  // Sumarle 1 vuelve a pedir las conversaciones (después de enviar un mensaje).
  const [version, setVersion] = useState(0);

  // Las conversaciones del backend (ver api/mensajes.js para su forma).
  const { cargando, datos, error } = usePedido(
    () => cargarMensajes(rol, id, personaPedida, proyectoPedido),
    [rol, id, personaPedida, proyectoPedido, version]
  );
  const chats = datos ?? [];

  // Id del chat elegido. null = todavía no se eligió (se abre el pedido por la dirección
  // o el primero de la lista). Lo cambia abrirChat.
  const [idElegido, setIdElegido] = useState(null);

  // Ids de los chats que ya se marcaron como leídos en esta visita (para mostrar 0 nuevos
  // sin volver a pedir todo). Es un Set: una lista sin repetidos.
  const [leidos, setLeidos] = useState(() => new Set());

  // Solo celular: true = se ve la conversación; false = se ve la lista.
  const [movilAbierto, setMovilAbierto] = useState(Boolean(personaPedida));

  // Texto del buscador de conversaciones por nombre.
  const [busqueda, setBusqueda] = useState('');

  // Proyecto elegido en el filtro: 'todos' o el nombre de un proyecto.
  const [proyectoFiltrado, setProyectoFiltrado] = useState('todos');

  // Relación elegida en el filtro: 'Todos' o una de RELACIONES[rol].
  const [relacionFiltrada, setRelacionFiltrada] = useState('Todos');

  // Texto que se está escribiendo en el mensaje nuevo.
  const [textoMensaje, setTextoMensaje] = useState('');

  // Mensaje de error del envío o de marcar como leído ('' = sin error).
  const [errorMensaje, setErrorMensaje] = useState('');

  // true mientras se espera la respuesta del backend al enviar.
  const [enviando, setEnviando] = useState(false);

  // ───── 2. CÁLCULOS ─────

  const relaciones = RELACIONES[rol];

  // Nombres de proyecto sin repetir, para las opciones del selector «Proyecto».
  // `new Set(...)` descarta repetidos y `[...]` lo vuelve a convertir en array.
  const nombresDeProyectos = [...new Set(chats.map((chat) => chat.proyecto))];

  // «Nuevos» de un chat: 0 si ya se marcó como leído en esta visita.
  const nuevosDe = (chat) => (leidos.has(chat.id) ? 0 : chat.nuevos);

  // Chats que pasan los tres filtros a la vez (relación, proyecto y búsqueda por nombre).
  // useMemo guarda el resultado y solo lo recalcula si cambia algo de la lista del final
  // (ver docs/GLOSARIO.md → useMemo).
  const chatsVisibles = useMemo(() => {
    const textoBuscado = busqueda.trim().toLowerCase();
    return chats.filter((chat) => {
      // 'Todos' en un filtro significa «no filtrar por esto»
      const cumpleRelacion = relacionFiltrada === 'Todos' || chat.rel === relacionFiltrada;
      const cumpleProyecto = proyectoFiltrado === 'todos' || chat.proyecto === proyectoFiltrado;
      const cumpleBusqueda = !textoBuscado || chat.con.toLowerCase().includes(textoBuscado);
      return cumpleRelacion && cumpleProyecto && cumpleBusqueda;
    });
  }, [chats, relacionFiltrada, proyectoFiltrado, busqueda]);

  // Chat abierto: el elegido; si no se eligió ninguno, el pedido por la dirección; si
  // tampoco, el primero de la lista. (.find puede devolver undefined.)
  const idPedido = personaPedida && proyectoPedido
    ? claveDeConversacion(id, personaPedida, proyectoPedido)
    : null;
  const chatActual =
    chats.find((chat) => chat.id === idElegido) ??
    chats.find((chat) => chat.id === idPedido) ??
    chats[0];

  // Color de la etiqueta de relación: azul para la segunda opción, arena para el resto.
  function tonoDeLaRelacion(relacion) {
    return relacion === relaciones[1] ? 'blue' : 'sand';
  }

  const claseOcultarSiChatAbierto = movilAbierto ? s.ocultoMovil : '';
  const claseOcultarSiListaAbierta = movilAbierto ? '' : s.ocultoMovil;

  // ───── 3. ACCIONES ─────

  // Se ejecuta al tocar un chat de la lista: lo selecciona, en celular pasa a la
  // conversación y, si tenía mensajes sin leer, le avisa al backend que se leyeron.
  async function abrirChat(chat) {
    setIdElegido(chat.id);
    setMovilAbierto(true);
    setErrorMensaje('');
    if (nuevosDe(chat) === 0) return;
    try {
      await marcarComoLeida(chat, rol);
      // Copia del Set con el id agregado (React exige copiar, no modificar).
      setLeidos((anteriores) => new Set(anteriores).add(chat.id));
    } catch (e) {
      setErrorMensaje(mensajeDeError(e));
    }
  }

  // Se ejecuta al apretar «Enviar». Si el mensaje está vacío muestra un error y corta;
  // si no, lo manda al backend y vuelve a pedir las conversaciones.
  async function alEnviarMensaje(evento) {
    evento.preventDefault(); // evita que el navegador recargue la página

    if (!textoMensaje.trim()) {
      setErrorMensaje('Escribí un mensaje antes de enviar.');
      return;
    }
    setErrorMensaje('');
    setEnviando(true);
    try {
      await enviarMensaje(chatActual, rol, textoMensaje.trim());
      setIdElegido(chatActual.id); // que siga abierto después de recargar
      setTextoMensaje('');
      setVersion((v) => v + 1);
    } catch (e) {
      // Por ejemplo: la persona bloqueó los mensajes (ERR-EST-801).
      setErrorMensaje(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Contenido del recuadro de la conversación: espera, chat abierto o texto de ayuda.
  let contenidoDelChat;
  if (cargando) {
    contenidoDelChat = <RowsSkeleton n={3} />;
  } else if (!chatActual) {
    contenidoDelChat = <Text>Elegí una conversación.</Text>;
  } else {
    contenidoDelChat = (
      <>
        {/* Cabecera: flecha de volver (solo se ve en celular), nombre y etiquetas */}
        <header className={s.chead}>
          <button
            type="button"
            className={s.volver}
            onClick={() => setMovilAbierto(false)}
            aria-label="Volver a la lista de chats"
          >
            <Icon name="chevron-izq" size={16} />
          </button>
          <div className={s.cinfo}>
            <b>{chatActual.con}</b>
            <span className={s.tags}>
              <Tag>{chatActual.proyecto}</Tag>
              <Tag tone={tonoDeLaRelacion(chatActual.rel)}>{chatActual.rel}</Tag>
            </span>
          </div>
        </header>

        {/* Mensajes: cada uno es un par [quién, texto]; los propios ('yo') llevan s.yo */}
        <div className={s.msgs}>
          {chatActual.msgs.length === 0 && (
            <Text variant="small">Todavía no hay mensajes. Escribí el primero.</Text>
          )}
          {chatActual.msgs.map(([quien, contenido], posicion) => (
            <p key={posicion} className={`${s.msg} ${quien === 'yo' ? s.yo : ''}`}>
              {contenido}
            </p>
          ))}
        </div>

        {/* Si la persona bloqueó los mensajes, la org ya no puede escribirle. */}
        {chatActual.bloqueada ? (
          <Alert kind="warning">
            Esta persona no recibe mensajes de organizaciones. (ERR-EST-801)
          </Alert>
        ) : (
          <form className={s.compose} onSubmit={alEnviarMensaje} noValidate>
            {errorMensaje && <Alert kind="error">{errorMensaje}</Alert>}
            <Field
              as="textarea"
              label="Tu mensaje"
              placeholder="Escribí tu respuesta…"
              value={textoMensaje}
              onChange={(evento) => setTextoMensaje(evento.target.value)}
            />
            <Button type="submit" loading={enviando}>Enviar</Button>
          </form>
        )}
      </>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: título — en celular se oculta mientras hay un chat abierto */}
      <div className={`${s.top} ${claseOcultarSiChatAbierto}`}>
        <Heading level={1}>Mensajes</Heading>
      </div>

      {/* Si falló el pedido de conversaciones, un aviso arriba de todo. */}
      {error && (
        <Alert kind="error" title="No pudimos cargar los mensajes">{mensajeDeError(error)}</Alert>
      )}

      {/* BLOQUE: filtros — buscador por nombre, selector de proyecto y botones de relación */}
      <div className={`${s.filtros} ${claseOcultarSiChatAbierto}`}>
        <Field
          label="Buscar conversación"
          type="search"
          placeholder="Nombre"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
        <Field
          as="select"
          label="Proyecto"
          value={proyectoFiltrado}
          onChange={(evento) => setProyectoFiltrado(evento.target.value)}
        >
          <option value="todos">Todos</option>
          {nombresDeProyectos.map((nombre) => <option key={nombre}>{nombre}</option>)}
        </Field>
        <div className={s.rels} role="group" aria-label="Relación">
          {/* Un botón por relación; aria-pressed marca cuál está activo (el filtro actual) */}
          {relaciones.map((relacion, posicion) => (
            <button
              key={relacion}
              type="button"
              data-rel={posicion}
              aria-pressed={relacionFiltrada === relacion}
              onClick={() => setRelacionFiltrada(relacion)}
            >
              {relacion}
            </button>
          ))}
        </div>
      </div>

      <div className={s.cols}>
        {/* BLOQUE: lista de chats — en celular se oculta cuando hay un chat abierto */}
        <ul className={`${s.lista} ${claseOcultarSiChatAbierto}`}>
          {/* Mientras carga: filas grises de relleno */}
          {cargando && <li><RowsSkeleton n={3} /></li>}
          {/* Terminó de cargar pero ningún chat pasa los filtros (o no hay ninguno) */}
          {!cargando && !error && chatsVisibles.length === 0 && (
            <li>
              <Text>
                {chats.length === 0 ? 'Todavía no tenés conversaciones.' : 'Ninguna conversación coincide.'}
              </Text>
            </li>
          )}
          {/* Terminó de cargar: un botón por cada chat visible */}
          {!cargando && chatsVisibles.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                className={`${s.conv} ${chat.id === chatActual?.id ? s.sel : ''}`}
                aria-current={chat.id === chatActual?.id}
                onClick={() => abrirChat(chat)}
              >
                <span className={s.l1}>
                  <b>{chat.con}</b>
                  <small>{chat.hora}</small>
                </span>
                {/* Vista previa: el texto del último mensaje (si hay) */}
                <span className={s.snip}>
                  {chat.msgs.length ? chat.msgs[chat.msgs.length - 1][1] : 'Conversación nueva'}
                </span>
                <span className={s.tags}>
                  <Tag>{chat.proyecto}</Tag>
                  <Tag tone={tonoDeLaRelacion(chat.rel)}>{chat.rel}</Tag>
                  {/* Aparece solo si hay mensajes sin leer */}
                  {nuevosDe(chat) > 0 && <span className={s.nuevos}>{nuevosDe(chat)} nuevos</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* BLOQUE: conversación — en celular se oculta mientras se ve la lista */}
        <section
          className={`${s.chat} ${claseOcultarSiListaAbierta}`}
          aria-label={chatActual ? `Conversación con ${chatActual.con}` : 'Conversación'}
        >
          {contenidoDelChat}
        </section>
      </div>
    </div>
  );
}
