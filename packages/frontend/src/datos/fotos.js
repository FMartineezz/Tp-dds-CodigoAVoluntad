/**
 * Fotos de perfil de las cuentas del seed, por id.
 *
 * El backend todavía no guarda fotos: hasta que lo haga, el front las busca acá con el id
 * fijo que les da el seed (ver backend/seeds/sembrar.js → idFijo). Una cuenta sin foto
 * muestra sus iniciales (ver atomos/Avatar).
 * Para sumar una: poné la imagen en assets/pfp/… e importala abajo con su id.
 */
import ambiental from '../assets/pfp/colectivos/ong-ambiental.jpeg';
import huertas from '../assets/pfp/colectivos/huerta-palermo.jpg';
import espaciosVerdes from '../assets/pfp/colectivos/espacios-verdes.jpg';
import comedor from '../assets/pfp/colectivos/comedor-popular.jpeg';
import biblioteca from '../assets/pfp/colectivos/biblioteca-popular.jpeg';
import hilando from '../assets/pfp/colectivos/asamblea-hilado.jpeg';
import radio from '../assets/pfp/colectivos/radio-rebel.png';
import aprenderJugando from '../assets/pfp/colectivos/aprender-jugando.jpeg';
import aguaNeuquen from '../assets/pfp/colectivos/agua-neuquen.jpeg';
import cienciaPatagonia from '../assets/pfp/colectivos/ciencia-patagonia.jpeg';
import lucia from '../assets/pfp/colaboradores/lucia.jpg';
import beto from '../assets/pfp/colaboradores/backendbeto.jpeg';
import martin from '../assets/pfp/colaboradores/martin.jpeg';
import sol from '../assets/pfp/colaboradores/sol.jpeg';
import fernanda from '../assets/pfp/colaboradores/fernanda.jpeg';
import ana from '../assets/pfp/colaboradores/ana.jpeg';
import pixel from '../assets/pfp/colaboradores/pixel.jpeg';
import eliminado from '../assets/pfp/colaboradores/eliminado.jpg';

const FOTOS = {
  // Colectivos (c…1 a c…b, en hexadecimal; Fundación Huellas, c…6, no tiene)
  c00000000000000000000001: ambiental, // Colectivo Ambiental CABA
  c00000000000000000000002: huertas, // Red de Huertas de Palermo
  c00000000000000000000003: espaciosVerdes, // Asamblea Abierta por los Espacios Verdes
  c00000000000000000000004: comedor, // Comedor Los Pibes
  c00000000000000000000005: biblioteca, // Biblioteca Popular Sur
  c00000000000000000000007: hilando, // Cooperativa Textil Hilando Futuro
  c00000000000000000000008: radio, // Radio Comunitaria La Rebelde
  c00000000000000000000009: aprenderJugando, // Fundación Aprender Jugando
  c0000000000000000000000a: aguaNeuquen, // Asamblea por el Agua de Neuquén
  c0000000000000000000000b: cienciaPatagonia, // Club de Ciencia Patagonia
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
