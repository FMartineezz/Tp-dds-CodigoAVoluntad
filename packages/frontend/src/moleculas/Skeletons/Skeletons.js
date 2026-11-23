/**
 * Esqueletos de carga: CardsSkeleton (grilla de tarjetas) y RowsSkeleton (filas).
 *
 * USO: <CardsSkeleton n={6} />  |  <RowsSkeleton n={4} />
 * SI LO CAMBIÁS O SACÁS: El enunciado pide indicadores de carga. Úsalos mientras llega la respuesta del backend.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un esqueleto nuevo: otro componente que arme bloques con <Skeleton/>.
 */
import { Skeleton } from '../../atomos';
import { Grid } from '../Grid/Grid.js';
import s from './Skeletons.module.css';

export function CardsSkeleton({ n = 6 }) {
  return (
    <div aria-busy="true">
      <span className="sr-only" role="status">Cargando…</span>
      <Grid>{Array.from({ length: n }, (_, i) => <div key={i} className={s.skCard}><Skeleton height="1.2rem" /><Skeleton height="2.2rem" /><Skeleton lines={3} /><Skeleton height="2.75rem" /></div>)}</Grid>
    </div>
  );
}

export function RowsSkeleton({ n = 4 }) {
  return (
    <div aria-busy="true" className={s.skRows}>
      <span className="sr-only" role="status">Cargando…</span>
      {Array.from({ length: n }, (_, i) => <div key={i} className={s.skRow}><Skeleton height="3.2rem" /></div>)}
    </div>
  );
}
