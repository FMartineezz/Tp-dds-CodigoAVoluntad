/**
 * Párrafo de texto con variantes de lectura.
 *
 * USO: variant: body (mono, interfaz) | lead (bajada) | prose (lectura larga, grotesca) | small | muted.
 *      as="span" para cambiar la etiqueta sin cambiar el aspecto.
 * SI LO CAMBIÁS O SACÁS: Los <p> sueltos pierden el ancho máximo (62ch) y los tamaños.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Variante nueva: agregá la clase en Text.module.css y usala como variant="nueva".
 */
import s from './Text.module.css';
import { cx } from '../../utilidades/cx.js';

export default function Text({ as: Tag = 'p', variant = 'body', className, children, ...rest }) {
  return (
    <Tag className={cx(s.text, s[variant], className)} {...rest}>
      {children}
    </Tag>
  );
}
