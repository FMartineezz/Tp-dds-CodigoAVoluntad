/**
 * hCaptcha SIMULADO (casilla «No soy un robot»).
 *
 * USO: ok, onChange, error.
 * SI LO CAMBIÁS O SACÁS: Es un reemplazo de maqueta: en producción se cambia por el widget real de hCaptcha.
 */
import { Checkbox } from '../../atomos';
import s from './CaptchaMock.module.css';

export function CaptchaMock({ ok, onChange, error }) {
  return (
    <div className={s.captcha}>
      <Checkbox checked={ok} onChange={(e) => onChange(e.target.checked)}>No soy un robot</Checkbox>
      <small>Verificación hCaptcha (simulada)</small>
      {error && <p className={s.cerr}>{error}</p>}
    </div>
  );
}
