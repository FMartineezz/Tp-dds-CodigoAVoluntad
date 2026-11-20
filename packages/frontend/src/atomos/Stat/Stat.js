/**
 * Cifra grande con su etiqueta.
 *
 * USO: <Stat value="120" label="proyectos" />
 * SI LO CAMBIÁS O SACÁS: Decorativo/informativo; no tiene dependencias.
 */
import s from './Stat.module.css';

export default function Stat({ value, label }) {
  return (
    <p className={s.stat}>
      <b className={s.value}>{value}</b>
      <span className={s.label}>{label}</span>
    </p>
  );
}
