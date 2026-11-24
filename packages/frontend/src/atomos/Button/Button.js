/**
 * Botón / enlace con aspecto de botón. Es EL botón de todo el sitio.
 *
 * USO: variant: primary | secondary | success | danger | link
 *      size: md | lg   as: 'button' | 'a' | Link   loading: spinner + aria-busy   fullWidth
 *      Lleva data-variant="…": la regla [data-area='app'] de estilos/base.css lo usa para pintar de azul el primario con sesión.
 * SI LO CAMBIÁS O SACÁS: Hay que reemplazar todos los botones. Cambiar colores: editá Button.module.css (usa variables, no hex).
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Variante nueva (ej. 'warning'): 1) agregá la clase .warning en Button.module.css, 2) escribí su hover,
 *   3) usala como variant="warning". No hace falta tocar este archivo.
 */
import s from './Button.module.css';
import { cx } from '../../utilidades/cx.js';
import Spinner from '../Spinner/Spinner.js';

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconRight,
  className,
  onClick,
  children,
  ...rest
}) {
  const bloqueado = disabled || loading;
  const props = { ...rest };
  if (Tag === 'button') props.type = rest.type || 'button';

  return (
    <Tag
      className={cx(s.btn, s[variant], size === 'lg' && s.lg, fullWidth && s.full, className)}
      data-variant={variant}
      aria-disabled={bloqueado || undefined}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (bloqueado) return e.preventDefault();
        onClick?.(e);
      }}
      {...props}
    >
      {loading && <Spinner inline label="Cargando" />}
      <span>{children}</span>
      {iconRight && !loading && <span aria-hidden="true">{iconRight}</span>}
    </Tag>
  );
}
