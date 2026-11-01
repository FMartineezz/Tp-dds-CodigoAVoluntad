/**
 * Une clases CSS ignorando valores vacíos: cx('a', cond && 'b').
 *
 * USO: —
 * SI LO CAMBIÁS O SACÁS: Lo usan casi todos los componentes.
 */
// Une clases CSS ignorando valores falsy: cx(s.btn, loading && s.loading)
export const cx = (...clases) => clases.filter(Boolean).join(' ');
