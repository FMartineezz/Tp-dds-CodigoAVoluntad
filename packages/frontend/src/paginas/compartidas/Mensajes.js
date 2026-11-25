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
import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, Field, Heading, Icon, Text } from "../../atomos";
import { Alert, ConfirmDialog, RowsSkeleton } from "../../moleculas";
import { useAuth } from "../../contexto";
import { usePedido } from "../../hooks";
import { mensajeDeError } from "../../api/errores.js";
import {
  RELACIONES,
  claveDeConversacion,
  enviarMensaje,
  marcarComoLeida,
  obtenerConversaciones,
} from "../../api/mensajes.js";
import { obtenerColaboradora } from "../../api/organizacion.js";
import { obtenerProyecto } from "../../api/proyectos.js";
import { fotoDe } from "../../datos/fotos.js";
import s from "./Mensajes.module.css";
import sh from "../../plantillas/disposicion.module.css";

// Pide las conversaciones. Si la org llegó con ?persona=&proyecto= y todavía no hay
// conversación con esa persona en ese proyecto, arma un chat vacío («borrador»).
async function cargarMensajes(rol, idCuenta, personaId, proyectoId) {
  const chats = await obtenerConversaciones(rol, idCuenta);
  if (rol !== "org" || !personaId || !proyectoId) return chats;

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
    hora: "Nueva",
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
  const personaPedida = parametros.get("persona");
  const proyectoPedido = parametros.get("proyecto");

  // Las conversaciones del backend (ver api/mensajes.js para su forma).
  const { cargando, datos, error } = usePedido(
    () => cargarMensajes(rol, id, personaPedida, proyectoPedido),
    [rol, id, personaPedida, proyectoPedido],
  );

  // Copia local para agregar mensajes enviados sin volver a mostrar skeletons.
  const [chatsEditados, setChatsEditados] = useState(null);

  useEffect(() => {
    setChatsEditados(null);
  }, [rol, id, personaPedida, proyectoPedido]);

  const chats = chatsEditados ?? datos ?? [];

  // Id del chat elegido. null = todavía no se eligió (se abre el pedido por la dirección
  // o el primero de la lista). Lo cambia abrirChat.
  const [idElegido, setIdElegido] = useState(null);

  // Ids de los chats que ya se marcaron como leídos en esta visita (para mostrar 0 nuevos
  // sin volver a pedir todo). Es un Set: una lista sin repetidos.
  const [leidos, setLeidos] = useState(() => new Set());

  // Solo celular: true = se ve la conversación; false = se ve la lista.
  const [movilAbierto, setMovilAbierto] = useState(Boolean(personaPedida));

  // Texto del buscador de conversaciones por nombre.
  const [busqueda, setBusqueda] = useState("");

  // Proyecto elegido en el filtro: 'todos' o el nombre de un proyecto.
  const [proyectoFiltrado, setProyectoFiltrado] = useState("todos");

  // Relación elegida en el filtro: 'Todos' o una de RELACIONES[rol].
  const [relacionFiltrada, setRelacionFiltrada] = useState("Todos");

  // Texto que se está escribiendo en el mensaje nuevo.
  const [textoMensaje, setTextoMensaje] = useState("");

  // Mensaje de error del envío o de marcar como leído ('' = sin error).
  const [errorMensaje, setErrorMensaje] = useState("");

  // true mientras se espera la respuesta del backend al enviar.
  const [enviando, setEnviando] = useState(false);

  // true mientras está abierta la ficha de la otra parte (se abre tocando su nombre).
  const [fichaAbierta, setFichaAbierta] = useState(false);
  const navegar = useNavigate();

  // La caja de mensajes, para bajarla hasta el último (como cualquier chat).
  const cajaDeMensajes = useRef(null);

  // ───── 2. CÁLCULOS ─────

  const relaciones = RELACIONES[rol];

  // Nombres de proyecto sin repetir, para las opciones del selector «Proyecto».
  // `new Set(...)` descarta repetidos y `[...]` lo vuelve a convertir en array.
  const nombresDeProyectos = [...new Set(chats.map((chat) => chat.proyecto))];

  // «Nuevos» de un chat: 0 si ya se marcó como leído en esta visita.
  const nuevosDe = (chat) => (leidos.has(chat.id) ? 0 : chat.nuevos);

  // Chats que pasan los tres filtros a la vez (relación, proyecto y búsqueda por nombre).
  // useMemo guarda el resultado y solo lo recalcula si cambia algo de la lista del final
  // (ver packages/frontend/docs/GLOSARIO.md → useMemo).
  const chatsVisibles = useMemo(() => {
    const textoBuscado = busqueda.trim().toLowerCase();
    return chats.filter((chat) => {
      // 'Todos' en un filtro significa «no filtrar por esto»
      const cumpleRelacion = relacionFiltrada === "Todos" || chat.rel === relacionFiltrada;
      const cumpleProyecto = proyectoFiltrado === "todos" || chat.proyecto === proyectoFiltrado;
      const cumpleBusqueda = !textoBuscado || chat.con.toLowerCase().includes(textoBuscado);
      return cumpleRelacion && cumpleProyecto && cumpleBusqueda;
    });
  }, [chats, relacionFiltrada, proyectoFiltrado, busqueda]);

  // Chat abierto: el elegido; si no se eligió ninguno, el pedido por la dirección; si
  // tampoco, el primero de la lista. (.find puede devolver undefined.)
  const idPedido =
    personaPedida && proyectoPedido ? claveDeConversacion(id, personaPedida, proyectoPedido) : null;
  const chatActual =
    chats.find((chat) => chat.id === idElegido) ??
    chats.find((chat) => chat.id === idPedido) ??
    chats[0];

  const marcandoRef = useRef(new Set());

  useEffect(() => {
    const esEscritorio = window.matchMedia("(min-width: 801px)").matches;
    if (!chatActual || (!esEscritorio && !movilAbierto)) return;
    if (
      chatActual.nuevos === 0 ||
      leidos.has(chatActual.id) ||
      marcandoRef.current.has(chatActual.id)
    ) {
      return;
    }
    marcandoRef.current.add(chatActual.id);
    marcarComoLeida(chatActual, rol)
      .then(() => {
        setLeidos((anteriores) => new Set(anteriores).add(chatActual.id));
        window.dispatchEvent(new Event("cav-mensajes-actualizados"));
      })
      .catch((e) => {
        marcandoRef.current.delete(chatActual.id);
        setErrorMensaje(mensajeDeError(e));
      });
  }, [chatActual, leidos, movilAbierto, rol]);

  // Baja hasta el último mensaje al abrir un chat o cuando llega/sale uno nuevo.
  const cantidadDeMensajes = chatActual?.msgs.length;
  useEffect(() => {
    const caja = cajaDeMensajes.current;
    if (caja) caja.scrollTop = caja.scrollHeight;
  }, [chatActual?.id, cantidadDeMensajes]);

  // La otra parte de la conversación: la org habla con personas y la persona con colectivos.
  const idDeLaOtraParte = (chat) => (rol === "org" ? chat.personaId : chat.colectivoId);
  const perfilDeLaOtraParte = (chat) =>
    rol === "org" ? `/org/colaboradoras/${chat.personaId}` : `/colectivos/${chat.colectivoId}`;

  // ¿La conversación la empezó la cuenta que está mirando? (yo me postulé / yo contacté).
  // Si sí, la flechita sale hacia afuera (↗); si me buscaron a mí, entra (↘).
  const empezoYo = (chat) =>
    rol === "col" ? chat.rel === relaciones[1] : chat.rel === relaciones[2];

  // Color de la etiqueta de relación: azul para la segunda opción, arena para el resto.
  function tonoDeLaRelacion(relacion) {
    return relacion === relaciones[1] ? "blue" : "sand";
  }

  const claseOcultarSiChatAbierto = movilAbierto ? s.ocultoMovil : "";
  const claseOcultarSiListaAbierta = movilAbierto ? "" : s.ocultoMovil;

  // ───── 3. ACCIONES ─────

  // Se ejecuta al tocar un chat de la lista: lo selecciona, en celular pasa a la
  // conversación y, si tenía mensajes sin leer, le avisa al backend que se leyeron.
  function abrirChat(chat) {
    setIdElegido(chat.id);
    setMovilAbierto(true);
    setErrorMensaje("");
  }

  // Se ejecuta al apretar «Enviar». Si el mensaje está vacío muestra un error y corta;
  // si no, lo manda al backend y vuelve a pedir las conversaciones.
  async function alEnviarMensaje(evento) {
    evento.preventDefault();

    const texto = textoMensaje.trim();
    if (!texto) {
      setErrorMensaje("Escribí un mensaje antes de enviar.");
      return;
    }
    setErrorMensaje("");
    setEnviando(true);
    try {
      await enviarMensaje(chatActual, rol, texto);
      setIdElegido(chatActual.id);
      setTextoMensaje("");
      setChatsEditados((previos) => {
        const base = previos ?? datos ?? [];
        const actual = base.find((c) => c.id === chatActual.id) ?? chatActual;
        const actualizado = {
          ...actual,
          msgs: [...actual.msgs, ["yo", texto]],
          hora: "Ahora",
          fecha: new Date().toISOString(),
        };
        return [actualizado, ...base.filter((c) => c.id !== actual.id)];
      });
    } catch (e) {
      // Por ejemplo: la persona bloqueó los mensajes (ERR-EST-801).
      setErrorMensaje(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  // Enter manda el mensaje y Shift+Enter baja de renglón (como en WhatsApp Web).
  function alApretarTeclaEnElMensaje(evento) {
    if (evento.key === "Enter" && !evento.shiftKey) {
      evento.preventDefault();
      evento.currentTarget.form.requestSubmit();
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
        <header className={s.chatCabecera}>
          <button
            type="button"
            className={s.volver}
            onClick={() => setMovilAbierto(false)}
            aria-label="Volver a la lista de chats"
          >
            <Icon name="chevron-izq" size={16} />
          </button>
          {/* Tocando la foto o el nombre se abre su ficha */}
          <button
            type="button"
            className={s.chatInfo}
            onClick={() => setFichaAbierta(true)}
            aria-label={`Ver la ficha de ${chatActual.con}`}
          >
            <Avatar nombre={chatActual.con} size={44} foto={fotoDe(idDeLaOtraParte(chatActual))} />
            {/* Como el «en línea» de WhatsApp: abajo del nombre, chiquito, la relación y el proyecto */}
            <span className={s.chatNombre}>
              <b>{chatActual.con}</b>
              <small className={s.chatDetalle}>
                <span className={s.relacionChica} data-tono={tonoDeLaRelacion(chatActual.rel)}>
                  {chatActual.rel}
                </span>
                {chatActual.proyecto}
              </small>
            </span>
          </button>
        </header>

        <ConfirmDialog
          open={fichaAbierta}
          title={chatActual.con}
          confirmLabel="Ver perfil completo"
          cancelLabel="Cerrar"
          onConfirm={() => navegar(perfilDeLaOtraParte(chatActual))}
          onCancel={() => setFichaAbierta(false)}
        >
          <div className={s.ficha}>
            <Avatar nombre={chatActual.con} size={120} square foto={fotoDe(idDeLaOtraParte(chatActual))} />
            <dl>
              <dt>Proyecto</dt>
              <dd>{chatActual.proyecto}</dd>
              <dt>Relación</dt>
              <dd>{chatActual.rel}</dd>
            </dl>
          </div>
        </ConfirmDialog>

        {/* Mensajes: cada uno es un par [quién, texto]; los propios ('yo') llevan s.propio */}
        <div className={s.mensajes} ref={cajaDeMensajes}>
          {chatActual.msgs.length === 0 && (
            <Text variant="small">Todavía no hay mensajes. Escribí el primero.</Text>
          )}
          {chatActual.msgs.map(([quien, contenido], posicion) => (
            <p key={posicion} className={`${s.mensaje} ${quien === "yo" ? s.propio : ""}`}>
              {contenido}
            </p>
          ))}
        </div>

        {/* Si la persona bloqueó los mensajes, la org ya no puede escribirle. */}
        {chatActual.bloqueada ? (
          <Alert kind="warning">
            Esta persona no recibe mensajes de organizaciones.
          </Alert>
        ) : (
          <form className={s.redactar} onSubmit={alEnviarMensaje} noValidate>
            {errorMensaje && <Alert kind="error">{errorMensaje}</Alert>}
            <div className={s.barraDeEscritura}>
              <Field
                as="textarea"
                rows={1}
                className={s.campoDeMensaje}
                label="Tu mensaje"
                placeholder="Escribí un mensaje"
                value={textoMensaje}
                onChange={(evento) => setTextoMensaje(evento.target.value)}
                onKeyDown={alApretarTeclaEnElMensaje}
              />
              <button
                type="submit"
                className={s.enviar}
                aria-label="Enviar mensaje"
                aria-busy={enviando || undefined}
                disabled={enviando}
              >
                <Icon name="flecha-der" size={20} />
              </button>
            </div>
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
        <Alert kind="error" title="No pudimos cargar los mensajes">
          {mensajeDeError(error)}
        </Alert>
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
          {nombresDeProyectos.map((nombre) => (
            <option key={nombre}>{nombre}</option>
          ))}
        </Field>
        <div className={s.relaciones} role="group" aria-label="Relación">
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

      <div className={s.columnas}>
        {/* BLOQUE: lista de chats — en celular se oculta cuando hay un chat abierto */}
        <ul className={`${s.lista} ${claseOcultarSiChatAbierto}`}>
          {/* Mientras carga: filas grises de relleno */}
          {cargando && (
            <li>
              <RowsSkeleton n={3} />
            </li>
          )}
          {/* Terminó de cargar pero ningún chat pasa los filtros (o no hay ninguno) */}
          {!cargando && !error && chatsVisibles.length === 0 && (
            <li>
              <Text>
                {chats.length === 0
                  ? "Todavía no tenés conversaciones."
                  : "Ninguna conversación coincide."}
              </Text>
            </li>
          )}
          {/* Terminó de cargar: un botón por cada chat visible */}
          {!cargando &&
            chatsVisibles.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  className={`${s.conversacion} ${chat.id === chatActual?.id ? s.seleccionada : ""}`}
                  aria-current={chat.id === chatActual?.id}
                  onClick={() => abrirChat(chat)}
                >
                  {/* Dos renglones como WhatsApp: foto (con la flechita de la relación),
                      nombre y hora arriba; último mensaje y burbuja de no leídos abajo */}
                  <span className={s.fotoConMarca}>
                    <Avatar nombre={chat.con} size={44} foto={fotoDe(idDeLaOtraParte(chat))} />
                    <span
                      className={s.marcaRelacion}
                      data-tono={tonoDeLaRelacion(chat.rel)}
                      title={chat.rel}
                      aria-hidden="true"
                    >
                      {empezoYo(chat) ? "↗" : "↘"}
                    </span>
                  </span>
                  <span className={s.lineaSuperior}>
                    <b>{chat.con}</b>
                    <small className={nuevosDe(chat) > 0 ? s.horaNueva : undefined}>{chat.hora}</small>
                  </span>
                  <span className={s.lineaInferior}>
                    <span className={s.vistaPrevia}>
                      {chat.msgs.length ? chat.msgs[chat.msgs.length - 1][1] : "Conversación nueva"}
                    </span>
                    {nuevosDe(chat) > 0 && (
                      <span className={s.burbuja} aria-label={`${nuevosDe(chat)} sin leer`}>
                        {nuevosDe(chat)}
                      </span>
                    )}
                  </span>
                  {/* Para el lector de pantalla, la flechita dicha en palabras */}
                  <span className="sr-only">{chat.rel} · {chat.proyecto}</span>
                </button>
              </li>
            ))}
        </ul>

        {/* BLOQUE: conversación — en celular se oculta mientras se ve la lista */}
        <section
          className={`${s.chat} ${claseOcultarSiListaAbierta}`}
          aria-label={chatActual ? `Conversación con ${chatActual.con}` : "Conversación"}
        >
          {contenidoDelChat}
        </section>
      </div>
    </div>
  );
}
