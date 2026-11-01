/**
 * Efecto de dos tintas desalineadas (serigrafía) para UNA palabra del titular.
 *
 * USO: <Overprint>cambiar</Overprint>. Solo texto plano: se copia a data-text para la 2ª tinta.
 * SI LO CAMBIÁS O SACÁS: Usalo una vez por pantalla: si todo está torcido, nada destaca. Los colores salen de --blue-600 y --red-500.
 */
import s from './Overprint.module.css';

export default function Overprint({ children }) {
  return (
    <span className={s.wrap}>
      <span className={s.visual} aria-hidden="true" data-text={children}>
        {children}
      </span>
      <span className="sr-only">{children}</span>
    </span>
  );
}
