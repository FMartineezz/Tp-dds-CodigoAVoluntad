/**
 * AUXILIARES de las pantallas de registro: constantes y funciones que usan varias
 * pantallas de esta carpeta.
 * Si cambiás algo acá, cambia en todas las pantallas que lo importan.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. MAIL: la regla para decidir si un correo «parece» válido.
 *   2. useForm: manejo de validación de un formulario (errores al salir del campo,
 *      resumen al enviar y espera simulada).
 *   3. Resumen: el aviso rojo con la lista de errores al enviar.
 *   4. useSocial: qué pasa al registrarse con un botón de red social.
 */

// ───── Imports ─────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert } from '../../moleculas';
import { useAuth } from '../../contexto';

// ───── 1. MAIL ─────
// Expresión regular que acepta «algo@algo.algo» sin espacios. No comprueba que el correo
// exista, solo que tenga forma de correo.
// Quién la usa: RegistroColaboradora y RegistroOrganizacion.
// Si se cambia: cambia qué correos se aceptan en ambos registros (Ingresar.js tiene
// su propia copia de esta regla).
export const MAIL = /^\S+@\S+\.\S+$/;

// ───── 2. useForm ─────
// Hook que maneja la validación de un formulario de registro. Quién lo usa:
// RegistroColaboradora y RegistroOrganizacion.
//
// Cómo funciona la validación (dos momentos):
//   a) AL SALIR DEL CAMPO (onBlur): el campo se anota como «tocado» y, desde ese
//      momento, se le muestra su error (si lo tiene). Así no se retan campos
//      que la persona todavía no llegó a completar.
//   b) AL ENVIAR: se marca `intento`. Desde ahí se muestran los errores de TODOS los
//      campos (aunque nunca se hayan tocado) y el <Resumen> arriba del formulario.
//
// Parámetro `validar`: función que recibe los valores del formulario y devuelve un
// objeto con un mensaje por campo inválido, ej. { mail: 'Ingresá un correo válido.' }.
// Un objeto vacío {} significa «todo bien».
//
// Devuelve: { blur, enviar, errores, cargando, listo, intento, todos }.
// Si se cambia: cambia el comportamiento de ambos formularios de registro.
export function useForm(validar) {
  // ───── 1. DATOS Y ESTADO ─────

  // Campos que la persona ya «tocó» (entró y salió), ej. { mail: true }.
  // Empieza vacío; lo cambia alSalirDelCampo.
  // (ver docs/GLOSARIO.md → useState)
  const [tocados, setTocados] = useState({});

  // true desde la primera vez que se aprieta «Crear cuenta». Una vez true, se muestran
  // todos los errores. Lo cambia `enviar`.
  const [intento, setIntento] = useState(false);

  // true mientras dura la espera simulada del envío (el botón muestra «cargando»).
  // Lo cambia `enviar`.
  const [cargando, setCargando] = useState(false);

  // true cuando el «envío» terminó bien (la pantalla muestra «Cuenta creada»).
  // Lo cambia `enviar`.
  const [listo, setListo] = useState(false);

  // ───── 2. CÁLCULOS ─────

  // Devuelve solo los errores que corresponde MOSTRAR ahora: todos si ya se intentó
  // enviar; si no, solo los de campos «tocados». Se llama en cada dibujado de la pantalla.
  function erroresVisibles(valores) {
    const todosLosErrores = validar(valores);
    const visibles = {};
    Object.keys(todosLosErrores).forEach((campo) => {
      if (intento || tocados[campo]) {
        visibles[campo] = todosLosErrores[campo];
      }
    });
    return visibles;
  }

  // ───── 3. ACCIONES ─────

  // Se usa como onBlur de un campo: `blur('mail')` devuelve la función que se ejecuta
  // cuando la persona sale de ese campo y lo anota como «tocado».
  // Son dos funciones anidadas: la de afuera recibe el nombre del campo y la de adentro
  // es el manejador real.
  function alSalirDelCampo(campo) {
    return function () {
      // `...previos` copia lo que ya había y `[campo]: true` agrega/pisa ese campo
      // (ver docs/GLOSARIO.md → Copiar con cambios). React exige copiar, no modificar.
      setTocados((previos) => ({ ...previos, [campo]: true }));
    };
  }

  // Se usa como onSubmit del formulario: `enviar(valores)` devuelve el manejador
  // que corre al apretar «Crear cuenta». Si hay errores corta y no «llama a la API».
  function alEnviarFormulario(valores) {
    return function (evento) {
      evento.preventDefault(); // evita que el navegador recargue la página
      setIntento(true); // desde ahora se muestran todos los errores
      setListo(false); // oculta un «Cuenta creada» anterior

      const hayErrores = Object.keys(validar(valores)).length > 0;
      if (hayErrores) {
        return;
      }

      // Se simula la espera con setTimeout (ejecuta la función de adentro a los 800 ms)
      // para poder ver el estado «cargando». En producción acá iría la llamada a la API
      // y esto correría cuando el servidor responda.
      setCargando(true);
      setTimeout(() => {
        setCargando(false);
        setListo(true);
      }, 800);
    };
  }

  // Lo que el hook le entrega a la pantalla. `todos` es la función de validación completa.
  return {
    blur: alSalirDelCampo,
    enviar: alEnviarFormulario,
    errores: erroresVisibles,
    cargando,
    listo,
    intento,
    todos: validar,
  };
}

// ───── 3. Resumen ─────
// Aviso rojo «Revisá estos campos» con todos los mensajes de error juntos.
// Props: `errores` (objeto campo → mensaje) y `mostrar` (true recién después de intentar enviar).
// Quién la usa: ambos registros. Si se cambia: cambia el aviso de resumen de los dos.
export function Resumen({ errores, mostrar }) {
  // Object.values(...) junta solo los mensajes (sin los nombres de campo) en un array
  const mensajes = Object.values(errores);

  // No se muestra nada si todavía no se intentó enviar o si no hay errores.
  // Devolver null en un componente significa «no dibujes nada».
  if (!mostrar || mensajes.length === 0) {
    return null;
  }
  // .join(' ') une los mensajes en un solo texto, separados por un espacio
  return <Alert kind="error" title="Revisá estos campos">{mensajes.join(' ')}</Alert>;
}

// ───── 4. useSocial ─────
// Hook para el registro con red social. Devuelve una función en dos pasos:
// `social('col')` (rol) → devuelve el manejador que recibe el proveedor elegido.
// Quién lo usa: ambos registros (colaboradora pasa 'col', organización pasa 'org').
// En el prototipo no se contacta a ningún proveedor: abre la sesión directo y va al panel.
// Si se cambia: cambia a dónde se llega al registrarse con una red social.
export function useSocial() {
  const { entrar } = useAuth(); // abre la sesión con un rol
  const navegar = useNavigate(); // ir a otra pantalla desde código

  return function conRol(rol) {
    return function alElegirProveedor(proveedor) {
      entrar(rol);
      navegar(rol === 'org' ? '/org' : '/panel');
      // `proveedor` (Google, etc.) se recibe pero no se usa en el prototipo;
      // `void` evita el aviso del linter de «variable sin usar».
      void proveedor;
    };
  };
}
