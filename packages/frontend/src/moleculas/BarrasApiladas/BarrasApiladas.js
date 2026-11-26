/**
 * Gráfico de barras apiladas: cada barra se parte según cómo terminaron las postulaciones
 * (aceptadas, pendientes y rechazadas). Es una lista, así el lector de pantalla la lee bien.
 *
 * USO: <BarrasApiladas titulo="…" datos={[{ etiqueta, aceptadas, pendientes, rechazadas }]} />
 * Todas las barras usan la misma escala: la más larga es la de más postulaciones.
 */
import s from './BarrasApiladas.module.css';

// Los tramos de cada barra, en orden: clave del dato, texto y clase de color.
const TRAMOS = [
  { clave: 'aceptadas', texto: 'Aceptadas', clase: s.aceptadas },
  { clave: 'pendientes', texto: 'Pendientes', clase: s.pendientes },
  { clave: 'rechazadas', texto: 'Rechazadas', clase: s.rechazadas },
];

const totalDe = (fila) => fila.aceptadas + fila.pendientes + fila.rechazadas;

export function BarrasApiladas({ titulo, datos }) {
  const maximo = Math.max(1, ...datos.map(totalDe));

  return (
    <figure className={s.grafico}>
      <figcaption>{titulo}</figcaption>
      <ul>
        {datos.map((fila) => (
          <li key={fila.etiqueta}>
            <span className={s.etiqueta}>{fila.etiqueta}</span>
            <span className={s.barra} aria-hidden="true">
              {TRAMOS.filter((tramo) => fila[tramo.clave] > 0).map((tramo) => (
                <span
                  key={tramo.clave}
                  className={tramo.clase}
                  style={{ width: `${(fila[tramo.clave] / maximo) * 100}%` }}
                />
              ))}
            </span>
            <b>{totalDe(fila)}</b>
            {/* Lo que el gráfico muestra con colores, dicho en palabras */}
            <span className="sr-only">
              postulaciones: {fila.aceptadas} aceptadas, {fila.pendientes} pendientes y{' '}
              {fila.rechazadas} rechazadas
            </span>
          </li>
        ))}
      </ul>
      <p className={s.leyenda} aria-hidden="true">
        {TRAMOS.map((tramo) => (
          <span key={tramo.clave}>
            <i className={tramo.clase} />
            {tramo.texto}
          </span>
        ))}
      </p>
    </figure>
  );
}
