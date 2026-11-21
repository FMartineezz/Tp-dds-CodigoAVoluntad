/**
 * PANTALLA ProyectosCol
 * Ruta: /panel/proyectos   ·   Quién la ve: Colaboradora
 * Qué muestra: Proyectos en los que participo, separados en «En curso» y «Finalizados».
 *   Desvincularse (permanente) de uno en curso o valorar al colectivo de uno finalizado.
 * De dónde salen los datos: del backend (api/colaboradora.js):
 *   · obtenerMisColaboraciones → GET /colaboradoras/:id/colaboraciones + valoraciones
 *     que ya hizo (GET /personaColaboradora/:id/valoraciones?direccion=emitidas).
 *   · darseDeBaja → DELETE /colaboraciones/:id.
 *   · valorarColectivo → POST /valoraciones.
 * Para modificarla: un botón más en la tarjeta = un <Button> más dentro de footer={<>…</>}.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: el pedido de colaboraciones, y lo necesario para los dos diálogos
 *      (desvincularse / valorar), el «enviando» y los avisos de resultado o de error.
 *   2. CÁLCULOS: separa en curso / finalizados y arma el botón final de cada tarjeta.
 *   3. ACCIONES: desvincularse y confirmar una valoración (pedidos al backend).
 *   4. LO QUE SE DIBUJA: título, avisos, las dos listas de tarjetas y los dos diálogos.
 *
 * Cómo se decide el botón de cada tarjeta (siempre hay «Ver proyecto»; se suma uno más):
 *   - proyecto en curso (no finalizado): «Desvincularme»;
 *   - proyecto finalizado y todavía sin valorar: «Valorar al colectivo»;
 *   - proyecto finalizado y ya valorado: la etiqueta «Valoración enviada».
 *
 * GET /colaboradoras/:id/colaboraciones trae el historial completo: también las anónimas
 *   (con la etiqueta «Anónima») y las dadas de baja, que van a «Finalizados».
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Heading, Tag, Text } from '../../atomos';
import { Alert, CardsSkeleton, ConfirmDialog, Grid, TicketRow } from '../../moleculas';
import { ProyectoCard, ValoracionDialog } from '../../organismos';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { darseDeBaja, obtenerMisColaboraciones, valorarColectivo } from '../../api/colaboradora.js';
import { mensajeDeError } from '../../api/errores.js';
import sh from '../../plantillas/disposicion.module.css';

export default function ProyectosCol() {
  // ───── 1. DATOS Y ESTADO ─────

  // `id` es el _id de la colaboradora con la sesión (ver contexto/Auth.js).
  const { id } = useAuth();

  // Número que se suma después de cada acción: como está en las dependencias del pedido,
  // cambiarlo vuelve a pedir la lista al backend (así se ve lo que quedó guardado).
  const [vuelta, setVuelta] = useState(0);

  // Pide las colaboraciones de la persona. `datos: colaboraciones` = «lo que viene en
  // `datos` guardalo con el nombre `colaboraciones`».
  const { cargando, datos: colaboraciones, error } = usePedido(
    () => obtenerMisColaboraciones(id),
    [id, vuelta]
  );

  // Colaboración de la que se quiere salir (null = ninguna, diálogo cerrado).
  // La pone «Desvincularme» y la borra «Cancelar» o confirmar.
  const [deBaja, setDeBaja] = useState(null);

  // Colaboración (de un proyecto finalizado) que se quiere valorar (null = diálogo cerrado).
  const [aValorar, setAValorar] = useState(null);

  // true mientras se espera la respuesta del backend a una acción (botón «cargando»).
  const [enviando, setEnviando] = useState(false);

  // Texto del aviso verde de resultado ('' = no se muestra). Lo borra la «x» del aviso.
  const [aviso, setAviso] = useState('');

  // Error de la última acción (null = sin error). Se muestra en un aviso rojo.
  const [errorDeAccion, setErrorDeAccion] = useState(null);

  // ───── 2. CÁLCULOS ─────

  // Mientras carga (o si falló), `colaboraciones` es null: `?? []` usa una lista vacía.
  const lista = colaboraciones ?? [];
  // .filter se queda con las que cumplen (ver docs/GLOSARIO.md → Métodos de arrays).
  // En curso: sigue activa y el proyecto no terminó. El resto (proyecto finalizado o
  // colaboración dada de baja) va a «Finalizados», donde se puede valorar al colectivo.
  const sigueEnCurso = (c) => c.activa && !c.proyecto.finalizado;
  const enCurso = lista.filter(sigueEnCurso);
  const finalizadas = lista.filter((c) => !sigueEnCurso(c));

  // Último botón de la tarjeta (ver reglas en la cabecera del archivo).
  function botonFinalDeLaTarjeta(colaboracion) {
    if (sigueEnCurso(colaboracion)) {
      return (
        <Button variant="danger" onClick={() => setDeBaja(colaboracion)}>
          Desvincularme
        </Button>
      );
    }
    if (colaboracion.valorada) {
      return <Tag tone="sand">Valoración enviada</Tag>;
    }
    return (
      <Button variant="secondary" onClick={() => setAValorar(colaboracion)}>
        Valorar al colectivo
      </Button>
    );
  }

  // Dibuja la tarjeta de una colaboración: el proyecto, su rol y sus botones.
  function tarjetaDeColaboracion(colaboracion) {
    return (
      <ProyectoCard
        key={colaboracion.id}
        p={colaboracion.proyecto}
        extra={(
          <TicketRow label="Tu rol">
            {colaboracion.rol}
            {colaboracion.anonima && <> <Tag tone="outline">Anónima</Tag></>}
          </TicketRow>
        )}
        footer={(
          <>
            <Button as={Link} to={`/proyectos/${colaboracion.proyecto.id}`} variant="secondary">
              Ver proyecto
            </Button>
            {botonFinalDeLaTarjeta(colaboracion)}
          </>
        )}
      />
    );
  }

  // ───── 3. ACCIONES ─────

  // Se ejecuta al confirmar «Sí, desvincularme»: pide la baja al backend. Si sale bien,
  // avisa y vuelve a pedir la lista; si sale mal, muestra el mensaje del backend.
  // `async` permite usar `await` adentro: la función espera la respuesta del backend antes de
  // seguir. Si el backend responde con error, salta al bloque `catch`.
  async function desvincular() {
    setEnviando(true);
    setErrorDeAccion(null);
    try {
      await darseDeBaja(deBaja.id);
      // `«${…}»` es una plantilla de texto: mete el título dentro de la frase
      setAviso(`Te desvinculaste de «${deBaja.proyecto.titulo}».`);
      setVuelta((v) => v + 1);
    } catch (e) {
      setErrorDeAccion(e);
    } finally {
      // `finally` corre siempre, haya salido bien o mal.
      setEnviando(false);
      setDeBaja(null);
    }
  }

  // Se ejecuta al publicar la valoración (el diálogo manda { puntaje, texto }).
  async function confirmarValoracion(valoracion) {
    setEnviando(true);
    setErrorDeAccion(null);
    try {
      await valorarColectivo(aValorar.id, valoracion);
      setAviso('Valoración publicada. Gracias por contar tu experiencia.');
      setVuelta((v) => v + 1);
    } catch (e) {
      setErrorDeAccion(e);
    } finally {
      setEnviando(false);
      setAValorar(null);
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      <Heading level={1}>Mis proyectos</Heading>

      {/* Avisos: verde si la última acción salió bien, rojo si el backend la rechazó */}
      {aviso && <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>}
      {errorDeAccion && (
        <Alert kind="error" onClose={() => setErrorDeAccion(null)}>
          {mensajeDeError(errorDeAccion)}
        </Alert>
      )}

      {/* BLOQUE: tarjetas — según el caso: cargando / error / sin proyectos / listas */}
      {cargando && <CardsSkeleton n={3} />}
      {error && (
        <Alert kind="error" title="No pudimos cargar tus proyectos">
          {mensajeDeError(error)}
        </Alert>
      )}
      {/* Terminó de cargar y no participa en ningún proyecto */}
      {!cargando && !error && lista.length === 0 && (
        <div className={sh.empty}>
          <Heading level={2} size="h3">No tenés proyectos activos</Heading>
          <Button as={Link} to="/proyectos">Buscar proyectos</Button>
        </div>
      )}
      {/* En curso: una tarjeta por cada uno (solo si hay alguno) */}
      {!cargando && enCurso.length > 0 && (
        <section aria-labelledby="curso">
          <Heading level={2} size="h3" id="curso">En curso</Heading>
          <Grid>{enCurso.map(tarjetaDeColaboracion)}</Grid>
        </section>
      )}
      {/* Finalizados: acá se puede valorar al colectivo */}
      {!cargando && finalizadas.length > 0 && (
        <section aria-labelledby="fin">
          <Heading level={2} size="h3" id="fin">Finalizados</Heading>
          <Grid>{finalizadas.map(tarjetaDeColaboracion)}</Grid>
        </section>
      )}

      {/* BLOQUE: diálogo de baja — abierto solo si hay una colaboración elegida para dejar */}
      {/* `!!deBaja` convierte el objeto (o null) en true/false; `deBaja?.` evita leer de null */}
      <ConfirmDialog
        open={!!deBaja}
        title={`¿Desvincularte de «${deBaja?.proyecto.titulo ?? ''}»?`}
        danger
        loading={enviando}
        confirmLabel="Sí, desvincularme"
        onCancel={() => setDeBaja(null)}
        onConfirm={desvincular}
      >
        <Text>Es permanente: tendrías que postularte de nuevo.</Text>
      </ConfirmDialog>

      {/* BLOQUE: diálogo de valoración — `a` es a quién se valora (el colectivo del proyecto) */}
      <ValoracionDialog
        open={!!aValorar}
        a={aValorar?.proyecto.colectivo || 'el colectivo'}
        loading={enviando}
        onCancel={() => setAValorar(null)}
        onConfirm={confirmarValoracion}
      />
    </div>
  );
}
