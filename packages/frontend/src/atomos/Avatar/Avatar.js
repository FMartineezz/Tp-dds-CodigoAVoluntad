/**
 * Foto de perfil, o un círculo/cuadrado con las iniciales si no hay foto.
 *
 * USO: <Avatar nombre="Ana Pérez" size={56} square foto={fotoDe(id)} />
 * SI LO CAMBIÁS O SACÁS: Lo usan las tarjetas de colectivos, perfiles, postulaciones y mensajes.
 */
import s from './Avatar.module.css';

export function Avatar({ nombre, size = 56, square = false, foto }) {
  const clases = `${s.avatar} ${square ? s.square : ''}`;
  if (foto) {
    // alt vacío: al lado siempre está el nombre escrito, la foto es decorativa
    return <img className={clases} src={foto} alt="" width={size} height={size} loading="lazy" />;
  }
  const iniciales = nombre.split(' ').map((palabra) => palabra[0]).slice(0, 2).join('');
  return (
    <span className={clases} style={{ width: size, height: size, fontSize: size * 0.38 }} aria-hidden="true">
      {iniciales}
    </span>
  );
}
