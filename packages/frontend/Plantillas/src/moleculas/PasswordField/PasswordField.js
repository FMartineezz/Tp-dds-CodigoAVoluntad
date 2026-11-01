/**
 * Campo de contraseña con casilla «Mostrar contraseña».
 *
 * USO: Recibe las mismas props que Field.
 * SI LO CAMBIÁS O SACÁS: —
 */
import { useState } from 'react';
import { Checkbox, Field } from '../../atomos';
import s from './PasswordField.module.css';

export function PasswordField(props) {
  const [ver, setVer] = useState(false);
  return (
    <div className={s.pass}>
      <Field {...props} type={ver ? 'text' : 'password'} />
      <Checkbox checked={ver} onChange={(e) => setVer(e.target.checked)}>Mostrar contraseña</Checkbox>
    </div>
  );
}
