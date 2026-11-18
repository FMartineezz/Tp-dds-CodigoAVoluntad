/**
 * Pestañas reales: tablist + tab + tabpanel, con flechas del teclado.
 *
 * USO: tabs=[{id,label}], value, onChange. El contenido de la pestaña activa va como children.
 * SI LO CAMBIÁS O SACÁS: No uses <a> en lugar de botones: perdería el comportamiento accesible.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Pestaña nueva: agregá {id:'x', label:'Texto'} al array tabs de la pantalla y un bloque {tab==='x' && …} en el contenido.
 */
import { useId } from 'react';
import s from './Tabs.module.css';

export function Tabs({ tabs, value, onChange, children }) {
  const id = useId();
  const onKey = (e, i) => {
    const n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null;
    if (n === null) return;
    const t = tabs[(n + tabs.length) % tabs.length];
    onChange(t.id);
    document.getElementById(`${id}-${t.id}`)?.focus();
  };
  return (
    <div>
      <div role="tablist" className={s.tabs}>
        {tabs.map((t, i) => (
          <button key={t.id} id={`${id}-${t.id}`} role="tab" type="button" aria-selected={value === t.id} aria-controls={`${id}-p`} tabIndex={value === t.id ? 0 : -1} onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-p`} aria-labelledby={`${id}-${value}`} className={s.panel}>{children}</div>
    </div>
  );
}
