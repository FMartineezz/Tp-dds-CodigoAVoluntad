/**
 * Foto de perfil con los botones para subirla, cambiarla o quitarla. La sube apenas se
 * elige el archivo (no espera al «Guardar» del formulario).
 *
 * USO: <SubirFoto recurso="colectivos" id={id} nombre={datos.nombre} square
 *        foto={fotoSubida} fotoDeRespaldo={fotoDe(id)} alCambiar={setFotoSubida} />
 *   · recurso: 'colectivos' | 'colaboradoras' (la ruta del backend).
 *   · foto: URL de la foto subida, o null si no subió ninguna.
 *   · fotoDeRespaldo: lo que se ve si no subió foto (su enlace o la del seed); sin nada, la inicial.
 *   · alCambiar(urlNueva | null): avisa la foto nueva (o null si la quitó).
 * De dónde salen los datos: PUT y DELETE /:recurso/:id/foto (api/fotos.js).
 */
import { useRef, useState } from 'react';
import { Avatar, Button } from '../../atomos';
import { borrarFoto, subirFoto } from '../../api/fotos.js';
import { mensajeDeError } from '../../api/errores.js';
import s from './SubirFoto.module.css';

// El error puede venir del backend (tiene response) o de leer la imagen en el navegador.
const textoDeError = (error) => (error.response ? mensajeDeError(error) : error.message);

export function SubirFoto({ recurso, id, nombre, foto, fotoDeRespaldo, square = false, alCambiar }) {
  // El <input type="file"> está escondido: el botón lo abre
  const entrada = useRef(null);
  // 'subiendo' | 'quitando' | null: el botón que corresponde muestra espera
  const [trabajando, setTrabajando] = useState(null);
  const [error, setError] = useState('');

  async function alElegirArchivo(evento) {
    const archivo = evento.target.files[0];
    // Se vacía para que elegir el mismo archivo otra vez también funcione
    evento.target.value = '';
    if (!archivo) return;

    setTrabajando('subiendo');
    setError('');
    try {
      alCambiar(await subirFoto(recurso, id, archivo));
    } catch (e) {
      setError(textoDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  async function alQuitar() {
    setTrabajando('quitando');
    setError('');
    try {
      await borrarFoto(recurso, id);
      alCambiar(null);
    } catch (e) {
      setError(textoDeError(e));
    } finally {
      setTrabajando(null);
    }
  }

  return (
    <div className={s.subirFoto}>
      <Avatar nombre={nombre || '?'} size={96} square={square} foto={foto || fotoDeRespaldo} />
      <div className={s.acciones}>
        <input ref={entrada} type="file" accept="image/*" hidden onChange={alElegirArchivo} />
        <div className={s.botones}>
          <Button
            variant="secondary"
            loading={trabajando === 'subiendo'}
            disabled={trabajando !== null}
            onClick={() => entrada.current.click()}
          >
            {foto ? 'Cambiar foto' : 'Subir foto'}
          </Button>
          {foto && (
            <Button variant="link" loading={trabajando === 'quitando'} disabled={trabajando !== null} onClick={alQuitar}>
              Quitar
            </Button>
          )}
        </div>
        <span className={s.ayuda}>JPG o PNG. Se recorta cuadrada.</span>
        {error && <span className={s.error} role="alert">{error}</span>}
      </div>
    </div>
  );
}
