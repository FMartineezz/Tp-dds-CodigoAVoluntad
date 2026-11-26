/**
 * PANTALLA PerfilCol
 * Ruta: /panel/perfil
 * Quién la ve: Colaboradora
 * Qué muestra: Edición del perfil: datos, foto, habilidades, redes, sitio web, mensajes y
 *   contactos.
 * De dónde salen los datos: del backend (api/colaboradora.js):
 *   - obtenerPerfil → GET /colaboradoras/:id; las habilidades posibles salen del catálogo
 *     real (GET /habilidades, api/habilidades.js).
 *   - obtenerMisContactos → GET /colaboradoras/:id/contactos (privados, solo para la dueña).
 *   - guardarPerfil → PATCH /colaboradoras/:id.
 * Para modificarla: un campo nuevo = un <Field> en la grilla .form (y su traducción en
 *   aPerfilDeLaVista / guardarPerfil de api/colaboradora.js).
 *
 * ANATOMÍA DE ESTE ARCHIVO: son DOS componentes.
 *   PerfilCol (el de la ruta): pide el perfil, los contactos y el catálogo, y dibuja cargando / error. Cuando
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
 * Foto: se sube apenas se elige (PUT /colaboradoras/:id/foto, ver organismos/SubirFoto), sin
 *   esperar a «Guardar». También se puede pegar el enlace a una foto publicada en otro lado.
 *   Se ve la subida; si no hay, la del enlace; si no, la del seed (datos/fotos.js) o la inicial.
 * PENDIENTE (backend): no hay importación desde LinkedIn ni correo de la cuenta (vendrá con
 *   el login).
 */

// ───── Imports ─────
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Checkbox, Field, Heading, Text } from '../../atomos';
import { Alert, ContactosEditor, RowsSkeleton, TagPicker } from '../../moleculas';
import { SubirFoto } from '../../organismos';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { guardarPerfil, obtenerMisContactos, obtenerPerfil } from '../../api/colaboradora.js';
import { obtenerHabilidades } from '../../api/habilidades.js';
import { mensajeDeError } from '../../api/errores.js';
import { llevarAlPrimerError } from '../../utilidades/llevarAlPrimerError.js';
import s from './Colaboradora.module.css';
import sh from '../../plantillas/disposicion.module.css'; // sh = layout común (.page, .form…)
import { fotoDe } from '../../datos/fotos.js';

// Pide a la vez el perfil, sus contactos y el catálogo de habilidades (para el TagPicker).
async function pedirPerfilYCatalogo(id) {
  const [perfil, contactos, catalogo] = await Promise.all([
    obtenerPerfil(id),
    obtenerMisContactos(id),
    obtenerHabilidades(),
  ]);
  return { perfil, contactos, opciones: catalogo.map((habilidad) => habilidad.titulo) };
}

// true si el texto está vacío (es opcional) o empieza con http:// o https://
const esUrlOVacio = (texto) => !texto.trim() || /^https?:\/\//.test(texto.trim());

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
  return (
    <FormularioDePerfil
      id={id}
      inicial={datos.perfil}
      contactosIniciales={datos.contactos}
      opciones={datos.opciones}
    />
  );
}

function FormularioDePerfil({ id, inicial, contactosIniciales, opciones }) {
  // ───── 1. DATOS Y ESTADO ─────

  // Todos los campos del perfil juntos en un objeto: texto para los campos, true/false para
  // la casilla `mensajes` y una lista de títulos en `habilidades`. Empiezan con lo que mandó
  // el backend. (ver packages/frontend/docs/GLOSARIO.md → useState)
  const [datos, setDatos] = useState(inicial);

  // Contactos privados: array de pares [tipo, dato]. Arrancan con los que ya tenía guardados;
  // los cambia el ContactosEditor. Al guardar se manda la lista entera.
  const [contactos, setContactos] = useState(contactosIniciales);

  // URL de la foto subida (null = no subió). Va aparte de `datos`: se guarda sola al elegirla.
  const [fotoSubida, setFotoSubida] = useState(inicial.fotoSubida);

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
      // (ver packages/frontend/docs/GLOSARIO.md → Copiar con cambios)
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
    const pedirUrlCompleta = 'Pegá la dirección completa, empezando con https://';
    if (!esUrlOVacio(datos.linkedin)) erroresNuevos.linkedin = pedirUrlCompleta;
    if (!esUrlOVacio(datos.sitioWeb)) erroresNuevos.sitioWeb = pedirUrlCompleta;
    if (!esUrlOVacio(datos.foto)) erroresNuevos.foto = pedirUrlCompleta;
    setErrores(erroresNuevos);
    setMensajeOk('');
    setErrorAlGuardar(null);

    const hayErrores = Object.keys(erroresNuevos).length > 0;
    if (hayErrores) {
      llevarAlPrimerError(evento.currentTarget);
      return;
    }

    setGuardando(true);
    try {
      const guardado = await guardarPerfil(id, datos, { contactos });
      // Lo que devuelve el backend pasa a ser el nuevo punto de partida del formulario.
      setDatos(guardado);
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

      {/* BLOQUE: datos personales — a la izquierda foto (con el enlace al lado), nombre de
          fantasía, nombre, apellido y pronombres; a la derecha «Sobre vos» y habilidades (que
          ocupa el alto de las 4 filas) */}
      <div className={sh.form}>
        <div>
          <span className={s.etiqueta}>Foto</span>
          <div className={s.foto}>
            {/* Si no subió foto, se ve al momento el enlace que pega (o la del seed, o la inicial) */}
            <SubirFoto
              recurso="colaboradoras"
              id={id}
              nombre={datos.fantasia}
              foto={fotoSubida}
              fotoDeRespaldo={datos.foto.trim() || fotoDe(id)}
              alCambiar={setFotoSubida}
            />
            <Field
              label="O pegá el enlace a una foto"
              optional
              hint={fotoSubida ? 'Mientras tengas una foto subida, se muestra esa.' : undefined}
              placeholder="https://…/foto.jpg"
              value={datos.foto}
              onChange={alCambiarCampo('foto')}
              error={errores.foto}
            />
          </div>
        </div>
        <Field
          as="textarea"
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
        <div className={s.habilidades}>
          <TagPicker
            label="Habilidades"
            value={datos.habilidades}
            options={opciones}
            onChange={alCambiarHabilidades}
            error={errores.habilidades}
          />
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
      </div>

      <hr className={s.separador} />

      {/* BLOQUE: redes — LinkedIn, la cuenta de código y el sitio web */}
      <div className={sh.form}>
        <Field
          label="LinkedIn"
          optional
          placeholder="https://linkedin.com/in/usuario"
          value={datos.linkedin}
          onChange={alCambiarCampo('linkedin')}
          error={errores.linkedin}
        />
        <Field
          label="Cuenta de GitHub o GitLab"
          placeholder="https://github.com/usuario"
          value={datos.github}
          onChange={alCambiarCampo('github')}
          error={errores.github}
        />
        <Field
          label="Sitio web"
          optional
          placeholder="https://tu-portfolio.dev"
          value={datos.sitioWeb}
          onChange={alCambiarCampo('sitioWeb')}
          error={errores.sitioWeb}
        />
      </div>

      <hr className={s.separador} />

      {/* BLOQUE: contacto — medios privados y, en la misma fila del título, si acepta mensajes */}
      <div>
        <ContactosEditor
          value={contactos}
          onChange={alCambiarContactos}
          accion={
            <Checkbox checked={datos.mensajes} onChange={alCambiarCampo('mensajes')}>
              Permitir mensajes de organizaciones
            </Checkbox>
          }
        />
        <Text variant="small">
          Solo los ven los colectivos de los proyectos en los que colaborás.
        </Text>
      </div>

      <hr className={s.separador} />

      {/* BLOQUE: botones finales — guardar (con «cargando» mientras guarda) o cancelar */}
      <div className={sh.formActions}>
        <Button type="submit" loading={guardando}>Guardar cambios</Button>
        <Button as={Link} to="/panel" variant="secondary">Cancelar</Button>
      </div>
    </form>
  );
}
