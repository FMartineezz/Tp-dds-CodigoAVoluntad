/**
 * PANTALLA RegistroColaboradora
 * Ruta: /registro/colaboradora   ·   Quién la ve: Sin sesión
 * Qué muestra: Alta de colaboradora: nombre de fantasía, habilidades, contactos
 *   internos, captcha y términos.
 * Para modificarla: un campo nuevo = un <Field> más dentro de la grilla .form
 *   (y su regla en useForm si es obligatorio).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: lo que la pantalla recuerda (campos de texto, habilidades,
 *      contactos) y el manejo de validación que viene de auxiliares.js.
 *   2. CÁLCULOS: las reglas de validación y los errores que se ven en este momento.
 *   3. ACCIONES: cómo se guarda cada cambio de un campo.
 *   4. LO QUE SE DIBUJA: el formulario completo.
 *
 * Cómo se validan los campos: al salir de un campo (onBlur) se muestra su error; al
 * apretar «Crear cuenta» se muestran todos y aparece el resumen rojo arriba
 * (la explicación completa está en acceso/auxiliares.js → useForm).
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Checkbox, Field, Heading } from '../../atomos';
import {
  Alert,
  CaptchaMock,
  ContactosEditor,
  PasswordField,
  SocialButtons,
  TagPicker,
} from '../../moleculas';
import { HABILIDADES } from '../../datos'; // lista de habilidades que se pueden elegir
// piezas compartidas con el otro registro
import { MAIL, useForm, Resumen, useSocial } from './auxiliares.js';
import s from './Ingresar.module.css';
import sh from '../../plantillas/disposicion.module.css'; // sh = layout común (.page, .form…)

export default function RegistroColaboradora() {
  // ───── 1. DATOS Y ESTADO ─────

  // Todos los campos simples del formulario juntos en un objeto: texto para los
  // campos, true/false para las casillas (mensajes, terminos, captcha).
  // Empiezan vacíos (mensajes empieza tildado); los cambia alCambiarCampo y el captcha.
  // (ver docs/GLOSARIO.md → useState)
  const [datos, setDatos] = useState({
    fantasia: '',
    nombre: '',
    apellido: '',
    pronombres: '',
    github: '',
    mail: '',
    pass: '',
    bio: '',
    mensajes: true,
    terminos: false,
    captcha: false,
  });

  // Habilidades elegidas, como array de textos, ej. ['React', 'Node'].
  // Empieza vacío; lo cambia el TagPicker.
  const [habilidadesElegidas, setHabilidadesElegidas] = useState([]);

  // Contactos internos: array de pares [tipo, dato], ej. ['WhatsApp', '+54 11…'].
  // Empieza vacío; lo cambia el ContactosEditor.
  const [contactos, setContactos] = useState([]);

  // Manejo de validación (ver auxiliares.js → useForm). Devuelve funciones y banderas:
  // formulario.blur / .enviar / .errores y .cargando / .listo / .intento.
  // Se le pasa la función con las reglas (validarDatos, más abajo).
  const formulario = useForm(validarDatos);

  // Función que, al elegir una red social, abre sesión como colaboradora ('col').
  const entrarConRedSocial = useSocial();

  // ───── 2. CÁLCULOS ─────

  // Reglas de validación. Recibe los datos y devuelve un objeto con un mensaje por cada
  // campo inválido ({} si está todo bien). Se declara con `function`, por eso se puede
  // usar arriba en useForm aunque esté escrita más abajo.
  function validarDatos(valores) {
    const erroresDelFormulario = {};
    if (!valores.fantasia.trim()) {
      erroresDelFormulario.fantasia = 'Ingresá un nombre de fantasía.';
    }
    if (!MAIL.test(valores.mail)) {
      erroresDelFormulario.mail = 'Ingresá un correo válido.';
    }
    if (valores.pass.length < 8) {
      erroresDelFormulario.pass = 'La contraseña debe tener al menos 8 caracteres.';
    }
    if (!valores.terminos) {
      erroresDelFormulario.terminos = 'Tenés que aceptar los términos.';
    }
    if (!valores.captcha) {
      erroresDelFormulario.captcha = 'Confirmá que no sos un robot.';
    }
    return erroresDelFormulario;
  }

  // Errores que se muestran AHORA: los de campos ya «tocados» o, si ya se intentó
  // enviar, los de todos. Se recalcula en cada dibujado.
  const errores = formulario.errores(datos);

  // ───── 3. ACCIONES ─────

  // Devuelve el manejador onChange de un campo: `alCambiarCampo('mail')` se ejecuta
  // cuando la persona escribe en «mail» (o tilda/destilda una casilla).
  // Casillas: se guarda `checked` (true/false); campos de texto: se guarda `value`.
  function alCambiarCampo(campo) {
    return function (evento) {
      const esCasilla = evento.target.type === 'checkbox';
      const nuevoValor = esCasilla ? evento.target.checked : evento.target.value;
      // `...datos` copia todo lo que había y `[campo]: nuevoValor` cambia solo ese campo
      // (ver docs/GLOSARIO.md → Copiar con cambios).
      setDatos({ ...datos, [campo]: nuevoValor });
    };
  }

  // Se ejecuta cuando la persona tilda el captcha de prueba (recibe true o false).
  function alCambiarCaptcha(resuelto) {
    setDatos({ ...datos, captcha: resuelto });
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    // onSubmit: al enviar, formulario.enviar(datos) valida y simula el envío
    <form className={`container ${sh.page}`} onSubmit={formulario.enviar(datos)} noValidate>
      <Heading level={1}>Crear cuenta · Colaboradora</Heading>

      {/* Aparece solo cuando el envío simulado terminó (listo = true) */}
      {formulario.listo && (
        <Alert kind="success" title="Cuenta creada">
          Ya podés <Link to="/ingresar">ingresar</Link>.
        </Alert>
      )}

      {/* BLOQUE: resumen de errores — aparece solo después de intentar enviar y si hay errores */}
      <Resumen errores={errores} mostrar={formulario.intento} />

      {/* BLOQUE: campos — grilla del formulario; sh.r2 / sh.mid / sh.full controlan cuánto
         ocupa cada uno */}
      <div className={sh.form}>
        {/* onBlur = al salir del campo (activa su validación); `optional` = campo no
           obligatorio */}
        <Field
          label="Nombre de fantasía"
          hint="Podés mantenerte anónima."
          placeholder="Cómo querés que te llamen"
          value={datos.fantasia}
          onChange={alCambiarCampo('fantasia')}
          onBlur={formulario.blur('fantasia')}
          error={errores.fantasia}
        />
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
          label="Nombre"
          optional
          placeholder="Nombre"
          value={datos.nombre}
          onChange={alCambiarCampo('nombre')}
        />
        <Field
          label="Apellido"
          optional
          placeholder="Apellido"
          value={datos.apellido}
          onChange={alCambiarCampo('apellido')}
        />
        <Field
          label="Pronombres"
          optional
          placeholder="Ej: ella, él, elle"
          value={datos.pronombres}
          onChange={alCambiarCampo('pronombres')}
        />
        <Field
          label="Cuenta de GitHub o GitLab"
          optional
          placeholder="usuario"
          value={datos.github}
          onChange={alCambiarCampo('github')}
        />
        <Field
          label="Correo electrónico"
          type="email"
          placeholder="nombre@correo.org"
          value={datos.mail}
          onChange={alCambiarCampo('mail')}
          onBlur={formulario.blur('mail')}
          error={errores.mail}
        />
        <TagPicker
          label="Habilidades"
          value={habilidadesElegidas}
          options={HABILIDADES}
          onChange={setHabilidadesElegidas}
        />
        <PasswordField
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          value={datos.pass}
          onChange={alCambiarCampo('pass')}
          onBlur={formulario.blur('pass')}
          error={errores.pass}
        />
        <div className={sh.mid}>
          <Checkbox checked={datos.mensajes} onChange={alCambiarCampo('mensajes')}>
            Permitir mensajes de organizaciones
          </Checkbox>
        </div>
        <div className={sh.full}>
          <ContactosEditor value={contactos} onChange={setContactos} />
        </div>
        <div className={sh.full}>
          <CaptchaMock ok={datos.captcha} onChange={alCambiarCaptcha} error={errores.captcha} />
        </div>
        <div className={sh.full}>
          <Checkbox checked={datos.terminos} onChange={alCambiarCampo('terminos')}>
            Acepto los <Link to="/terminos">términos y condiciones</Link>
          </Checkbox>
          {/* Aparece solo si hay error en términos (no se tildó y ya se tocó o se intentó enviar) */}
          {errores.terminos && <p className={s.err}>{errores.terminos}</p>}
        </div>
      </div>

      {/* BLOQUE: botón de envío — muestra «cargando» durante la espera simulada */}
      <div className={sh.formActs}>
        <Button type="submit" loading={formulario.cargando}>Crear cuenta</Button>
      </div>

      {/* BLOQUE: registro social — alternativa sin formulario */}
      <div className={s.narrow}>
        <SocialButtons verbo="Registrarme" onEntrar={entrarConRedSocial('col')} />
      </div>
    </form>
  );
}
