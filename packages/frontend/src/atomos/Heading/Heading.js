/**
 * Título (h1–h6 o display). Separa SEMÁNTICA de ASPECTO.
 *
 * USO: <Heading level={2}>  |  <Heading as="h3" size="h1">  → es un h3 para lectores de pantalla pero se ve como h1.
 *      Tamaños disponibles: display, h1, h2, h3, h4, h5, h6.
 * SI LO CAMBIÁS O SACÁS: Los tamaños NO viven acá: están en estilos/titulos.css. Para cambiar cómo se ve un nivel, editá ese archivo.
 *      Si sacás este componente, los <h1>…<h6> sueltos igual toman los estilos globales.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un nivel nuevo (ej. h7): agregalo en estilos/titulos.css (variables + regla) y en la lista SIZES de abajo.
 */
import { cx } from '../../utilidades/cx.js';

// Niveles con estilo definido en estilos/titulos.css
const SIZES = ['display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

export default function Heading({ level = 2, as, size, className, children, ...rest }) {
  const Tag = as || `h${level}`;                              // etiqueta real (semántica)
  const look = SIZES.includes(size) ? size : `h${level}`;     // aspecto (clase global de titulos.css)
  return (
    <Tag className={cx(look, className)} {...rest}>
      {children}
    </Tag>
  );
}
