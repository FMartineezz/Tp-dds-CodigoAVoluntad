/**
 * «Última actividad»: las notificaciones de quien tiene la sesión (colaborador u organización).
 *
 * USO: <UltimaActividad />   (no recibe props: busca solo las notificaciones de la sesión)
 * Se ven las primeras y la última se desvanece; «Ver todas las notificaciones» despliega
 * el resto ahí mismo. Si no hay ninguna, no se dibuja nada (no deja un hueco).
 * SI LO CAMBIÁS O SACÁS: Lo usan los paneles de colaborador y de organización.
 */
import { useState } from 'react';
import { Button, Heading } from '../../atomos';
import { Alert } from '../../moleculas';
import { useNotificaciones } from '../../hooks/useNotificaciones.js';
import s from './UltimaActividad.module.css';

// Cuántas se ven antes de desplegar: la última de estas aparece desvanecida.
const A_LA_VISTA = 2;

export function UltimaActividad() {
  const { notificaciones } = useNotificaciones();
  // true cuando tocó «Ver todas las notificaciones».
  const [verTodas, setVerTodas] = useState(false);

  if (notificaciones.length === 0) return null;

  const hayMas = notificaciones.length > A_LA_VISTA;
  const recortada = hayMas && !verTodas;
  const visibles = recortada ? notificaciones.slice(0, A_LA_VISTA) : notificaciones;

  return (
    <section className={s.actividad} aria-labelledby="h-ultima-actividad">
      <Heading level={2} size="h3" id="h-ultima-actividad">
        Última actividad
      </Heading>
      <div className={`${s.lista} ${recortada ? s.recortada : ''}`}>
        {visibles.map((notificacion) => (
          <Alert key={notificacion.id} kind="info">
            {notificacion.texto} <small>({notificacion.cuando})</small>
          </Alert>
        ))}
      </div>
      {hayMas && (
        <Button
          variant="secondary"
          className={s.verTodas}
          aria-expanded={verTodas}
          onClick={() => setVerTodas(!verTodas)}
        >
          {verTodas ? 'Ver menos' : 'Ver todas las notificaciones'}
        </Button>
      )}
    </section>
  );
}
