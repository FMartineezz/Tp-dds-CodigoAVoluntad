/**
 * PANTALLA FormProyecto
 * Ruta: /org/proyectos/nuevo · /org/proyectos/:id/editar   ·   Quién la ve: Organización
 * Qué muestra: Alta/edición de proyecto: perfiles completos, búsqueda abierta, cierre
 * automático e hitos con avance.
 * Para modificarla: un campo del proyecto = otro <Field> en la grilla; un campo por
 * perfil = otro <Field> dentro de PerfilesEditor.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   0. DATOS DE EJEMPLO: el perfil vacío y los perfiles que se cargan al editar.
 *   A. PerfilesEditor (componente chico, arriba): la lista de perfiles buscados.
 *      Recibe la lista y devuelve una lista nueva cada vez que algo cambia.
 *   B. FormProyecto (el componente principal, abajo), con estas secciones:
 *      1. DATOS Y ESTADO: datos del proyecto, perfiles, hitos, logros, errores y avisos.
 *      2. CÁLCULOS: suma de pesos de los hitos y avance del proyecto.
 *      3. ACCIONES: cambiar campos, editar hitos, validar y guardar.
 *      4. LO QUE SE DIBUJA: el formulario completo (los hitos solo al editar).
 *
 * Una idea clave del archivo: React exige NO modificar listas ni objetos que ya están
 * en el estado. Para cambiar algo se arma una copia con el cambio y se la entrega al
 * `set…` correspondiente (ver docs/GLOSARIO.md → Copiar con cambios).
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Checkbox, Field, Heading, Icon, Progress, Text } from '../../atomos';
import { Alert, Crumbs, TagPicker } from '../../moleculas';
import { HABILIDADES, HITOS_EDIT, PROYECTOS } from '../../datos';
import { NoEncontrado } from '../../paginas/sistema/Errores.js';
import { persona } from './auxiliares.js';
import s from './Organizacion.module.css';
import sh from '../../plantillas/disposicion.module.css';

// ───── 0. DATOS DE EJEMPLO ─────

// Devuelve un perfil buscado en blanco. Es una función (y no un objeto fijo) para que
// cada perfil nuevo sea un objeto distinto y no se compartan datos entre perfiles.
const PERFIL_VACIO = () => ({
  rol: '',
  descripcion: '',
  requeridas: [],
  opcionales: [],
  tipo: 'semanales',
  horas: '',
  incentivo: false,
  contratacion: false,
  cupo: '',
});

// Perfiles de ejemplo que se cargan cuando se EDITA un proyecto existente.
const PERFILES_EDIT = [
  {
    rol: 'Front-end',
    descripcion: 'Arma la interfaz de turnos para voluntarias, pensada para celular.',
    requeridas: ['React', 'Accesibilidad'],
    opcionales: ['Testing'],
    tipo: 'semanales',
    horas: '4',
    incentivo: true,
    contratacion: false,
    cupo: '2',
  },
  {
    rol: 'Back-end',
    descripcion: 'Diseña la API de turnos y la base de datos.',
    requeridas: ['Node', 'MongoDB'],
    opcionales: ['DevOps'],
    tipo: 'semanales',
    horas: '6',
    incentivo: false,
    contratacion: false,
    cupo: '2',
  },
];

// Descripción de ejemplo que se carga al editar un proyecto.
const DESCRIPCION_EDIT =
  'Necesitamos una herramienta simple para organizar quién retira la vianda y en qué horario.';

// ───── A. PerfilesEditor ─────
// Dibuja y edita la lista de perfiles buscados.
// Props: `value` = lista actual de perfiles, `onChange(nuevaLista)` = avisa a la pantalla
// principal que la lista cambió, `errores` = texto de error a mostrar (o undefined).
function PerfilesEditor({ value, onChange, errores }) {
  // ───── 3. ACCIONES ─────

  // Cambia UNO O VARIOS campos de UN perfil sin tocar los demás.
  // `indice` dice cuál perfil; `cambios` es un objeto con los campos nuevos, por ejemplo
  // { horas: '5' }. Nunca se modifica la lista original: se arma una copia.
  function cambiarPerfil(indice, cambios) {
    // (.map y `...` → docs/GLOSARIO.md → Métodos de arrays / Copiar con cambios)
    const listaNueva = value.map((perfil, posicion) => {
      // Solo el perfil de la posición pedida se copia con los cambios; el resto queda igual.
      if (posicion === indice) return { ...perfil, ...cambios };
      return perfil;
    });
    onChange(listaNueva);
  }

  // Agrega un perfil en blanco al final de la lista (copia la lista y suma uno).
  function agregarPerfil() {
    onChange([...value, PERFIL_VACIO()]);
  }

  // Quita el perfil de la posición `indice` (copia la lista sin ese perfil).
  function quitarPerfil(indice) {
    onChange(value.filter((perfil, posicion) => posicion !== indice));
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <section className={s.perfiles} aria-labelledby="h-perfiles">
      {/* BLOQUE: Encabezado — título y botón para agregar un perfil */}
      <div className={`${sh.row} ${sh.sb}`}>
        <Heading level={2} size="h3" id="h-perfiles">Perfiles buscados</Heading>
        <Button
          type="button"
          variant="secondary"
          iconRight={<Icon name="mas" size={14} />}
          onClick={agregarPerfil}
        >
          Agregar perfil
        </Button>
      </div>

      {/* Se muestra solo si la lista está vacía (no hay ningún perfil cargado). */}
      {value.length === 0 && (
        <Text variant="small">
          Agregá al menos un perfil: cada uno define habilidades, compromiso y modalidad.
        </Text>
      )}

      {/* Se muestra solo si hay un texto de error (lo calcula la pantalla al guardar). */}
      {errores && <Alert kind="error">{errores}</Alert>}

      {/* BLOQUE: Un recuadro por perfil — todos sus campos editables */}
      {value.map((perfil, indice) => (
        <fieldset key={indice} className={s.perfil}>
          <legend>Perfil {indice + 1}</legend>
          <div className={sh.form}>
            <Field
              label="Nombre del perfil"
              placeholder="Ej: Tester"
              value={perfil.rol}
              onChange={(e) => cambiarPerfil(indice, { rol: e.target.value })}
            />
            <Field
              as="textarea"
              className={sh.r2}
              label="Descripción del perfil"
              placeholder="Qué tendría que hacer esta persona…"
              value={perfil.descripcion}
              onChange={(e) => cambiarPerfil(indice, { descripcion: e.target.value })}
            />
            {/* Una habilidad no puede ser a la vez requerida y opcional: cada selector
                ofrece solo las que NO están elegidas en el otro. */}
            <TagPicker
              label="Habilidades requeridas"
              value={perfil.requeridas}
              options={HABILIDADES.filter((h) => !perfil.opcionales.includes(h))}
              onChange={(habilidades) => cambiarPerfil(indice, { requeridas: habilidades })}
            />
            <TagPicker
              label="Habilidades opcionales"
              value={perfil.opcionales}
              options={HABILIDADES.filter((h) => !perfil.requeridas.includes(h))}
              onChange={(habilidades) => cambiarPerfil(indice, { opcionales: habilidades })}
            />
            <div className={s.compromiso}>
              <Field
                as="select"
                label="Compromiso"
                value={perfil.tipo}
                onChange={(e) => cambiarPerfil(indice, { tipo: e.target.value })}
              >
                <option value="semanales">Horas semanales</option>
                <option value="mensuales">Horas mensuales</option>
                <option value="totales">Horas totales</option>
              </Field>
              <Field
                label="Cantidad de horas"
                type="number"
                min="1"
                placeholder="Ej: 5"
                value={perfil.horas}
                onChange={(e) => cambiarPerfil(indice, { horas: e.target.value })}
              />
            </div>
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
            <fieldset className={`${s.modalidad} ${sh.full}`}>
              <legend>Modalidad de colaboración</legend>
              <Text variant="small">
                Si no marcás nada, la colaboración es únicamente gratuita.
              </Text>
              <div className={sh.row}>
                <Checkbox
                  checked={perfil.incentivo}
                  onChange={(e) => cambiarPerfil(indice, { incentivo: e.target.checked })}
                >
                  Ofrece incentivo económico
                </Checkbox>
                <Checkbox
                  checked={perfil.contratacion}
                  onChange={(e) => cambiarPerfil(indice, { contratacion: e.target.checked })}
                >
                  Posible contratación eventual
                </Checkbox>
              </div>
            </fieldset>
          </div>
          <div>
            <Button type="button" variant="danger" onClick={() => quitarPerfil(indice)}>
              Quitar perfil
            </Button>
          </div>
        </fieldset>
      ))}
    </section>
  );
}

// Dice si a un perfil le falta algo obligatorio: nombre, al menos una habilidad
// requerida o las horas de compromiso. Se usa al validar el formulario.
function perfilIncompleto(perfil) {
  const sinNombre = !perfil.rol.trim();
  const sinHabilidades = !perfil.requeridas.length;
  const sinHoras = !perfil.horas;
  return sinNombre || sinHabilidades || sinHoras;
}

// ───── B. FormProyecto ─────
// Prop `edit`: true cuando la ruta es /editar (precarga datos y muestra los hitos);
// false o ausente cuando es un proyecto nuevo.
export default function FormProyecto({ edit }) {
  // ───── 1. DATOS Y ESTADO ─────

  // Lee la parte variable de la dirección: /org/proyectos/48/editar → id = '48'
  // (ver docs/GLOSARIO.md → useParams)
  const { id } = useParams();

  // `navegar('/ruta')` lleva a otra pantalla desde código (ver docs/GLOSARIO.md → useNavigate).
  const navegar = useNavigate();

  // El proyecto que se está editando (solo si es de esta organización), o null si es nuevo.
  // Si no existe queda `undefined` y más abajo se muestra «no encontrado».
  const proyectoEditado = edit
    ? PROYECTOS.find((proyecto) => String(proyecto.id) === id && proyecto.colectivoId === 1)
    : null;

  // Datos simples del proyecto: guarda un objeto con nombre, desc, repo, prod, abierta (true/
  // false), hasta y cierre (fechas como texto). Lo cambia alCambiarCampo al escribir.
  // `?.` y `??`: «si hay proyecto usá su título, si no, texto vacío» (ver docs/GLOSARIO.md).
  const [datos, setDatos] = useState({
    nombre: proyectoEditado?.titulo ?? '',
    desc: edit ? DESCRIPCION_EDIT : '',
    repo: '',
    prod: '',
    abierta: true,
    hasta: edit ? '2026-11-30' : '',
    cierre: edit ? '2026-12-31' : '',
  });

  // Lista de perfiles buscados (cada uno es un objeto, ver PERFIL_VACIO). Al crear arranca
  // con un perfil vacío; al editar, con los de ejemplo. Lo cambia PerfilesEditor.
  const [perfiles, setPerfiles] = useState(edit ? PERFILES_EDIT : [PERFIL_VACIO()]);

  // Lista de hitos { nombre, peso, hecho }. Vacía al crear; al editar, con los de ejemplo.
  // Lo cambian cambiarHito, agregarHito y quitarHito.
  const [hitos, setHitos] = useState(edit ? HITOS_EDIT : []);

  // Lista de logros elegidos (textos). Lo cambia el selector de «Logros».
  const [logros, setLogros] = useState(edit ? ['Primer deploy'] : []);

  // Errores de validación por campo, p. ej. { nombre: '…', hitos: '…' }.
  // Objeto vacío = sin errores. Lo completa alGuardar.
  const [errores, setErrores] = useState({});

  // true mientras dura el «guardado» simulado (el botón muestra que está cargando).
  const [guardando, setGuardando] = useState(false);

  // true cuando hay que mostrar «Cambios guardados». Se enciende al guardar una edición
  // y se apaga apenas la persona vuelve a tocar cualquier campo.
  const [aviso, setAviso] = useState(false);

  // Si se pidió editar un proyecto que no existe (o es de otra organización), se corta
  // acá y se muestra la pantalla de error. Va después de los hooks a propósito.
  if (edit && !proyectoEditado) {
    return (
      <NoEncontrado
        code="ERR-NOT-108"
        titulo="Ese proyecto no existe"
        msg="El proyecto solicitado no fue encontrado"
      />
    );
  }

  // ───── 2. CÁLCULOS ─────

  // Suma de los pesos de TODOS los hitos. Cada hito vale un porcentaje del proyecto; si la
  // suma pasa de 100 no se puede guardar (error ERR-EST-113), porque el avance superaría el
  // 100 %. `Number(...) || 0` convierte el texto escrito en número y toma 0 si está vacío.
  // (.reduce → docs/GLOSARIO.md → Métodos de arrays: va acumulando la suma hito por hito)
  const sumaDePesos = hitos.reduce(
    (suma, hito) => suma + (Number(hito.peso) || 0),
    0
  );

  // Avance del proyecto: suma de los pesos de SOLO los hitos completados.
  // Se calcula así (y no con un número a mano) para que el avance siempre refleje el
  // trabajo realmente terminado: tildar un hito lo hace subir, destildarlo lo baja.
  const hitosCompletados = hitos.filter((hito) => hito.hecho);
  const avance = hitosCompletados.reduce(
    (suma, hito) => suma + (Number(hito.peso) || 0),
    0
  );

  // ───── 3. ACCIONES ─────

  // Devuelve la función que se ejecuta cuando cambia UN campo simple del proyecto.
  // `campo` es la propiedad de `datos` que se actualiza ('nombre', 'desc', 'abierta'…).
  function alCambiarCampo(campo) {
    return function (e) {
      setAviso(false); // al editar se esconde el «Cambios guardados» anterior
      // Los checkbox traen el valor en `checked`; los demás campos, en `value`.
      let valorNuevo = e.target.value;
      if (e.target.type === 'checkbox') valorNuevo = e.target.checked;
      // Se copia `datos` y se pisa solo ese campo (corchetes = nombre de campo variable).
      setDatos({ ...datos, [campo]: valorNuevo });
    };
  }

  // Se ejecuta cuando PerfilesEditor avisa que la lista de perfiles cambió.
  function alCambiarPerfiles(perfilesNuevos) {
    setAviso(false);
    setPerfiles(perfilesNuevos);
  }

  // Cambia UN campo de UN hito sin tocar los demás.
  // `indice` dice cuál hito; `campo` cuál propiedad ('nombre' | 'peso' | 'hecho');
  // `valor` el nuevo valor.
  function cambiarHito(indice, campo, valor) {
    setAviso(false);
    setHitos((hitosActuales) =>
      hitosActuales.map((hito, posicion) => {
        // Solo el hito en la posición pedida se copia con el cambio; los otros quedan igual.
        if (posicion === indice) return { ...hito, [campo]: valor };
        return hito;
      })
    );
  }

  // Agrega un hito en blanco al final (copia la lista y suma uno con peso 0).
  function agregarHito() {
    setHitos((hitosActuales) => [...hitosActuales, { nombre: '', peso: 0, hecho: false }]);
  }

  // Quita el hito de la posición `indice` (copia la lista sin ese hito).
  function quitarHito(indice) {
    setHitos((hitosActuales) => hitosActuales.filter((hito, posicion) => posicion !== indice));
  }

  // Se ejecuta al enviar el formulario (botón «Guardar»): valida y, si todo está bien,
  // simula el guardado.
  function alGuardar(e) {
    e.preventDefault(); // evita que el navegador recargue la página al enviar

    // Se juntan los errores en un objeto: un campo con error = una entrada nueva.
    const erroresNuevos = {};
    if (!datos.nombre.trim()) {
      erroresNuevos.nombre = 'Ingresá el nombre del proyecto. (ERR-VAL-101)';
    }
    if (!datos.desc.trim()) {
      erroresNuevos.desc = 'Ingresá una descripción. (ERR-VAL-102)';
    }
    // El repositorio es opcional, pero si se escribió tiene que empezar con http(s)://
    if (datos.repo && !/^https?:\/\//.test(datos.repo)) {
      erroresNuevos.repo = 'El enlace debe empezar con https://. (ERR-VAL-103)';
    }
    // Tiene que haber al menos un perfil y ninguno puede estar incompleto.
    if (!perfiles.length || perfiles.some(perfilIncompleto)) {
      erroresNuevos.perfiles =
        'Cada perfil necesita nombre, al menos una habilidad requerida y las horas de compromiso.';
    }
    // Regla de negocio: los pesos de los hitos no pueden sumar más de 100 %.
    if (sumaDePesos > 100) {
      erroresNuevos.hitos = 'Los pesos de los hitos suman más de 100 %. (ERR-EST-113)';
    }
    setErrores(erroresNuevos);
    setAviso(false);

    // Si hay algún error no se guarda: se muestran los avisos y se corta acá.
    if (Object.keys(erroresNuevos).length) return;

    // Guardado simulado: 700 ms de espera (ver docs/GLOSARIO.md → setTimeout).
    // Al terminar, si se estaba editando se muestra «Cambios guardados»; si era un
    // proyecto nuevo, se vuelve a la lista de proyectos.
    setGuardando(true);
    setTimeout(() => {
      setGuardando(false);
      if (edit) setAviso(true);
      else navegar('/org/proyectos');
    }, 700);
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <form className={`container ${sh.page}`} onSubmit={alGuardar} noValidate>
      {/* BLOQUE: Migas de pan y título — cambian según sea alta o edición */}
      <Crumbs
        items={[
          { label: 'Mis proyectos', to: '/org/proyectos' },
          { label: edit ? 'Editar' : 'Nuevo' },
        ]}
      />
      <Heading level={1}>{edit ? 'Editar proyecto' : 'Nuevo proyecto'}</Heading>

      {/* Aparece solo después de guardar una edición; se apaga al cerrarlo o al tocar
          un campo. */}
      {aviso && (
        <Alert kind="success" onClose={() => setAviso(false)}>Cambios guardados.</Alert>
      )}

      {/* BLOQUE: Datos del proyecto — nombre, descripción y enlaces */}
      <div className={sh.form}>
        <Field
          label="Nombre"
          placeholder="Ej: Sistema de turnos para el comedor"
          value={datos.nombre}
          onChange={alCambiarCampo('nombre')}
          error={errores.nombre}
        />
        <Field
          as="textarea"
          className={sh.r2}
          label="Descripción"
          placeholder="Contá qué problema resuelve y qué necesitan construir…"
          value={datos.desc}
          onChange={alCambiarCampo('desc')}
          error={errores.desc}
        />
        <Field
          label="Enlace al repositorio"
          optional
          placeholder="https://github.com/…"
          value={datos.repo}
          onChange={alCambiarCampo('repo')}
          error={errores.repo}
        />
        <Field
          label="Enlace a producción"
          optional
          placeholder="https://…"
          value={datos.prod}
          onChange={alCambiarCampo('prod')}
        />
      </div>

      {/* BLOQUE: Perfiles buscados — la lista editable de perfiles (componente de arriba) */}
      <PerfilesEditor
        value={perfiles}
        onChange={alCambiarPerfiles}
        errores={errores.perfiles}
      />

      {/* BLOQUE: Búsqueda de colaboraciones — si está abierta y fechas de cierre */}
      <section className={s.perfiles} aria-labelledby="h-busq">
        <Heading level={2} size="h3" id="h-busq">Búsqueda de colaboraciones</Heading>
        <div className={sh.form}>
          <div className={sh.mid}>
            <Checkbox checked={datos.abierta} onChange={alCambiarCampo('abierta')}>
              La búsqueda está abierta
            </Checkbox>
          </div>
          {/* El campo de fecha se deshabilita cuando la búsqueda NO está abierta. */}
          <Field
            label="Abierta hasta"
            optional
            type="date"
            value={datos.hasta}
            onChange={alCambiarCampo('hasta')}
            disabled={!datos.abierta}
          />
          <Field
            label="Cierre automático del proyecto"
            optional
            type="date"
            hint="Ese día el proyecto se cierra y se rechazan las postulaciones pendientes."
            value={datos.cierre}
            onChange={alCambiarCampo('cierre')}
          />
        </div>
      </section>

      {/* BLOQUE: Avance por hitos — solo al EDITAR (un proyecto nuevo aún no tiene hitos) */}
      {edit && (
        <section className={s.hitos} aria-labelledby="h-hitos">
          <Heading level={2} id="h-hitos">Avance por hitos</Heading>
          <Text variant="small">El avance del proyecto se calcula con los hitos completados.</Text>

          {/* Aparece solo si al guardar los pesos sumaban más de 100 %. */}
          {errores.hitos && <Alert kind="error">{errores.hitos}</Alert>}

          {/* BLOQUE: Tabla de hitos — nombre, peso, si está completado y botón para quitar */}
          <table className={sh.table}>
            <thead>
              <tr>
                <th>Hito</th>
                <th>Peso (%)</th>
                <th>Completado</th>
                <th><span className="sr-only">Acción</span></th>
              </tr>
            </thead>
            <tbody>
              {hitos.map((hito, indice) => (
                <tr key={indice}>
                  <td data-l="Hito">
                    <Field
                      label={`Nombre del hito ${indice + 1}`}
                      className={s.sinLabel}
                      value={hito.nombre}
                      onChange={(e) => cambiarHito(indice, 'nombre', e.target.value)}
                    />
                  </td>
                  <td data-l="Peso (%)" className={s.peso}>
                    <Field
                      label={`Peso del hito ${indice + 1}`}
                      className={s.sinLabel}
                      type="number"
                      min="0"
                      max="100"
                      value={hito.peso}
                      onChange={(e) => cambiarHito(indice, 'peso', e.target.value)}
                    />
                  </td>
                  <td data-l="Completado">
                    <Checkbox
                      checked={hito.hecho}
                      onChange={(e) => cambiarHito(indice, 'hecho', e.target.checked)}
                    >
                      {/* El texto del checkbox es «Sí» si el hito está hecho, «No» si no. */}
                      {hito.hecho ? 'Sí' : 'No'}
                    </Checkbox>
                  </td>
                  <td className={sh.act}>
                    <Button type="button" variant="danger" onClick={() => quitarHito(indice)}>
                      Quitar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div>
            <Button
              type="button"
              variant="secondary"
              iconRight={<Icon name="mas" size={14} />}
              onClick={agregarHito}
            >
              Agregar hito
            </Button>
          </div>

          {/* BLOQUE: Resumen — suma de pesos, avance calculado y barra de progreso */}
          <div className={s.sum}>
            <div className={`${sh.row} ${sh.sb}`}>
              {/* La suma se pinta en rojo (s.mal) solo si pasa de 100; si no, sin clase extra. */}
              <span className={sumaDePesos > 100 ? s.mal : undefined}>
                Suma de pesos: <b>{sumaDePesos} %</b>
              </span>
              <span>Avance calculado: <b>{avance} %</b></span>
            </div>
            {/* La barra nunca pasa de 100, aunque los pesos se pasen. */}
            <Progress value={Math.min(100, avance)} />
          </div>

          {/* BLOQUE: Logros — selector de logros del proyecto */}
          <TagPicker
            label="Logros"
            value={logros}
            options={['Primer deploy', 'MVP', 'Primer usuario real']}
            onChange={setLogros}
            addLabel="Agregar logro"
          />
        </section>
      )}

      {/* BLOQUE: Botones — guardar (con indicador de carga) o cancelar */}
      <div className={sh.formActs}>
        <Button type="submit" loading={guardando}>Guardar</Button>
        <Button as={Link} to="/org/proyectos" variant="secondary">Cancelar</Button>
      </div>
    </form>
  );
}
