/**
 * Diálogo modal de confirmación (usa <dialog> nativo: foco, Esc y accesibilidad incluidos).
 *
 * USO: open, title, confirmLabel, cancelLabel, danger, loading, onConfirm, onCancel, children = contenido.
 * SI LO CAMBIÁS O SACÁS: El enunciado exige advertir las acciones permanentes (desvincular, borrar): usá danger.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Un diálogo con formulario adentro: mirá organismos/Dialogos/ (PostularDialog, DenunciaDialog…).
 */
import { useEffect, useId, useRef } from 'react';
import s from './ConfirmDialog.module.css';
import Button from '../../atomos/Button/Button.js';
import Heading from '../../atomos/Heading/Heading.js';

export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault(); // Esc: que decida el padre
        onCancel?.();
      }}
      onClick={(e) => e.target === ref.current && onCancel?.()}
    >
      <div className={s.inner}>
        <Heading as="h2" size="h3" id={titleId}>
          {title}
        </Heading>
        <div className={s.body}>{children}</div>
        <div className={s.actions}>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
