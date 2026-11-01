/* ValoracionDialog: ver Dialogos explicado en PostularDialog.js. */
import { useState, useEffect } from 'react';
import { Field, Text } from '../../atomos';
import { ConfirmDialog } from '../../moleculas';
import s from './Dialogos.module.css';

export function ValoracionDialog({ open, a, onCancel, onConfirm }) {
  const [puntaje, setPuntaje] = useState(5);
  const [texto, setTexto] = useState('');
  useEffect(() => { if (open) { setPuntaje(5); setTexto(''); } }, [open]);
  return (
    <ConfirmDialog open={open} title={`Valorar a ${a}`} confirmLabel="Publicar valoración" onCancel={onCancel} onConfirm={() => onConfirm({ puntaje, texto })}>
      <div className={s.form}>
        <Field as="select" label="Puntaje" value={puntaje} onChange={(e) => setPuntaje(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} de 5</option>)}
        </Field>
        <Field as="textarea" label="Comentario breve" optional placeholder="Contá cómo fue trabajar juntas…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <Text variant="small">La valoración queda visible en el historial público de ambas partes.</Text>
      </div>
    </ConfirmDialog>
  );
}
