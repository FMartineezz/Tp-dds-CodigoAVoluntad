/**
 * PANTALLA ReportarProblema
 * Ruta: /reportar   ·   Quién la ve: Todas (no hace falta cuenta)
 * Qué muestra: Un formulario para avisar de un error, una sugerencia u otra cosa.
 * De dónde salen los datos: POST /reportes (ver api/reportes.js). Se llega desde el pie de
 *   página, que agrega ?desde=/la/pantalla/donde/estaba para completar «¿Dónde pasó?».
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. DATOS Y ESTADO: lo que se escribe, los errores, si se está enviando y si ya se mandó.
 *   3. ACCIONES: validar y enviar.
 *   4. LO QUE SE DIBUJA: el formulario o, después de enviar, el «¡Gracias!».
 */
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Field, Heading, Text } from '../../atomos';
import { Alert } from '../../moleculas';
import { TIPOS_DE_REPORTE, enviarReporte } from '../../api/reportes.js';
import { mensajeDeError } from '../../api/errores.js';
import { llevarAlPrimerError } from '../../utilidades/llevarAlPrimerError.js';
import sh from '../../plantillas/disposicion.module.css';

// Mismo formato de correo que piden los registros: «algo@algo.algo».
const CORREO = /^\S+@\S+\.\S+$/;

export default function ReportarProblema() {
  // ───── 1. DATOS Y ESTADO ─────
  const [parametros] = useSearchParams();
  const [datos, setDatos] = useState({
    tipo: 'error',
    descripcion: '',
    // La pantalla donde estaba cuando tocó «Reportar un problema» (la puede cambiar).
    pantalla: parametros.get('desde') ?? '',
    correo: '',
  });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  // Error del backend al enviar (null = no hay).
  const [errorAlEnviar, setErrorAlEnviar] = useState(null);
  // true cuando el reporte llegó: se cambia el formulario por el agradecimiento.
  const [enviado, setEnviado] = useState(false);

  // ───── 3. ACCIONES ─────
  function alCambiarCampo(campo) {
    return (evento) => setDatos({ ...datos, [campo]: evento.target.value });
  }

  async function alEnviar(evento) {
    evento.preventDefault();
    const formulario = evento.currentTarget;

    const erroresNuevos = {};
    if (!datos.descripcion.trim()) erroresNuevos.descripcion = 'Contanos qué pasó.';
    if (datos.correo.trim() && !CORREO.test(datos.correo.trim())) {
      erroresNuevos.correo = 'Revisá el correo (tiene que ser algo@algo.algo).';
    }
    setErrores(erroresNuevos);
    setErrorAlEnviar(null);
    if (Object.keys(erroresNuevos).length) {
      llevarAlPrimerError(formulario);
      return;
    }

    setEnviando(true);
    try {
      await enviarReporte(datos);
      setEnviado(true);
    } catch (error) {
      setErrorAlEnviar(error);
    } finally {
      setEnviando(false);
    }
  }

  // ───── 4. LO QUE SE DIBUJA ─────
  if (enviado) {
    return (
      <div className={`container ${sh.page}`}>
        <Heading level={1}>¡Gracias por avisar!</Heading>
        <Text variant="lead">
          Ya le llegó tu reporte al equipo.
          {datos.correo.trim() && ' Te escribimos al correo que dejaste cuando lo resolvamos.'}
        </Text>
        <div className={sh.formActions}>
          <Button as={Link} to={datos.pantalla || '/'}>
            {datos.pantalla ? 'Volver a donde estaba' : 'Volver al inicio'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form className={`container ${sh.page}`} onSubmit={alEnviar} noValidate>
      <Heading level={1}>Reportar un problema</Heading>
      <Text variant="lead">
        ¿Algo no anduvo como esperabas o se te ocurre cómo mejorar la plataforma? Contanos: no
        hace falta tener cuenta.
      </Text>

      {errorAlEnviar && (
        <Alert kind="error" title="No pudimos enviar el reporte" onClose={() => setErrorAlEnviar(null)}>
          {mensajeDeError(errorAlEnviar)}
        </Alert>
      )}

      <div className={sh.form}>
        <Field as="select" label="¿Qué querés contarnos?" value={datos.tipo} onChange={alCambiarCampo('tipo')}>
          {Object.entries(TIPOS_DE_REPORTE).map(([valor, texto]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </Field>
        <Field
          label="¿Dónde pasó?"
          optional
          placeholder="Ej: /proyectos o «al guardar mi perfil»"
          hint="Si llegaste desde el pie de página, ya está completo con la pantalla donde estabas."
          value={datos.pantalla}
          onChange={alCambiarCampo('pantalla')}
        />
        <Field
          as="textarea"
          className={sh.fullWidth}
          label="¿Qué pasó?"
          placeholder="Ej: Toqué «Guardar» en un proyecto nuevo y no pasó nada. Estaba en el celular."
          maxLength={2000}
          value={datos.descripcion}
          onChange={alCambiarCampo('descripcion')}
          error={errores.descripcion}
        />
        <Field
          label="Tu correo"
          optional
          type="email"
          placeholder="nombre@correo.org"
          hint="Solo para avisarte cuando lo resolvamos."
          value={datos.correo}
          onChange={alCambiarCampo('correo')}
          error={errores.correo}
        />
      </div>

      <div className={sh.formActions}>
        <Button type="submit" loading={enviando}>Enviar reporte</Button>
        <Button as={Link} to={datos.pantalla || '/'} variant="secondary">Cancelar</Button>
      </div>
    </form>
  );
}
