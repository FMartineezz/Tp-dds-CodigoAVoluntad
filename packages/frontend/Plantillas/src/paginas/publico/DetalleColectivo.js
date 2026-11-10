/**
 * PANTALLA DetalleColectivo
 * Ruta: /colectivos/:id   ·   Quién la ve: Todas
 * Qué muestra: Datos del colectivo, sus proyectos y valoraciones. Permite denunciar a quien participó.
 * Para modificarla: los datos salen de datos/datos.js (COLECTIVOS).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO  → qué colectivo se está mirando (sale de la dirección), quién tiene la
 *                        sesión y lo que la pantalla recuerda: si la ventana de denuncia
 *                        está abierta y si hay que mostrar el aviso de éxito.
 *   2. CÁLCULOS        → los proyectos de ese colectivo, sus valoraciones y si la persona
 *                        puede denunciarlo.
 *   3. ACCIONES        → funciones para abrir, confirmar y cancelar la denuncia.
 *   4. LO QUE SE DIBUJA → migas de pan, aviso, cabecera con datos del colectivo, lista de
 *                        proyectos (o mensaje de vacío), valoraciones y la ventana de denuncia.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Heading, Tag, Text } from '../../atomos';
import { Alert, CardsSkeleton, Crumbs, Estrellas, Grid } from '../../moleculas';
import { DenunciaDialog, ProyectoCard } from '../../organismos';
import { COLECTIVOS, PROYECTOS, VALORACIONES } from '../../datos';
import { useAuth } from '../../contexto';
import { useLoading } from '../../hooks';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import s from './Colectivos.module.css';
import d from './DetalleColectivo.module.css';

// Ids de los colectivos con los que la colaboradora de la demo participó.
// Solo en esos aparece el botón «Denunciar».
const PARTICIPO = [1, 8];

export default function DetalleColectivo() {
  // ───── 1. DATOS Y ESTADO ─────
  // `id` es la parte variable de la dirección: en /colectivos/3 vale '3' (siempre texto).
  // (ver docs/GLOSARIO.md → useParams y Desestructurar)
  const { id } = useParams();
  // Rol de la sesión: 'col' (colaboradora), 'org' (organización) o null (visitante).
  const { rol } = useAuth();
  // true un instante al entrar (450 ms, simula la espera de datos); mientras tanto
  // se ven tarjetas grises en lugar de los proyectos.
  const cargando = useLoading(450);
  // true = la ventana «Denunciar» está abierta. La abre el botón «Denunciar»
  // y la cierran sus botones de cancelar / confirmar.
  const [denunciaAbierta, setDenunciaAbierta] = useState(false);
  // true = se ve el aviso verde «Denuncia enviada». Lo prende alConfirmarDenuncia
  // y lo apaga la X del propio aviso.
  const [denunciaEnviada, setDenunciaEnviada] = useState(false);
  // El colectivo que se está mirando: se busca en la lista por id (como texto).
  // .find devuelve el primero que cumple, o undefined si no hay ninguno.
  const colectivo = COLECTIVOS.find((candidato) => String(candidato.id) === id);

  // Si la dirección tiene un id que no existe, se muestra la pantalla de error y se corta acá.
  // (Los hooks de arriba tienen que ir antes de este `return`, siempre en el mismo orden.)
  if (!colectivo) {
    return (
      <NoEncontrado
        code="ERR-NOT-305"
        titulo="Ese colectivo no existe"
        msg="El colectivo solicitado no fue encontrado"
      />
    );
  }

  // ───── 2. CÁLCULOS ─────
  // Los proyectos publicados por este colectivo (.filter se queda con los que cumplen;
  // ver docs/GLOSARIO.md → Métodos de arrays).
  const proyectosDelColectivo = PROYECTOS.filter(
    (proyecto) => proyecto.colectivoId === colectivo.id
  );
  // Las valoraciones que recibió este colectivo. Si no tiene ninguna cargada, queda una lista
  // vacía: `||` significa «lo de la izquierda, y si no existe, lo de la derecha».
  const valoraciones = VALORACIONES.colectivo[colectivo.id] || [];
  // Puede denunciar solo una colaboradora que ya participó con este colectivo.
  const puedeDenunciar = rol === 'col' && PARTICIPO.includes(colectivo.id);

  // ───── 3. ACCIONES ─────
  // Se ejecuta al tocar «Denunciar»: abre la ventana de denuncia.
  function alTocarDenunciar() {
    setDenunciaAbierta(true);
  }

  // Se ejecuta al confirmar la denuncia: cierra la ventana y muestra el aviso de éxito.
  function alConfirmarDenuncia() {
    setDenunciaAbierta(false);
    setDenunciaEnviada(true);
  }

  // Se ejecuta al cancelar la ventana de denuncia: se cierra sin enviar nada.
  function alCancelarDenuncia() {
    setDenunciaAbierta(false);
  }

  // Se ejecuta al cerrar el aviso verde con su X: lo oculta.
  function alCerrarAviso() {
    setDenunciaEnviada(false);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.page}`}>
      <Crumbs items={[{ label: 'Colectivos', to: '/colectivos' }, { label: colectivo.nombre }]} />

      {/* Aviso de éxito: se ve solo después de confirmar una denuncia (`&&`: si es verdadero
          se dibuja; ver docs/GLOSARIO.md → Renderizado condicional) */}
      {denunciaEnviada && (
        <Alert kind="success" onClose={alCerrarAviso}>
          Denuncia enviada. El equipo administrativo la va a evaluar.
        </Alert>
      )}

      {/* BLOQUE: Cabecera — nombre, descripción, etiquetas, enlaces, acciones y avatar */}
      <header className={d.head}>
        <div className={d.info}>
          <Heading level={1} size="h2">{colectivo.nombre}</Heading>
          <Text variant="prose">{colectivo.descripcion}</Text>
          <div className={d.tags}>
            <Tag>{colectivo.tipo}</Tag>
            <Tag>{colectivo.ubicacion}</Tag>
            {/* Una etiqueta por cada causa del colectivo */}
            {colectivo.causas.map((causa) => (
              <Tag key={causa} tone="sand">{causa}</Tag>
            ))}
          </div>
          <div className={d.links}>
            <a href="#sitio">Sitio web</a>
            <a href="#instagram">Instagram</a>
            <a href="#linkedin">LinkedIn</a>
          </div>
          <div className={d.acts}>
            <Button
              as="a"
              href="https://cafecito.app"
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
            >
              Invitar un cafecito
            </Button>
            {/* «Denunciar» aparece solo si es una colaboradora que participó con este colectivo */}
            {puedeDenunciar && (
              <Button variant="link" onClick={alTocarDenunciar}>Denunciar</Button>
            )}
          </div>
        </div>
        <Avatar nombre={colectivo.nombre} size={120} square />
      </header>

      {/* BLOQUE: Sus proyectos — tarjetas de los proyectos del colectivo */}
      <Heading level={2}>Sus proyectos</Heading>
      {/* Tres casos, solo se ve uno: cargando → tarjetas grises; ya cargó y tiene proyectos
          → sus tarjetas; ya cargó y no tiene ninguno → mensaje y enlace al listado. */}
      {cargando && <CardsSkeleton n={2} />}

      {!cargando && proyectosDelColectivo.length > 0 && (
        <Grid>
          {proyectosDelColectivo.map((proyecto) => (
            <ProyectoCard key={proyecto.id} p={proyecto} />
          ))}
        </Grid>
      )}

      {!cargando && proyectosDelColectivo.length === 0 && (
        <div className={s.empty}>
          <Heading level={2} size="h3">Todavía no publicó proyectos</Heading>
          <Button as={Link} to="/proyectos" variant="secondary">Ver otros proyectos</Button>
        </div>
      )}

      {/* BLOQUE: Valoraciones — opiniones recibidas; se ve solo si hay al menos una */}
      {valoraciones.length > 0 && (
        <section aria-labelledby="vals" className={d.vals}>
          <Heading level={2} id="vals">Valoraciones</Heading>
          <ul>
            {valoraciones.map((valoracion) => (
              <li key={valoracion.de}>
                <div className={d.vh}>
                  <b>{valoracion.de}</b>
                  <Estrellas valor={valoracion.puntaje} />
                </div>
                <Text variant="prose">{valoracion.texto}</Text>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* BLOQUE: Nota final — cómo contactar al colectivo */}
      <Text variant="small">
        Para contactar a la organización, postulate a uno de sus proyectos: se escriben por
        mensajes internos.
      </Text>

      {/* BLOQUE: Ventana de denuncia — se ve solo cuando `denunciaAbierta` es true */}
      <DenunciaDialog
        open={denunciaAbierta}
        a={colectivo.nombre}
        onCancel={alCancelarDenuncia}
        onConfirm={alConfirmarDenuncia}
      />
    </div>
  );
}
