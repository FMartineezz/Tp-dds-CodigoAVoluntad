/**
 * Antetítulo chico en mayúsculas, con etiqueta de relleno opcional.
 *
 * USO: <Eyebrow tag="Red solidaria IT">Código abierto</Eyebrow>
 * SI LO CAMBIÁS O SACÁS: Es decorativo: se puede sacar de cualquier pantalla sin romper nada.
 */
import s from './Eyebrow.module.css';

export default function Eyebrow({ tag, children }) {
  return (
    <p className={s.eyebrow}>
      {tag && <b className={s.tag}>{tag}</b>}
      <span>{children}</span>
    </p>
  );
}
