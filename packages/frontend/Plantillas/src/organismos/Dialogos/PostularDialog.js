/**
 * Diálogos con formulario: PostularDialog, DenunciaDialog y ValoracionDialog (todos sobre ConfirmDialog).
 *
 * USO: open, onCancel, onConfirm(datos).
 * SI LO CAMBIÁS O SACÁS: Cada uno devuelve sus datos en onConfirm: la pantalla decide qué hacer.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un diálogo nuevo: copiá uno, cambiá los campos y el título.
 */
import { useState, useEffect } from 'react';
import { Checkbox, Field, Text } from '../../atomos';
import { ConfirmDialog } from '../../moleculas';
import s from './Dialogos.module.css';

export function PostularDialog({ open, perfiles, perfilInicial, onCancel, onConfirm }) {
  const [perfil, setPerfil] = useState(perfilInicial);
  const [publica, setPublica] = useState(true);
  useEffect(() => { if (open) { setPerfil(perfilInicial); setPublica(true); } }, [open, perfilInicial]);
  return (
    <ConfirmDialog open={open} title="Postularme" confirmLabel="Enviar postulación" onCancel={onCancel} onConfirm={() => onConfirm({ perfil, publica })}>
      <div className={s.form}>
        <Field as="select" label="Perfil al que te postulás" value={perfil} onChange={(e) => setPerfil(e.target.value)}>
          {perfiles.map((p) => <option key={p.rol} value={p.rol}>{p.rol}</option>)}
        </Field>
        <Checkbox checked={publica} onChange={(e) => setPublica(e.target.checked)}>Registrar mi contribución públicamente</Checkbox>
        <Text variant="small">Si lo desmarcás, la contribución figura en la plataforma pero sin tu nombre. Tus datos de contacto solo se comparten con la organización si aceptan tu postulación.</Text>
      </div>
    </ConfirmDialog>
  );
}
