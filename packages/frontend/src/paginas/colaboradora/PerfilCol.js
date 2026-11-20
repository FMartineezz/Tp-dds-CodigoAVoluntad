/**
 * PANTALLA PerfilCol
 * Ruta: /panel/perfil   ·   Quién la ve: Colaboradora
 * Qué muestra: Edición del perfil: datos, habilidades, LinkedIn, mensajes y contactos.
 * De dónde salen los datos: del backend (api/colaboradora.js):
 *   · obtenerPerfil → GET /colaboradoras/:id; las habilidades posibles salen del catálogo
 *     real (GET /habilidades, api/habilidades.js).
 *   · guardarPerfil → PATCH /colaboradoras/:id.
 * Para modificarla: un campo nuevo = un <Field> en la grilla .form (y su traducción en
 *   aPerfilDeLaVista / guardarPerfil de api/colaboradora.js).
 *
 * ANATOMÍA DE ESTE ARCHIVO: son DOS componentes.
 *   PerfilCol (el de la ruta): pide el perfil y el catálogo, y dibuja cargando / error. Cuando
 *     llegan los datos, dibuja el formulario pasándole esos datos como punto de partida.
 *   FormularioDePerfil:
 *     1. DATOS Y ESTADO: los campos (arrancan con lo que vino del backend), contactos y el
 *        estado del guardado (guardando, mensaje de éxito, errores).
 *     3. ACCIONES: cambiar un campo y guardar (validación + pedido al backend).
 *     4. LO QUE SE DIBUJA: el formulario completo.
 *   ¿Por qué dos? useState toma el valor inicial UNA sola vez, al aparecer el componente.
 *   Si el formulario aparece recién cuando ya llegaron los datos, arranca con ellos.
 *
 * Aviso de éxito: cualquier cambio en un campo borra el mensaje de éxito anterior
 * (así no queda un «Cambios guardados» que ya no es cierto).
 *
 * PENDIENTE (backend): no hay foto de perfil (se dibuja un avatar con la inicial), ni
 *   importación desde LinkedIn, ni campo «Sitio web», ni correo de la cuenta (vendrá con el
 *   login). Esos campos de la maqueta se sacaron.
 * PENDIENTE (backend): los contactos nunca vuelven en el GET (son privados), así que el editor
 *   arranca vacío. Si la persona agrega alguno, al guardar REEMPLAZAN a los que tenía. Haría
 *   falta un GET /colaboradoras/:id/contactos solo para la dueña del perfil.
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Checkbox, Field, Heading, Text } from '../../atomos';
import { Alert, ContactosEditor, RowsSkeleton, TagPicker } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { guardarPerfil, obtenerPerfil } from '../../api/colaboradora.js';
import { obtenerHabilidades } from '../../api/habilidades.js';
import { mensajeDeError } from '../../api/errores.js';
import s from './Colaboradora.module.css';
import sh from '../../plantillas/disposicion.module.css'; // sh = layout común (.page, .form…)

// Pide a la vez el perfil y el catálogo de habilidades (para las opciones del TagPicker).
async function pedirPerfilYCatalogo(id) {
  const [perfil, catalogo] = await Promise.all([obtenerPerfil(id), obtenerHabilidades()]);
  return { perfil, opciones: catalogo.map((habilidad) => habilidad.titulo) };
}

export default function PerfilCol() {
  // `id` es el _id de la colaboradora con la sesión (ver contexto/Auth.js).
  const { id } = useAuth();
  const { cargando, datos, error } = usePedido(() => pedirPerfilYCatalogo(id), [id]);

  // Caso 1: todavía no llegó la respuesta → filas grises de relleno.
  if (cargando) {
    return (
      <div className={`container ${sh.page}`}>
        <RowsSkeleton n={5} />
      </div>
    );
  }

  // Caso 2: algo falló → aviso con el mensaje del backend (o uno genérico).
  if (error) {
    return (
      <div className={`container ${sh.page}`}>
        <Alert kind="error" title="No pudimos cargar tu perfil">
          {mensajeDeError(error)}
        </Alert>
      </div>
    );
  }

  // Caso 3: llegó todo → el formulario, que arranca con esos datos.
  return <FormularioDePerfil id={id} inicial={datos.perfil} opciones={datos.opciones} />;
}

function FormularioDePerfil({ id, inicial, opciones }) {
  // ───── 1. DATOS Y ESTADO ─────

  // Todos los campos del perfil juntos en un objeto: texto para los campos, true/false para
  // la casilla `mensajes` y una lista de títulos en `habilidades`. Empiezan con lo que mandó
  // el backend. (ver docs/GLOSARIO.md → useState)
  const [datos, setDatos] = useState(inicial);

  // Contactos internos: array de pares [tipo, dato]. Empieza vacío porque el backend no los
  // devuelve (ver PENDIENTE en la cabecera); lo cambia el ContactosEditor.
  const [contactos, setContactos] = useState([]);

  // true si la persona tocó los contactos: solo en ese caso se mandan al guardar
  // (si no, se reemplazarían los que ya tenía por una lista vacía).
  const [contactosTocados, setContactosTocados] = useState(false);

  // true mientras se espera la respuesta del backend (el botón muestra «cargando»).
  const [guardando, setGuardando] = useState(false);

  // Mensaje verde de éxito ('' = no se muestra). Lo pone alGuardar; lo borran los cambios en
  // los campos y la «x» del aviso.
  const [mensajeOk, setMensajeOk] = useState('');

  // Error que devolvió el backend al guardar (null = ninguno). Se muestra en un aviso rojo.
  const [errorAlGuardar, setErrorAlGuardar] = useState(null);

  // Errores por campo, ej. { fantasia: '…', github: '…' }. Empieza vacío ({} = sin errores);
  // lo cambia alGuardar.
  const [errores, setErrores] = useState({});

  // ───── 3. ACCIONES ─────

  // Devuelve el manejador onChange de un campo: `alCambiarCampo('bio')` se ejecuta cuando
  // la persona escribe en «bio» (o tilda una casilla). Borra el aviso de éxito anterior.
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
    setDatos({ ...datos, habilidades: habilidadesNuevas });
  }

  // Se ejecuta al cambiar los contactos en el ContactosEditor (recibe la lista nueva).
  function alCambiarContactos(contactosNuevos) {
    setMensajeOk('');
    setContactos(contactosNuevos);
    setContactosTocados(true);
  }

  // Se ejecuta al apretar «Guardar cambios». Primero valida; si hay errores corta acá y
  // no llama al backend. `async` permite esperar la respuesta con `await`.
  async function alGuardar(evento) {
    // evita que el navegador recargue la página (comportamiento normal de un <form>)
    evento.preventDefault();

    // Validación: un mensaje por cada campo que el backend exige.
    const erroresNuevos = {};
    if (!datos.fantasia.trim()) {
      erroresNuevos.fantasia = 'Ingresá un nombre de fantasía.';
    }
    if (!datos.github.trim()) {
      erroresNuevos.github = 'Ingresá tu cuenta de GitHub o GitLab.';
    }
    if (!datos.bio.trim()) {
      erroresNuevos.bio = 'Contá algo sobre vos.';
    }
    if (datos.habilidades.length === 0) {
      erroresNuevos.habilidades = 'Elegí al menos una habilidad.';
    }
    if (datos.linkedin.trim() && !/^https?:\/\//.test(datos.linkedin.trim())) {
      // la expresión regular pide que empiece con http:// o https://
      erroresNuevos.linkedin = 'Pegá la dirección completa, empezando con https://';
    }
    setErrores(erroresNuevos);
    setMensajeOk('');
    setErrorAlGuardar(null);

    const hayErrores = Object.keys(erroresNuevos).length > 0;
    if (hayErrores) {
      return;
    }

    setGuardando(true);
    try {
      // Los contactos se mandan solo si se tocaron (ver contactosTocados).
      const guardado = await guardarPerfil(id, datos, {
        contactos: contactosTocados ? contactos : undefined,
      });
      // Lo que devuelve el backend pasa a ser el nuevo punto de partida del formulario.
      setDatos(guardado);
      setContactosTocados(false);
      setMensajeOk('Cambios guardados.');
    } catch (e) {
      setErrorAlGuardar(e);
    } finally {
      // `finally` corre siempre, haya salido bien o mal.
      setGuardando(false);
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <form className={`container ${sh.page}`} onSubmit={alGuardar} noValidate>
      {/* BLOQUE: encabezado */}
      <Heading level={1}>Mi perfil</Heading>

      {/* Aparece solo si hay un mensaje de éxito (`mensajeOk` no vacío); la «x» lo borra */}
      {mensajeOk && <Alert kind="success" onClose={() => setMensajeOk('')}>{mensajeOk}</Alert>}
      {/* Aparece solo si el backend rechazó el guardado: muestra su mensaje */}
      {errorAlGuardar && (
        <Alert kind="error" onClose={() => setErrorAlGuardar(null)}>
          {mensajeDeError(errorAlGuardar)}
        </Alert>
      )}

      {/* BLOQUE: campos — grilla; sh.r2 / sh.mid / sh.full controlan cuánto ocupa cada uno */}
      {/* `optional` = campo no obligatorio; error={errores.x} muestra el mensaje solo si existe */}
      <div className={sh.form}>
        {/* Avatar con la inicial del nombre de fantasía (o «?» si está vacío; `||` = «o, si no,
           usá»). No hay foto: el backend todavía no guarda imágenes. */}
        <div className={sh.r2}>
          <span className={s.lab}>Foto</span>
          <div className={sh.foto}>
            <Avatar nombre={datos.fantasia || '?'} size={96} />
          </div>
        </div>
        <Field
          as="textarea"
          className={sh.r2}
          label="Sobre vos"
          placeholder="Contá en pocas líneas quién sos y qué te gusta hacer…"
          value={datos.bio}
          onChange={alCambiarCampo('bio')}
          error={errores.bio}
        />
        <Field
          label="Nombre de fantasía"
          value={datos.fantasia}
          onChange={alCambiarCampo('fantasia')}
          error={errores.fantasia}
        />
        <div>
          <TagPicker
            label="Habilidades"
            value={datos.habilidades}
            options={opciones}
            onChange={alCambiarHabilidades}
          />
          {/* El TagPicker no muestra errores: el mensaje va debajo, solo si existe */}
          {errores.habilidades && <Text variant="small" role="alert">{errores.habilidades}</Text>}
        </div>
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
          placeholder="ella/la"
          value={datos.pronombres}
          onChange={alCambiarCampo('pronombres')}
        />
        <Field
          label="Cuenta de GitHub o GitLab"
          placeholder="https://github.com/usuario"
          value={datos.github}
          onChange={alCambiarCampo('github')}
          error={errores.github}
        />
        <Field
          label="LinkedIn"
          optional
          placeholder="https://linkedin.com/in/usuario"
          value={datos.linkedin}
          onChange={alCambiarCampo('linkedin')}
          error={errores.linkedin}
        />
        <div className={sh.mid}>
          <Checkbox checked={datos.mensajes} onChange={alCambiarCampo('mensajes')}>
            Permitir mensajes de organizaciones
          </Checkbox>
        </div>
        <div className={sh.full}>
          <ContactosEditor value={contactos} onChange={alCambiarContactos} />
          <Text variant="small">
            Por privacidad no mostramos los contactos que ya guardaste. Si agregás alguno acá,
            al guardar reemplaza a los anteriores. Teléfonos: 10 dígitos, sin 0 ni 15
            (ej. 1127891234).
          </Text>
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
