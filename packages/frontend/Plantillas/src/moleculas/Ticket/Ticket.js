/**
 * Tarjeta tipo ticket con borde perforado: LA tarjeta de proyecto. Incluye TicketRow.
 *
 * USO: Slots: meta (izq.), status (der.), title, children (filas), footer (acciones), stamp. titleAs define el nivel real del título.
 * SI LO CAMBIÁS O SACÁS: ProyectoCard (organismo) deja de funcionar.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Una fila nueva en la tarjeta: agregá un <TicketRow label="Algo">valor</TicketRow> entre los children.
 *   Un botón nuevo: ponelo dentro de footer={<>…</>}.
 */
import s from './Ticket.module.css';
import Heading from '../../atomos/Heading/Heading.js';
import { cx } from '../../utilidades/cx.js';

export function Ticket({ meta, status, title, titleAs = 'h3', tilt = false, stamp, footer, children }) {
  return (
    <article className={cx(s.ticket, tilt && s.tilt)}>
      <div className={s.head}>
        <span>{meta}</span>
        <span>{status}</span>
      </div>
      <Heading as={titleAs} size="h3" className={s.title}>
        {title}
      </Heading>
      <dl className={s.rows}>{children}</dl>
      {footer && <div className={s.footer}>{footer}</div>}
      {stamp && <div className={s.stamp}>{stamp}</div>}
    </article>
  );
}

/** Fila etiqueta/valor dentro de un Ticket. */
export function TicketRow({ label, children }) {
  return (
    <div className={s.row}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
