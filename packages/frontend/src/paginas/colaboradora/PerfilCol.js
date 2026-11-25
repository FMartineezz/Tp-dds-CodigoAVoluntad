/* eslint-disable react/react-in-jsx-scope */
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
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Button, Checkbox, Field, Heading } from '../../atomos';
import { Alert, ContactosEditor, TagPicker } from '../../moleculas';
import s from './Colaboradora.module.css';
import sh from '../../plantillas/disposicion.module.css'; // sh = layout común (.page, .form…)
import { useAuth } from '../../contexto';
import Lodash from "lodash";


export default function PerfilCol() {
  const { usuario, cargando, keycloak, recargarPerfil } = useAuth();

  // Mientras carga o si todavía no se hidrató el usuario, evitamos errores de renderizado
  if (cargando || !usuario) {
    return <p>Cargando datos del perfil...</p>;
  }
  // ───── 1. DATOS Y ESTADO ─────

  // Todos los campos simples del perfil juntos en un objeto: texto para los campos,
  // true/false para la casilla `mensajes`. Empiezan con datos de ejemplo de «Lucía».
  // Los cambia alCambiarCampo y alImportarDeLinkedIn.
  // (ver docs/GLOSARIO.md → useState)
  const [datos, setDatos] = useState({
    fantasia: usuario.nombreFantasia,
    nombre: usuario.nombre,
    apellido: usuario.appellido,
    pronombres: usuario.pronombres,
    github: usuario.git,
    habilidades: usuario.habilidades.map((h) => h.titulo),
    contactos: usuario.contactos.map((obj) => Object.values(obj)),
    linkedin: '',
    web: '',
    bio: usuario.presentacion,
    mensajes: usuario.bloquearMensajeInterno,
  });
  console.log(datos.contactos);

  // Habilidades elegidas, como array de textos. Empieza con dos de ejemplo; las cambia
  // el TagPicker y alImportarDeLinkedIn (que suma «Accesibilidad»).
/*   const [habilidadesElegidas, setHabilidadesElegidas] = useState(['React', 'Node']); */

  // Contactos internos: array de pares [tipo, dato]. Empieza con dos de ejemplo;
  // lo cambia el ContactosEditor.
/*   const [contactos, setContactos] = useState([
    ['Correo', 'colaboradora@demo.org'],
    ['WhatsApp', '+54 11 5555-0199'],
  ]); */

  // true durante la espera simulada del guardado (el botón muestra «cargando»).
  // Lo cambia alGuardar.
  const [guardando, setGuardando] = useState(false);

  // Mensaje verde de éxito o de aviso ('' = no se muestra). Lo ponen alGuardar y
  // alImportarDeLinkedIn; lo borran los cambios en los campos y la «x» del aviso.
  const [mensajeOk, setMensajeOk] = useState('');

  // Errores por campo, ej. { fantasia: '…', mail: '…' }. Empieza vacío ({} = sin errores);
  // lo cambia alGuardar.
  const [errores, setErrores] = useState({});

  const [habilidadesDisponibles, setHabilidadesDisponibles] = useState([]);
  
  useEffect(() => {
    const controlador = new AbortController();
    
    async function cargarHabilidades() {
      try {
        const response = await fetch("http://localhost:3000/habilidades", {
          signal: controlador.signal,
        });
        if (!response.ok) throw new Error("Error al cargar habilidades");
        const data = await response.json();
        console.log(data)
        setHabilidadesDisponibles(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorHabilidades(error.message);
        }
      }
    }
    
    cargarHabilidades();
    return () => controlador.abort();
  }, []);
  // ───── 3. ACCIONES ─────

  // Devuelve el manejador onChange de un campo: `alCambiarCampo('mail')` se ejecuta cuando
  // la persona escribe en «mail» (o tilda una casilla). Borra el aviso de éxito anterior.
  // Casillas: se guarda `checked` (true/false); campos de texto: se guarda `value`.
  function alCambiarCampo(campo) {
    return function (eventoOValor) {
      const nuevoValor =
        eventoOValor && eventoOValor.target !== undefined
          ? eventoOValor.target.type === "checkbox"
            ? eventoOValor.target.checked
            : eventoOValor.target.value
          : eventoOValor;

      setDatos((prev) => ({
        ...prev,
        [campo]: nuevoValor,
      }));
    };
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
  async function alGuardar(evento) {
    // evita que el navegador recargue la página (comportamiento normal de un <form>)
    evento.preventDefault();

    // Validación: un mensaje por cada campo obligatorio mal completado.
    const erroresNuevos = {};
    if (!datos.fantasia.trim()) {
      erroresNuevos.fantasia = 'Ingresá un nombre de fantasía.';
    }
    setErrores(erroresNuevos);
    setMensajeOk('');

    const hayErrores = Object.keys(erroresNuevos).length > 0;
    if (hayErrores) {
      return;
    }

    // Se simula la espera con setTimeout (ejecuta la función de adentro a los 700 ms);
    // en producción acá iría la llamada a la API y esto correría cuando responda.
    console.log(datos);
    const payload = {
      nombreFantasia: datos.fantasia,
      git: datos.github,
      nombre: datos.nombre,
      apellido: datos.apellido,
      habilidades: (datos.habilidades || []).map(habilidad => Lodash.snakeCase(habilidad)),
      pronombres: datos.pronombres == '' ? [] : datos.pronombres,
      presentacion: datos.bio,
      contactos: (datos.contactos || []).map(([tipo, valor]) => ({
        tipo,
        valor,
      })),
      bloquearMensajeInterno: datos.mensajes,
    };
    
      try {
        // 1. Nos aseguramos de que el token no esté vencido antes de enviarlo
        await keycloak.updateToken(30);

        // 2. Enviamos los datos del formulario al backend
        const response = await fetch(`http://localhost:3000/colaboradoras/${usuario._id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keycloak.token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log(data);

        if (!response.ok) {
          throw new Error(data.message || "Ocurrió un error al actualizar los datos");
        }

        // 4. Actualizamos el AuthContext (perfilCompletado = true, rol = 'colaboradora')
        await recargarPerfil();

        window.scrollTo({
        top: 0,
        behavior: 'smooth',
        });

      } catch (error) {
        console.error("Error al registrar colaboradora:", error);
      }
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
          value={datos.habilidades}
          options={habilidadesDisponibles.map((h) => h.titulo)}
          onChange={alCambiarCampo("habilidades")}
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
          value={datos.github}
          onChange={alCambiarCampo('github')}
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
          <ContactosEditor value={datos.contactos} onChange={alCambiarCampo('contactos')} />
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
