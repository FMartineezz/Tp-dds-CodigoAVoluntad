/**
 * Editor de medios de contacto internos (correo, WhatsApp, SMS).
 *
 * USO: value=[[tipo, dato]], onChange.
 * SI LO CAMBIÁS O SACÁS: Los medios NO se muestran públicamente: solo al aceptar una postulación.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Tipo nuevo (ej. Telegram): agregá un <option> al select de este archivo.
 */
import { useState } from 'react';
import { Button, Field, Icon } from '../../atomos';
import s from './ContactosEditor.module.css';

export function ContactosEditor({ value, onChange }) {
  const [tipo, setTipo] = useState('Correo');
  const [val, setVal] = useState('');
  const agregar = () => { if (!val.trim()) return; onChange([...value, [tipo, val.trim()]]); setVal(''); };
  return (
    <div className={s.contactos}>
      <span className={s.pl}>Medios de contacto <span className={s.hint}>(opcional, no se muestran públicamente)</span></span>
      {value.length > 0 && (
        <ul className={s.clist}>
          {value.map(([t, v], i) => (
            <li key={i}><b>{t}</b><span>{v}</span><button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={`Quitar ${t} ${v}`}><Icon name="x" size={10} /></button></li>
          ))}
        </ul>
      )}
      <div className={s.cadd}>
        <Field as="select" label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}><option>Correo</option><option>WhatsApp</option><option>SMS</option></Field>
        <Field label="Dato de contacto" placeholder={tipo === 'Correo' ? 'nombre@correo.org' : '+54 11 5555-0000'} value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }} />
        <Button type="button" variant="secondary" onClick={agregar}>Agregar</Button>
      </div>
    </div>
  );
}
