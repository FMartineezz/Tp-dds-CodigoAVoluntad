/**
 * Grilla responsive de tarjetas del MISMO alto (cada hijo se envuelve en un <li>).
 *
 * USO: <Grid>{items.map(p => <ProyectoCard key={p.id} p={p}/>)}</Grid>
 * SI LO CAMBIÁS O SACÁS: Si cambiás minmax(24rem…) cambia cuántas tarjetas entran por fila.
 */
import s from './Grid.module.css';

export function Grid({ children }) {
  return <ul className={s.grid}>{[].concat(children).flat().map((c, i) => <li key={c?.key ?? i}>{c}</li>)}</ul>;
}
