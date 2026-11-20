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

// Número corto para la etiqueta «Proyecto #…». Los ids del backend son ObjectId de 24
// caracteres (ej. '6afe36dd7209c9e0efb5a619'): se muestran solo los últimos 6 ('b5a619').
// Si el id es corto (datos de prueba numéricos), se rellena con ceros: 7 → '007'.
function numeroCorto(id) {
  const texto = String(id);
  return texto.length > 6 ? texto.slice(-6) : texto.padStart(3, '0');
}

export function ProyectoCard({ p, footer, extra }) {
  return (
    <Ticket
      meta={`Proyecto #${numeroCorto(p.id)}`}
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
