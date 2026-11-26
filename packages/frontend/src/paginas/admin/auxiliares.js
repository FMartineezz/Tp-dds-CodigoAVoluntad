/**
 * Piezas que comparten las pantallas del equipo administrativo (paginas/admin/).
 *   · EstadoTag: la etiqueta del estado de una denuncia o de un reporte.
 *   · PantallaDeError / PantallaCargando: lo que se ve mientras carga o si falló el pedido.
 */
import { Tag } from '../../atomos';
import { Alert, RowsSkeleton } from '../../moleculas';
import { ESTADOS_DE_DENUNCIA, ESTADOS_DE_REPORTE } from '../../api/admin.js';
import { mensajeDeError } from '../../api/errores.js';
import sh from '../../plantillas/disposicion.module.css';

// Amarillo = espera que alguien lo mire; azul = alguien lo está mirando; arena = cerrado.
const TONO_POR_ESTADO = {
  pendiente: 'yellow',
  nuevo: 'yellow',
  en_revision: 'blue',
  resuelta: 'sand',
  resuelto: 'sand',
  descartada: 'outline',
};

export function EstadoTag({ estado }) {
  const texto = ESTADOS_DE_DENUNCIA[estado] ?? ESTADOS_DE_REPORTE[estado] ?? estado;
  return <Tag tone={TONO_POR_ESTADO[estado]}>{texto}</Tag>;
}

export function PantallaCargando() {
  return (
    <div className={`container ${sh.page}`}>
      <RowsSkeleton n={4} />
    </div>
  );
}

export function PantallaDeError({ titulo, error }) {
  return (
    <div className={`container ${sh.page}`}>
      <Alert kind="error" title={titulo}>{mensajeDeError(error)}</Alert>
    </div>
  );
}
