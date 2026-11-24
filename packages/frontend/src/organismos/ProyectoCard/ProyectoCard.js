/**
 * Tarjeta de un proyecto (usa Ticket). Se repite en Inicio, Proyectos, Colectivo, Mis proyectos…
 *
 * USO: p = proyecto, footer (botones propios), extra (filas extra).
 * SI LO CAMBIÁS O SACÁS: Cambiarla acá cambia todas las listas de proyectos a la vez.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Una fila más: agregá un <TicketRow> en este archivo (para todas) o pasalo por extra (solo en una pantalla).
 */
import { Link } from 'react-router-dom';
import { Button, Progress, StatusBadge, Tag } from '../../atomos';
import { Ticket, TicketRow } from '../../moleculas';

export function ProyectoCard({ p, footer, extra }) {
  return (
    <Ticket
      meta={`Proyecto #${String(p.id).padStart(3, '0')}`}
      status={<StatusBadge status={p.estado} />}
      title={p.titulo}
      footer={footer ?? <Button as={Link} to={`/proyectos/${p.id}`} variant={p.estado === 'abierto' ? 'primary' : 'secondary'}>{p.estado === 'abierto' ? 'Ver y postularme' : 'Ver proyecto'}</Button>}
    >
      <TicketRow label="Colectivo">{p.colectivo}</TicketRow>
      {extra}
      <TicketRow label="Buscamos">
        {p.habilidades.map((k, i) => <Tag key={k} tone={i === 0 ? 'sand' : i === 1 ? 'blue' : 'outline'}>{k}</Tag>)}
      </TicketRow>
      <TicketRow label="Tiempo">{p.tiempo}</TicketRow>
      {p.modalidad && <TicketRow label="Modalidad">{p.modalidad.map((m) => <Tag key={m}>{m}</Tag>)}</TicketRow>}
      <TicketRow label="Avance">
        <Progress value={p.avance} />
        <b>{p.avance} %</b>
      </TicketRow>
    </Ticket>
  );
}
