/**
 * PANTALLA Pronto
 * Ruta: /pronto   ·   Quién la ve: Todas
 * Qué muestra: Marcador para pantallas que todavía no existen.
 * Para modificarla: se puede borrar cuando no queden enlaces a /pronto.
 *
 * ANATOMÍA DE ESTE ARCHIVO:
 *   1. LO QUE SE DIBUJA: un título, una frase y un botón para volver al inicio.
 *      No guarda datos ni calcula nada.
 */

// ───── Imports ─────
import { Link } from 'react-router-dom'; // enlace interno que no recarga la página
import { Button, Heading, Text } from '../../atomos';
import s from '../../plantillas/LayoutPrincipal.module.css'; // acá vive la clase s.pronto

export default function Pronto() {
  // ───── 4. LO QUE SE DIBUJA ─────
  return (
    <div className={`container ${s.pronto}`}>
      <Heading level={1}>Esta pantalla llega pronto</Heading>
      <Text variant="lead">Todavía no está en el prototipo.</Text>
      {/* as={Link}: el botón se dibuja como un enlace interno hacia el inicio */}
      <Button as={Link} to="/">Volver al inicio</Button>
    </div>
  );
}
