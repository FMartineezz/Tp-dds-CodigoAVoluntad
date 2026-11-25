/**
 * PANTALLA FormProyecto
 * Ruta: /org/proyectos/nuevo · /org/proyectos/:id/editar   ·   Quién la ve: Organización
 * Qué muestra: Alta/edición de proyecto: datos, perfiles buscados, fechas y logros (avance).
 * De dónde salen los datos (ver api/organizacion.js):
 *   · Alta: POST /proyectos con sus perfiles (el colectivo va por NOMBRE y las habilidades
 *     por CÓDIGO, como pide el backend).
 *   · Edición: el proyecto de GET /proyectos/:id y, al guardar, solo lo que cambió:
 *     PATCH /proyectos/:id (urlDonaciones, fechaCierre), POST/PATCH/DELETE de perfiles y
 *     POST/PATCH/DELETE de logros.
 *   PENDIENTE (backend): PATCH /proyectos/:id no acepta titulo, descripcion, urlSistema ni
 *   fechaLimiteBusqueda (ni abrir/cerrar la búsqueda con busquedaCerrada): en la edición
 *   esos campos se ven pero están deshabilitados.
 * Para modificarla: un campo del proyecto = otro <Field> en la grilla (y su nombre del
 * backend en armarProyectoNuevo); un campo por perfil = otro <Field> en PerfilesEditor.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   0. VALORES Y CONVERSIONES: perfil y logro vacíos, y cómo pasar del backend al formulario.
 *   A. PerfilesEditor (componente chico): la lista de perfiles buscados.
 *   B. FormProyecto (el que usa la ruta): pide los datos al backend y, cuando llegan,
 *      dibuja el Formulario. Así el estado del formulario nace con los datos ya cargados.
 *   C. Formulario, con estas secciones:
 *      1. DATOS Y ESTADO: datos del proyecto, perfiles, logros, errores y avisos.
 *      2. CÁLCULOS: avance (suma de los logros).
 *      3. ACCIONES: cambiar campos, editar logros, validar y guardar.
 *      4. LO QUE SE DIBUJA: el formulario completo (los logros solo al editar).
 *
 * Una idea clave del archivo: React exige NO modificar listas ni objetos que ya están
 * en el estado. Para cambiar algo se arma una copia con el cambio y se la entrega al
 * `set…` correspondiente (ver docs/GLOSARIO.md → Copiar con cambios).
 */
import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Field, Heading, Icon, Progress, Text } from '../../atomos';
import { Alert, Crumbs, RowsSkeleton, TagPicker } from '../../moleculas';
import { useAuth } from '../../contexto';
import { usePedido } from '../../hooks';
import { mensajeDeError } from '../../api/errores.js';
import { llevarAlPrimerError } from '../../utilidades/llevarAlPrimerError.js';
import { obtenerHabilidades } from '../../api/habilidades.js';
import { MODALIDADES } from '../../api/proyectos.js';
import {
  actualizarLogro,
  actualizarPerfil,
  actualizarProyecto,
  agregarLogro,
  agregarPerfil,
  crearProyecto,
  eliminarLogro,
  eliminarPerfil,
  obtenerMiColectivo,
} from '../../api/organizacion.js';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { esNoEncontrado, obtenerMiProyecto } from './auxiliares.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

// ───── 0. VALORES Y CONVERSIONES ─────

// Devuelve un perfil buscado en blanco. Es una función (y no un objeto fijo) para que
// cada perfil nuevo sea un objeto distinto. Sin `id` = todavía no existe en el backend.
const PERFIL_VACIO = () => ({
  descripcion: '',
  requeridas: [],
  opcionales: [],
  tipo: 'semanal',
  horas: '',
  modalidad: 'gratuita',
  cupo: '',
});

// Un logro en blanco (sin `id` = nuevo).
const LOGRO_VACIO = () => ({ descripcion: '', porcentaje: '', url: '' });

// Fecha del backend ('2026-12-18T23:38:05.748Z') → valor de <input type="date"> ('2026-12-18').
const aFechaDelInput = (fecha) => (fecha ? String(fecha).slice(0, 10) : '');

// Perfil como lo adapta api/proyectos.js → perfil del formulario (horas y cupo como texto,
// porque así los manejan los <input>).
function perfilDelFormulario(p) {
  return {
    id: p.id,
    descripcion: p.descripcion ?? '',
    requeridas: p.requeridas,
    opcionales: p.opcionales,
    tipo: p.tipoDeCompromiso,
    horas: String(p.horas ?? ''),
    modalidad: p.modalidadDeColaboracion,
    cupo: p.cantidadMaxima ? String(p.cantidadMaxima) : '',
  };
}

// Logro del backend → logro del formulario.
function logroDelFormulario(l) {
  return { id: l._id, descripcion: l.descripcion, porcentaje: String(l.porcentaje), url: l.urlCodigoFuente };
}

// Perfil del formulario → cuerpo que espera el backend. `codigos` es el Map título → código.
function perfilParaElBackend(perfil, codigos) {
  const cuerpo = {
    descripcion: perfil.descripcion.trim(),
    habilidadesRequeridas: perfil.requeridas.map((titulo) => codigos.get(titulo)),
    habilidadesOpcionales: perfil.opcionales.map((titulo) => codigos.get(titulo)),
    horas: Number(perfil.horas),
    tipoDeCompromiso: perfil.tipo,
    modalidadDeColaboracion: perfil.modalidad,
  };
  if (perfil.cupo) cuerpo.cantidadMaxima = Number(perfil.cupo);
  return cuerpo;
}

// Logro del formulario → cuerpo que espera el backend.
function logroParaElBackend(logro) {
  return {
    descripcion: logro.descripcion.trim(),
    porcentaje: Number(logro.porcentaje),
    urlCodigoFuente: logro.url.trim(),
  };
}

// ¿Cambió algo? Compara dos objetos convirtiéndolos a texto (alcanza para datos simples).
const cambio = (a, b) => JSON.stringify(a) !== JSON.stringify(b);

// ───── A. PerfilesEditor ─────
// Dibuja y edita la lista de perfiles buscados.
// Props: `value` = lista actual de perfiles, `onChange(nuevaLista)` = avisa que cambió,
// `errores` = texto de error (o undefined), `habilidades` = títulos que se pueden elegir.
// Si hay `errores`, además se marca en rojo cada campo que falta completar.
function PerfilesEditor({ value, onChange, errores, habilidades }) {
  // Cambia UNO O VARIOS campos de UN perfil sin tocar los demás.
  function cambiarPerfil(indice, cambios) {
    // (.map y `...` → docs/GLOSARIO.md → Métodos de arrays / Copiar con cambios)
    onChange(value.map((perfil, posicion) => (posicion === indice ? { ...perfil, ...cambios } : perfil)));
  }

  // Agrega un perfil en blanco al final de la lista.
  function agregarPerfilVacio() {
    onChange([...value, PERFIL_VACIO()]);
  }

  // Quita el perfil de la posición `indice`.
  function quitarPerfil(indice) {
    onChange(value.filter((perfil, posicion) => posicion !== indice));
  }

  return (
    <section className={s.perfiles} aria-labelledby="h-perfiles">
      <Heading level={2} size="h3" id="h-perfiles">Perfiles buscados</Heading>

      {value.length === 0 && (
        <Text variant="small">
          Agregá al menos un perfil: cada uno define habilidades, compromiso y modalidad.
        </Text>
      )}

      {errores && <Alert kind="error">{errores}</Alert>}

      {/* BLOQUE: Un recuadro por perfil — todos sus campos editables */}
      {value.map((perfil, indice) => (
        <fieldset key={perfil.id ?? `nuevo-${indice}`} className={s.perfilBuscado}>
          <legend>Perfil {indice + 1}</legend>
          {/* Filas: descripción | requeridas · compromiso | opcionales · modalidad | cupo */}
          <div className={sh.form}>
            <Field
              as="textarea"
              className={s.descripcionDelPerfil}
              label="Descripción del perfil"
              placeholder="Ej: Desarrollo frontend. Vas a armar las pantallas de inscripción en React junto a otra persona del equipo."
              value={perfil.descripcion}
              onChange={(e) => cambiarPerfil(indice, { descripcion: e.target.value })}
              error={errores && !perfil.descripcion.trim() ? 'Contá qué va a hacer esta persona.' : undefined}
            />
            {/* Una habilidad no puede ser a la vez requerida y opcional: cada selector
                ofrece solo las que NO están elegidas en el otro. */}
            <TagPicker
              label="Habilidades requeridas"
              value={perfil.requeridas}
              options={habilidades.filter((h) => !perfil.opcionales.includes(h))}
              onChange={(elegidas) => cambiarPerfil(indice, { requeridas: elegidas })}
              error={errores && !perfil.requeridas.length ? 'Elegí al menos una habilidad.' : undefined}
            />
            <div className={s.compromiso}>
              <Field
                as="select"
                label="Compromiso"
                value={perfil.tipo}
                onChange={(e) => cambiarPerfil(indice, { tipo: e.target.value })}
              >
                <option value="semanal">Horas semanales</option>
                <option value="mensual">Horas mensuales</option>
                <option value="total">Horas totales</option>
              </Field>
              <Field
                label="Cantidad de horas"
                type="number"
                min="1"
                placeholder="Ej: 5"
                value={perfil.horas}
                onChange={(e) => cambiarPerfil(indice, { horas: e.target.value })}
                error={errores && !(Number(perfil.horas) > 0) ? 'Poné cuántas horas.' : undefined}
              />
            </div>
            <TagPicker
              label="Habilidades opcionales"
              value={perfil.opcionales}
              options={habilidades.filter((h) => !perfil.requeridas.includes(h))}
              onChange={(elegidas) => cambiarPerfil(indice, { opcionales: elegidas })}
            />
            {/* El backend guarda UNA modalidad por perfil. */}
            <Field
              as="select"
              label="Modalidad de colaboración"
              value={perfil.modalidad}
              onChange={(e) => cambiarPerfil(indice, { modalidad: e.target.value })}
            >
              {/* Object.entries convierte { clave: texto } en pares [clave, texto]. */}
              {Object.entries(MODALIDADES).map(([valor, texto]) => (
                <option key={valor} value={valor}>{texto}</option>
              ))}
            </Field>
            <Field
              label="Cupo de colaboraciones"
              optional
              type="number"
              min="1"
              placeholder="Sin límite"
              hint="Al llegar al cupo no se pueden aceptar más postulaciones."
              value={perfil.cupo}
              onChange={(e) => cambiarPerfil(indice, { cupo: e.target.value })}
            />
          </div>
          <div>
            {/* Un proyecto necesita al menos un perfil: con uno solo no se puede quitar */}
            <Button
              type="button"
              variant="danger"
              disabled={value.length === 1}
              title={value.length === 1 ? 'El proyecto necesita al menos un perfil' : undefined}
              onClick={() => quitarPerfil(indice)}
            >
              Quitar perfil
            </Button>
          </div>
        </fieldset>
      ))}

      {/* Agregar va debajo del último perfil, centrado */}
      <div className={s.agregarPerfil}>
        <Button
          type="button"
          variant="secondary"
          iconRight={<Icon name="mas" size={14} />}
          onClick={agregarPerfilVacio}
        >
          Agregar perfil
        </Button>
      </div>
    </section>
  );
}

// Dice si a un perfil le falta algo obligatorio: descripción, al menos una habilidad
// requerida u horas (número mayor que 0).
function perfilIncompleto(perfil) {
  return !perfil.descripcion.trim() || !perfil.requeridas.length || !(Number(perfil.horas) > 0);
}

// Dice si a un logro le falta algo: descripción, porcentaje entre 0 (excluido) y 100,
// y un enlace http(s) al código fuente.
function logroIncompleto(logro) {
  const porcentaje = Number(logro.porcentaje);
  return (
    !logro.descripcion.trim() ||
    !(porcentaje > 0 && porcentaje <= 100) ||
    !/^https?:\/\/\S+/.test(logro.url.trim())
  );
}

// ───── B. FormProyecto ─────
// Pide lo necesario al backend: el catálogo de habilidades y, según el caso, el colectivo
// (alta: hace falta su NOMBRE para el POST) o el proyecto a editar (solo si es mío).
async function cargarFormulario(edit, proyectoId, colectivoId) {
  const [habilidades, extra] = await Promise.all([
    obtenerHabilidades(),
    edit ? obtenerMiProyecto(proyectoId, colectivoId) : obtenerMiColectivo(colectivoId),
  ]);
  return edit ? { habilidades, proyecto: extra } : { habilidades, colectivo: extra };
}

// Prop `edit`: true cuando la ruta es /editar; false o ausente cuando es un proyecto nuevo.
export default function FormProyecto({ edit = false }) {
  // Lee la parte variable de la dirección: /org/proyectos/6afe…/editar → id = '6afe…'
  const { id } = useParams();
  const { id: idColectivo } = useAuth();

  // Sumarle 1 vuelve a pedir el proyecto (después de guardar una edición).
  const [version, setVersion] = useState(0);
  const { cargando, datos, error } = usePedido(
    () => cargarFormulario(edit, id, idColectivo),
    [edit, id, idColectivo, version]
  );

  // Aviso «Cambios guardados»: vive acá (y no en Formulario) porque Formulario se vuelve a
  // crear cuando llegan los datos nuevos, y su estado se perdería.
  const [aviso, setAviso] = useState(false);

  if (cargando) {
    return (
      <div className={`container ${sh.page}`}>
        <RowsSkeleton n={6} />
      </div>
    );
  }
  if (esNoEncontrado(error)) {
    const { code, message } = error.response.data;
    return <NoEncontrado code={code} titulo="Ese proyecto no existe" msg={message} />;
  }
  if (error) {
    return (
      <div className={`container ${sh.page}`}>
        <Alert kind="error" title="No pudimos cargar el formulario">{mensajeDeError(error)}</Alert>
      </div>
    );
  }

  // `key`: si cambia, React descarta el Formulario viejo y crea uno nuevo con los datos
  // recién llegados (así el estado inicial se vuelve a armar).
  return (
    <Formulario
      key={version}
      edit={edit}
      {...datos}
      aviso={aviso}
      setAviso={setAviso}
      alGuardarEdicion={() => {
        setAviso(true);
        setVersion((v) => v + 1);
      }}
    />
  );
}

// ───── C. Formulario ─────
// Props: `edit`, `habilidades` (catálogo), `proyecto` (al editar) o `colectivo` (al crear),
// `aviso`/`setAviso` (el «Cambios guardados») y `alGuardarEdicion` (recarga los datos).
function Formulario({ edit, habilidades, proyecto, colectivo, aviso, setAviso, alGuardarEdicion }) {
  // ───── 1. DATOS Y ESTADO ─────

  const navegar = useNavigate();

  // Títulos de las habilidades (lo que muestra el selector) y el Map título → código
  // (lo que viaja al backend).
  const titulosDeHabilidades = habilidades.map((h) => h.titulo);
  const codigos = new Map(habilidades.map((h) => [h.titulo, h.codigo]));

  // Valores con los que arranca el formulario (al editar, los del backend). Se guardan
  // para comparar al guardar y mandar SOLO lo que cambió.
  const [inicial] = useState(() => ({
    datos: {
      nombre: proyecto?.titulo ?? '',
      desc: proyecto?.descripcion ?? '',
      urlSistema: proyecto?.urlSistema ?? '',
      urlDonaciones: proyecto?.urlDonaciones ?? '',
      hasta: aFechaDelInput(proyecto?.fechaLimiteBusqueda),
      cierre: aFechaDelInput(proyecto?.fechaCierre),
    },
    perfiles: proyecto ? proyecto.perfiles.map(perfilDelFormulario) : [PERFIL_VACIO()],
    logros: proyecto ? proyecto.logros.map(logroDelFormulario) : [],
  }));

  // Datos simples del proyecto. Lo cambia alCambiarCampo al escribir.
  const [datos, setDatos] = useState(inicial.datos);

  // Lista de perfiles buscados. Lo cambia PerfilesEditor.
  const [perfiles, setPerfiles] = useState(inicial.perfiles);

  // Lista de logros { id?, descripcion, porcentaje, url }. Lo cambian cambiarLogro,
  // agregarLogroVacio y quitarLogro.
  const [logros, setLogros] = useState(inicial.logros);

  // Errores de validación por campo. Objeto vacío = sin errores. Lo completa alGuardar.
  const [errores, setErrores] = useState({});

  // Error que devolvió el backend al guardar ('' = ninguno).
  const [errorGuardado, setErrorGuardado] = useState('');

  // true mientras se espera al backend (el botón muestra que está cargando).
  const [guardando, setGuardando] = useState(false);
  // El <form>, para poder llevar a la persona hasta el primer error.
  const formulario = useRef(null);

  // Un proyecto finalizado ya no acepta cambios en sus logros (ERR-EST-109).
  const finalizado = Boolean(proyecto?.finalizado);

  // ───── 2. CÁLCULOS ─────

  // Avance del proyecto: suma de los porcentajes de los logros. No puede pasar de 100
  // (ERR-EST-113). `Number(...) || 0` toma 0 si el campo está vacío.
  // (.reduce → docs/GLOSARIO.md → Métodos de arrays)
  const avance = logros.reduce((suma, logro) => suma + (Number(logro.porcentaje) || 0), 0);

  // ───── 3. ACCIONES ─────

  // Devuelve la función que se ejecuta cuando cambia UN campo simple del proyecto.
  function alCambiarCampo(campo) {
    return function (e) {
      setAviso(false);
      setDatos({ ...datos, [campo]: e.target.value });
    };
  }

  function alCambiarPerfiles(perfilesNuevos) {
    setAviso(false);
    setPerfiles(perfilesNuevos);
  }

  // Cambia UN campo de UN logro sin tocar los demás.
  function cambiarLogro(indice, campo, valor) {
    setAviso(false);
    setLogros((actuales) =>
      actuales.map((logro, posicion) => (posicion === indice ? { ...logro, [campo]: valor } : logro))
    );
  }
  function agregarLogroVacio() {
    setLogros((actuales) => [...actuales, LOGRO_VACIO()]);
  }
  function quitarLogro(indice) {
    setLogros((actuales) => actuales.filter((logro, posicion) => posicion !== indice));
  }

  // Revisa el formulario y devuelve los errores encontrados (objeto vacío = todo bien).
  function validar() {
    const erroresNuevos = {};
    if (!datos.nombre.trim()) erroresNuevos.nombre = 'Ingresá el nombre del proyecto.';
    if (!datos.desc.trim()) erroresNuevos.desc = 'Ingresá una descripción.';
    if (!/^https?:\/\/\S+/.test(datos.urlSistema.trim())) {
      erroresNuevos.urlSistema = 'Ingresá el enlace al sistema, empezando con https://.';
    }
    if (datos.urlDonaciones.trim() && !/^https?:\/\/\S+/.test(datos.urlDonaciones.trim())) {
      erroresNuevos.urlDonaciones = 'El enlace debe empezar con https://.';
    }
    if (!perfiles.length || perfiles.some(perfilIncompleto)) {
      erroresNuevos.perfiles =
        'Cada perfil necesita descripción, al menos una habilidad requerida y las horas de compromiso.';
    }
    if (logros.some(logroIncompleto)) {
      erroresNuevos.logros =
        'Cada logro necesita descripción, un porcentaje entre 1 y 100 y el enlace al código fuente.';
    } else if (avance > 100) {
      erroresNuevos.logros = 'Los logros suman más de 100 %.';
    }
    return erroresNuevos;
  }

  // ALTA: arma el cuerpo de POST /proyectos con los nombres del backend.
  function armarProyectoNuevo() {
    const cuerpo = {
      titulo: datos.nombre.trim(),
      descripcion: datos.desc.trim(),
      colectivo: colectivo.nombre, // el backend pide el NOMBRE del colectivo
      urlSistema: datos.urlSistema.trim(),
      perfiles: perfiles.map((perfil) => perfilParaElBackend(perfil, codigos)),
    };
    // Los opcionales solo se mandan si se completaron.
    if (datos.urlDonaciones.trim()) cuerpo.urlDonaciones = datos.urlDonaciones.trim();
    if (datos.hasta) cuerpo.fechaLimiteBusqueda = datos.hasta;
    if (datos.cierre) cuerpo.fechaCierre = datos.cierre;
    return cuerpo;
  }

  // EDICIÓN: manda al backend, uno por uno, solo los cambios. Si un pedido falla, los
  // anteriores ya quedaron guardados y se corta ahí (el error lo muestra alGuardar).
  async function guardarCambios() {
    const proyectoId = proyecto.id;

    // 1) Datos del proyecto que el backend deja cambiar.
    const cambiosProyecto = {};
    if (datos.urlDonaciones !== inicial.datos.urlDonaciones) {
      cambiosProyecto.urlDonaciones = datos.urlDonaciones.trim() || null; // null = quitar
    }
    if (datos.cierre !== inicial.datos.cierre) {
      cambiosProyecto.fechaCierre = datos.cierre || null;
    }
    if (Object.keys(cambiosProyecto).length) await actualizarProyecto(proyectoId, cambiosProyecto);

    // 2) Perfiles: los que ya no están se borran; los nuevos (sin id) se crean; los que
    //    cambiaron se actualizan.
    const idsQueQuedan = perfiles.map((p) => p.id).filter(Boolean);
    for (const viejo of inicial.perfiles) {
      if (!idsQueQuedan.includes(viejo.id)) await eliminarPerfil(proyectoId, viejo.id);
    }
    for (const perfil of perfiles) {
      if (!perfil.id) {
        await agregarPerfil(proyectoId, perfilParaElBackend(perfil, codigos));
      } else {
        const viejo = inicial.perfiles.find((p) => p.id === perfil.id);
        if (cambio(viejo, perfil)) {
          await actualizarPerfil(proyectoId, perfil.id, perfilParaElBackend(perfil, codigos));
        }
      }
    }

    // 3) Logros: primero se borran (libera porcentaje), después se actualizan y al final
    //    se crean los nuevos, para no pasar del 100 % a mitad de camino.
    const logrosQueQuedan = logros.map((l) => l.id).filter(Boolean);
    for (const viejo of inicial.logros) {
      if (!logrosQueQuedan.includes(viejo.id)) await eliminarLogro(proyectoId, viejo.id);
    }
    for (const logro of logros.filter((l) => l.id)) {
      const viejo = inicial.logros.find((l) => l.id === logro.id);
      if (cambio(viejo, logro)) await actualizarLogro(proyectoId, logro.id, logroParaElBackend(logro));
    }
    for (const logro of logros.filter((l) => !l.id)) {
      await agregarLogro(proyectoId, logroParaElBackend(logro));
    }
  }

  // Se ejecuta al enviar el formulario (botón «Guardar»): valida y, si todo está bien,
  // guarda en el backend.
  async function alGuardar(e) {
    e.preventDefault(); // evita que el navegador recargue la página al enviar

    const erroresNuevos = validar();
    setErrores(erroresNuevos);
    setAviso(false);
    setErrorGuardado('');
    if (Object.keys(erroresNuevos).length) {
      llevarAlPrimerError(formulario.current);
      return;
    }

    setGuardando(true);
    try {
      if (edit) {
        await guardarCambios();
        alGuardarEdicion(); // aviso «Cambios guardados» y recarga del proyecto
      } else {
        await crearProyecto(armarProyectoNuevo());
        navegar('/org/proyectos');
      }
    } catch (error) {
      setErrorGuardado(
        edit
          ? `${mensajeDeError(error)} Los cambios anteriores a este error ya quedaron guardados.`
          : mensajeDeError(error)
      );
      setGuardando(false);
      // El aviso del backend está arriba de todo: subimos para que se vea
      formulario.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Texto de ayuda para los campos que el backend todavía no deja editar.
  const noEditable = edit ? 'Por ahora no se puede modificar después de publicar.' : undefined;

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <form ref={formulario} className={`container ${sh.page}`} onSubmit={alGuardar} noValidate>
      {/* BLOQUE: Migas de pan y título — cambian según sea alta o edición */}
      <Crumbs
        items={[
          { label: 'Mis proyectos', to: '/org/proyectos' },
          { label: edit ? 'Editar' : 'Nuevo' },
        ]}
      />
      <Heading level={1}>{edit ? 'Editar proyecto' : 'Nuevo proyecto'}</Heading>

      {/* Avisos: guardado con éxito, error del backend, o proyecto finalizado. */}
      {aviso && <Alert kind="success" onClose={() => setAviso(false)}>Cambios guardados.</Alert>}
      {errorGuardado && (
        <Alert kind="error" onClose={() => setErrorGuardado('')}>{errorGuardado}</Alert>
      )}
      {finalizado && (
        <Alert kind="warning">Este proyecto está finalizado: ya no se pueden cambiar sus logros.</Alert>
      )}

      {/* BLOQUE: Datos del proyecto — nombre, descripción y enlaces */}
      <div className={sh.form}>
        <Field
          label="Nombre"
          placeholder="Ej: Sistema de turnos para el comedor"
          value={datos.nombre}
          onChange={alCambiarCampo('nombre')}
          error={errores.nombre}
          disabled={edit}
          hint={noEditable}
        />
        <Field
          as="textarea"
          className={s.descripcionDelProyecto}
          label="Descripción"
          placeholder="Ej: Hoy anotamos los turnos del comedor en papel y se pierden. Queremos una web simple para que las familias reserven y sepamos cuántas viandas preparar."
          value={datos.desc}
          onChange={alCambiarCampo('desc')}
          error={errores.desc}
          disabled={edit}
          hint={noEditable}
        />
        <Field
          label="Enlace al sistema"
          placeholder="https://…"
          value={datos.urlSistema}
          onChange={alCambiarCampo('urlSistema')}
          error={errores.urlSistema}
          disabled={edit}
          hint={noEditable ?? 'Dónde se va a ver el sistema funcionando.'}
        />
        <Field
          label="Enlace para donaciones"
          optional
          placeholder="https://cafecito.app/…"
          value={datos.urlDonaciones}
          onChange={alCambiarCampo('urlDonaciones')}
          error={errores.urlDonaciones}
        />
      </div>

      {/* BLOQUE: Perfiles buscados — la lista editable de perfiles (componente de arriba) */}
      <PerfilesEditor
        value={perfiles}
        onChange={alCambiarPerfiles}
        errores={errores.perfiles}
        habilidades={titulosDeHabilidades}
      />

      {/* BLOQUE: Fechas — límite para postularse y cierre automático */}
      <section className={s.perfiles} aria-labelledby="h-busq">
        <Heading level={2} size="h3" id="h-busq">Búsqueda de colaboraciones</Heading>
        <div className={sh.form}>
          <Field
            label="Recibe postulaciones hasta"
            optional
            type="date"
            value={datos.hasta}
            onChange={alCambiarCampo('hasta')}
            disabled={edit}
            hint={noEditable}
          />
          <Field
            label="Cierre automático del proyecto"
            optional
            type="date"
            value={datos.cierre}
            onChange={alCambiarCampo('cierre')}
          />
        </div>
      </section>

      {/* BLOQUE: Avance por logros — solo al EDITAR (un proyecto nuevo aún no tiene logros) */}
      {edit && (
        <section className={s.hitos} aria-labelledby="h-logros">
          <Heading level={2} id="h-logros">Avance por logros</Heading>
          <Text variant="small">
            Cada logro cumplido suma un porcentaje al avance del proyecto (hasta 100 %).
          </Text>

          {errores.logros && <Alert kind="error">{errores.logros}</Alert>}

          {/* BLOQUE: Tabla de logros — descripción, porcentaje, enlace y botón para quitar */}
          {logros.length > 0 && (
            <table className={sh.table}>
              <thead>
                <tr>
                  <th>Logro</th>
                  <th>Porcentaje</th>
                  <th>Código fuente</th>
                  <th><span className="sr-only">Acción</span></th>
                </tr>
              </thead>
              <tbody>
                {logros.map((logro, indice) => (
                  <tr key={logro.id ?? `nuevo-${indice}`}>
                    <td data-l="Logro">
                      <Field
                        label={`Descripción del logro ${indice + 1}`}
                        className={s.sinLabel}
                        value={logro.descripcion}
                        disabled={finalizado}
                        onChange={(e) => cambiarLogro(indice, 'descripcion', e.target.value)}
                      />
                    </td>
                    <td data-l="Porcentaje" className={s.peso}>
                      <Field
                        label={`Porcentaje del logro ${indice + 1}`}
                        className={s.sinLabel}
                        type="number"
                        min="1"
                        max="100"
                        value={logro.porcentaje}
                        disabled={finalizado}
                        onChange={(e) => cambiarLogro(indice, 'porcentaje', e.target.value)}
                      />
                    </td>
                    <td data-l="Código fuente">
                      <Field
                        label={`Enlace al código del logro ${indice + 1}`}
                        className={s.sinLabel}
                        placeholder="https://github.com/…"
                        value={logro.url}
                        disabled={finalizado}
                        onChange={(e) => cambiarLogro(indice, 'url', e.target.value)}
                      />
                    </td>
                    <td className={sh.actions}>
                      <Button
                        type="button"
                        variant="danger"
                        disabled={finalizado}
                        onClick={() => quitarLogro(indice)}
                      >
                        Quitar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!finalizado && (
            <div>
              <Button
                type="button"
                variant="secondary"
                iconRight={<Icon name="mas" size={14} />}
                onClick={agregarLogroVacio}
              >
                Agregar logro
              </Button>
            </div>
          )}

          {/* BLOQUE: Resumen — avance calculado y barra de progreso */}
          <div className={s.resumen}>
            <div className={`${sh.row} ${sh.spaceBetween}`}>
              {/* El número se pinta en rojo (s.error) si pasa de 100. */}
              <span className={avance > 100 ? s.error : undefined}>
                Avance: <b>{avance} %</b>
              </span>
            </div>
            <Progress value={Math.min(100, avance)} />
          </div>
        </section>
      )}

      {/* BLOQUE: Botones — guardar (con indicador de carga) o cancelar */}
      <div className={sh.formActions}>
        <Button type="submit" loading={guardando}>Guardar</Button>
        <Button as={Link} to="/org/proyectos" variant="secondary">Cancelar</Button>
      </div>
    </form>
  );
}
