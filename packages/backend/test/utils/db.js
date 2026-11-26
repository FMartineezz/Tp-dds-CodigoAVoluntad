import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

// Conecta mongoose a una base nueva y exclusiva del archivo de test que la llama.
export async function conectarBase() {
  const nombre = `test-${randomUUID()}`;
  await mongoose.connect(process.env.MONGO_TEST_URI, { dbName: nombre });
  await Promise.all(Object.values(mongoose.models).map((modelo) => modelo.init()));
}

// Vacía todas las colecciones (los índices quedan, así se siguen validando los únicos).
export async function limpiarBase() {
  const colecciones = await mongoose.connection.db.collections();
  await Promise.all(colecciones.map((coleccion) => coleccion.deleteMany({})));
}

export async function desconectarBase() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

// Registra los hooks de Jest para usar la base en un archivo de test.
export function usarBaseDeDatos() {
  beforeAll(conectarBase);
  afterEach(limpiarBase);
  afterAll(desconectarBase);
}

// Cuenta las consultas que mongoose manda a una colección mientras corre `accion`.
// Sirve para verificar que no haya consultas N+1 (una consulta por cada fila).
// Devuelve la lista de métodos ejecutados, por ejemplo ["find"].
export async function consultasA(coleccion, accion) {
  const metodos = [];
  mongoose.set("debug", (nombreColeccion, metodo) => {
    if (nombreColeccion === coleccion) metodos.push(metodo);
  });
  try {
    await accion();
  } finally {
    mongoose.set("debug", false);
  }
  return metodos;
}
