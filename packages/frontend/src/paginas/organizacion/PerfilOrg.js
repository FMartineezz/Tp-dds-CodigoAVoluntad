/**
 * PANTALLA PerfilOrg
 * Ruta: /org/perfil   ·   Quién la ve: Organización
 * Qué muestra: Edición de la organización y «Zona de riesgo» para eliminar la cuenta.
 * De dónde salen los datos: GET /colectivos/:id para cargar y PATCH /colectivos/:id para
 *   guardar (ver api/organizacion.js). Tipos, ubicaciones y redes usan los valores que acepta
 *   el backend (TIPOS_DE_COLECTIVO, UBICACIONES, REDES_SOCIALES).
 *   PENDIENTE (backend): logo, causas, ciudad/barrio, correo y sitio web no existen en el
 *   colectivo, por eso no están en el formulario.
 * Para modificarla: un campo nuevo = un <Field> en la grilla .form (y su nombre del backend
 * en alGuardar).
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   A. PerfilOrg (arriba): pide el colectivo y, cuando llega, dibuja el formulario.
 *   B. FormularioOrg (abajo): el formulario en sí, con estas secciones:
 *      1. DATOS Y ESTADO: los datos editables, errores, avisos y el diálogo de eliminar.
 *      2. CÁLCULOS: si el nombre escrito para confirmar la eliminación coincide.
 *      3. ACCIONES: cambiar campos, validar y guardar, y confirmar o cancelar la eliminación.
 *      4. LO QUE SE DIBUJA: formulario de datos, zona de riesgo y diálogo de confirmación.
 * ¿Por qué dos componentes? El estado del formulario (useState) se arma con los datos del
 * backend; separándolo, FormularioOrg recién se crea cuando esos datos ya llegaron.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, Button, Field, Heading, Text } from '../../atomos';
import { Alert, ConfirmDialog, RowsSkeleton } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { mensajeDeError } from '../../api/errores.js';
import {
  REDES_SOCIALES,
  TIPOS_DE_COLECTIVO,
  UBICACIONES,
  actualizarColectivo,
  obtenerMiColectivo,
} from '../../api/organizacion.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

// ───── A. PerfilOrg ─────
export default function PerfilOrg() {
  const { id } = useAuth();
  const { cargando, datos: colectivo, error } = usePedido(() => obtenerMiColectivo(id), [id]);

  // Caso 1: esperando la respuesta → filas grises.
  if (cargando) {
    return (
      <div className={`container ${sh.page}`}>
        <RowsSkeleton n={5} />
      </div>
    );
  }
  // Caso 2: falló el pedido → aviso.
  if (error) {
    return (
      <div className={`container ${sh.page}`}>
        <Alert kind="error" title="No pudimos cargar los datos">{mensajeDeError(error)}</Alert>
      </div>
    );
  }
  // Caso 3: llegaron los datos → formulario.
  return <FormularioOrg colectivo={colectivo} />;
}

// Arma el objeto { instagram: 'https://…', github: '' … } a partir de la lista del backend.
function redesComoObjeto(redes) {
  const objeto = {};
  REDES_SOCIALES.forEach((red) => {
    objeto[red.valor] = redes.find((r) => r.tipo === red.valor)?.url ?? '';
  });
  return objeto;
}

// ───── B. FormularioOrg ─────
// Prop `colectivo`: el colectivo como lo devuelve obtenerMiColectivo.
function FormularioOrg({ colectivo }) {
  // ───── 1. DATOS Y ESTADO ─────

  // `id` del colectivo y `salir()` para cerrar la sesión (al eliminar la cuenta).
  const { id, salir } = useAuth();

  // `navegar('/ruta')` lleva a otra pantalla desde código (ver docs/GLOSARIO.md → useNavigate).
  const navegar = useNavigate();

  // Datos editables. Arrancan con lo que vino del backend; los cambia alCambiarCampo.
  // `nombreGuardado` es el nombre tal como está en el backend (para el diálogo de eliminar).
  const [datos, setDatos] = useState({
    nombre: colectivo.nombre,
    desc: colectivo.descripcion,
    tipo: colectivo.tipo,
    ubicacion: colectivo.ubicacion,
  });
  const [nombreGuardado, setNombreGuardado] = useState(colectivo.nombre);

  // URL de cada red social ('' = no tiene). Lo cambia alCambiarRed.
  const [redes, setRedes] = useState(() => redesComoObjeto(colectivo.redes));

  // Errores de validación por campo, p. ej. { nombre: '…' }. Objeto vacío = sin errores.
  const [errores, setErrores] = useState({});

  // Error que devolvió el backend al guardar ('' = ninguno).
  const [errorGuardado, setErrorGuardado] = useState('');

  // true mientras se espera la respuesta del PATCH (el botón muestra que está cargando).
  const [guardando, setGuardando] = useState(false);

  // true cuando hay que mostrar «Cambios guardados».
  const [seGuardo, setSeGuardo] = useState(false);

  // true cuando el diálogo «¿Eliminar la cuenta?» está abierto.
  const [dialogoEliminarAbierto, setDialogoEliminarAbierto] = useState(false);

  // Texto que la persona escribe en el diálogo para confirmar la eliminación.
  const [nombreEscrito, setNombreEscrito] = useState('');

  // ───── 2. CÁLCULOS ─────

  // true si lo escrito (sin espacios de los costados) NO coincide con el nombre guardado.
  const nombreNoCoincide = nombreEscrito.trim() !== nombreGuardado;

  // Mensaje de error del campo de confirmación: aparece solo si ya se escribió algo y no
  // coincide (`&&` y `? :` → docs/GLOSARIO.md → Operadores). Vacío = sin error.
  const errorDeConfirmacion =
    nombreEscrito && nombreNoCoincide ? 'El nombre no coincide.' : undefined;

  // ───── 3. ACCIONES ─────

  // Devuelve la función que se ejecuta cuando cambia UN campo del formulario.
  function alCambiarCampo(campo) {
    return function (e) {
      setSeGuardo(false);
      setDatos({ ...datos, [campo]: e.target.value });
    };
  }

  // Igual, pero para la URL de una red social.
  function alCambiarRed(tipo) {
    return function (e) {
      setSeGuardo(false);
      setRedes({ ...redes, [tipo]: e.target.value });
    };
  }

  // Se ejecuta al enviar el formulario (botón «Guardar»): valida y manda los cambios.
  async function alGuardar(e) {
    e.preventDefault(); // evita que el navegador recargue la página al enviar

    const erroresNuevos = {};
    if (!datos.nombre.trim()) erroresNuevos.nombre = 'Ingresá el nombre del colectivo.';
    if (!datos.desc.trim()) erroresNuevos.desc = 'Ingresá una descripción.';
    // Cada red cargada tiene que ser un enlace http(s).
    REDES_SOCIALES.forEach((red) => {
      const url = redes[red.valor].trim();
      if (url && !/^https?:\/\//.test(url)) erroresNuevos[red.valor] = 'El enlace debe empezar con https://';
    });
    setErrores(erroresNuevos);
    setSeGuardo(false);
    setErrorGuardado('');
    if (Object.keys(erroresNuevos).length) return;

    // El cuerpo del PATCH, con los nombres que usa el backend. Las redes viajan como lista
    // [{ tipo, url }] solo con las que tienen enlace (la lista reemplaza a la anterior).
    const cambios = {
      nombre: datos.nombre.trim(),
      descripcion: datos.desc.trim(),
      tipoDeColectivo: datos.tipo,
      redesSociales: REDES_SOCIALES.filter((red) => redes[red.valor].trim()).map((red) => ({
        tipo: red.valor,
        url: redes[red.valor].trim(),
      })),
    };
    // La ubicación solo se manda si se eligió una (el backend no acepta vacío).
    if (datos.ubicacion) cambios.ubicacion = datos.ubicacion;

    setGuardando(true);
    try {
      const actualizado = await actualizarColectivo(id, cambios);
      setNombreGuardado(actualizado.nombre);
      setSeGuardo(true);
    } catch (error) {
      setErrorGuardado(mensajeDeError(error));
    } finally {
      setGuardando(false);
    }
  }

  // Se ejecuta al cancelar el diálogo de eliminar: lo cierra y borra lo que se había escrito.
  function alCancelarEliminacion() {
    setDialogoEliminarAbierto(false);
    setNombreEscrito('');
  }

  // Se ejecuta al tocar «Sí, eliminar». Solo avanza si el nombre escrito coincide.
  // PENDIENTE (front): DELETE /colectivos/:id ya da de baja al colectivo (activo: false),
  // pero esta pantalla todavía no lo llama: por ahora solo se cierra la sesión.
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

        {/* Avisos: guardado con éxito, o el error que devolvió el backend. */}
        {seGuardo && (
          <Alert kind="success" onClose={() => setSeGuardo(false)}>Cambios guardados.</Alert>
        )}
        {errorGuardado && (
          <Alert kind="error" onClose={() => setErrorGuardado('')}>{errorGuardado}</Alert>
        )}

        <div className={sh.form}>
          {/* Logo: la inicial del nombre (el backend no guarda imágenes). */}
          <div className={sh.r2}>
            <span className={s.lab}>Logo</span>
            <div className={sh.foto}>
              <Avatar nombre={datos.nombre || 'O'} size={96} square />
            </div>
          </div>
          <Field
            as="textarea"
            className={sh.r2}
            label="Descripción"
            placeholder="Qué hace la organización y a quién ayuda…"
            value={datos.desc}
            onChange={alCambiarCampo('desc')}
            error={errores.desc}
          />
          <Field
            label="Nombre"
            value={datos.nombre}
            onChange={alCambiarCampo('nombre')}
            error={errores.nombre}
          />
          <Field
            as="select"
            label="Tipo de colectivo"
            value={datos.tipo}
            onChange={alCambiarCampo('tipo')}
          >
            {TIPOS_DE_COLECTIVO.map((tipo) => (
              <option key={tipo.valor} value={tipo.valor}>{tipo.texto}</option>
            ))}
          </Field>
          <Field
            as="select"
            label="Ubicación"
            value={datos.ubicacion}
            onChange={alCambiarCampo('ubicacion')}
          >
            {/* «Sin indicar» solo aparece si todavía no tiene ubicación. */}
            {!colectivo.ubicacion && <option value="">Sin indicar</option>}
            {UBICACIONES.map((ubicacion) => (
              <option key={ubicacion.valor} value={ubicacion.valor}>{ubicacion.texto}</option>
            ))}
          </Field>
          {/* Un campo por cada red social que acepta el backend. */}
          {REDES_SOCIALES.map((red) => (
            <Field
              key={red.valor}
              label={red.texto}
              optional
              placeholder="https://"
              value={redes[red.valor]}
              onChange={alCambiarRed(red.valor)}
              error={errores[red.valor]}
            />
          ))}
        </div>

        {/* BLOQUE: Botones — guardar (con indicador de carga) o cancelar */}
        <div className={sh.formActs}>
          <Button type="submit" loading={guardando}>Guardar</Button>
          <Button as={Link} to="/org" variant="secondary">Cancelar</Button>
        </div>
      </form>

      {/* BLOQUE: Zona de riesgo — eliminar la cuenta del colectivo (acción permanente).
          PENDIENTE (front): la baja todavía no se pide al backend (ver alConfirmarEliminacion). */}
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

      {/* BLOQUE: Confirmación de eliminación — se pide escribir el nombre del colectivo
          como barrera extra contra clics por error. */}
      <ConfirmDialog
        open={dialogoEliminarAbierto}
        danger
        title="¿Eliminar la cuenta del colectivo?"
        confirmLabel="Sí, eliminar"
        onCancel={alCancelarEliminacion}
        onConfirm={alConfirmarEliminacion}
      >
        <Text>
          Es permanente. Para confirmar, escribí el nombre del colectivo: <b>{nombreGuardado}</b>
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
