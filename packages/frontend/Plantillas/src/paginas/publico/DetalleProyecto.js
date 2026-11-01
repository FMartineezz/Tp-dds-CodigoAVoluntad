/**
 * PANTALLA DetalleProyecto
 * Ruta: /proyectos/:id   ·   Quién la ve: Todas (acciones según rol)
 * Qué muestra: Resumen, Perfiles (cupo, equipo, postulación) y Avance (hitos) en pestañas.
 * Para modificarla: una pestaña nueva = un objeto en el array de <Tabs> + un bloque {tab === "x" && …}.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → qué proyecto se está mirando (sale de la dirección), quién tiene la
 *                        sesión y lo que la pantalla recuerda: pestaña abierta, perfiles a los
 *                        que ya se postuló, ventanas abiertas y el aviso verde.
 *   2. CÁLCULOS        → si la búsqueda sigue abierta, cuánto avance llevan los hitos y
 *                        qué perfiles todavía tienen lugar.
 *   3. ACCIONES        → funciones para postularse, confirmar la postulación, denunciar
 *                        y decidir qué botón mostrar en cada fila de la tabla de perfiles.
 *   4. LO QUE SE DIBUJA → migas de pan, cabecera con botón de postular, aviso de éxito,
 *                        pestañas (Resumen / Perfiles / Avance) y las dos ventanas emergentes.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Heading, Icon, Progress, StatusBadge, Tag, Text } from '../../atomos';
import { Alert, Crumbs, RowsSkeleton, Tabs } from '../../moleculas';
import { DenunciaDialog, PostularDialog } from '../../organismos';
import { COLABORADORAS, DETALLE, PROYECTOS } from '../../datos';
import { useAuth } from '../../contexto';
import { useLoading } from '../../hooks';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import s from './Detalle.module.css';

// Ids de los proyectos en los que la colaboradora de la demo ya participó.
// Solo en esos aparece el botón «Denunciar al colectivo».
const PARTICIPO = [48, 45];

// Las tres pestañas de la pantalla: `id` es el valor interno, `label` el texto que se ve.
const PESTANAS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'perfiles', label: 'Perfiles' },
  { id: 'avance', label: 'Avance' },
];

export default function DetalleProyecto() {
  // ───── 1. DATOS Y ESTADO ─────
  // `id` es la parte variable de la dirección: en /proyectos/48 vale '48' (siempre texto).
  // (ver docs/GLOSARIO.md → useParams y Desestructurar)
  const { id } = useParams();
  // Rol de la sesión: 'col' (colaboradora), 'org' (organización) o null (visitante).
  const { rol } = useAuth();
  // El proyecto que se está mirando: se busca en la lista por id (como texto).
  // .find devuelve el primero que cumple, o undefined si no hay ninguno.
  const proyecto = PROYECTOS.find((candidato) => String(candidato.id) === id);
  // true un instante al entrar (450 ms, simula la espera de datos); mientras tanto
  // se ven filas grises en lugar del contenido de las pestañas.
  const cargando = useLoading(450);
  // Pestaña visible: 'resumen', 'perfiles' o 'avance'. Empieza en 'resumen'; la cambia <Tabs>.
  const [pestanaActiva, setPestanaActiva] = useState('resumen');
  // Perfiles a los que ya se mandó postulación en esta visita. Es un objeto con el nombre
  // del perfil como clave, ej. { Backend: true }. Lo cambia alConfirmarPostulacion.
  const [perfilesPostulados, setPerfilesPostulados] = useState({});
  // Perfil preseleccionado en la ventana «Postularme». null = ventana cerrada.
  // Lo cambian los botones «Postularme» (abren) y la propia ventana (cierra).
  const [perfilParaPostular, setPerfilParaPostular] = useState(null);
  // Mensaje verde de éxito que se ve arriba. '' = no se muestra nada.
  // Lo cambia alConfirmarPostulacion / alConfirmarDenuncia, y la X del aviso lo borra.
  const [aviso, setAviso] = useState('');
  // true = la ventana «Denunciar al colectivo» está abierta. La abre el botón «Denunciar».
  const [denunciaAbierta, setDenunciaAbierta] = useState(false);

  // Si la dirección tiene un id que no existe, se muestra la pantalla de error y se corta acá.
  // (Los hooks de arriba tienen que ir antes de este `return`, siempre en el mismo orden.)
  if (!proyecto) {
    return (
      <NoEncontrado
        code="ERR-NOT-108"
        titulo="Ese proyecto no existe"
        msg="El proyecto solicitado no fue encontrado"
      />
    );
  }

  // ───── 2. CÁLCULOS ─────
  // ¿Se puede postular? Hace falta que el proyecto esté «abierto» Y que la búsqueda siga abierta.
  const busquedaAbierta = proyecto.estado === 'abierto' && DETALLE.busqueda.abierta;

  // ¿Ya mandó alguna postulación? Object.keys lista las claves del objeto: si hay al menos una, sí.
  const yaMePostule = Object.keys(perfilesPostulados).length > 0;

  // Hitos que ya están completados (.filter se queda con los que tienen `hecho`).
  const hitosCompletados = DETALLE.hitos.filter((hito) => hito.hecho);
  // Suma de los pesos (%) de los hitos completados. Es el avance que se explica abajo.
  // .reduce va acumulando: arranca en 0 y le suma el peso de cada hito
  // (ver docs/GLOSARIO.md → Métodos de arrays).
  const avanceDeHitos = hitosCompletados.reduce((suma, hito) => suma + hito.peso, 0);

  // Perfiles que todavía tienen lugar: menos ocupantes que el cupo.
  const perfilesConCupo = DETALLE.perfiles.filter(
    (perfil) => perfil.ocupantes.length < perfil.cupo
  );

  // Puede denunciar solo una colaboradora que ya participó en este proyecto.
  const puedeDenunciar = rol === 'col' && PARTICIPO.includes(proyecto.id);

  // ¿Qué botón principal va en la cabecera? Dos casos distintos (ver el bloque «Cabecera»):
  // - botón que abre la ventana: colaboradora, o cualquiera si la búsqueda está cerrada
  //   (en ese caso queda deshabilitado);
  // - botón que lleva a ingresar: visitante sin sesión con la búsqueda abierta.
  const mostrarBotonDeCabecera = rol !== 'org' && !yaMePostule;
  const botonDeCabeceraAbreVentana = rol === 'col' || !busquedaAbierta;

  // ───── 3. ACCIONES ─────
  // Devuelve el nombre a mostrar de quien ocupa un lugar en un perfil:
  // si pidió ser anónima, un texto genérico; si no, su nombre buscado por id.
  function nombreDelOcupante(ocupante) {
    if (ocupante.anonima) {
      return 'Contribución anónima';
    }
    const colaboradora = COLABORADORAS.find((persona) => persona.id === ocupante.persona);
    return colaboradora.nombre;
  }

  // Decide qué se ve en la última columna de la fila de un perfil que todavía tiene lugar.
  // Devuelve un botón, una etiqueta o null (= nada). Se llama una vez por fila.
  function accionDelPerfil(perfil) {
    // Una organización no se postula: no ve nada.
    if (rol === 'org') {
      return null;
    }
    // Si ya se postuló a este perfil, se ve la etiqueta «pendiente».
    if (perfilesPostulados[perfil.rol]) {
      return <StatusBadge status="pendiente" />;
    }
    // Si la búsqueda está cerrada, no hay botón.
    if (!busquedaAbierta) {
      return null;
    }
    // Colaboradora con sesión: el botón abre la ventana con este perfil preseleccionado.
    if (rol === 'col') {
      return (
        <Button variant="secondary" onClick={() => setPerfilParaPostular(perfil.rol)}>
          Postularme
        </Button>
      );
    }
    // Visitante sin sesión: el botón la lleva a ingresar y después vuelve a este proyecto.
    // La dirección se arma con una plantilla de texto: `${…}` mete el id del proyecto
    // (ver docs/GLOSARIO.md → Plantillas de texto).
    return (
      <Button
        as={Link}
        to={`/ingresar?volver=/proyectos/${proyecto.id}`}
        variant="secondary"
      >
        Postularme
      </Button>
    );
  }

  // Se ejecuta al tocar el botón «Postularme» de la cabecera: abre la ventana con el
  // primer perfil que tenga lugar (el `?.` evita un error si no queda ninguno;
  // ver docs/GLOSARIO.md → Operadores).
  function alPostularmeDesdeLaCabecera() {
    setPerfilParaPostular(perfilesConCupo[0]?.rol);
  }

  // Se ejecuta al confirmar la ventana de postulación.
  // Recibe el perfil elegido y si la persona quiere que su contribución sea pública.
  function alConfirmarPostulacion({ perfil, publica }) {
    // Se agrega el perfil a los ya postulados. `...anteriores` copia lo que había y
    // `[perfil]: true` usa el nombre del perfil como clave
    // (ver docs/GLOSARIO.md → Copiar con cambios).
    setPerfilesPostulados((anteriores) => ({ ...anteriores, [perfil]: true }));
    // Se cierra la ventana.
    setPerfilParaPostular(null);
    // Si eligió no ser pública, el aviso lo aclara; si no, esa frase queda vacía.
    const fraseAnonima = publica ? '' : 'Tu contribución será anónima. ';
    setAviso(
      `Postulación enviada al perfil ${perfil}. ${fraseAnonima}La organización la va a revisar.`
    );
  }

  // Se ejecuta al cancelar la ventana de postulación: se cierra sin guardar nada.
  function alCancelarPostulacion() {
    setPerfilParaPostular(null);
  }

  // Se ejecuta al confirmar la denuncia: cierra la ventana y muestra el aviso de éxito.
  function alConfirmarDenuncia() {
    setDenunciaAbierta(false);
    setAviso('Denuncia enviada. El equipo administrativo la va a evaluar.');
  }

  // Se ejecuta al cancelar la ventana de denuncia: se cierra sin enviar nada.
  function alCancelarDenuncia() {
    setDenunciaAbierta(false);
  }

  // Dibuja una fila de la tabla de «Perfiles» (se llama una vez por cada perfil del proyecto).
  function filaDePerfil(perfil) {
    // El perfil está completo cuando ya no queda cupo libre.
    const perfilCompleto = perfil.ocupantes.length >= perfil.cupo;
    const hayOcupantes = perfil.ocupantes.length > 0;
    const hayOpcionales = perfil.opcionales.length > 0;

    return (
      <tr key={perfil.rol}>
        {/* Columna 1: nombre y descripción del perfil */}
        <td data-l="Perfil">
          <b>{perfil.rol}</b>
          <span className={s.desc}>{perfil.descripcion}</span>
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

        {/* Columna 3: compromiso de tiempo y modalidades de trabajo */}
        <td data-l="Compromiso">
          {perfil.compromiso}
          <span className={s.tags}>
            {perfil.modalidad.map((modalidad) => (
              <Tag key={modalidad}>{modalidad}</Tag>
            ))}
          </span>
        </td>

        {/* Columna 4: cuántos lugares están ocupados y quiénes son */}
        <td data-l="Equipo">
          <b>{perfil.ocupantes.length}/{perfil.cupo}</b>
          {/* Si hay integrantes se listan por nombre; si no, un texto aclaratorio */}
          {hayOcupantes ? (
            <ul className={s.ocup}>
              {perfil.ocupantes.map((ocupante, posicion) => (
                <li key={posicion}>{nombreDelOcupante(ocupante)}</li>
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
      <Crumbs
        items={[{ label: 'Proyectos', to: '/proyectos' }, { label: proyecto.titulo }]}
      />

      {/* BLOQUE: Cabecera — título, estado, colectivo, etiquetas y botón de postulación */}
      <header className={s.top}>
        <div className={s.title}>
          <div className={s.row}>
            <Heading level={1} size="h2">{proyecto.titulo}</Heading>
            <StatusBadge status={proyecto.estado} />
          </div>
          <Text variant="small">
            <Link to={`/colectivos/${proyecto.colectivoId}`}>{proyecto.colectivo}</Link> · Creado 12/03
          </Text>
          <div className={s.tags}>
            {/* La etiqueta cambia según la búsqueda esté abierta (con fecha límite) o cerrada */}
            <Tag tone={busquedaAbierta ? 'sand' : 'outline'}>
              {busquedaAbierta
                ? `Búsqueda abierta hasta ${DETALLE.busqueda.hasta}`
                : 'Búsqueda cerrada'}
            </Tag>
            <Tag>Cierra automáticamente el {DETALLE.cierreAuto}</Tag>
            {/* «Denunciar al colectivo» aparece solo si es una colaboradora que participó
                en este proyecto (`&&`: si es verdadero se dibuja; ver
                docs/GLOSARIO.md → Renderizado condicional) */}
            {puedeDenunciar && (
              <Button variant="link" onClick={() => setDenunciaAbierta(true)}>
                Denunciar al colectivo
              </Button>
            )}
          </div>
        </div>

        <div className={s.right}>
          {/* Botón que abre la ventana de postulación: aparece si no es organización y todavía
              no se postuló, y es colaboradora o la búsqueda está cerrada. Si la búsqueda está
              cerrada o no quedan perfiles con lugar, queda deshabilitado. */}
          {mostrarBotonDeCabecera && botonDeCabeceraAbreVentana && (
            <Button
              disabled={!busquedaAbierta || perfilesConCupo.length === 0}
              onClick={alPostularmeDesdeLaCabecera}
            >
              {busquedaAbierta ? 'Postularme' : 'Búsqueda cerrada'}
            </Button>
          )}
          {/* Botón que lleva a ingresar: aparece si no es organización, todavía no se postuló,
              no es colaboradora y la búsqueda está abierta (o sea, una visita sin sesión) */}
          {mostrarBotonDeCabecera && !botonDeCabeceraAbreVentana && (
            <Button as={Link} to={`/ingresar?volver=/proyectos/${proyecto.id}`}>
              Postularme
            </Button>
          )}
          {/* Si ya se postuló (y no es organización) se ve la etiqueta «pendiente» */}
          {rol !== 'org' && yaMePostule && <StatusBadge status="pendiente" />}
          {/* Mensaje para visitantes sin sesión cuando la búsqueda está abierta */}
          {rol === null && busquedaAbierta && (
            <Text variant="small">Ingresá como colaboradora para postularte</Text>
          )}
        </div>
      </header>

      {/* BLOQUE: Aviso de éxito — se ve solo cuando `aviso` tiene texto (no está vacío) */}
      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}

      {/* BLOQUE: Pestañas — Resumen / Perfiles / Avance; se ve el contenido de la activa */}
      <Tabs tabs={PESTANAS} value={pestanaActiva} onChange={setPestanaActiva}>
        {/* Mientras carga se ven 3 filas grises; después, el contenido de la pestaña elegida */}
        {cargando ? (
          <RowsSkeleton n={3} />
        ) : (
          <>
            {/* Pestaña «Resumen»: descripción, habilidades y modalidades del proyecto */}
            {pestanaActiva === 'resumen' && (
              <>
                <Text variant="prose">{DETALLE.descripcion}</Text>
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
                  {DETALLE.perfiles.map(filaDePerfil)}
                </tbody>
              </table>
            )}

            {/* Pestaña «Avance»: porcentaje, barra de progreso y lista de hitos */}
            {pestanaActiva === 'avance' && (
              <>
                <div className={s.avance}><b>{proyecto.avance} %</b><span>finalizado</span></div>
                <Progress value={proyecto.avance} />
                <ul className={s.hitos}>
                  {DETALLE.hitos.map((hito) => (
                    // Los hitos completados llevan la clase `done` (se ven tachados/marcados)
                    <li key={hito.nombre} className={hito.hecho ? s.done : undefined}>
                      {/* El tilde aparece solo si el hito está hecho */}
                      <span className={s.check}>
                        {hito.hecho && <Icon name="check" size={12} />}
                      </span>
                      {/* El texto «completado/pendiente» solo lo leen los lectores de pantalla */}
                      <span>
                        {hito.nombre}
                        <span className="sr-only">
                          {hito.hecho ? ' (completado)' : ' (pendiente)'}
                        </span>
                      </span>
                      <b>{hito.peso} %</b>
                    </li>
                  ))}
                </ul>
                <Text variant="small">
                  El avance es la suma de los pesos de los hitos completados ({avanceDeHitos} %).
                </Text>
                <div className={s.tags}>
                  <Tag tone="sand">Primer deploy</Tag>
                  <Tag tone="sand">MVP</Tag>
                  <Button variant="link" as="a" href="#repo">Repositorio</Button>
                  <Button variant="link" as="a" href="#prod">Ver en producción</Button>
                </div>
              </>
            )}
          </>
        )}
      </Tabs>

      {/* BLOQUE: Ventanas emergentes — postularse y denunciar
          (cada una se ve solo si está abierta) */}
      {/* `!!perfilParaPostular` convierte el valor en true/false: abierta si hay perfil elegido */}
      <PostularDialog
        open={!!perfilParaPostular}
        perfiles={perfilesConCupo}
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
