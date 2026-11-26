import { MongoMemoryServer } from "mongodb-memory-server";

// Levanta un mongod real (binario oficial de MongoDB) una sola vez para toda la suite.
// Cada archivo de test usa su propia base dentro de este servidor, así pueden correr en paralelo.
export default async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  globalThis.__MONGOD__ = mongod;
  process.env.MONGO_TEST_URI = mongod.getUri();
}
