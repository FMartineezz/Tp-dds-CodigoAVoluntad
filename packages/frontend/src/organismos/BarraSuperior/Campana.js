/**
 * Piezas del header con sesión: Campana (notificaciones), MenuUsuario (Mi cuenta) y BottomNav (barra inferior móvil).
 *
 * USO: Campana y MenuUsuario van en actions de Navbar. BottomNav se muestra solo en móvil.
 * SI LO CAMBIÁS O SACÁS: Si sacás BottomNav, en móvil queda solo el botón «Menú».
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un ítem más en el menú de usuario: otro <li> en MenuUsuario.
 *   Un destino más en la barra inferior: una fila más en menus.js (se calcula de ahí).
 *   Una notificación: datos/datos.js → NOTIFICACIONES.
 */
import { useState, useId } from 'react';
import { Icon } from '../../atomos';
import { NOTIFICACIONES } from '../../datos';
import { useAuth } from '../../contexto';
import { useDisclosure } from '../../hooks';
import s from './BarraSuperior.module.css';

export function Campana() {
  const { rol } = useAuth();
  const { open, setOpen, ref } = useDisclosure();
  const id = useId();
  const items = NOTIFICACIONES[rol];
  const [leidas, setLeidas] = useState(false);
  const n = leidas ? 0 : items.length;
  return (
    <div className={s.wrap} ref={ref}>
      <button type="button" className={s.btn} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <Icon name="campana" size={18} />
        <span className="sr-only">Notificaciones{n ? `, ${n} sin leer` : ''}</span>
        {n > 0 && <span className={s.count} aria-hidden="true">{n}</span>}
      </button>
      {open && (
        <div id={id} className={s.panel} role="region" aria-label="Notificaciones">
          <ul>
            {items.map((x) => <li key={x.id}><span>{x.texto}</span><small>{x.cuando}</small></li>)}
          </ul>
          <button type="button" className={s.link} onClick={() => setLeidas(true)}>Marcar todo como leído</button>
        </div>
      )}
    </div>
  );
}
