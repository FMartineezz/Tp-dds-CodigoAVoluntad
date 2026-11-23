/**
 * PANTALLA ComoFunciona
 * Ruta: /como-funciona   ·   Quién la ve: Todas
 * Qué muestra: Dos columnas (organización / colaboradora) y preguntas frecuentes en acordeón.
 * Para modificarla: una pregunta nueva = una fila más en FAQ (datos/datos.js).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   · Pregunta (componente chico) → una pregunta frecuente que se abre y se cierra al tocarla.
 *     Tiene su propia memoria (un useState) y sus propias secciones: DATOS Y ESTADO,
 *     ACCIONES y LO QUE SE DIBUJA.
 *   · ComoFunciona (la pantalla) → no guarda nada ni calcula nada; solo tiene
 *     4. LO QUE SE DIBUJA: título, dos columnas con los pasos para cada tipo de cuenta
 *     y la lista de preguntas frecuentes (que sale de FAQ en datos/datos.js).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Icon, Text } from '../../atomos';
import { FAQ } from '../../datos';
import s from './Como.module.css';

// ═════ COMPONENTE AUXILIAR: Pregunta ═════
// Una pregunta frecuente tipo acordeón: se ve la pregunta y, al tocarla, aparece la respuesta.
// Props: `q` (texto de la pregunta) y `a` (texto de la respuesta). Las llaves { } de abajo
// sacan esas dos piezas del objeto de props (ver docs/GLOSARIO.md → Props y Desestructurar).
function Pregunta({ q, a }) {
  // ───── 1. DATOS Y ESTADO ─────
  // true = la respuesta está a la vista; false = está oculta. Empieza oculta
  // y cambia cada vez que se toca el botón de la pregunta (ver alTocarPregunta).
  const [abierta, setAbierta] = useState(false);

  // ───── 3. ACCIONES ─────
  // Se ejecuta al tocar la pregunta: si estaba cerrada la abre y si estaba abierta la cierra.
  // Recibe el valor anterior y devuelve su opuesto.
  function alTocarPregunta() {
    setAbierta((estabaAbierta) => !estabaAbierta);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={s.faq}>
      {/* BLOQUE: Pregunta — botón con el texto y un ícono que cambia (más / cruz) */}
      <h3>
        <button type="button" aria-expanded={abierta} onClick={alTocarPregunta}>
          <span>{q}</span>
          {/* Ícono «x» si la respuesta está abierta, ícono «más» si está cerrada */}
          <Icon name={abierta ? 'x' : 'mas'} size={14} />
        </button>
      </h3>
      {/* BLOQUE: Respuesta — se ve solo cuando `abierta` es true
          (`&&`: si es verdadero se dibuja; ver docs/GLOSARIO.md → Renderizado condicional) */}
      {abierta && <Text variant="prose">{a}</Text>}
    </div>
  );
}

// ═════ PANTALLA ═════
export default function ComoFunciona() {
  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Heading level={1}>Cómo funciona</Heading>

      {/* BLOQUE: Dos columnas — qué hace una organización y qué hace una colaboradora */}
      <div className={s.split}>
        {/* Columna 1: para organizaciones, con botón que lleva a su registro */}
        <section className={s.col} aria-labelledby="c-org">
          <Heading level={2} size="h2" id="c-org">Si sos una organización</Heading>
          <Text variant="prose">
            Registrás a tu colectivo y publicás un proyecto con los perfiles que necesitás:
            front, back, diseño, datos.
          </Text>
          <Text variant="prose">
            Revisás las postulaciones, aceptás a quienes sumen al equipo y conversás por
            mensajes internos.
          </Text>
          <Text variant="prose">
            Dividís el proyecto en hitos con un peso, y el avance se calcula solo a medida
            que los completan.
          </Text>
          <Button as={Link} to="/registro/organizacion">Crear cuenta de organización</Button>
        </section>

        {/* Columna 2: para colaboradoras, con botón que lleva a su registro */}
        <section className={s.col} aria-labelledby="c-col">
          <Heading level={2} size="h2" id="c-col">Si querés colaborar</Heading>
          <Text variant="prose">
            Armás tu perfil con tus habilidades y el tiempo que tenés. Tus datos de contacto
            no son públicos.
          </Text>
          <Text variant="prose">
            Buscás proyectos por habilidad y te postulás al perfil que te queda cómodo.
          </Text>
          <Text variant="prose">
            Si te aceptan, sumás al equipo y llevás un registro de tus logros dentro de la
            plataforma.
          </Text>
          <Button as={Link} to="/registro/colaboradora">Crear cuenta de colaboradora</Button>
        </section>
      </div>

      {/* BLOQUE: Preguntas frecuentes — una <Pregunta> por cada fila de FAQ */}
      <section aria-labelledby="c-faq" className={s.faqs}>
        <Heading level={2} id="c-faq">Preguntas frecuentes</Heading>
        {/* Cada fila de FAQ es un par [pregunta, respuesta]; los corchetes del parámetro
            lo separan en dos variables con nombre (ver docs/GLOSARIO.md → Desestructurar).
            `key` ayuda a React a distinguir cada pregunta
            (ver docs/GLOSARIO.md → Listas con map y key). */}
        {FAQ.map(([pregunta, respuesta]) => (
          <Pregunta key={pregunta} q={pregunta} a={respuesta} />
        ))}
      </section>
    </div>
  );
}
