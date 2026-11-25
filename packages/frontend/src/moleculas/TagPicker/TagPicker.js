/**
 * Selector de etiquetas con buscador: las elegidas se ven como chips y, al escribir,
 * aparece la lista de opciones filtrada. Se pueden elegir varias seguidas sin cerrarla.
 *
 * USO: label, value (array), options (array), onChange(array), hint, error, placeholder.
 * TECLADO: ↑/↓ recorren la lista, Enter elige/saca, Escape cierra,
 *          Borrar con el texto vacío saca el último chip.
 * SI LO CAMBIÁS O SACÁS: Es lo que reemplaza a los campos de 'habilidades', 'causas', etc.
 *
 * CÓMO AGREGAR UN HERMANO / EXTENDERLO:
 *   Opciones nuevas: agregalas al array que se pasa en options.
 *   Solo se puede elegir entre las opciones: el backend tiene un catálogo fijo de habilidades.
 */
import { useId, useRef, useState } from 'react';
import { Icon } from '../../atomos';
import { cx } from '../../utilidades/cx.js';
import s from './TagPicker.module.css';

// Compara sin importar mayúsculas ni tildes: «diseno» encuentra «Diseño».
const sinTildes = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function TagPicker({ label, value, options, onChange, hint, error, placeholder = 'Escribí para buscar…' }) {
  const id = useId();
  const input = useRef(null);
  const [busqueda, setBusqueda] = useState('');
  const [abierta, setAbierta] = useState(false);
  // Posición de la opción resaltada con las flechas.
  const [resaltada, setResaltada] = useState(0);

  const encontradas = options.filter((opcion) => sinTildes(opcion).includes(sinTildes(busqueda)));

  function alternar(opcion) {
    onChange(value.includes(opcion) ? value.filter((v) => v !== opcion) : [...value, opcion]);
    setBusqueda('');
    input.current?.focus();
  }

  function alApretarTecla(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setAbierta(true);
      const paso = e.key === 'ArrowDown' ? 1 : -1;
      // El % hace que al pasar el final vuelva al principio (y al revés)
      setResaltada((actual) => (actual + paso + encontradas.length) % Math.max(1, encontradas.length));
    } else if (e.key === 'Enter' && abierta && encontradas[resaltada]) {
      e.preventDefault(); // que no mande el formulario
      alternar(encontradas[resaltada]);
    } else if (e.key === 'Escape') {
      setAbierta(false);
    } else if (e.key === 'Backspace' && !busqueda && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  const idLista = `${id}-lista`;
  const idError = error ? `${id}-error` : undefined;

  return (
    <div
      className={s.picker}
      // Se cierra cuando el foco sale del componente entero (no al tocar una opción)
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setAbierta(false)}
    >
      <label className={s.label} htmlFor={id}>{label}</label>
      {hint && <span className={s.hint}>{hint}</span>}

      <div className={cx(s.caja, error && s.invalida)} onClick={() => input.current?.focus()}>
        {value.map((elegida) => (
          <button
            key={elegida}
            type="button"
            className={s.chip}
            onClick={(e) => { e.stopPropagation(); alternar(elegida); }}
            aria-label={`Quitar ${elegida}`}
          >
            {elegida} <Icon name="x" size={10} />
          </button>
        ))}
        <input
          id={id}
          ref={input}
          className={s.buscador}
          role="combobox"
          aria-expanded={abierta}
          aria-controls={idLista}
          aria-autocomplete="list"
          aria-invalid={error ? true : undefined}
          aria-describedby={idError}
          placeholder={value.length ? '' : placeholder}
          value={busqueda}
          onChange={(e) => { setBusqueda(e.target.value); setResaltada(0); setAbierta(true); }}
          onFocus={() => setAbierta(true)}
          onKeyDown={alApretarTecla}
        />
        <Icon name="chevron-abajo" size={12} />
      </div>

      {abierta && (
        <ul id={idLista} className={s.lista} role="listbox" aria-multiselectable="true" aria-label={label}>
          {encontradas.length === 0 && <li className={s.vacia}>No hay opciones con «{busqueda}».</li>}
          {encontradas.map((opcion, posicion) => (
            <li
              key={opcion}
              role="option"
              aria-selected={value.includes(opcion)}
              className={cx(s.opcion, posicion === resaltada && s.resaltada)}
              // mousedown en vez de click: así el input no pierde el foco y la lista no se cierra
              onMouseDown={(e) => { e.preventDefault(); alternar(opcion); }}
              onMouseEnter={() => setResaltada(posicion)}
            >
              {opcion}
              {value.includes(opcion) && <Icon name="check" size={12} />}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p id={idError} className={s.error}>
          <span aria-hidden="true">✕ </span>{error}
        </p>
      )}
    </div>
  );
}
