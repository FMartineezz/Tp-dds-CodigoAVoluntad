import { EventEmitter } from "node:events";

export const eventos = new EventEmitter();

export const EVENTO_PROYECTO_CREADO = "proyectoCreado";
export const EVENTO_PERSONA_CREADA = "personaColaboradoraCreada";
