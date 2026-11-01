/* DenunciaDialog: ver Dialogos explicado en PostularDialog.js. */
import { useState, useEffect } from 'react';
import { Field, Text } from '../../atomos';
import { ConfirmDialog } from '../../moleculas';
import { MOTIVOS_DENUNCIA } from '../../datos';
import s from './Dialogos.module.css';

export function DenunciaDialog({ open, a, onCancel, onConfirm }) {
  const [motivo, setMotivo] = useState(MOTIVOS_DENUNCIA[0]);
  const [texto, setTexto] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (open) { setMotivo(MOTIVOS_DENUNCIA[0]); setTexto(''); setErr(''); } }, [open]);
  const enviar = () => { if (!texto.trim()) return setErr('Contanos brevemente qué pasó.'); onConfirm({ motivo, texto }); };
  return (
    <ConfirmDialog open={open} danger title={`Denunciar a ${a}`} confirmLabel="Enviar denuncia" onCancel={onCancel} onConfirm={enviar}>
      <div className={s.form}>
        <Field as="select" label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>{MOTIVOS_DENUNCIA.map((m) => <option key={m}>{m}</option>)}</Field>
        <Field as="textarea" label="¿Qué pasó?" placeholder="Describí lo sucedido…" value={texto} onChange={(e) => setTexto(e.target.value)} error={err} />
        <Text variant="small">Solo pueden denunciar quienes participaron de un proyecto. El equipo administrativo evalúa cada denuncia.</Text>
      </div>
    </ConfirmDialog>
  );
}
