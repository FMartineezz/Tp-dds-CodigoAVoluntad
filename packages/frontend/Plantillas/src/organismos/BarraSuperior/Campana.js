/**
 * Piezas del header con sesión: Campana (notificaciones), MenuUsuario (Mi cuenta) y BottomNav (barra inferior móvil).
 *
 * USO: Campana y MenuUsuario van en actions de Navbar. BottomNav se muestra solo en móvil.
 * SI LO CAMBIÁS O SACÁS: Si sacás BottomNav, en móvil queda solo el botón «Menú».
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un ítem más en el menú de usuario: otro <li> en MenuUsuario.
 *   Un destino más en la barra inferior: una fila más en menus.js (se calcula de ahí).
 *   Una notificación: las de la colaboradora (rol 'col') vienen del backend
 *   (GET /colaboradoras/:id/notificaciones, ver api/colaboradora.js); las de la organización
 *   (rol 'org') de GET /colectivos/:id/notificaciones (ver api/organizacion.js).
 */
import { useState, useId } from 'react';
import { Icon } from '../../atomos';
import { NOTIFICACIONES } from '../../datos';
import { useAuth } from '../../contexto';
import { useDisclosure, usePedido } from '../../hooks';
import { obtenerNotificaciones } from '../../api/colaboradora.js';
import { obtenerNotificacionesDelColectivo } from '../../api/organizacion.js';
import s from './BarraSuperior.module.css';

export function Campana() {
  // `idCuenta` = _id de la cuenta con sesión (se renombra porque `id` ya se usa abajo).
  const { rol, id: idCuenta } = useAuth();
  const { open, setOpen, ref } = useDisclosure();
  const id = useId();
  // Colaboradora y organización: se piden al backend (cada una a su endpoint).
  // (Mientras carga o si falla, la campana queda sin avisos en vez de romperse.)
  const { datos: deLaColaboradora } = usePedido(
    () => (rol === 'col' && idCuenta ? obtenerNotificaciones(idCuenta) : Promise.resolve(null)),
    [rol, idCuenta]
  );
  // Organización: GET /colectivos/:id/notificaciones (ver api/organizacion.js).
  const { datos: deLaOrganizacion } = usePedido(
    () => (rol === 'org' && idCuenta ? obtenerNotificacionesDelColectivo(idCuenta) : Promise.resolve(null)),
    [rol, idCuenta]
  );
  const porRol = { col: deLaColaboradora, org: deLaOrganizacion };
  const items = (rol in porRol ? porRol[rol] : NOTIFICACIONES[rol]) ?? [];
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
