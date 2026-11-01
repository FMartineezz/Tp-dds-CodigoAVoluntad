/**
 * Botones de login social (Google, LinkedIn). Simulados.
 *
 * USO: onEntrar(proveedor), verbo.
 * SI LO CAMBIÁS O SACÁS: En producción cada botón dispara el flujo OAuth.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Proveedor nuevo: un <Button> más en este archivo.
 */
import { Button } from '../../atomos';
import s from './SocialButtons.module.css';

export function SocialButtons({ onEntrar, verbo = 'Continuar' }) {
  return (
    <div className={s.social}>
      <span className={s.sep}>o</span>
      <Button type="button" variant="secondary" fullWidth onClick={() => onEntrar('Google')}>{verbo} con Google</Button>
      <Button type="button" variant="secondary" fullWidth onClick={() => onEntrar('LinkedIn')}>{verbo} con LinkedIn</Button>
    </div>
  );
}
