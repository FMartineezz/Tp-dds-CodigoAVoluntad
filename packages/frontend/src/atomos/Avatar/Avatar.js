/**
 * Círculo o cuadrado con las iniciales de una persona o colectivo.
 *
 * USO: <Avatar nombre="Ana Pérez" size={56} square />
 * SI LO CAMBIÁS O SACÁS: Cuando haya fotos reales, reemplazá el contenido por un <img> manteniendo el mismo tamaño.
 */
import s from './Avatar.module.css';

export function Avatar({ nombre, size = 56, square = false }) {
  const ini = nombre.split(' ').map((w) => w[0]).slice(0, 2).join('');
  return <span className={`${s.avatar} ${square ? s.sq : ''}`} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">{ini}</span>;
}
