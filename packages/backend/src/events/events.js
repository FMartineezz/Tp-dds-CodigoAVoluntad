import { EventEmitter } from "node:events";

/**
 * Bus de eventos interno de la app (en memoria): los services emiten y otros services escuchan,
 * sin depender entre sí.
 */
export const eventos = new EventEmitter();

/** Se emite al crear un proyecto. */
export const EVENTO_PROYECTO_CREADO = "proyectoCreado";
/** Se emite al crear una persona colaboradora. */
export const EVENTO_PERSONA_CREADA = "personaColaboradoraCreada";
/** Se emite cuando el job de cierre cierra proyectos. */
export const EVENTO_PROYECTOS_CERRADOS = "proyectosCerrados";
