/**
 * PANTALLA PerfilOrg
 * Ruta: /org/perfil   ·   Quién la ve: Organización
 * Qué muestra: Edición de la organización y «Zona de riesgo» para eliminar la cuenta.
 * Para modificarla: un campo nuevo = un <Field> en la grilla .form.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: los datos de la organización, causas, errores, avisos y lo que
 *      pasa en el diálogo de eliminar.
 *   2. CÁLCULOS: si el nombre escrito para confirmar la eliminación coincide.
 *   3. ACCIONES: cambiar campos, validar y guardar, y confirmar o cancelar la eliminación.
 *   4. LO QUE SE DIBUJA: formulario de datos, zona de riesgo y diálogo de confirmación.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Field, Heading, Logo, Text } from '../../atomos';
import { Alert, ConfirmDialog, TagPicker } from '../../moleculas';
import { CAUSAS, TIPOS, UBICACIONES } from '../../datos';
import { useAuth } from '../../contexto';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

export default function PerfilOrg() {
  // ───── 1. DATOS Y ESTADO ─────

  // `salir()` cierra la sesión (viene del contexto de sesión). Se usa al eliminar la cuenta.
  // (`{ salir }` saca una pieza del objeto, ver docs/GLOSARIO.md → Desestructurar)
  const { salir } = useAuth();

  // `navegar('/ruta')` lleva a otra pantalla desde código (ver docs/GLOSARIO.md → useNavigate).
  const navegar = useNavigate();

  // Datos de la organización: objeto con nombre, desc, tipo, ubicacion, lugar, mail, web e
  // instagram (todos texto). Arranca con los datos de ejemplo; lo cambia alCambiarCampo.
  // (ver docs/GLOSARIO.md → Estado (useState))
  const [datos, setDatos] = useState({
    nombre: 'Asamblea Barrial Norte',
    desc: 'Vecinas y vecinos que sostienen un comedor comunitario y una huerta.',
    tipo: 'Asamblea',
    ubicacion: 'Buenos Aires',
    lugar: 'Zona norte',
    mail: 'organizacion@demo.org',
    web: '',
    instagram: '',
  });

  // Causas elegidas (lista de textos). Lo cambia el selector de «Causas».
  const [causas, setCausas] = useState(['Alimentación']);

  // Errores de validación por campo, p. ej. { nombre: '…', mail: '…' }.
  // Objeto vacío = sin errores. Lo completa alGuardar.
  const [errores, setErrores] = useState({});

  // true mientras dura el «guardado» simulado (el botón muestra que está cargando).
  const [guardando, setGuardando] = useState(false);

  // true cuando hay que mostrar «Cambios guardados». Se enciende al guardar y se apaga
  // al cerrar el aviso o apenas se vuelve a tocar un campo.
  const [seGuardo, setSeGuardo] = useState(false);

  // true cuando el diálogo «¿Eliminar la cuenta?» está abierto. Lo abre el botón de la
  // zona de riesgo; se cierra al cancelar o al confirmar.
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false);

  // Texto que la persona escribe en el diálogo para confirmar la eliminación.
  // Tiene que ser igual al nombre del colectivo para que el botón funcione.
  const [nombreEscrito, setNombreEscrito] = useState('');

  // ───── 2. CÁLCULOS ─────

  // true si lo escrito (sin espacios de los costados) NO coincide con el nombre actual.
  const nombreNoCoincide = nombreEscrito.trim() !== datos.nombre;

  // Mensaje de error del campo de confirmación: aparece solo si ya se escribió algo y no
  // coincide (`&&` y `? :` → docs/GLOSARIO.md → Operadores). Vacío = sin error.
  const errorDeConfirmacion =
    nombreEscrito && nombreNoCoincide ? 'El nombre no coincide.' : undefined;

  // ───── 3. ACCIONES ─────

  // Devuelve la función que se ejecuta cuando cambia UN campo del formulario.
  // `campo` es la propiedad de `datos` que se actualiza ('nombre', 'mail'…).
  function alCambiarCampo(campo) {
    return function (e) {
      setSeGuardo(false); // al editar se esconde el «Cambios guardados» anterior
      // Se copia `datos` y se pisa solo ese campo (corchetes = nombre de campo variable).
      setDatos({ ...datos, [campo]: e.target.value });
    };
  }

  // Se ejecuta al enviar el formulario (botón «Guardar»): valida y, si todo está bien,
  // simula el guardado.
  function alGuardar(e) {
    e.preventDefault(); // evita que el navegador recargue la página al enviar

    // Se juntan los errores en un objeto: un campo con error = una entrada nueva.
    const erroresNuevos = {};
    if (!datos.nombre.trim()) {
      erroresNuevos.nombre = 'Ingresá el nombre del colectivo.';
    }
    // El correo debe tener forma de «algo@algo.algo» (expresión regular simple).
    if (!/^\S+@\S+\.\S+$/.test(datos.mail)) {
      erroresNuevos.mail = 'Ingresá un correo válido.';
    }
    setErrores(erroresNuevos);
    setSeGuardo(false);

    // Si hay algún error no se guarda: se muestran los avisos y se corta acá.
    if (Object.keys(erroresNuevos).length) return;

    // Guardado simulado: 700 ms de espera (ver docs/GLOSARIO.md → setTimeout) y después
    // se muestra «Cambios guardados».
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      setSeGuardo(true);
    }, 700);
  }

  // Se ejecuta al cambiar las causas en el selector.
  function alCambiarCausas(causasNuevas) {
    setSeGuardo(false);
    setCausas(causasNuevas);
  }

  // Se ejecuta al cancelar el diálogo de eliminar: lo cierra y borra lo que se había escrito.
  function alCancelarEliminacion() {
    setDialogoEliminarAbierto(false);
    setNombreEscrito('');
  }

  // Se ejecuta al tocar «Sí, eliminar». Solo avanza si el nombre escrito coincide con el
  // del colectivo: así se evita borrar la cuenta por un clic distraído.
  // Si no coincide no pasa nada y el diálogo queda abierto (el campo ya muestra el error).
  function alConfirmarEliminacion() {
    if (nombreNoCoincide) return;
    setDialogoEliminarAbierto(false);
    salir(); // cierra la sesión
    navegar('/'); // vuelve al inicio público
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${sh.page}`}>
      {/* BLOQUE: Formulario de datos — todos los datos editables de la organización */}
      <form className={sh.page} style={{ padding: 0 }} onSubmit={alGuardar} noValidate>
        <Heading level={1}>Datos de la organización</Heading>

        {/* Aparece solo después de guardar; se apaga al cerrarlo o al tocar un campo. */}
        {seGuardo && (
          <Alert kind="success" onClose={() => setSeGuardo(false)}>Cambios guardados.</Alert>
        )}

        <div className={sh.form}>
          {/* Logo: se muestra la inicial del nombre (o «O» si el nombre está vacío). */}
          <div className={sh.r2}>
            <span className={s.lab}>Logo</span>
            <div className={sh.foto}>
              <Avatar nombre={datos.nombre || 'O'} size={96} square />
              <Button type="button" variant="secondary">Cambiar logo</Button>
            </div>
          </div>
          <Field
            as="textarea"
            className={sh.r2}
            label="Descripción"
            placeholder="Qué hace la organización y a quién ayuda…"
            value={datos.desc}
            onChange={alCambiarCampo('desc')}
          />
          <Field
            label="Nombre"
            value={datos.nombre}
            onChange={alCambiarCampo('nombre')}
            error={errores.nombre}
          />
          <TagPicker
            label="Causas"
            value={causas}
            options={CAUSAS}
            onChange={alCambiarCausas}
          />
          <Field
            as="select"
            label="Tipo de colectivo"
            value={datos.tipo}
            onChange={alCambiarCampo('tipo')}
          >
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
            value={datos.lugar}
            onChange={alCambiarCampo('lugar')}
          />
          <Field
            label="Correo de contacto"
            type="email"
            value={datos.mail}
            onChange={alCambiarCampo('mail')}
            error={errores.mail}
          />
          <Field
            label="Sitio web"
            optional
            placeholder="https://"
            value={datos.web}
            onChange={alCambiarCampo('web')}
          />
          <Field
            label="Instagram"
            optional
            placeholder="@usuario"
            value={datos.instagram}
            onChange={alCambiarCampo('instagram')}
          />
        </div>

        {/* BLOQUE: Botones — guardar (con indicador de carga) o cancelar */}
        <div className={sh.formActs}>
          <Button type="submit" loading={guardando}>Guardar</Button>
          <Button as={Link} to="/org" variant="secondary">Cancelar</Button>
        </div>
      </form>

      {/* BLOQUE: Zona de riesgo — eliminar la cuenta del colectivo (acción permanente).
          Está separada del formulario y con un estilo de alerta para que no se toque
          sin querer. */}
      <section className={s.riesgo} aria-labelledby="riesgo">
        <Heading level={2} size="h3" id="riesgo">Zona de riesgo</Heading>
        <Text>
          Si eliminás la cuenta se borran tus datos de contacto de la plataforma. La
          información histórica del colectivo (proyectos y colaboraciones) se conserva.
        </Text>
        <div>
          <Button variant="danger" onClick={() => setDialogoEliminarAbierto(true)}>
            Eliminar la cuenta del colectivo
          </Button>
        </div>
      </section>

      {/* BLOQUE: Confirmación de eliminación — diálogo abierto solo si se tocó el botón de
          la zona de riesgo. Como la acción es permanente, se pide escribir el nombre del
          colectivo: es una barrera extra contra clics por error. */}
      <ConfirmDialog
        open={dialogoEliminarAbierto}
        danger
        title="¿Eliminar la cuenta del colectivo?"
        confirmLabel="Sí, eliminar"
        onCancel={alCancelarEliminacion}
        onConfirm={alConfirmarEliminacion}
      >
        <Text>
          Es permanente. Para confirmar, escribí el nombre del colectivo: <b>{datos.nombre}</b>
        </Text>
        <Field
          label="Nombre del colectivo"
          value={nombreEscrito}
          onChange={(e) => setNombreEscrito(e.target.value)}
          error={errorDeConfirmacion}
        />
      </ConfirmDialog>
    </div>
  );
}
