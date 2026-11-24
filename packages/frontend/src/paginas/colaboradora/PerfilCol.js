/**
 * PANTALLA PerfilCol
 * Ruta: /panel/perfil   ·   Quién la ve: Colaboradora
 * Qué muestra: Edición del perfil: datos, habilidades, contactos, redes, mensajes y LinkedIn.
 * Para modificarla: un campo nuevo = un <Field> en la grilla .form.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: los datos del perfil (con valores de ejemplo), habilidades,
 *      contactos y el estado del guardado (guardando, mensaje de éxito, errores).
 *   3. ACCIONES: cambiar un campo, importar desde LinkedIn y guardar con validación.
 *   4. LO QUE SE DIBUJA: el formulario completo.
 *
 * Aviso de éxito: cualquier cambio en un campo borra el mensaje de éxito anterior
 * (así no queda un «Cambios guardados» que ya no es cierto).
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Checkbox, Field, Heading } from '../../atomos';
import { Alert, ContactosEditor, TagPicker } from '../../moleculas';
import { HABILIDADES } from '../../datos'; // lista de habilidades que se pueden elegir
import s from './Colaboradora.module.css';
import sh from '../../plantillas/disposicion.module.css'; // sh = layout común (.page, .form…)

export default function PerfilCol() {
  // ───── 1. DATOS Y ESTADO ─────

  // Todos los campos simples del perfil juntos en un objeto: texto para los campos,
  // true/false para la casilla `mensajes`. Empiezan con datos de ejemplo de «Lucía».
  // Los cambia alCambiarCampo y alImportarDeLinkedIn.
  // (ver docs/GLOSARIO.md → useState)
  const [datos, setDatos] = useState({
    fantasia: 'Lucía',
    nombre: 'Lucía',
    apellido: 'Fernández',
    pronombres: 'ella',
    github: 'lucia-dev',
    linkedin: '',
    web: '',
    bio: 'Desarrolladora front. Me gusta que las herramientas sean simples para quien las usa.',
    mail: 'colaboradora@demo.org',
    mensajes: true,
  });

  // Habilidades elegidas, como array de textos. Empieza con dos de ejemplo; las cambia
  // el TagPicker y alImportarDeLinkedIn (que suma «Accesibilidad»).
  const [habilidadesElegidas, setHabilidadesElegidas] = useState(['React', 'Node']);

  // Contactos internos: array de pares [tipo, dato]. Empieza con dos de ejemplo;
  // lo cambia el ContactosEditor.
  const [contactos, setContactos] = useState([
    ['Correo', 'colaboradora@demo.org'],
    ['WhatsApp', '+54 11 5555-0199'],
  ]);

  // true durante la espera simulada del guardado (el botón muestra «cargando»).
  // Lo cambia alGuardar.
  const [guardando, setGuardando] = useState(false);

  // Mensaje verde de éxito o de aviso ('' = no se muestra). Lo ponen alGuardar y
  // alImportarDeLinkedIn; lo borran los cambios en los campos y la «x» del aviso.
  const [mensajeOk, setMensajeOk] = useState('');

  // Errores por campo, ej. { fantasia: '…', mail: '…' }. Empieza vacío ({} = sin errores);
  // lo cambia alGuardar.
  const [errores, setErrores] = useState({});

  // ───── 3. ACCIONES ─────

  // Devuelve el manejador onChange de un campo: `alCambiarCampo('mail')` se ejecuta cuando
  // la persona escribe en «mail» (o tilda una casilla). Borra el aviso de éxito anterior.
  // Casillas: se guarda `checked` (true/false); campos de texto: se guarda `value`.
  function alCambiarCampo(campo) {
    return function (evento) {
      setMensajeOk('');
      const esCasilla = evento.target.type === 'checkbox';
      const nuevoValor = esCasilla ? evento.target.checked : evento.target.value;
      // `...datos` copia todo lo que había y `[campo]: nuevoValor` cambia solo ese campo
      // (ver docs/GLOSARIO.md → Copiar con cambios)
      setDatos({ ...datos, [campo]: nuevoValor });
    };
  }

  // Se ejecuta al cambiar las habilidades en el TagPicker (recibe la lista nueva).
  function alCambiarHabilidades(habilidadesNuevas) {
    setMensajeOk('');
    setHabilidadesElegidas(habilidadesNuevas);
  }

  // Se ejecuta al cambiar los contactos en el ContactosEditor (recibe la lista nueva).
  function alCambiarContactos(contactosNuevos) {
    setMensajeOk('');
    setContactos(contactosNuevos);
  }

  // Se ejecuta al apretar «Importar desde LinkedIn». Es una simulación: completa LinkedIn
  // y la presentación con datos de ejemplo y suma la habilidad «Accesibilidad».
  // Nada se guarda hasta apretar «Guardar cambios».
  function alImportarDeLinkedIn() {
    // setDatos con una función recibe los datos actuales y devuelve los nuevos
    setDatos((datosPrevios) => ({
      ...datosPrevios,
      linkedin: 'linkedin.com/in/lucia-fernandez',
      bio: 'Desarrolladora front con 5 años de experiencia en React y accesibilidad.',
    }));
    // new Set(...) descarta repetidos: así «Accesibilidad» no se duplica si ya estaba
    setHabilidadesElegidas((habilidadesPrevias) => {
      return [...new Set([...habilidadesPrevias, 'Accesibilidad'])];
    });
    setMensajeOk(
      'Importamos tu presentación y tus habilidades desde LinkedIn. Revisalas antes de guardar.',
    );
  }

  // Se ejecuta al apretar «Guardar cambios». Primero valida; si hay errores corta acá y
  // no «llama a la API».
  function alGuardar(evento) {
    // evita que el navegador recargue la página (comportamiento normal de un <form>)
    evento.preventDefault();

    // Validación: un mensaje por cada campo obligatorio mal completado.
    const erroresNuevos = {};
    if (!datos.fantasia.trim()) {
      erroresNuevos.fantasia = 'Ingresá un nombre de fantasía.';
    }
    if (!/^\S+@\S+\.\S+$/.test(datos.mail)) {
      // la expresión regular pide «algo@algo.algo», sin espacios
      erroresNuevos.mail = 'Ingresá un correo válido.';
    }
    setErrores(erroresNuevos);
    setMensajeOk('');

    const hayErrores = Object.keys(erroresNuevos).length > 0;
    if (hayErrores) {
      return;
    }

    // Se simula la espera con setTimeout (ejecuta la función de adentro a los 700 ms);
    // en producción acá iría la llamada a la API y esto correría cuando responda.
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setMensajeOk('Cambios guardados.');
    }, 700);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <form className={`container ${sh.page}`} onSubmit={alGuardar} noValidate>
      {/* BLOQUE: encabezado — título y botón para importar datos de LinkedIn */}
      <div className={`${sh.row} ${sh.sb}`}>
        <Heading level={1}>Mi perfil</Heading>
        <Button type="button" variant="secondary" onClick={alImportarDeLinkedIn}>
          Importar desde LinkedIn
        </Button>
      </div>

      {/* Aparece solo si hay un mensaje de éxito/aviso (`mensajeOk` no vacío); la «x» lo borra */}
      {mensajeOk && <Alert kind="success" onClose={() => setMensajeOk('')}>{mensajeOk}</Alert>}

      {/* BLOQUE: campos — grilla; sh.r2 / sh.mid / sh.full controlan cuánto ocupa cada uno */}
      {/* `optional` = campo no obligatorio; error={errores.x} muestra el mensaje solo si existe */}
      <div className={sh.form}>
        {/* Foto: el avatar usa el nombre de fantasía (o «L» si está vacío; `||` = «o, si no,
           usá») */}
        <div className={sh.r2}>
          <span className={s.lab}>Foto</span>
          <div className={sh.foto}>
            <Avatar nombre={datos.fantasia || 'L'} size={96} />
            <Button type="button" variant="secondary">Cambiar foto</Button>
          </div>
        </div>
        <Field
          as="textarea"
          className={sh.r2}
          label="Sobre vos"
          optional
          placeholder="Contá en pocas líneas quién sos y qué te gusta hacer…"
          value={datos.bio}
          onChange={alCambiarCampo('bio')}
        />
        <Field
          label="Nombre de fantasía"
          value={datos.fantasia}
          onChange={alCambiarCampo('fantasia')}
          error={errores.fantasia}
        />
        <TagPicker
          label="Habilidades"
          value={habilidadesElegidas}
          options={HABILIDADES}
          onChange={alCambiarHabilidades}
        />
        <Field
          label="Nombre"
          optional
          value={datos.nombre}
          onChange={alCambiarCampo('nombre')}
        />
        <Field
          label="Apellido"
          optional
          value={datos.apellido}
          onChange={alCambiarCampo('apellido')}
        />
        <Field
          label="Pronombres"
          optional
          value={datos.pronombres}
          onChange={alCambiarCampo('pronombres')}
        />
        <Field
          label="Cuenta de GitHub o GitLab"
          optional
          value={datos.github}
          onChange={alCambiarCampo('github')}
        />
        <Field
          label="Correo de la cuenta"
          type="email"
          value={datos.mail}
          onChange={alCambiarCampo('mail')}
          error={errores.mail}
        />
        <Field
          label="LinkedIn"
          optional
          placeholder="linkedin.com/in/usuario"
          value={datos.linkedin}
          onChange={alCambiarCampo('linkedin')}
        />
        <Field
          label="Sitio web"
          optional
          placeholder="https://"
          value={datos.web}
          onChange={alCambiarCampo('web')}
        />
        <div className={sh.mid}>
          <Checkbox checked={datos.mensajes} onChange={alCambiarCampo('mensajes')}>
            Permitir mensajes de organizaciones
          </Checkbox>
        </div>
        <div className={sh.full}>
          <ContactosEditor value={contactos} onChange={alCambiarContactos} />
        </div>
      </div>

      {/* BLOQUE: botones finales — guardar (con «cargando» mientras guarda) o cancelar */}
      <div className={sh.formActs}>
        <Button type="submit" loading={guardando}>Guardar cambios</Button>
        <Button as={Link} to="/panel" variant="secondary">Cancelar</Button>
      </div>
    </form>
  );
}
