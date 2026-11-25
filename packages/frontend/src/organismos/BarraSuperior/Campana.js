/**
 * Piezas del header con sesión: Campana (notificaciones), MenuUsuario (Mi cuenta) y BottomNav (barra inferior móvil).
 *
 * USO: Campana y MenuUsuario van en actions de Navbar. BottomNav se muestra solo en móvil.
 * SI LO CAMBIÁS O SACÁS: Si sacás BottomNav, en móvil queda solo el botón «Menú».
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un ítem más en el menú de usuario: otro <li> en MenuUsuario.
 *   Un destino más en la barra inferior: una fila más en menus.js (se calcula de ahí).
 *   Las notificaciones salen de hooks/useNotificaciones.js (las comparte con «Última actividad»).
 */
import { useState, useId } from 'react';
import { Icon } from '../../atomos';
import { useDisclosure, useNotificaciones } from '../../hooks';
import s from './BarraSuperior.module.css';

export function Campana() {
  const { open, setOpen, ref } = useDisclosure();
  const id = useId();
  // Las de quien tiene la sesión (ver hooks/useNotificaciones.js).
  const { notificaciones: items } = useNotificaciones();
  const [leidas, setLeidas] = useState(false);
  const n = leidas ? 0 : items.length;
  return (
    <div className={s.desplegable} ref={ref}>
      <button type="button" className={s.boton} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <Icon name="campana" size={18} />
        <span className="sr-only">Notificaciones{n ? `, ${n} sin leer` : ''}</span>
        {n > 0 && <span className={s.contador} aria-hidden="true">{n}</span>}
      </button>
      {open && (
        <div id={id} className={s.panel} role="region" aria-label="Notificaciones">
          {items.length === 0 && <p>No tenés notificaciones.</p>}
          <ul>
            {items.map((x) => <li key={x.id}><span>{x.texto}</span><small>{x.cuando}</small></li>)}
          </ul>
          <button type="button" className={s.link} onClick={() => setLeidas(true)}>Marcar todo como leído</button>
        </div>
      )}
    </div>
  );
}
