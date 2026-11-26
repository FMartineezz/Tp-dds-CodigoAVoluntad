/* eslint-disable react/react-in-jsx-scope */
/**
 * PANTALLA RegistroColaboradora
 * Ruta: /registro/colaboradora   ·   Quién la ve: Sin sesión
 * Qué muestra: Alta de colaboradora: nombre de fantasía, habilidades, contactos
 *   internos, captcha y términos.
 * Adónde van los datos: POST /colaboradoras (ver api/colaboradoras.js). Las habilidades
 *   salen del catálogo real (GET /habilidades) y viajan como CÓDIGOS. Si el backend rechaza
 *   algo, su mensaje se ve arriba del formulario. Si sale bien, se abre la sesión con la
 *   cuenta recién creada y se va al panel.
 *   PENDIENTE (backend): correo y contraseña todavía no se guardan en ningún lado (no hay
 *   login real / Keycloak); se piden y validan para que el formulario quede listo.
 * Para modificarla: un campo nuevo = un <Field> más dentro de la grilla .form
 *   (y su regla en useForm si es obligatorio).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: lo que la pantalla recuerda (campos de texto, habilidades,
 *      contactos), el catálogo de habilidades (pedido al backend) y el manejo de
 *      validación y envío que viene de auxiliares.js.
 *   2. CÁLCULOS: las reglas de validación y los errores que se ven en este momento.
 *   3. ACCIONES: cómo se guarda cada cambio de un campo y cómo se arma y envía el alta.
 *   4. LO QUE SE DIBUJA: el formulario completo.
 *
 * Cómo se validan los campos: al salir de un campo (onBlur) se muestra su error; al
 * apretar «Crear cuenta» se muestran todos y aparece el resumen rojo arriba
 * (la explicación completa está en acceso/auxiliares.js → useForm).
 */

// ───── Imports ─────
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Checkbox, Field, Heading } from "../../atomos";
import {
  Alert,
  CaptchaMock,
  ContactosEditor,
  TagPicker,
  Captcha,
} from "../../moleculas";
import { useAuth } from "../../contexto";
import { usePedido } from "../../hooks";
import { obtenerHabilidades } from "../../api/habilidades.js";
import { crearColaboradora } from "../../api/colaboradoras.js";
import { mensajeDeError } from "../../api/errores.js";
import { leerExportDeLinkedin } from "../../utilidades/linkedin.js";
// piezas compartidas con el otro registro
import { useForm, Resumen } from "./auxiliares.js";
import s from "./Ingresar.module.css";
import sh from "../../plantillas/disposicion.module.css"; // sh = layout común (.page, .form…)

// Tipo de contacto como lo muestra ContactosEditor → como lo acepta el backend.
const TIPOS_DE_CONTACTO = { Correo: "email", WhatsApp: "whatsapp", SMS: "sms" };

export default function RegistroColaboradora() {
  // ───── 1. DATOS Y ESTADO ─────

  // Todos los campos simples del formulario juntos en un objeto: texto para los
  // campos, true/false para las casillas (mensajes, terminos, captcha).
  // Empiezan vacíos (mensajes empieza tildado); los cambia alCambiarCampo y el captcha.
  // (ver docs/GLOSARIO.md → useState)
  const [datos, setDatos] = useState({
    fantasia: "",
    nombre: "",
    apellido: "",
    pronombres: "",
    github: "",
    bio: "",
    mensajes: true,
    terminos: false,
    captcha: "",
  });

  const captchaRef = useRef(null);
  const inputLinkedinRef = useRef(null);

  // Catálogo de habilidades del backend: [{ id, titulo, codigo, descripcion }].
  // `[]` = se pide una sola vez, al entrar.
  const { datos: catalogo, error: errorDelCatalogo } = usePedido(() => obtenerHabilidades(), []);

  // Habilidades elegidas, como array de TÍTULOS, ej. ['Desarrollo Web React'].
  // Empieza vacío; lo cambia el TagPicker.
  const [habilidadesElegidas, setHabilidadesElegidas] = useState([]);

  // Contactos internos: array de pares [tipo, dato], ej. ['WhatsApp', '1155550000'].
  // Empieza vacío; lo cambia el ContactosEditor.
  const [contactos, setContactos] = useState([]);

  const [avisoLinkedin, setAvisoLinkedin] = useState("");

  // Manejo de validación (ver auxiliares.js → useForm). Devuelve funciones y banderas:
  // formulario.blur / .enviar / .errores y .cargando / .listo / .intento.
  // Se le pasa la función con las reglas (validarDatos, más abajo).
  // El segundo parámetro es la función que manda el alta al backend (enviarAlBackend, abajo).
  const formulario = useForm(validarDatos, enviarAlBackend);

  // Para abrir la sesión con la cuenta creada y para ir al panel después.
  const { entrar } = useAuth();
  const navegar = useNavigate();



  // ───── 2. CÁLCULOS ─────

  // Reglas de validación. Recibe los datos y devuelve un objeto con un mensaje por cada
  // campo inválido ({} si está todo bien). Se declara con `function`, por eso se puede
  // usar arriba en useForm aunque esté escrita más abajo.
  function validarDatos(valores) {
    const erroresDelFormulario = {};
    if (!valores.fantasia.trim()) {
      erroresDelFormulario.fantasia = "Ingresá un nombre de fantasía.";
    }
    // El backend exige la cuenta de git y la presentación.
    if (!valores.github.trim()) {
      erroresDelFormulario.github = "Ingresá tu cuenta de GitHub o GitLab.";
    }
    if (!valores.bio.trim()) {
      erroresDelFormulario.bio = "Contá algo sobre vos.";
    }
    if (!valores.terminos) {
      erroresDelFormulario.terminos = "Tenés que aceptar los términos.";
    }
    if (!valores.captcha) {
      erroresDelFormulario.captcha = "Confirmá que no sos un robot.";
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
      const esCasilla = evento.target.type === "checkbox";
      const nuevoValor = esCasilla ? evento.target.checked : evento.target.value;
      // `...datos` copia todo lo que había y `[campo]: nuevoValor` cambia solo ese campo
      // (ver docs/GLOSARIO.md → Copiar con cambios).
      setDatos({ ...datos, [campo]: nuevoValor });
    };
  }

  // Se ejecuta cuando la persona tilda el captcha de prueba (recibe true o false).
  function alCambiarCaptcha(token) {
    setDatos((previos) => ({ ...previos, captcha: token }));
  }

  async function alImportarLinkedin(evento) {
    const archivo = evento.target.files[0];
    evento.target.value = ""; // permite volver a elegir el mismo archivo
    if (!archivo) return;
    try {
      const d = await leerExportDeLinkedin(archivo);

      // Solo completa lo que está vacío, para no pisar lo que la persona ya escribió.
      setDatos((previos) => ({
        ...previos,
        nombre: previos.nombre || d.nombre || "",
        apellido: previos.apellido || d.apellido || "",
        bio: previos.bio || d.bio || "",
        github: previos.github || d.github || "",
        mail: previos.mail || d.mail || "",
      }));

      // Habilidades: solo las que existen en TU catálogo (comparando sin mayúsculas).
      const titulos = (catalogo ?? []).map((h) => h.titulo);
      const coinciden = titulos.filter((t) =>
        d.habilidades.some((x) => x.trim().toLowerCase() === t.toLowerCase()),
      );
      setHabilidadesElegidas((previas) => [...new Set([...previas, ...coinciden])]);

      setAvisoLinkedin(
        `Importamos tus datos. Habilidades reconocidas: ${coinciden.length} de ${d.habilidades.length}. Revisá todo antes de crear la cuenta.`,
      );
    } catch (error) {
      setAvisoLinkedin(error.message);
    }
  }

  // Arma el cuerpo que pide POST /colaboradoras y lo envía. useForm la llama solo si no hay
  // errores; si el backend responde con error, useForm muestra su mensaje.
  async function enviarAlBackend(valores) {
    try {
      // Título elegido → código (el backend recibe códigos, no títulos ni ids).
      const codigos = habilidadesElegidas
        .map((titulo) => catalogo.find((habilidad) => habilidad.titulo === titulo)?.codigo)
        .filter(Boolean);
      // ['WhatsApp', '11 5555-0000'] → { tipo: 'whatsapp', valor: '1155550000' }.
      // Para teléfonos se sacan espacios, guiones y paréntesis: el backend pide 10 dígitos juntos.
      const contactosParaElBackend = contactos.map(([tipo, dato]) => {
        const tipoDelBackend = TIPOS_DE_CONTACTO[tipo] ?? tipo.toLowerCase();
        const valor = tipoDelBackend === "email" ? dato : dato.replace(/[\s\-()]/g, "");
        return { tipo: tipoDelBackend, valor };
      });
      // Pronombres: «ella, elle» → ['ella', 'elle'] (el backend guarda una lista).
      const pronombres = valores.pronombres
        .split(",")
        .map((pronombre) => pronombre.trim())
        .filter(Boolean);

      const creada = await crearColaboradora({
        nombreFantasia: valores.fantasia.trim(),
        git: valores.github.trim(),
        presentacion: valores.bio.trim(),
        habilidades: codigos,
        contactos: contactosParaElBackend,
        // La casilla dice «permitir mensajes»; el backend guarda lo contrario: «bloquear».
        bloquearMensajeInterno: !valores.mensajes,
        // Los opcionales se mandan solo si se completaron (`...(cond && {…})` agrega o no la clave).
        ...(valores.nombre.trim() && { nombre: valores.nombre.trim() }),
        ...(valores.apellido.trim() && { apellido: valores.apellido.trim() }),
        ...(pronombres.length > 0 && { pronombres }),
        captcha: valores.captcha,
      });
      // Salió bien: sesión abierta con la cuenta nueva y al panel.
      entrar("col", creada.id);
      navegar("/panel");
    } catch (error) {
      captchaRef.current?.resetCaptcha();
      setDatos((previos) => ({ ...previos, captcha: "" }));
      throw error;
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    // onSubmit: al enviar, formulario.enviar(datos) valida y simula el envío
    <form className={`container ${sh.page}`} onSubmit={formulario.enviar(datos)} noValidate>
      <Heading level={1}>Crear cuenta · Colaboradora</Heading>

      {/* Aparece si el backend rechazó el alta: su mensaje explica por qué */}
      {formulario.errorDelBackend && (
        <Alert kind="error" title="No pudimos crear la cuenta">
          {formulario.errorDelBackend}
        </Alert>
      )}
      {/* Aparece si no se pudo traer el catálogo de habilidades */}
      {errorDelCatalogo && (
        <Alert kind="error" title="No pudimos cargar las habilidades">
          {mensajeDeError(errorDelCatalogo)}
        </Alert>
      )}

      {/* BLOQUE: resumen de errores — aparece solo después de intentar enviar y si hay errores */}
      <Resumen errores={errores} mostrar={formulario.intento} />

      {/* BLOQUE: campos — grilla del formulario; sh.r2 / sh.mid / sh.full controlan cuánto
         ocupa cada uno */}
      <div className={sh.form}>
        {/* onBlur = al salir del campo (activa su validación); `optional` = campo no
           obligatorio */}
        <div className={sh.full}>
          <input
            ref={inputLinkedinRef}
            type="file"
            accept=".zip,.csv"
            onChange={alImportarLinkedin}
            hidden
          />
          <Button type="button" onClick={() => inputLinkedinRef.current.click()}>
            Importar desde LinkedIn
          </Button>
          <small style={{ marginLeft: 8 }}>
            Subí el ZIP o el CSV que exporta Linkedin. Revisá los datos antes de crear la cuenta.
          </small>
          {avisoLinkedin && <p>{avisoLinkedin}</p>}
        </div>
        <Field
          label="Nombre de fantasía"
          hint="Podés mantenerte anónima."
          placeholder="Cómo querés que te llamen"
          value={datos.fantasia}
          onChange={alCambiarCampo("fantasia")}
          onBlur={formulario.blur("fantasia")}
          error={errores.fantasia}
        />
        <Field
          as="textarea"
          className={sh.r2}
          label="Sobre vos"
          placeholder="Contá en pocas líneas quién sos y qué te gusta hacer…"
          value={datos.bio}
          onChange={alCambiarCampo("bio")}
          onBlur={formulario.blur("bio")}
          error={errores.bio}
        />
        <Field
          label="Nombre"
          optional
          placeholder="Nombre"
          value={datos.nombre}
          onChange={alCambiarCampo("nombre")}
        />
        <Field
          label="Apellido"
          optional
          placeholder="Apellido"
          value={datos.apellido}
          onChange={alCambiarCampo("apellido")}
        />
        <Field
          label="Pronombres"
          optional
          hint="Si son varios, separalos con comas."
          placeholder="Ej: ella, él, elle"
          value={datos.pronombres}
          onChange={alCambiarCampo("pronombres")}
        />
        <Field
          label="Cuenta de GitHub o GitLab"
          placeholder="https://github.com/usuario"
          value={datos.github}
          onChange={alCambiarCampo("github")}
          onBlur={formulario.blur("github")}
          error={errores.github}
        />
        <TagPicker
          label="Habilidades"
          value={habilidadesElegidas}
          options={(catalogo ?? []).map((habilidad) => habilidad.titulo)}
          onChange={setHabilidadesElegidas}
        />
        <div className={sh.mid}>
          <Checkbox checked={datos.mensajes} onChange={alCambiarCampo("mensajes")}>
            Permitir mensajes de organizaciones
          </Checkbox>
        </div>
        <div className={sh.full}>
          <ContactosEditor value={contactos} onChange={setContactos} />
        </div>
        <div className={sh.full}>
          <Captcha ok={datos.captcha} onChange={alCambiarCaptcha} error={errores.captcha} />
        </div>
        <div className={sh.full}>
          <Checkbox checked={datos.terminos} onChange={alCambiarCampo("terminos")}>
            Acepto los <Link to="/terminos">términos y condiciones</Link>
          </Checkbox>
          {/* Aparece solo si hay error en términos (no se tildó y ya se tocó o se intentó enviar) */}
          {errores.terminos && <p className={s.err}>{errores.terminos}</p>}
        </div>
      </div>

      {/* BLOQUE: botón de envío — muestra «cargando» mientras espera al backend */}
      <div className={sh.formActs}>
        <Button type="submit" loading={formulario.cargando}>
          Crear cuenta
        </Button>
      </div>

    </form>
  );
}
