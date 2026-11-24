/**
 * PANTALLA EquipoOrg
 * Ruta: /org/proyectos/:id/equipo   ·   Quién la ve: Organización
 * Qué muestra: Integrantes del proyecto: contactar, desvincular (permanente) o valorar
 * si el proyecto cerró.
 * Para modificarla: un dato más en la tarjeta = otro elemento dentro de .mi.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: el equipo, a quién se quiere desvincular o valorar, a quiénes
 *      ya se valoró y el aviso de éxito.
 *   2. CÁLCULOS: si el proyecto está cerrado y los nombres que van en los diálogos.
 *   3. ACCIONES: confirmar la valoración y confirmar la baja.
 *   4. LO QUE SE DIBUJA: migas, aviso, tarjetas del equipo y los dos diálogos.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Heading, Icon, Tag, Text } from '../../atomos';
import { Alert, CardsSkeleton, ConfirmDialog, Crumbs, Grid } from '../../moleculas';
import { ValoracionDialog } from '../../organismos';
import { EQUIPO, PROYECTOS } from '../../datos';
import { useLoading } from '../../hooks';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { persona } from './auxiliares.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

export default function EquipoOrg() {
  // ───── 1. DATOS Y ESTADO ─────

  // Lee la parte variable de la dirección: /org/proyectos/48/equipo → id = '48'
  // (ver docs/GLOSARIO.md → useParams)
  const { id } = useParams();

  // El proyecto de la dirección (solo si es de esta organización). `undefined` si no existe.
  // (.find → docs/GLOSARIO.md → Métodos de arrays)
  const proyecto = PROYECTOS.find(
    (candidato) => String(candidato.id) === id && candidato.colectivoId === 1
  );

  // Integrantes del equipo (cada uno tiene `id` de persona y `perfil`). Arranca con los de
  // ejemplo; solo cambia al desvincular a alguien. (ver docs/GLOSARIO.md → Estado (useState))
  const [equipo, setEquipo] = useState(EQUIPO);

  // Id de la persona que se quiere desvincular, o null si no hay ninguna.
  // «Desvincular» guarda el id (y abre el diálogo); cancelar vuelve a null.
  const [idADesvincular, setIdADesvincular] = useState(null);

  // Id de la persona que se quiere valorar, o null si no hay ninguna.
  // «Valorar» guarda el id (y abre el diálogo de valoración); cancelar vuelve a null.
  const [idAValorar, setIdAValorar] = useState(null);

  // Ids de las personas ya valoradas en esta sesión (lista de números).
  // Sirve para cambiar el botón «Valorar» por la etiqueta «Valoración enviada».
  const [idsValoradas, setIdsValoradas] = useState([]);

  // Mensaje verde de éxito. Texto vacío = no se muestra. Lo completan las dos
  // acciones de confirmar.
  const [aviso, setAviso] = useState('');

  // true un instante (simula la espera de datos) y después false.
  const cargando = useLoading();

  // Si el proyecto no existe se corta acá y se muestra la pantalla de error.
  // Va después de los hooks a propósito (los hooks no pueden ir dentro de un `if`).
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

  // true si el proyecto ya cerró. En un proyecto cerrado se puede VALORAR al equipo;
  // en uno abierto, en cambio, se puede DESVINCULAR a alguien.
  const proyectoCerrado = proyecto.estado === 'cerrado';

  // Nombre completo de la persona a valorar (para el diálogo); vacío si no hay ninguna.
  const nombreAValorar = idAValorar ? persona(idAValorar).nombre : '';

  // Primer nombre de la persona a desvincular (para el título del diálogo); vacío si
  // no hay ninguna. `.split(' ')[0]` corta el nombre por los espacios y toma la primera
  // palabra.
  const primerNombreADesvincular = idADesvincular
    ? persona(idADesvincular).nombre.split(' ')[0]
    : '';

  // ───── 3. ACCIONES ─────

  // Se ejecuta al confirmar la valoración: recuerda que esa persona ya fue valorada,
  // cierra el diálogo y avisa.
  function alConfirmarValoracion() {
    // Se copia la lista de valoradas y se le suma el id nuevo (`...` → Copiar con cambios).
    setIdsValoradas((actuales) => [...actuales, idAValorar]);
    setIdAValorar(null);
    setAviso('Valoración publicada.');
  }

  // Se ejecuta al tocar «Sí, desvincular»: quita a la persona del equipo, cierra el
  // diálogo y avisa. Es permanente (por eso antes se pide confirmación).
  function alConfirmarBaja() {
    const nombre = persona(idADesvincular).nombre;
    // Se arma un equipo nuevo SIN esa persona.
    setEquipo((actual) => actual.filter((integrante) => integrante.id !== idADesvincular));
    setIdADesvincular(null);
    setAviso(`${nombre} fue desvinculada del proyecto.`);
  }

  // Devuelve el botón (o etiqueta) de la derecha de cada tarjeta, según el proyecto:
  //  - proyecto cerrado y ya valorada: etiqueta «Valoración enviada».
  //  - proyecto cerrado y sin valorar: botón «Valorar».
  //  - proyecto abierto: botón «Desvincular».
  function accionDelIntegrante(integrante) {
    if (proyectoCerrado) {
      if (idsValoradas.includes(integrante.id)) {
        return <Tag tone="sand">Valoración enviada</Tag>;
      }
      return (
        <Button variant="secondary" onClick={() => setIdAValorar(integrante.id)}>
          Valorar
        </Button>
      );
    }
    return (
      <Button variant="danger" onClick={() => setIdADesvincular(integrante.id)}>
        Desvincular
      </Button>
    );
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué se ve como contenido principal. Hay tres casos posibles.
  let contenidoDelEquipo;
  if (cargando) {
    // Caso 1: está cargando, tarjetas grises de relleno.
    contenidoDelEquipo = <CardsSkeleton n={3} />;
  } else if (equipo.length === 0) {
    // Caso 2: no queda nadie en el equipo, se invita a revisar postulaciones.
    contenidoDelEquipo = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">Todavía no hay integrantes</Heading>
        <Button as={Link} to={`/org/proyectos/${id}/postulaciones`}>
          Revisar postulaciones
        </Button>
      </div>
    );
  } else {
    // Caso 3: hay integrantes, una tarjeta por cada uno.
    contenidoDelEquipo = (
      <Grid>
        {equipo.map((integrante) => {
          // La persona (con nombre, mensajes, etc.) a partir de su id.
          const colaboradora = persona(integrante.id);
          return (
            <div key={integrante.id} className={s.miembro}>
              <div className={s.mi}>
                <Avatar nombre={colaboradora.nombre} size={56} />
                <div><b>{colaboradora.nombre}</b><small>{integrante.perfil}</small></div>
              </div>
              <div className={sh.row}>
                {/* Si la persona acepta mensajes: botón «Contactar». Si no, un aviso
                    con candado de que los desactivó. */}
                {colaboradora.mensajes ? (
                  <Button as={Link} to="/org/mensajes" variant="secondary">Contactar</Button>
                ) : (
                  <span className={sh.muted}>
                    <Icon name="candado" />Mensajes deshabilitados
                  </span>
                )}
                {accionDelIntegrante(integrante)}
              </div>
            </div>
          );
        })}
      </Grid>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Migas de pan y título */}
      <Crumbs
        items={[
          { label: 'Mis proyectos', to: '/org/proyectos' },
          { label: proyecto.titulo },
          { label: 'Equipo' },
        ]}
      />
      <Heading level={1}>Equipo</Heading>

      {/* BLOQUE: Aviso de éxito — aparece solo si `aviso` tiene texto */}
      {aviso && (
        <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>
      )}

      {/* BLOQUE: Equipo — relleno gris si carga, mensaje si está vacío, o las tarjetas */}
      {contenidoDelEquipo}

      {/* BLOQUE: Diálogo de valoración — abierto solo si hay alguien elegida para valorar */}
      <ValoracionDialog
        open={!!idAValorar}
        a={nombreAValorar}
        onCancel={() => setIdAValorar(null)}
        onConfirm={alConfirmarValoracion}
      />

      {/* BLOQUE: Confirmación de baja — abierta solo si hay alguien elegida para
          desvincular */}
      <ConfirmDialog
        open={!!idADesvincular}
        danger
        title={`¿Desvincular a ${primerNombreADesvincular}?`}
        confirmLabel="Sí, desvincular"
        onCancel={() => setIdADesvincular(null)}
        onConfirm={alConfirmarBaja}
      >
        <Text>Es permanente y se le avisará por mensaje.</Text>
      </ConfirmDialog>
    </div>
  );
}
