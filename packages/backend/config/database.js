import mongoose from "mongoose";

/** Conexión a MongoDB con mongoose. */
export class MongoDBClient {
  /**
   * Conecta usando MONGODB_URI y MONGODB_DB_NAME. Si falla, loguea y termina el proceso.
   * @returns {Promise<void>}
   */
  static async connect() {
    try {
      const conn = await mongoose.connect(
        `${process.env.MONGODB_URI}/${process.env.MONGODB_DB_NAME}?authSource=admin`,
      );
      console.log(`MongoDB Conectado: ${conn.connection.host}`);
    } catch (error) {
      console.error(`Error de conexión: ${error.message}`);
      process.exit(1);
    }
  }
}
