// Carga los datos de datos.js directo en MongoDB con los modelos de Mongoose.
// No pasa por los services (así no dispara eventos ni manda mails a los contactos de ejemplo),
// por eso verifica a mano las reglas del dominio y corta con un error si los datos no las cumplen.
// Requiere una conexión de mongoose abierta: la usan seed.js y el test del seed.

import { HabilidadModel } from "../src/schemas/habilidadSchema.js";
import { ColectivoModel } from "../src/schemas/colectivoSchema.js";
import { PersonaColaboradoraModel } from "../src/schemas/personaColaboradoraSchema.js";
import { ProyectoModel } from "../src/schemas/proyectoSchema.js";
import { PostulacionModel } from "../src/schemas/postulacionSchema.js";
import { ColaboracionModel } from "../src/schemas/colaboracionSchema.js";
import { ValoracionModel } from "../src/schemas/valoracionSchema.js";
import { MensajeModel } from "../src/schemas/mensajeSchema.js";
import { NotificacionModel } from "../src/schemas/notificacionSchema.js";

import { Habilidad } from "../src/models/habilidad.js";
import { Colectivo } from "../src/models/colectivo.js";
import { PersonaColaboradora } from "../src/models/personaColaboradora.js";
import { Proyecto } from "../src/models/proyecto.js";
import { Perfil } from "../src/models/perfil.js";
import { Logro } from "../src/models/logro.js";
import { Postulacion, EstadoPostulacion } from "../src/models/postulacion.js";
import { Colaboracion } from "../src/models/colaboracion.js";
import { Valoracion, TipoEvaluador } from "../src/models/valoracion.js";
import { Denuncia } from "../src/models/denuncia.js";
import { Mensaje } from "../src/models/mensaje.js";
import { Notificacion } from "../src/models/notificacion.js";

// Las bajas de cuentas usan los mismos repositorios que la app, así quedan igual que en producción
import { ColectivoRepository } from "../src/repositories/colectivoRepository.js";
import { PersonaColaboradoraRepository } from "../src/repositories/personaColaboradoraRepository.js";

import * as datos from "./datos.js";

// Orden de borrado: primero lo que referencia a otras colecciones
const MODELOS = [
  NotificacionModel,
  MensajeModel,
  ValoracionModel,
  ColaboracionModel,
  PostulacionModel,
  ProyectoModel,
  PersonaColaboradoraModel,
  ColectivoModel,
  HabilidadModel,
];

export async function limpiar() {
  for (const modelo of MODELOS) {
    await modelo.deleteMany({});
  }
}

const DIA = 24 * 60 * 60 * 1000;
const enDias = (dias) => (dias === undefined ? undefined : new Date(Date.now() + dias * DIA));

function buscar(mapa, clave, entidad) {
  const valor = mapa.get(clave);
  if (!valor) throw new Error(`El seed usa ${entidad} que no existe: "${clave}"`);
  return valor;
}

// Ids fijos para colectivos y colaboradoras: con la misma semilla, cada cuenta tiene siempre el
// mismo id aunque se vuelva a sembrar. Así el front puede entrar con una cuenta de demo conocida
// (VITE_DEMO_COLECTIVO_ID / VITE_DEMO_COLABORADORA_ID) y los enlaces no se rompen al resembrar.
// Colectivo n.º 1 → "c00000000000000000000001"; colaboradora n.º 5 → "a00000000000000000000005".
export const idFijo = (letra, numero) => letra + numero.toString(16).padStart(23, "0");

const porClave = (documentos, clave) => new Map(documentos.map((doc) => [doc[clave], doc]));
const mismoId = (a, b) => String(a) === String(b);

export async function sembrar(d = datos) {
  // Habilidades
  const habilidades = await HabilidadModel.create(
    d.habilidades.map(([titulo, descripcion]) => new Habilidad(titulo, descripcion)),
  );
  const habilidadesPorCodigo = porClave(habilidades, "codigo");
  const idsHabilidades = (codigos) =>
    codigos.map((codigo) => buscar(habilidadesPorCodigo, codigo, "una habilidad")._id);

  // Colectivos y colaboradoras de la semilla no tienen usuario en Keycloak: keycloackId queda
  // undefined (no null) para que Mongo no lo guarde y el índice sparse no los haga chocar.
  const sinKeycloak = undefined;

  // Colectivos
  const colectivos = await ColectivoModel.create(
    d.colectivos.map((c, i) =>
      Object.assign(
        new Colectivo(
          c.nombre,
          c.descripcion,
          c.ubicacion,
          c.tipo,
          sinKeycloak,
          c.redesSociales ?? [],
        ),
        { _id: idFijo("c", i + 1) },
      ),
    ),
  );
  const colectivosPorNombre = porClave(colectivos, "nombre");

  // Personas colaboradoras
  const colaboradoras = await PersonaColaboradoraModel.create(
    d.colaboradoras.map((c, i) =>
      Object.assign(
        new PersonaColaboradora(
          c.nombreFantasia,
          c.git,
          c.nombre,
          c.apellido,
          idsHabilidades(c.habilidades),
          c.pronombres,
          c.presentacion,
          c.contactos ?? [],
          c.bloquearMensajeInterno ?? false,
          sinKeycloak,
          c.redesSociales ?? [],
        ),
        { _id: idFijo("a", i + 1) },
      ),
    ),
  );
  const colaboradorasPorNombre = porClave(colaboradoras, "nombreFantasia");

  // Proyectos con perfiles y logros
  const proyectos = [];
  for (const p of d.proyectos) {
    const colectivo = buscar(colectivosPorNombre, p.colectivo, "un colectivo");
    if (p.diasCierre < 0 && !p.finalizado) {
      throw new Error(`"${p.titulo}" tiene la fecha de cierre vencida y no está finalizado`);
    }
    const totalLogros = p.logros.reduce((total, [, porcentaje]) => total + porcentaje, 0);
    if (totalLogros > 100) throw new Error(`Los logros de "${p.titulo}" suman ${totalLogros}%`);

    const proyecto = new Proyecto(
      p.titulo,
      p.descripcion,
      p.perfiles.map(
        (perfil) =>
          new Perfil(
            perfil.descripcion,
            idsHabilidades(perfil.requeridas),
            idsHabilidades(perfil.opcionales),
            perfil.horas,
            perfil.compromiso,
            perfil.modalidad,
            perfil.cantidadMaxima,
          ),
      ),
      colectivo._id,
      p.urlSistema,
      enDias(p.diasCierre),
      enDias(p.diasLimiteBusqueda),
      p.urlDonaciones,
    );
    proyecto.logros = p.logros.map(([desc, porcentaje, url]) => new Logro(desc, porcentaje, url));
    proyecto.finalizado = p.finalizado ?? false;
    proyecto.busquedaCerrada = p.busquedaCerrada ?? false;

    const creado = await ProyectoModel.create(proyecto);
    await ColectivoModel.updateOne({ _id: colectivo._id }, { $push: { proyectos: creado._id } });
    proyectos.push(creado);
  }
  const proyectosPorTitulo = porClave(proyectos, "titulo");

  // Postulaciones; las aceptadas generan su colaboración
  const postulaciones = [];
  const colaboraciones = [];
  for (const p of d.postulaciones) {
    const persona = buscar(colaboradorasPorNombre, p.colaboradora, "una colaboradora");
    const proyecto = buscar(proyectosPorTitulo, p.proyecto, "un proyecto");
    const perfil = proyecto.perfiles.find((pf) => pf.descripcion === p.perfil);
    if (!perfil) throw new Error(`"${p.proyecto}" no tiene el perfil "${p.perfil}"`);

    const contexto = `${p.colaboradora} en "${p.proyecto}" / "${p.perfil}"`;
    const tieneHabilidad = perfil.habilidadesRequeridas.some((h) =>
      persona.habilidades.some((ph) => mismoId(ph, h)),
    );
    if (!tieneHabilidad) {
      throw new Error(`${contexto}: no tiene ninguna habilidad requerida del perfil`);
    }
    const busquedaAbierta =
      !proyecto.finalizado &&
      !proyecto.busquedaCerrada &&
      (!proyecto.fechaLimiteBusqueda || proyecto.fechaLimiteBusqueda > new Date());
    if (p.estado === EstadoPostulacion.PENDIENTE && !busquedaAbierta) {
      throw new Error(`${contexto}: no puede quedar pendiente con la búsqueda cerrada`);
    }

    const postulacion = new Postulacion(
      persona._id,
      proyecto.colectivo,
      proyecto._id,
      perfil._id,
      p.anonima ?? false,
      enDias(p.diasResolucion),
    );
    postulacion.estado = p.estado;
    postulaciones.push(await PostulacionModel.create(postulacion));

    if (p.estado !== EstadoPostulacion.ACEPTADA) continue;

    if (perfil.cantidadMaxima) {
      const ocupados = colaboraciones.filter(
        (c) => c.activo && mismoId(c.perfil, perfil._id),
      ).length;
      if (ocupados >= perfil.cantidadMaxima) {
        throw new Error(`${contexto}: el perfil ya tiene su cupo de ${perfil.cantidadMaxima}`);
      }
    }

    const colaboracion = new Colaboracion(persona._id, proyecto._id, perfil._id, p.anonima);
    if (p.baja) {
      colaboracion.activo = false;
      colaboracion.fechaBaja = enDias(p.baja.dias);
      colaboracion.bajaPor = p.baja.por;
    }
    colaboraciones.push(await ColaboracionModel.create(colaboracion));
  }

  const buscarColaboracion = ({ colaboradora, proyecto }) => {
    const persona = buscar(colaboradorasPorNombre, colaboradora, "una colaboradora");
    const proy = buscar(proyectosPorTitulo, proyecto, "un proyecto");
    const colaboracion = colaboraciones.find(
      (c) => mismoId(c.personaColaboradora, persona._id) && mismoId(c.proyecto, proy._id),
    );
    if (!colaboracion) {
      throw new Error(`No hay colaboración de ${colaboradora} en "${proyecto}"`);
    }
    return { colaboracion, persona, proyecto: proy };
  };

  // Valoraciones: solo sobre colaboraciones terminadas
  const valoraciones = await ValoracionModel.create(
    d.valoraciones.map((v) => {
      const { colaboracion, persona, proyecto } = buscarColaboracion(v);
      if (colaboracion.activo && !proyecto.finalizado) {
        throw new Error(`Valoración sobre una colaboración en curso: ${v.colaboradora}`);
      }
      const deColectivo = v.evaluador === TipoEvaluador.COLECTIVO;
      return new Valoracion(
        colaboracion._id,
        v.evaluador,
        v.puntaje,
        v.comentario,
        deColectivo ? proyecto.colectivo : persona._id,
        deColectivo ? persona._id : proyecto.colectivo,
      );
    }),
  );

  // Denuncias, embebidas en el colectivo del proyecto
  for (const dn of d.denuncias) {
    const { colaboracion, proyecto } = buscarColaboracion(dn);
    const denuncia = new Denuncia(dn.descripcion, colaboracion._id);
    denuncia.estado = dn.estado;
    denuncia.fecha = enDias(dn.dias);
    await ColectivoModel.updateOne({ _id: proyecto.colectivo }, { $push: { denuncias: denuncia } });
  }

  // Mensajes internos
  const mensajes = await MensajeModel.create(
    d.mensajes.map((m) => {
      const colectivo = buscar(colectivosPorNombre, m.colectivo, "un colectivo");
      const persona = buscar(colaboradorasPorNombre, m.colaboradora, "una colaboradora");
      const proyecto = buscar(proyectosPorTitulo, m.proyecto, "un proyecto");
      if (!mismoId(proyecto.colectivo, colectivo._id)) {
        throw new Error(`El mensaje usa "${m.proyecto}", que no es de ${m.colectivo}`);
      }
      const mensaje = new Mensaje(colectivo._id, persona._id, proyecto._id, m.emisor, m.texto);
      mensaje.date = enDias(m.dias);
      mensaje.leido = m.leido ?? false;
      return mensaje;
    }),
  );

  // Notificaciones automáticas ya generadas
  const notificaciones = await NotificacionModel.create(
    d.notificaciones.map((n) => {
      const persona = buscar(colaboradorasPorNombre, n.colaboradora, "una colaboradora");
      const proyecto = buscar(proyectosPorTitulo, n.proyecto, "un proyecto");
      return new Notificacion(
        persona._id,
        proyecto.colectivo,
        proyecto._id,
        n.destinatario,
        n.texto,
      );
    }),
  );

  // Bajas de cuentas, al final para que el historial de arriba se arme con los datos originales
  const colectivosDadosDeBaja = d.colectivos.filter((c) => c.eliminado);
  for (const c of colectivosDadosDeBaja) {
    await new ColectivoRepository().eliminarColectivo(colectivosPorNombre.get(c.nombre)._id);
  }
  const colaboradorasEliminadas = d.colaboradoras.filter((c) => c.eliminada);
  for (const c of colaboradorasEliminadas) {
    await new PersonaColaboradoraRepository().eliminar(
      colaboradorasPorNombre.get(c.nombreFantasia)._id,
    );
  }

  return {
    habilidades: habilidades.length,
    colectivos: colectivos.length,
    colaboradoras: colaboradoras.length,
    proyectos: proyectos.length,
    postulaciones: postulaciones.length,
    colaboraciones: colaboraciones.length,
    valoraciones: valoraciones.length,
    denuncias: d.denuncias.length,
    mensajes: mensajes.length,
    notificaciones: notificaciones.length,
    colectivosDadosDeBaja: colectivosDadosDeBaja.length,
    colaboradorasEliminadas: colaboradorasEliminadas.length,
  };
}
