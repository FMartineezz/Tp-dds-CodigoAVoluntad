/**
 * PANTALLA PerfilColaboradora
 * Ruta: /org/colaboradoras/:id   ·   Quién la ve: Organización
 * Qué muestra: Perfil de una colaboradora. Los datos de contacto solo se ven si su
 * postulación fue aceptada (si no, ERR-PER-001).
 * Para modificarla: la regla de acceso es la constante enEquipo.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: la persona de la dirección y si está cargando (no hay estado propio).
 *   2. CÁLCULOS: si la persona está en el equipo (regla de acceso) y sus valoraciones.
 *   3. ACCIONES: no hay (los botones son enlaces a otras pantallas).
 *   4. LO QUE SE DIBUJA: migas, cabecera, logros, valoraciones, contacto y mensajes.
 */
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Heading, Tag, Text } from '../../atomos';
import { Alert, Crumbs, Estrellas, RowsSkeleton } from '../../moleculas';
import { EQUIPO, VALORACIONES } from '../../datos';
import { useLoading } from '../../hooks';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { persona } from './auxiliares.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

export default function PerfilColaboradora() {
  // ───── 1. DATOS Y ESTADO ─────

  // Lee la parte variable de la dirección: /org/colaboradoras/3 → id = '3'
  // (ver docs/GLOSARIO.md → useParams)
  const { id } = useParams();

  // La colaboradora de esa dirección. El id llega como texto, por eso `Number(id)` lo pasa
  // a número. Si no existe queda `undefined`.
  const colaboradora = persona(Number(id));

  // true un instante (450 ms, simula la espera de datos) y después false.
  const cargando = useLoading(450);

  // Si la colaboradora no existe se corta acá y se muestra la pantalla de error.
  // Va después de los hooks a propósito (los hooks no pueden ir dentro de un `if`).
  if (!colaboradora) {
    return (
      <NoEncontrado
        code="ERR-NOT-405"
        titulo="Esa colaboradora no existe"
        msg="La colaboradora solicitada no fue encontrada"
      />
    );
  }

  // ───── 2. CÁLCULOS ─────

  // REGLA DE ACCESO: true si la colaboradora figura en el equipo del proyecto, o sea,
  // si su postulación fue aceptada. Solo en ese caso se comparten sus datos de contacto;
  // antes de aceptarla, la organización no puede verlos (protege su privacidad).
  // (.some → docs/GLOSARIO.md → Métodos de arrays: ¿algún integrante tiene su id?)
  const enEquipo = EQUIPO.some((integrante) => integrante.id === colaboradora.id);

  // Valoraciones que recibió de otras organizaciones. `||` usa una lista vacía si no
  // tiene ninguna, para que el resto del código no falle.
  const valoraciones = VALORACIONES.colaboradora[colaboradora.id] || [];

  // ───── 4. LO QUE SE DIBUJA ─────

  // BLOQUE «Logros»: si tiene logros, una etiqueta por cada uno; si no, un texto que
  // lo aclara.
  let contenidoDeLogros;
  if (colaboradora.logros.length) {
    contenidoDeLogros = (
      <span className={sh.tagsRow}>
        {colaboradora.logros.map((logro) => (
          <Tag key={logro} tone="blue">{logro}</Tag>
        ))}
      </span>
    );
  } else {
    contenidoDeLogros = <Text variant="small">Todavía no tiene logros.</Text>;
  }

  // BLOQUE «Datos de contacto»: tres casos posibles.
  let contenidoDeContacto;
  if (cargando) {
    // Caso 1: está cargando, una fila gris de relleno.
    contenidoDeContacto = <RowsSkeleton n={1} />;
  } else if (enEquipo) {
    // Caso 2: está en el equipo, se muestran sus contactos (cada uno es un par
    // [tipo, valor], por ejemplo ['Mail', 'ana@mail.com']; `[tipo, valor]` desestructura
    // el par, ver docs/GLOSARIO.md → Desestructurar).
    contenidoDeContacto = (
      <ul className={s.contactos}>
        {colaboradora.contactos.map(([tipo, valor]) => (
          <li key={tipo}><b>{tipo}</b><span>{valor}</span></li>
        ))}
      </ul>
    );
  } else {
    // Caso 3: NO está en el equipo, se niega el acceso con un aviso de error.
    contenidoDeContacto = (
      <Alert kind="error" title="No tenés acceso a estos datos">
        Los datos de contacto se comparten recién cuando aceptás su postulación. (ERR-PER-001)
      </Alert>
    );
  }

  // BLOQUE «Mensajes»: si acepta mensajes, un botón para escribirle; si no, un aviso.
  let contenidoDeMensajes;
  if (colaboradora.mensajes) {
    contenidoDeMensajes = (
      <div className={`${sh.bar} ${sh.barInfo}`}>
        <span>Podés contactarla por mensaje interno.</span>
        <Button as={Link} to="/org/mensajes">Enviar mensaje</Button>
      </div>
    );
  } else {
    contenidoDeMensajes = (
      <Alert kind="warning">
        Esta persona no recibe mensajes de organizaciones. (ERR-EST-801)
      </Alert>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Migas de pan */}
      <Crumbs
        items={[
          { label: 'Colaboradoras', to: '/org/colaboradoras' },
          { label: colaboradora.nombre },
        ]}
      />

      {/* BLOQUE: Cabecera — nombre, pronombres, bio, habilidades, redes y foto */}
      <header className={s.perfil}>
        <div className={s.pinfo}>
          <Heading level={1} size="h2">
            {colaboradora.nombre} <small className={s.pron}>({colaboradora.pronombres})</small>
          </Heading>
          <Text variant="prose">{colaboradora.bio}</Text>
          <span className={sh.tagsRow}>
            {colaboradora.habilidades.map((habilidad) => (
              <Tag key={habilidad} tone="sand">{habilidad}</Tag>
            ))}
          </span>
          <div className={s.redes}>
            <a href="#github">GitHub · {colaboradora.github}</a>
            <a href="#linkedin">LinkedIn</a>
          </div>
        </div>
        <Avatar nombre={colaboradora.nombre} size={120} square />
      </header>

      {/* BLOQUE: Logros — etiquetas con sus logros, o aviso si no tiene */}
      <section className={sh.col} aria-labelledby="logros">
        <Heading level={2} size="h3" id="logros">Logros</Heading>
        {contenidoDeLogros}
      </section>

      {/* BLOQUE: Valoraciones — aparece solo si la colaboradora recibió al menos una */}
      {valoraciones.length > 0 && (
        <section className={sh.col} aria-labelledby="vals">
          <Heading level={2} size="h3" id="vals">Valoraciones</Heading>
          {valoraciones.map((valoracion) => (
            <div key={valoracion.de} className={s.val}>
              <div className={sh.row}>
                <b>{valoracion.de}</b>
                <Estrellas valor={valoracion.puntaje} />
              </div>
              <Text variant="prose">{valoracion.texto}</Text>
            </div>
          ))}
        </section>
      )}

      {/* BLOQUE: Datos de contacto — visibles solo si su postulación fue aceptada */}
      <section className={sh.col} aria-labelledby="datos">
        <Heading level={2} size="h3" id="datos">Datos de contacto</Heading>
        {contenidoDeContacto}
      </section>

      {/* BLOQUE: Mensajes — botón para escribirle, o aviso si no recibe mensajes */}
      <section className={sh.col} aria-labelledby="mensaje">
        <Heading level={2} size="h3" id="mensaje">Mensajes</Heading>
        {contenidoDeMensajes}
      </section>
    </div>
  );
}
