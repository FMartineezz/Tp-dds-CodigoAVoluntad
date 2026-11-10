/**
 * PANTALLA Mensajes
 * Ruta: /panel/mensajes · /org/mensajes   ·   Quién la ve: Colaboradora y organización
 * Qué muestra: Lista de chats con filtros y conversación. En móvil son dos pantallas
 *   (lista / chat).
 * Para modificarla: el prop "rol" decide los textos y los datos (MENSAJES_COL / MENSAJES_ORG).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: de dónde salen los chats según el rol y todo lo que la pantalla
 *      recuerda (chats, chat elegido, filtros, texto que se escribe, errores).
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
import { Button, Field, Heading, Icon, Tag, Text } from '../../atomos';
import { Alert, RowsSkeleton } from '../../moleculas';
import { MENSAJES_COL, MENSAJES_ORG } from '../../datos'; // chats de ejemplo para cada rol
import { useLoading } from '../../hooks';
import s from './Mensajes.module.css';
import sh from '../../plantillas/disposicion.module.css';

/* Escritorio: lista + chat. Móvil: dos pantallas (lista de chats / chat abierto con
   flecha para volver). */
export default function Mensajes({ rol }) {
  // ───── 1. DATOS Y ESTADO ─────

  // Datos del rol que ve la pantalla: { chats: [...], rels: [...] }. Si `rol` es 'org'
  // se usan los de organización; si no, los de colaboradora.
  const datosDelRol = rol === 'org' ? MENSAJES_ORG : MENSAJES_COL;

  // Lista de conversaciones. Empieza con los chats del rol y cambia al abrir un chat
  // (los «nuevos» pasan a 0) y al enviar un mensaje (se agrega al final).
  // (ver docs/GLOSARIO.md → useState)
  const [chats, setChats] = useState(datosDelRol.chats);

  // Id del chat abierto en la conversación. Empieza en el primer chat; lo cambia abrirChat.
  const [idElegido, setIdElegido] = useState(datosDelRol.chats[0].id);

  // Solo celular: true = se ve la conversación; false = se ve la lista.
  // Lo cambia abrirChat (pasa a true) y la flecha «volver» (pasa a false).
  const [movilAbierto, setMovilAbierto] = useState(false);

  // Texto del buscador de conversaciones por nombre. Empieza vacío; lo cambia el campo «Buscar».
  const [busqueda, setBusqueda] = useState('');

  // Proyecto elegido en el filtro: 'todos' o el nombre de un proyecto. Lo cambia el selector.
  const [proyectoFiltrado, setProyectoFiltrado] = useState('todos');

  // Relación elegida en el filtro: 'Todos' o una de las opciones de datosDelRol.rels.
  // Lo cambian los botones de relación.
  const [relacionFiltrada, setRelacionFiltrada] = useState('Todos');

  // Texto que se está escribiendo en el mensaje nuevo. Empieza vacío; lo cambia el
  // campo «Tu mensaje» y se vacía al enviar.
  const [textoMensaje, setTextoMensaje] = useState('');

  // Mensaje de error del envío ('' = sin error). Lo cambian alEnviarMensaje y abrirChat.
  const [errorMensaje, setErrorMensaje] = useState('');

  // true durante la espera simulada del envío. Lo cambia alEnviarMensaje.
  const [enviando, setEnviando] = useState(false);

  // true mientras se «cargan» los chats (simulación; en producción vendría de la API).
  const cargando = useLoading();

  // ───── 2. CÁLCULOS ─────

  // Nombres de proyecto sin repetir, para las opciones del selector «Proyecto».
  // `new Set(...)` descarta repetidos y `[...]` lo vuelve a convertir en array
  // (ver docs/GLOSARIO.md → Copiar con cambios).
  const nombresDeProyectos = [
    ...new Set(datosDelRol.chats.map((chat) => chat.proyecto)),
  ];

  // Chats que pasan los tres filtros a la vez (relación, proyecto y búsqueda por nombre).
  // useMemo guarda el resultado y solo lo recalcula si cambia algo de la lista del final
  // (ver docs/GLOSARIO.md → useMemo). .filter se queda con los chats que cumplen todo
  // (ver docs/GLOSARIO.md → Métodos de arrays).
  const chatsVisibles = useMemo(() => {
    const textoBuscado = busqueda.trim().toLowerCase();

    return chats.filter((chat) => {
      // 'Todos' en un filtro significa «no filtrar por esto»
      const cumpleRelacion = relacionFiltrada === 'Todos' || chat.rel === relacionFiltrada;
      const cumpleProyecto = proyectoFiltrado === 'todos' || chat.proyecto === proyectoFiltrado;
      // buscador vacío = no filtra; si no, el nombre debe contener el texto (sin mayúsculas)
      const cumpleBusqueda = !textoBuscado || chat.con.toLowerCase().includes(textoBuscado);

      return cumpleRelacion && cumpleProyecto && cumpleBusqueda;
    });
  }, [chats, relacionFiltrada, proyectoFiltrado, busqueda]);

  // Conversación abierta: el chat cuyo id coincide con el elegido (.find devuelve el
  // primero que cumple; puede ser undefined si no hay ninguno).
  const chatActual = chats.find((chat) => chat.id === idElegido);

  // Color de la etiqueta de relación: azul si es la segunda opción de `rels`,
  // arena para el resto. Se usa en la lista y en la cabecera del chat.
  function tonoDeLaRelacion(relacion) {
    return relacion === datosDelRol.rels[1] ? 'blue' : 'sand';
  }

  // Clase para ocultar en celular la lista (y título/filtros) cuando hay un chat abierto.
  const claseOcultarSiChatAbierto = movilAbierto ? s.ocultoMovil : '';

  // Clase para ocultar en celular el chat cuando se está viendo la lista.
  const claseOcultarSiListaAbierta = movilAbierto ? '' : s.ocultoMovil;

  // ───── 3. ACCIONES ─────

  // Se ejecuta al tocar un chat de la lista: lo selecciona, en celular pasa a la
  // conversación, limpia el error y lo marca como leído (nuevos = 0).
  function abrirChat(id) {
    setIdElegido(id);
    setMovilAbierto(true);
    setErrorMensaje('');
    // .map recorre todos los chats y devuelve copias; solo el elegido cambia
    // (ver docs/GLOSARIO.md → Copiar con cambios)
    setChats((chatsPrevios) => chatsPrevios.map((chat) => {
      return chat.id === id ? { ...chat, nuevos: 0 } : chat;
    }));
  }

  // Se ejecuta al apretar «Enviar». Si el mensaje está vacío muestra un error y corta;
  // si no, «lo envía» y lo agrega al final de la conversación abierta.
  function alEnviarMensaje(evento) {
    evento.preventDefault(); // evita que el navegador recargue la página

    if (!textoMensaje.trim()) {
      setErrorMensaje('Escribí un mensaje antes de enviar.');
      return;
    }
    setErrorMensaje('');
    setEnviando(true);

    // Se simula la espera con setTimeout (ejecuta la función de adentro a los 500 ms);
    // en producción acá iría la llamada a la API y esto correría cuando responda.
    setTimeout(() => {
      setChats((chatsPrevios) => chatsPrevios.map((chat) => {
        if (chat.id !== idElegido) {
          return chat;
        }
        // Cada mensaje es un par ['yo', texto]; 'yo' marca que lo escribimos nosotras
        const mensajeNuevo = ['yo', textoMensaje.trim()];
        return { ...chat, msgs: [...chat.msgs, mensajeNuevo], hora: 'Ahora' };
      }));
      setTextoMensaje('');
      setEnviando(false);
    }, 500);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: título — en celular se oculta mientras hay un chat abierto */}
      <div className={`${s.top} ${claseOcultarSiChatAbierto}`}>
        <Heading level={1}>Mensajes</Heading>
      </div>

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
          {datosDelRol.rels.map((relacion, posicion) => (
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
          {/* `cond && <X />` dibuja X solo si cond es verdadero (ver docs/GLOSARIO.md →
             Renderizado condicional) */}
          {/* Mientras carga: filas grises de relleno */}
          {cargando && <li><RowsSkeleton n={3} /></li>}
          {/* Terminó de cargar pero ningún chat pasa los filtros */}
          {!cargando && chatsVisibles.length === 0 && (
            <li><Text>Ninguna conversación coincide.</Text></li>
          )}
          {/* Terminó de cargar: un botón por cada chat visible */}
          {!cargando && chatsVisibles.map((chat) => (
            <li key={chat.id}>
              <button
                type="button"
                className={`${s.conv} ${chat.id === idElegido ? s.sel : ''}`}
                aria-current={chat.id === idElegido}
                onClick={() => abrirChat(chat.id)}
              >
                <span className={s.l1}>
                  <b>{chat.con}</b>
                  <small>{chat.hora}</small>
                </span>
                {/* Vista previa: el texto del último mensaje (posición 1 del par [quién, texto]) */}
                <span className={s.snip}>{chat.msgs[chat.msgs.length - 1][1]}</span>
                <span className={s.tags}>
                  <Tag>{chat.proyecto}</Tag>
                  <Tag tone={tonoDeLaRelacion(chat.rel)}>{chat.rel}</Tag>
                  {/* Aparece solo si hay mensajes sin leer */}
                  {chat.nuevos > 0 && <span className={s.nuevos}>{chat.nuevos} nuevos</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* BLOQUE: conversación — en celular se oculta mientras se ve la lista */}
        {/* El aria-label (texto para lectores de pantalla) usa una plantilla `...${}` para
           meter el nombre (ver docs/GLOSARIO.md → Plantillas de texto) */}
        <section
          className={`${s.chat} ${claseOcultarSiListaAbierta}`}
          aria-label={chatActual ? `Conversación con ${chatActual.con}` : 'Conversación'}
        >
          {/* Si hay un chat abierto se dibuja la conversación; si no, un texto de ayuda */}
          {chatActual ? (
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
                {chatActual.msgs.map(([quien, contenido], posicion) => (
                  <p key={posicion} className={`${s.msg} ${quien === 'yo' ? s.yo : ''}`}>
                    {contenido}
                  </p>
                ))}
              </div>

              {/* Formulario para escribir y enviar un mensaje nuevo */}
              <form className={s.compose} onSubmit={alEnviarMensaje} noValidate>
                {/* Aparece solo si se intentó enviar un mensaje vacío */}
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
            </>
          ) : (
            <Text>Elegí una conversación.</Text>
          )}
        </section>
      </div>
    </div>
  );
}
