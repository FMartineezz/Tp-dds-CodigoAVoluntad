/**
 * Casilla de verificación con su texto.
 *
 * USO: <Checkbox checked={x} onChange={…}>Texto</Checkbox>
 * SI LO CAMBIÁS O SACÁS: El tilde se dibuja con una máscara que toma el color del texto (currentColor): no hay hex acá.
 */
import s from './Checkbox.module.css';

export default function Checkbox({ children, ...rest }) {
  return (
    <label className={s.wrap}>
      <input type="checkbox" className={s.box} {...rest} />
      <span>{children}</span>
    </label>
  );
}
