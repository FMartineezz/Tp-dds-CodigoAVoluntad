/**
 * PANTALLA PostulacionesOrg
 * Ruta: /org/proyectos/:id/postulaciones   ·   Quién la ve: Organización
 * Qué muestra: Postulaciones por estado; aceptar (se bloquea al llegar al cupo) o
 * rechazar con confirmación.
 * Para modificarla: COLUMNA NUEVA: <th> en <thead> + <td data-l="…"> por fila.
 *
 * ESTADOS DE UNA POSTULACIÓN: 'pendiente' (esperando respuesta), 'aceptada' (la persona
 * ya es parte del equipo) y 'rechazada'. Cada pestaña muestra uno de esos tres.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: la lista de postulaciones, la pestaña elegida, cuál se quiere
 *      rechazar y el aviso de éxito.
 *   2. CÁLCULOS: si el cupo está lleno, contadores por estado y la lista de la pestaña.
 *   3. ACCIONES: cambiar el estado, aceptar y confirmar el rechazo.
 *   4. LO QUE SE DIBUJA: migas, avisos, pestañas con la tabla y el diálogo de rechazo.
 */
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, Button, Heading, Tag, Text } from '../../atomos';
import { Alert, ConfirmDialog, Crumbs, Tabs } from '../../moleculas';
import { POSTULACIONES_ORG, PROYECTOS } from '../../datos';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { persona } from './auxiliares.js';
import sh from '../../plantillas/disposicion.module.css';

// Cupo máximo de personas aceptadas del proyecto (en el prototipo es fijo: 2).
// Al llegar a este número ya no se puede aceptar a nadie más.
const CUPO_MAXIMO = 2;

export default function PostulacionesOrg() {
  // ───── 1. DATOS Y ESTADO ─────

  // Lee la parte variable de la dirección: /org/proyectos/48/postulaciones → id = '48'
  // (ver docs/GLOSARIO.md → useParams)
  const { id } = useParams();

  // El proyecto de la dirección (solo si es de esta organización). `undefined` si no existe.
  // (.find → docs/GLOSARIO.md → Métodos de arrays)
  const proyecto = PROYECTOS.find(
    (candidato) => String(candidato.id) === id && candidato.colectivoId === 1
  );

  // Todas las postulaciones, con su estado actual. Arranca con las de ejemplo y cambia
  // cuando se acepta o rechaza una (cambiarEstado). (ver docs/GLOSARIO.md → Estado (useState))
  const [postulaciones, setPostulaciones] = useState(POSTULACIONES_ORG);

  // Pestaña activa: 'pendientes' | 'aceptadas' | 'rechazadas'. La cambian las pestañas.
  const [pestana, setPestana] = useState('pendientes');

  // Id de la postulación que se quiere rechazar, o null si no hay ninguna.
  // Al tocar «Rechazar» se guarda el id (y se abre el diálogo); al cancelar vuelve a null.
  const [idARechazar, setIdARechazar] = useState(null);

  // Mensaje verde de éxito. Texto vacío = no se muestra. Lo completan alAceptar y
  // alConfirmarRechazo.
  const [aviso, setAviso] = useState('');

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

  // Cuenta cuántas postulaciones tienen un estado dado ('pendiente', 'aceptada'…).
  // Sirve para los números de las pestañas y para controlar el cupo.
  function contarConEstado(estado) {
    return postulaciones.filter((postulacion) => postulacion.estado === estado).length;
  }

  // true cuando ya se aceptó a tantas personas como permite el cupo.
  // Entonces se deshabilita «Aceptar» y se muestra un aviso (regla de negocio).
  const cupoLleno = contarConEstado('aceptada') >= CUPO_MAXIMO;

  // Traduce el nombre de cada pestaña al estado que muestra.
  const estadoDeCadaPestana = {
    pendientes: 'pendiente',
    aceptadas: 'aceptada',
    rechazadas: 'rechazada',
  };

  // Las postulaciones que se ven en la pestaña activa.
  const postulacionesDeLaPestana = postulaciones.filter(
    (postulacion) => postulacion.estado === estadoDeCadaPestana[pestana]
  );

  // Las tres pestañas con su contador entre paréntesis (plantilla de texto, ver
  // docs/GLOSARIO.md → Plantillas de texto).
  const pestanas = [
    { id: 'pendientes', label: `Pendientes (${contarConEstado('pendiente')})` },
    { id: 'aceptadas', label: `Aceptadas (${contarConEstado('aceptada')})` },
    { id: 'rechazadas', label: `Rechazadas (${contarConEstado('rechazada')})` },
  ];

  // ───── 3. ACCIONES ─────

  // Cambia el estado de UNA postulación sin tocar las demás.
  // `idPostulacion` dice cuál; `nuevoEstado` es 'aceptada' o 'rechazada'.
  function cambiarEstado(idPostulacion, nuevoEstado) {
    setPostulaciones((actuales) =>
      actuales.map((postulacion) => {
        // Solo esa postulación se copia con el estado nuevo (`...` → Copiar con cambios).
        if (postulacion.id === idPostulacion) return { ...postulacion, estado: nuevoEstado };
        return postulacion;
      })
    );
  }

  // Se ejecuta al tocar «Aceptar»: marca la postulación como aceptada y avisa.
  // (El botón ya viene deshabilitado si el cupo está lleno, así que no hace falta
  // volver a controlarlo acá.)
  function alAceptar(postulacion) {
    const colaboradora = persona(postulacion.persona);
    cambiarEstado(postulacion.id, 'aceptada');
    setAviso(`Aceptaste a ${colaboradora.nombre}. Ya es parte del equipo.`);
  }

  // Se ejecuta al tocar «Sí, rechazar» en el diálogo: marca la postulación elegida como
  // rechazada, cierra el diálogo y avisa.
  function alConfirmarRechazo() {
    cambiarEstado(idARechazar, 'rechazada');
    setIdARechazar(null);
    setAviso('Postulación rechazada.');
  }

  // ───── 4. LO QUE SE DIBUJA ─────

  // Elige qué va dentro de la pestaña activa: mensaje vacío o la tabla.
  let contenidoDeLaPestana;
  if (postulacionesDeLaPestana.length === 0) {
    // No hay postulaciones en este estado.
    contenidoDeLaPestana = (
      <div className={sh.empty}>
        <Heading level={2} size="h3">No hay postulaciones en esta lista</Heading>
      </div>
    );
  } else {
    // Hay postulaciones: una fila por cada una.
    contenidoDeLaPestana = (
      <table className={sh.table}>
        <thead>
          <tr><th>Persona</th><th>Perfil</th><th>Habilidades</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          {postulacionesDeLaPestana.map((postulacion) => {
            // La persona que se postuló (se busca por su id).
            const colaboradora = persona(postulacion.persona);
            return (
              <tr key={postulacion.id}>
                <td data-l="Persona">
                  <Link to={`/org/colaboradoras/${colaboradora.id}`} className={sh.person}>
                    <Avatar nombre={colaboradora.nombre} size={36} />
                    {colaboradora.nombre}
                  </Link>
                </td>
                <td data-l="Perfil">{postulacion.perfil}</td>
                <td data-l="Habilidades">
                  <span className={sh.tagsRow}>
                    {colaboradora.habilidades.map((habilidad) => (
                      <Tag key={habilidad}>{habilidad}</Tag>
                    ))}
                  </span>
                </td>
                <td className={sh.act}>
                  <div className={sh.row}>
                    {/* Los botones aparecen solo si la postulación está pendiente; las
                        aceptadas y rechazadas ya no se pueden cambiar. «Aceptar» se
                        deshabilita si el cupo está lleno. */}
                    {postulacion.estado === 'pendiente' && (
                      <>
                        <Button
                          variant="success"
                          disabled={cupoLleno}
                          onClick={() => alAceptar(postulacion)}
                        >
                          Aceptar
                        </Button>
                        <Button variant="danger" onClick={() => setIdARechazar(postulacion.id)}>
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Migas de pan y título */}
      <Crumbs
        items={[
          { label: 'Mis proyectos', to: '/org/proyectos' },
          { label: proyecto.titulo },
          { label: 'Postulaciones' },
        ]}
      />
      <Heading level={1}>Postulaciones</Heading>

      {/* BLOQUE: Avisos — éxito (si hay mensaje) y cupo completo (si se llegó al máximo) */}
      {aviso && (
        <Alert kind="success" onClose={() => setAviso('')}>{aviso}</Alert>
      )}
      {cupoLleno && (
        <Alert kind="warning">
          El cupo del proyecto está completo: no se puede aceptar a más personas.
        </Alert>
      )}

      {/* BLOQUE: Pestañas — Pendientes / Aceptadas / Rechazadas, con la tabla adentro */}
      <Tabs tabs={pestanas} value={pestana} onChange={setPestana}>
        {contenidoDeLaPestana}
      </Tabs>

      {/* BLOQUE: Confirmación de rechazo — abierto solo si hay una postulación elegida */}
      {/* `!!idARechazar` convierte el id en true/false: hay id = abierto, null = cerrado. */}
      <ConfirmDialog
        open={!!idARechazar}
        danger
        title="¿Rechazar la postulación?"
        confirmLabel="Sí, rechazar"
        onCancel={() => setIdARechazar(null)}
        onConfirm={alConfirmarRechazo}
      >
        <Text>La persona va a ver el estado «Rechazada».</Text>
      </ConfirmDialog>
    </div>
  );
}
