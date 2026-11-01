/**
 * PANTALLA ProyectosCol
 * Ruta: /panel/proyectos   ·   Quién la ve: Colaboradora
 * Qué muestra: Proyectos en los que participo. Desvincularse (permanente) o valorar al colectivo.
 * Para modificarla: un botón más en la tarjeta = un <Button> más dentro de footer={<>…</>}.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: los proyectos en los que participa, y lo necesario para los
 *      dos diálogos (desvincularse / valorar) y el aviso de resultado.
 *   2. CÁLCULOS: el título que lleva el diálogo de baja y el botón final de cada tarjeta.
 *   3. ACCIONES: desvincularse, abrir/cerrar los diálogos y confirmar una valoración.
 *   4. LO QUE SE DIBUJA: título, aviso, tarjetas de proyectos y los dos diálogos.
 *
 * Cómo se decide el botón de cada tarjeta (siempre hay «Ver proyecto»; se suma uno más):
 *   - proyecto que todavía no está cerrado: «Desvincularme»;
 *   - proyecto cerrado y todavía sin valorar: «Valorar al colectivo»;
 *   - proyecto cerrado y ya valorado: la etiqueta «Valoración enviada».
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Tag, Text } from '../../atomos';
import { Alert, CardsSkeleton, ConfirmDialog, Grid, TicketRow } from '../../moleculas';
import { ProyectoCard, ValoracionDialog } from '../../organismos';
import { useLoading } from '../../hooks'; // simula la espera de datos
import { proyecto } from './auxiliares.js'; // busca un proyecto por id
import sh from '../../plantillas/disposicion.module.css';

export default function ProyectosCol() {
  // ───── 1. DATOS Y ESTADO ─────

  // Proyectos en los que participa: cada uno guarda el id del proyecto y el rol que
  // cumple ahí. Empieza con tres de ejemplo; se le saca uno al desvincularse.
  // (ver docs/GLOSARIO.md → useState)
  const [participaciones, setParticipaciones] = useState([
    { id: 48, rol: 'Front-end' },
    { id: 45, rol: 'Datos' },
    { id: 44, rol: 'Testing' },
  ]);

  // Id del proyecto del que se quiere salir (null = ninguno, diálogo cerrado).
  // Lo pone «Desvincularme» y lo borra «Cancelar» o confirmar.
  const [idDeBaja, setIdDeBaja] = useState(null);

  // Id del proyecto cerrado que se quiere valorar (null = ninguno, diálogo cerrado).
  // Lo pone «Valorar al colectivo» y lo borra «Cancelar» o confirmar.
  const [idAValorar, setIdAValorar] = useState(null);

  // Ids de los proyectos que ya se valoraron (para mostrar «Valoración enviada»).
  // Empieza vacío; se agrega un id al confirmar una valoración.
  const [idsValorados, setIdsValorados] = useState([]);

  // Texto del aviso verde de resultado ('' = no se muestra). Lo cambian desvincular y
  // confirmar valoración; lo borra la «x» del aviso.
  const [aviso, setAviso] = useState('');

  // true mientras se «cargan» los datos (simulación; en producción vendría de la API).
  const cargando = useLoading();

  // ───── 2. CÁLCULOS ─────

  // Título del proyecto de baja para el diálogo. `idDeBaja ? … : ''` evita buscar cuando
  // el diálogo está cerrado (idDeBaja es null).
  const tituloDelProyectoDeBaja = idDeBaja ? proyecto(idDeBaja).titulo : '';

  // Último botón de la tarjeta (ver reglas en la cabecera del archivo).
  // Recibe la participación y si su proyecto está cerrado.
  function botonFinalDeLaTarjeta(participacion, proyectoCerrado) {
    if (!proyectoCerrado) {
      return (
        <Button variant="danger" onClick={() => setIdDeBaja(participacion.id)}>
          Desvincularme
        </Button>
      );
    }
    // .includes pregunta si el id está en la lista de ya valorados
    if (idsValorados.includes(participacion.id)) {
      return <Tag tone="sand">Valoración enviada</Tag>;
    }
    return (
      <Button variant="secondary" onClick={() => setIdAValorar(participacion.id)}>
        Valorar al colectivo
      </Button>
    );
  }

  // Dibuja la tarjeta de un proyecto, con su rol y sus botones.
  function tarjetaDeParticipacion(participacion) {
    const datosProyecto = proyecto(participacion.id);
    const proyectoCerrado = datosProyecto.estado === 'cerrado';

    return (
      <ProyectoCard
        key={participacion.id}
        p={datosProyecto}
        extra={<TicketRow label="Tu rol">{participacion.rol}</TicketRow>}
        footer={(
          <>
            <Button as={Link} to={`/proyectos/${participacion.id}`} variant="secondary">
              Ver proyecto
            </Button>
            {botonFinalDeLaTarjeta(participacion, proyectoCerrado)}
          </>
        )}
      />
    );
  }

  // ───── 3. ACCIONES ─────

  // Se ejecuta al confirmar «Sí, desvincularme»: saca el proyecto de la lista, cierra el
  // diálogo y avisa. Es permanente. (En producción: llamada a la API.)
  function desvincular() {
    const datosProyecto = proyecto(idDeBaja);
    // .filter devuelve una copia sin ese proyecto (React exige copiar, no modificar)
    setParticipaciones((listaPrevia) => {
      return listaPrevia.filter((participacion) => participacion.id !== idDeBaja);
    });
    setIdDeBaja(null);
    // `«${…}»` es una plantilla de texto: mete el título dentro de la frase
    setAviso(`Te desvinculaste de «${datosProyecto.titulo}».`);
  }

  // Se ejecuta al confirmar la valoración en el diálogo: anota el proyecto como valorado,
  // cierra el diálogo y agradece. (En producción: se enviaría la valoración a la API.)
  function confirmarValoracion() {
    // [...lista, nuevo] copia la lista y agrega un id al final (ver docs/GLOSARIO.md →
    // Copiar con cambios)
    setIdsValorados((listaPrevia) => [...listaPrevia, idAValorar]);
    setIdAValorar(null);
    setAviso('Valoración publicada. Gracias por contar tu experiencia.');
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Mis proyectos</Heading>

      {/* Aparece solo si hay un texto de aviso (después de desvincularse o valorar) */}
      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}

      {/* BLOQUE: tarjetas — según el caso: cargando / sin proyectos / lista de tarjetas */}
      {cargando && <CardsSkeleton n={3} />}
      {/* Terminó de cargar y no queda ningún proyecto activo */}
      {!cargando && participaciones.length === 0 && (
        <div className={sh.empty}>
          <Heading level={2} size="h3">No tenés proyectos activos</Heading>
          <Button as={Link} to="/proyectos">Buscar proyectos</Button>
        </div>
      )}
      {/* Terminó de cargar y hay proyectos: una tarjeta por cada uno */}
      {!cargando && participaciones.length > 0 && (
        <Grid>
          {participaciones.map(tarjetaDeParticipacion)}
        </Grid>
      )}

      {/* BLOQUE: diálogo de baja — abierto solo si hay un proyecto elegido para dejar */}
      {/* `!!idDeBaja` convierte el id (o null) en true/false */}
      <ConfirmDialog
        open={!!idDeBaja}
        title={`¿Desvincularte de «${tituloDelProyectoDeBaja}»?`}
        danger
        confirmLabel="Sí, desvincularme"
        onCancel={() => setIdDeBaja(null)}
        onConfirm={desvincular}
      >
        <Text>Es permanente: tendrías que postularte de nuevo.</Text>
      </ConfirmDialog>

      {/* BLOQUE: diálogo de valoración — abierto solo si hay un proyecto cerrado elegido para
         valorar */}
      {/* `a`: a quién se valora (el colectivo del proyecto); '' si no hay proyecto elegido */}
      <ValoracionDialog
        open={!!idAValorar}
        a={idAValorar ? proyecto(idAValorar).colectivo : ''}
        onCancel={() => setIdAValorar(null)}
        onConfirm={confirmarValoracion}
      />
    </div>
  );
}
