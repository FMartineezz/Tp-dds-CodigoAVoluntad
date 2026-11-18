/* MenuUsuario: ver el comentario de Campana.js (mismas piezas, mismo CSS). */
import { useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../atomos';
import { useAuth } from '../../contexto';
import { useDisclosure } from '../../hooks';
import s from './BarraSuperior.module.css';

export function MenuUsuario() {
  const { rol, salir, dalt, toggleDalt } = useAuth();
  const nav = useNavigate();
  const { open, setOpen, ref } = useDisclosure();
  const id = useId();
  return (
    <div className={s.wrap} ref={ref}>
      <button type="button" className={`${s.btn} ${s.texto}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        <Icon name="usuario" size={16} /> Mi cuenta <Icon name="chevron-abajo" size={10} />
      </button>
      {open && (
        <ul id={id} className={`${s.panel} ${s.menu}`}>
          <li><Link to={rol === 'org' ? '/org/perfil' : '/panel/perfil'} onClick={() => setOpen(false)}>Mi perfil</Link></li>
          <li>
            <button type="button" role="switch" aria-checked={dalt} onClick={toggleDalt}>
              Modo daltónico <span className={`${s.sw} ${dalt ? s.on : ''}`} aria-hidden="true" />
            </button>
          </li>
          <li><button type="button" onClick={() => { setOpen(false); salir(); nav('/'); }}>Salir</button></li>
        </ul>
      )}
    </div>
  );
}
