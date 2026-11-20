/**
 * Sello circular rotado, de adorno.
 *
 * USO: <Stamp>Sin<br/>fines<br/>de lucro</Stamp> (máx. 3 líneas).
 * SI LO CAMBIÁS O SACÁS: Decorativo. Usá uno por pantalla.
 */
import s from './Stamp.module.css';

export default function Stamp({ children, className }) {
  return <span className={`${s.stamp} ${className || ''}`}>{children}</span>;
}
