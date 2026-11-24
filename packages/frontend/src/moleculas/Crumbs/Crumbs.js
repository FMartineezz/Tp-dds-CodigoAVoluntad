/**
 * Migas de pan (Inicio › Proyectos › Nombre).
 *
 * USO: items=[{label,to}]; el último ítem no lleva 'to'.
 * SI LO CAMBIÁS O SACÁS: Ayuda a orientarse: conviene mantenerlas en pantallas con 3 niveles o más.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un nivel más: un objeto más en items.
 */
import { Link } from 'react-router-dom';
import { Icon } from '../../atomos';
import s from './Crumbs.module.css';

export function Crumbs({ items }) {
  return (
    <nav aria-label="Ruta de navegación" className={s.crumbs}>
      <ol>
        <li><Link to="/">Inicio</Link></li>
        {items.map((x, i) => (
          <li key={x.label}>
            <Icon name="chevron-der" size={10} />
            {x.to && i < items.length - 1 ? <Link to={x.to}>{x.label}</Link> : <span aria-current="page">{x.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
