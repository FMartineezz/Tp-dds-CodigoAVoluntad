/**
 * Logotipo de texto con la estrella. Es un enlace por defecto.
 *
 * USO: <Logo as={Link} to="/" />  |  <Logo as="span" /> (sin enlace, para el pie)
 * SI LO CAMBIÁS O SACÁS: Para cambiar el nombre de la marca editá el texto de este archivo: aparece en el header y el pie.
 */
import s from './Logo.module.css';

export default function Logo({ as: Tag = 'a', ...rest }) {
  return (
    <Tag className={s.logo} {...rest}>
      <span className={s.star} aria-hidden="true">✺</span>
      Código a Voluntad
    </Tag>
  );
}
