// Script semilla: carga las entidades iniciales en la base configurada en el .env.
//
//   npm run seed            Demo curada: pocas entidades con nombres reconocibles que pasan
//                           por todos los estados posibles (datos.js).
//   npm run seed:volumen    Demo curada + datos generados en volumen para ver paginación y
//                           búsquedas con muchos resultados (volumen.js).
//
// Opciones del modo volumen (después de `--`): --colectivos=N --colaboradoras=N --proyectos=N
// --semilla=N. Con la misma semilla se generan siempre los mismos datos.
//
// ATENCIÓN: antes de cargar BORRA todos los documentos de las colecciones que siembra,
// así el resultado es siempre el mismo.

import "dotenv/config";
import mongoose from "mongoose";
import { MongoDBClient } from "../config/database.js";
import { limpiar, sembrar } from "./sembrar.js";
import * as datos from "./datos.js";
import { conVolumen } from "./volumen.js";

function leerOpciones(argumentos) {
  const opciones = {};
  for (const argumento of argumentos) {
    const [, clave, valor] = argumento.match(/^--(\w+)=(\d+)$/) ?? [];
    if (clave) opciones[clave] = Number(valor);
  }
  return opciones;
}

async function main() {
  if (!process.env.MONGODB_URI || !process.env.MONGODB_DB_NAME) {
    console.error("Faltan MONGODB_URI o MONGODB_DB_NAME en el .env");
    process.exit(1);
  }

  const argumentos = process.argv.slice(2);
  const volumen = argumentos.includes("--volumen");
  const datosASembrar = volumen ? conVolumen(datos, leerOpciones(argumentos)) : datos;

  await MongoDBClient.connect();
  console.log(
    `Limpiando y sembrando la base "${process.env.MONGODB_DB_NAME}" ` +
      `(${volumen ? "demo + volumen" : "demo"})...`,
  );

  try {
    await limpiar();
    const cantidades = await sembrar(datosASembrar);
    console.table(cantidades);
    console.log("Seed terminado.");
  } catch (error) {
    console.error("Error en el seed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();
