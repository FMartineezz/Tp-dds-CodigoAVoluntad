/**
 * Cifra grande con su etiqueta y, opcional, un ícono. Si `value` es un número, cuenta
 * desde 0 hasta él al aparecer.
 *
 * USO: <Stat value={22} label="proyectos" icon="proyectos" />
 * SI LO CAMBIÁS O SACÁS: Decorativo/informativo; solo depende de Icon y useConteo.
 */
import { useConteo } from '../../hooks/useConteo.js';
import { Icon } from '../Icon/Icon.js';
import s from './Stat.module.css';

export default function Stat({ value, label, icon }) {
  const mostrado = useConteo(value);
  return (
    <p className={s.stat}>
      {icon && (
        <span className={s.icon}>
          <Icon name={icon} size={28} />
        </span>
      )}
      {/* El lector de pantalla lee el número final, no cada paso de la cuenta */}
      <b className={s.value} aria-hidden="true">{mostrado}</b>
      <span className="sr-only">{value}</span>
      <span className={s.label}>{label}</span>
    </p>
  );
}
