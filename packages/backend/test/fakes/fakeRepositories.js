// Repositorios en memoria que respetan la misma interfaz que los repositorios de Mongo.
// Imitan lo que hace Mongoose para que los services se comporten igual que en producción:
//  - generan un _id de 24 caracteres hex (como un ObjectId)
//  - los campos con `ref` se guardan como id, aunque se pase el objeto completo
//  - guardar() devuelve el documento con `id` y `_id` (como save())
//  - las lecturas devuelven copias planas sin `id` (como .lean())

let ultimoId = 0;
const nuevoId = () => (++ultimoId).toString(16).padStart(24, "0");

// Mongoose castea un documento a su _id cuando el campo es una referencia
const aId = (valor) => (valor && typeof valor === "object" ? valor._id : valor);

// Copia profunda (como hace .lean(): el service nunca recibe la referencia guardada).
// No se usa structuredClone porque crea los Date en otro contexto y Jest no los reconoce.
const copiar = (valor) => {
  if (valor instanceof Date) return new Date(valor.getTime());
  if (Array.isArray(valor)) return valor.map(copiar);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([clave, v]) => [clave, copiar(v)]));
  }
  return valor;
};

const mismoId = (a, b) => String(a) === String(b);

class FakeRepository {
  constructor() {
    this.documentos = [];
  }

  // Cada repositorio define cómo se normaliza su entidad antes de guardarla
  normalizar(entidad) {
    return entidad;
  }

  async guardar(entidad) {
    const { id, ...datos } = this.normalizar(copiar(entidad));
    const documento = { ...datos, _id: nuevoId() };
    this.documentos.push(documento);
    return { ...copiar(documento), id: documento._id };
  }

  buscar(id) {
    return this.documentos.find((doc) => mismoId(doc._id, id));
  }

  async obtenerPorId(id) {
    return copiar(this.buscar(id)) ?? null;
  }

  async obtenerTodos() {
    return this.documentos.map(copiar);
  }
}

export class FakeHabilidadRepository extends FakeRepository {
  async obtenerTodas() {
    return this.obtenerTodos();
  }

  async obtenerPorTitulo(titulo) {
    return copiar(this.documentos.find((h) => h.titulo === titulo)) ?? null;
  }

  async obtenerPorCodigo(codigo) {
    return copiar(this.documentos.find((h) => h.codigo === codigo)) ?? null;
  }

  async obtenerPorCodigos(codigos) {
    return this.documentos.filter((h) => codigos.includes(h.codigo)).map(copiar);
  }
}

export class FakeColectivoRepository extends FakeRepository {
  normalizar(colectivo) {
    return { ...colectivo, proyectos: (colectivo.proyectos ?? []).map(aId) };
  }

  async obtenerPorNombre(nombre) {
    return copiar(this.documentos.find((c) => c.nombre === nombre)) ?? null;
  }

  async agregarProyecto(colectivoId, proyectoId) {
    this.buscar(colectivoId)?.proyectos.push(aId(proyectoId));
  }
}

export class FakePersonaColaboradoraRepository extends FakeRepository {
  normalizar(persona) {
    return { ...persona, habilidades: persona.habilidades.map(aId) };
  }

  async obtenerTodas() {
    return this.obtenerTodos();
  }

  async obtenerPodHabilidadId(idsHabilidades) {
    return this.documentos
      .filter((p) => p.habilidades.some((h) => idsHabilidades.some((id) => mismoId(h, id))))
      .map(copiar);
  }
}

const camposEditablesDePerfil = [
  "descripcion",
  "habilidadesRequeridas",
  "habilidadesOpcionales",
  "horas",
  "tipoDeCompromiso",
  "modalidadDeColaboracion",
];

const normalizarPerfil = (perfil) => {
  const { id, ...datos } = perfil;
  return {
    ...datos,
    _id: nuevoId(),
    habilidadesRequeridas: perfil.habilidadesRequeridas.map(aId),
    habilidadesOpcionales: perfil.habilidadesOpcionales.map(aId),
  };
};

export class FakeProyectoRepository extends FakeRepository {
  normalizar(proyecto) {
    return {
      ...proyecto,
      colectivo: aId(proyecto.colectivo),
      perfiles: proyecto.perfiles.map(normalizarPerfil),
      logros: proyecto.logros ?? [],
    };
  }

  async obtenerPorTituloYColectivo(titulo, colectivoId) {
    return (
      copiar(
        this.documentos.find((p) => p.titulo === titulo && mismoId(p.colectivo, colectivoId)),
      ) ?? null
    );
  }

  async guardarPerfil(proyectoId, perfil) {
    const proyecto = this.buscar(proyectoId);
    if (!proyecto) return null;
    const perfilGuardado = normalizarPerfil(copiar(perfil));
    proyecto.perfiles.push(perfilGuardado);
    return copiar(perfilGuardado);
  }

  buscarPerfil(proyectoId, perfilId) {
    return this.buscar(proyectoId)?.perfiles.find((p) => mismoId(p._id, perfilId));
  }

  async obtenerPerfilPorId(proyectoId, perfilId) {
    return copiar(this.buscarPerfil(proyectoId, perfilId)) ?? null;
  }

  // Igual que el $set posicional del repositorio real: solo campos editables,
  // y las habilidades se guardan como id
  async actualizarPerfil(proyectoId, perfilId, cambios) {
    const perfil = this.buscarPerfil(proyectoId, perfilId);
    if (!perfil) return null;
    for (const campo of camposEditablesDePerfil) {
      if (cambios[campo] !== undefined) perfil[campo] = copiar(cambios[campo]);
    }
    perfil.habilidadesRequeridas = perfil.habilidadesRequeridas.map(aId);
    perfil.habilidadesOpcionales = perfil.habilidadesOpcionales.map(aId);
    return copiar(perfil);
  }

  async eliminarPerfil(proyectoId, perfilId) {
    const perfil = this.buscarPerfil(proyectoId, perfilId);
    if (!perfil) return null;
    const proyecto = this.buscar(proyectoId);
    proyecto.perfiles = proyecto.perfiles.filter((p) => p !== perfil);
    return copiar(perfil);
  }

  async finalizarProyecto(id) {
    const proyecto = this.buscar(id);
    if (!proyecto) return null;
    proyecto.finalizado = true;
    return copiar(proyecto);
  }

  async obtenerPorAlgunaHabilidad(idsHabilidad) {
    return this.documentos
      .filter(
        (p) =>
          !p.finalizado &&
          p.perfiles.some((perfil) =>
            perfil.habilidadesRequeridas.some((h) => idsHabilidad.some((id) => mismoId(h, id))),
          ),
      )
      .map(copiar);
  }

  async guardarLogro(proyectoId, logro) {
    const proyecto = this.buscar(proyectoId);
    if (!proyecto) return null;
    const { id, ...datos } = copiar(logro);
    const logroGuardado = { ...datos, _id: nuevoId() };
    proyecto.logros.push(logroGuardado);
    return copiar(logroGuardado);
  }

  async obtenerLogros(proyectoId) {
    return copiar(this.buscar(proyectoId)?.logros) ?? null;
  }

  async obtenerLogroPorId(proyectoId, logroId) {
    return copiar(this.buscar(proyectoId)?.logros.find((l) => mismoId(l._id, logroId))) ?? null;
  }

  async actualizarLogro(proyectoId, logroId, cambios) {
    const logro = this.buscar(proyectoId)?.logros.find((l) => mismoId(l._id, logroId));
    if (!logro) return null;
    Object.assign(logro, cambios);
    return copiar(logro);
  }

  async eliminarLogro(proyectoId, logroId) {
    const proyecto = this.buscar(proyectoId);
    const logro = proyecto?.logros.find((l) => mismoId(l._id, logroId));
    if (!logro) return null;
    proyecto.logros = proyecto.logros.filter((l) => l !== logro);
    return copiar(logro);
  }
}

// Las lecturas hacen el equivalente a .populate("personaColaboradora").populate("proyecto")
export class FakeColaboracionRepository extends FakeRepository {
  constructor({ personaColaboradoraRepository, proyectoRepository }) {
    super();
    this.personaColaboradoraRepository = personaColaboradoraRepository;
    this.proyectoRepository = proyectoRepository;
  }

  normalizar(colaboracion) {
    return {
      ...colaboracion,
      personaColaboradora: aId(colaboracion.personaColaboradora),
      proyecto: aId(colaboracion.proyecto),
    };
  }

  popular(colaboracion) {
    return {
      ...copiar(colaboracion),
      personaColaboradora: copiar(
        this.personaColaboradoraRepository.buscar(colaboracion.personaColaboradora),
      ),
      proyecto: copiar(this.proyectoRepository.buscar(colaboracion.proyecto)),
    };
  }

  async obtenerTodas() {
    return this.documentos.map((c) => this.popular(c));
  }

  async obtenerPorId(id) {
    const colaboracion = this.buscar(id);
    return colaboracion ? this.popular(colaboracion) : null;
  }
}

// obtenerPorColaboradoraId hace el equivalente a .sort({ date: 1 }).populate("colectivo")
export class FakeMensajeRepository extends FakeRepository {
  constructor({ colectivoRepository }) {
    super();
    this.colectivoRepository = colectivoRepository;
  }

  normalizar(mensaje) {
    return {
      ...mensaje,
      colectivo: aId(mensaje.colectivo),
      personaColaboradora: aId(mensaje.personaColaboradora),
    };
  }

  async obtenerPorColaboradoraId(colaboradoraId) {
    return this.documentos
      .filter((m) => mismoId(m.personaColaboradora, colaboradoraId))
      .sort((a, b) => a.date - b.date)
      .map((m) => ({
        ...copiar(m),
        colectivo: copiar(this.colectivoRepository.buscar(m.colectivo)),
      }));
  }
}

// Reemplaza al transporter de nodemailer: registra los mails en vez de enviarlos
export class FakeTransporter {
  constructor({ falla = false } = {}) {
    this.enviados = [];
    this.falla = falla;
  }

  async sendMail(opciones) {
    if (this.falla) throw new Error("SMTP caído");
    this.enviados.push(opciones);
  }
}
