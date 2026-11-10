/**
 * PANTALLA RegistroOrganizacion
 * Ruta: /registro/organizacion   ·   Quién la ve: Sin sesión
 * Qué muestra: Alta de colectivo: tipo, ubicación, causas, captcha y términos.
 * Para modificarla: igual que el registro de colaboradora.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: lo que la pantalla recuerda (campos de texto, causas) y el
 *      manejo de validación que viene de auxiliares.js.
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
import { Alert, CaptchaMock, PasswordField, SocialButtons, TagPicker } from '../../moleculas';
import { CAUSAS, TIPOS, UBICACIONES } from '../../datos'; // listas para el selector y las etiquetas
// piezas compartidas con el otro registro
import { MAIL, useForm, Resumen, useSocial } from './auxiliares.js';
import s from './Ingresar.module.css';
import sh from '../../plantillas/disposicion.module.css'; // sh = layout común (.page, .form…)

export default function RegistroOrganizacion() {
  // ───── 1. DATOS Y ESTADO ─────

  // Todos los campos simples del formulario juntos en un objeto: texto para los
  // campos, true/false para las casillas (terminos, captcha).
  // Empiezan vacíos; los cambia alCambiarCampo y el captcha.
  // (ver docs/GLOSARIO.md → useState)
  const [datos, setDatos] = useState({
    nombre: '',
    desc: '',
    tipo: '',
    ubicacion: '',
    lugar: '',
    mail: '',
    pass: '',
    terminos: false,
    captcha: false,
  });

  // Causas elegidas, como array de textos. Empieza vacío; lo cambia el TagPicker.
  const [causasElegidas, setCausasElegidas] = useState([]);

  // Manejo de validación (ver auxiliares.js → useForm). Devuelve funciones y banderas:
  // formulario.blur / .enviar / .errores y .cargando / .listo / .intento.
  // Se le pasa la función con las reglas (validarDatos, más abajo).
  const formulario = useForm(validarDatos);

  // Función que, al elegir una red social, abre sesión como organización ('org').
  const entrarConRedSocial = useSocial();

  // ───── 2. CÁLCULOS ─────

  // Reglas de validación. Recibe los datos y devuelve un objeto con un mensaje por cada
  // campo inválido ({} si está todo bien). Se declara con `function`, por eso se puede
  // usar arriba en useForm aunque esté escrita más abajo.
  function validarDatos(valores) {
    const erroresDelFormulario = {};
    if (!valores.nombre.trim()) {
      erroresDelFormulario.nombre = 'Ingresá el nombre del colectivo.';
    }
    if (!valores.tipo) {
      erroresDelFormulario.tipo = 'Elegí el tipo de colectivo.';
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
  // cuando la persona escribe en «mail» (o elige en un selector / tilda una casilla).
  // Casillas: se guarda `checked` (true/false); el resto: se guarda `value`.
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
      <Heading level={1}>Crear cuenta · Organización</Heading>

      {/* Aparece solo cuando el envío simulado terminó (listo = true) */}
      {formulario.listo && (
        <Alert kind="success" title="Cuenta creada">
          Ya podés <Link to="/ingresar">ingresar</Link>.
        </Alert>
      )}

      {/* BLOQUE: resumen de errores — aparece solo después de intentar enviar y si hay errores */}
      <Resumen errores={errores} mostrar={formulario.intento} />

      {/* BLOQUE: campos — grilla del formulario; sh.r2 / sh.full controlan cuánto ocupa cada
         uno */}
      <div className={sh.form}>
        {/* onBlur = al salir del campo (activa su validación); `optional` = campo no
           obligatorio */}
        <Field
          label="Nombre del colectivo"
          placeholder="Nombre del colectivo"
          value={datos.nombre}
          onChange={alCambiarCampo('nombre')}
          onBlur={formulario.blur('nombre')}
          error={errores.nombre}
        />
        <Field
          as="textarea"
          className={sh.r2}
          label="Descripción"
          placeholder="Qué hace la organización y a quién ayuda…"
          value={datos.desc}
          onChange={alCambiarCampo('desc')}
        />
        <Field
          as="select"
          label="Tipo de colectivo"
          value={datos.tipo}
          onChange={alCambiarCampo('tipo')}
          onBlur={formulario.blur('tipo')}
          error={errores.tipo}
        >
          <option value="">Elegí una opción</option>
          {/* .map: una <option> por cada tipo de la lista TIPOS (key = identificador para React) */}
          {TIPOS.map((tipo) => <option key={tipo}>{tipo}</option>)}
        </Field>
        <Field
          as="select"
          label="Ubicación"
          optional
          value={datos.ubicacion}
          onChange={alCambiarCampo('ubicacion')}
        >
          <option value="">Sin indicar</option>
          {UBICACIONES.map((ubicacion) => <option key={ubicacion}>{ubicacion}</option>)}
        </Field>
        <Field
          label="Ciudad o barrio"
          optional
          placeholder="Texto libre"
          value={datos.lugar}
          onChange={alCambiarCampo('lugar')}
        />
        <Field
          label="Correo de contacto"
          type="email"
          placeholder="contacto@colectivo.org"
          value={datos.mail}
          onChange={alCambiarCampo('mail')}
          onBlur={formulario.blur('mail')}
          error={errores.mail}
        />
        <PasswordField
          label="Contraseña"
          placeholder="Mínimo 8 caracteres"
          value={datos.pass}
          onChange={alCambiarCampo('pass')}
          onBlur={formulario.blur('pass')}
          error={errores.pass}
        />
        <TagPicker
          label="Causas"
          value={causasElegidas}
          options={CAUSAS}
          onChange={setCausasElegidas}
        />
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
        <SocialButtons verbo="Registrarme" onEntrar={entrarConRedSocial('org')} />
      </div>
    </form>
  );
}
