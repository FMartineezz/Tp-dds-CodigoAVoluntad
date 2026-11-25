/**
 * Fotos de perfil de las cuentas del seed, por id.
 *
 * El backend todavía no guarda fotos: hasta que lo haga, el front las busca acá con el id
 * fijo que les da el seed (ver backend/seeds/sembrar.js → idFijo). Una cuenta sin foto
 * muestra sus iniciales (ver atomos/Avatar).
 * Para sumar una: poné la imagen en assets/fotos/… e importala abajo con su id.
 */
import ambiental from '../assets/fotos/colectivos/ong-ambiental.jpeg';
import huertas from '../assets/fotos/colectivos/huerta-palermo.jpg';
import espaciosVerdes from '../assets/fotos/colectivos/espacios-verdes.jpg';
import comedor from '../assets/fotos/colectivos/comedor-popular.jpeg';
import biblioteca from '../assets/fotos/colectivos/biblioteca-popular.jpeg';
import lucia from '../assets/fotos/colaboradores/lucia.jpg';
import beto from '../assets/fotos/colaboradores/backendbeto.jpeg';
import martin from '../assets/fotos/colaboradores/martin.jpeg';
import sol from '../assets/fotos/colaboradores/sol.jpeg';
import fernanda from '../assets/fotos/colaboradores/fernanda.avif';
import ana from '../assets/fotos/colaboradores/ana.jpeg';
import pixel from '../assets/fotos/colaboradores/pixel.jpeg';
import eliminado from '../assets/fotos/colaboradores/eliminado.jpg';

const FOTOS = {
  // Colectivos (c…1 a c…5)
  c00000000000000000000001: ambiental, // Colectivo Ambiental CABA
  c00000000000000000000002: huertas, // Red de Huertas de Palermo
  c00000000000000000000003: espaciosVerdes, // Asamblea Abierta por los Espacios Verdes
  c00000000000000000000004: comedor, // Comedor Los Pibes
  c00000000000000000000005: biblioteca, // Biblioteca Popular Sur
  // Personas colaboradoras (a…1 a a…8)
  a00000000000000000000001: lucia, // DevNeko
  a00000000000000000000002: beto, // BackendBeto
  a00000000000000000000003: martin, // QA Tincho
  a00000000000000000000004: sol, // DataSol
  a00000000000000000000005: fernanda, // FullstackFer
  a00000000000000000000006: ana, // Ana Docs
  a00000000000000000000007: pixel, // PixelPampa
  a00000000000000000000008: eliminado, // cuenta eliminada
};

// La foto de esa cuenta, o undefined si no tiene.
export const fotoDe = (id) => FOTOS[id];
