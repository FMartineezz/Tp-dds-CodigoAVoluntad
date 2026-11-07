# Enunciado: Plataforma "Código a Voluntad"

## Contexto General

Desde la cátedra de Desarrollo de Software de UTN FRBA desarrollaremos Código a Voluntad, una plataforma de código libre que tiene como finalidad ser un punto de encuentro entre, por un lado, colectivos (fundaciones, ONGs, asambleas, comunidades, organizaciones territoriales, etc.) que necesitan producir software de clase profesional pero no cuentan con los recursos económicos para costearlo, y personas colaboradoras, que buscan realizar contribuciones a estas organizaciones en forma de mano de obra y asesoramiento sobre desarrollo de software.

La arquitectura propuesta es cliente-servidor, Web, cliente pesado, utilizando Node.js y Express en el servidor, y una tecnología reactiva (React, Vue o Angular, a criterio de cada docente) en el cliente. Debido a que no se cuenta con grandes presupuestos para desarrollar y mantener esta plataforma, se buscará en todo momento que la misma sea simple y requiera una infraestructura mínima: en principio, un único servidor que contendrá:

- El proceso servidor, que expondrá una API JSON.
- Una base de datos MongoDB.
- El código cliente empaquetado, listo para ser descargado por los navegadores.

Opcionalmente, el servidor podrá contener un proxy HTTP reverso como NGINX delante del proceso servidor y que sirva el paquete del cliente (bundle / dist). Idealmente, el sistema se desplegará en DigitalOcean o un IaaS similar de bajo costo. Se buscará que el despliegue sea también sencillo, empleando una imagen Docker para el proceso servidor y otra imagen Docker para el servidor de MongoDB.

De todas formas, los requerimientos irán variando a lo largo del desarrollo del proyecto, el cual se desarrollará colaborativamente en una de las dos modalidades descriptas anteriormente, a definir por cada curso y docente.

## Dominio

**Colectivo:** Organización que lleva adelante una determinada causa. Al inscribirse, los colectivos deben indicar:

- Nombre.
- Descripción.
- Ubicación (opcional): puede ser "Argentina", una de las 23 provincias, CABA o una ciudad/barrio (esta última en formato de texto libre).
- Tipo de colectivo: por el momento los colectivos se clasificarán en fundaciones, asociaciones barriales, ONGs y asambleas, aunque esta clasificación podrá ser ampliada en el futuro.

**Proyectos:** Los colectivos pueden cargar uno o más proyectos. Cada proyecto cuenta con:

- Título y descripción.
- Lista de habilidades de desarrollo necesarias.
- Tipo de compromiso esperado (X horas totales, X horas semanales o X horas mensuales).
- Modalidad de colaboración: si las colaboraciones son únicamente gratuitas, si ofrecen un incentivo económico y/o si existe la posibilidad de contratación eventual.

**Habilidades:** se las define a partir de un título (ejemplo: “Desarrollo Web React”), un código único (por ahora, el título normalizado) y una descripción. Las habilidades serán precargadas por el equipo administrativo de Código a Voluntad.

**Personas colaboradoras:** Personas del ámbito del desarrollo que ofrecen sus conocimientos. Pueden mantenerse anónimos indicando un nombre de fantasía, indicar su cuenta de github o gitlab, o además registrar nombre y apellido. Listan sus habilidades, y opcionalmente sus pronombres y una breve presentación.

**Colaboraciones:** Las personas colaboradoras que participan o hayan participado de los proyectos quedarán asociadas a los mismos, construyendo así su historial en la plataforma. Cuando una colaboradora ve un proyecto de su interés, se “anota” en el mismo, estableciendo una colaboración. Al hacerlo, sus datos de contacto quedan visibles al equipo del colectivo.

---

## Primera Entrega

### Alcance

- Despliegue inicial.
- API HTTP inicial.

### Requerimientos mínimos

- Implementar todos los elementos del dominio, bajo una arquitectura de capas.
- Exponer APIs HTTP/REST para:
  - Carga de colectivos, colaboradoras, habilidades y proyectos.
  - Anotar una persona colaboradora a un proyecto, estableciendo así una colaboración. Se deberá validar que la persona cuente con al menos una de las habilidades requeridas.
  - Cierre manual de un proyecto: los colectivos podrán en cualquier momento marcar a un proyecto como finalizado. Luego de esto, ya no se pueden anotar personas colaboradoras al mismo.

> **Nota:** En esta primera entrega, los colectivos y demás entidades se mantendrán en memoria.

### Entregables

- Diagrama de clases.
- Implementación totalmente de todos los endpoints requeridos
- Implementación de un endpoint de "Health Check".
- Explicación del Git Flow definido para utilizar a lo largo del proyecto.
- Implementación de la API REST del sistema, que incluya todos los endpoints necesarios para dar solución a los requerimientos listados.
- Despliegue inicial.

### Tecnologías a Utilizar

- Backend:
  - Lenguaje de programación base: JavaScript / Node.js
  - Framework: Express
- Control de versiones: Git (repositorios en GitHub)
- Testing: Test unitarios de la capa de servicios y de la capa de dominio.
- Documentación: Documentación de la API REST.

---

## Segunda Entrega

### Alcance

- API HTTP (segunda iteración).
- Persistencia.
- Despliegue (segunda iteración).

### Cambios al dominio

**Perfiles:** Las habilidades y compromisos requeridos de los proyectos ahora contarán con mayor granularidad. Por un lado, ya no se listarán habilidades requeridas directamente, sino perfiles. Cada uno incluirá:

- Una descripción del perfil requerido
- Una o más habilidades requeridas
- Uno o más habilidades opcionales

Por otro lado, el tipo de compromiso esperado y la modalidad de colaboración también se indicará por perfil. Por ejemplo, un proyecto podrá indicar que necesita un perfil “Tester”, con la habilidad opcional “Uso de Soap UI” y obligatoria “Testing E2E con Cypress”, un compromiso de 5 horas mensuales y sin incentivo económico. Al mismo tiempo, podrá indicar que necesita “Analista de Datos”, con un compromiso de 15 horas mensuales e incentivo económico y “Conocimientos de Pandas” como habilidad requerida.

**Contribuciones Anónimas:** Las personas colaboradoras, cuando se anoten en un proyecto, podrán indicar si la contribución quedará registrada públicamente en la plataforma o no. Cuando esto ocurra, la contribución figurará efectivamente en la plataforma como de costumbre, pero no indicará quién la realizó.

**Medios de Contacto:** A partir de ahora, se permitirá el registro interno de cero o más medios de contacto (email, WhatsApp, SMS). No se muestran de forma pública en la plataforma, pero quedan registrados internamente. Más allá de estos medios, las personas colaboradoras podrán indicar si desean ser contactadas a través de la mensajería interna de la plataforma cuando haya proyectos relacionados con sus habilidades.

**Búsquedas y Notificaciones Internas:**

- Las organizaciones pueden buscar colaboradoras acordes a perfiles y contactarlas: si la persona destinataria ha aceptado ser contactada, se envía un mensaje interno dentro de la aplicación.
- Las personas colaboradoras pueden buscar proyectos que encajen con sus habilidades

**Envío de notificaciones por medios externos:** Las notificaciones internas deberían poder ser replicadas a través de los medios de contacto registrados.

**Logros:** Para dar trazabilidad, en los proyectos se deberá cargar periódicamente el porcentaje de concreción, logros/hitos y los enlaces al sistema en funcionamiento y a su código fuente (el cual debe ser público).

### Requerimientos mínimos

- Implementar todos los cambios al dominio
- Persistir completamente en la base de datos MongoDB todas las viejas y nuevas entidades
- Exponer las siguientes APIs:
  - CRUD de perfiles de un proyecto
  - CRUD de logros
  - Búsqueda de potenciales colaboradoras según un perfil del proyecto
  - Búsqueda de potenciales proyectos según según habilidades de la colaboradora
- Implementación de notificaciones por medios alternativos

> **Nota:** En esta entrega, las entidades iniciales se cargarán a través de scripts semilla (seeds).

### Entregables

- Implementación de la API REST del sistema adaptada a los nuevos requerimientos.
- Implementación de la persistencia de las entidades de dominio en una base de datos NoSQL documental.
- Implementación de los test unitarios de la capa de servicios y de la capa de dominio.
- Documentación de la API REST.

### Tecnologías a Utilizar

- Todas las mencionadas en la primera entrega.
- Base de Datos: MongoDB (NoSQL Documental).
- Testing Unitario: Jest.
- Documentación: Swagger (se permite el uso de dependencias que generen el contenido automáticamente).

---

## Tercera Entrega

### Alcance

- API HTTP (tercera iteración).
- Interfaz de Usuario (UI) y Login.
- Despliegue (tercera iteración).

### Cambios al dominio

**Proyectos:** Cuando se cargue un proyecto, se podrá indicar, opcionalmente la cantidad (límite) de colaboraciones que se necesitan por cada perfil requerido y si la búsqueda de colaboraciones está abierta y, opcionalmente, hasta cuando.

**Postulaciones:** ahora, las personas colaboradoras ya no se anotan directamente a los proyectos, sino que se postulan para un cierto perfil, lo cual sólo pueden hacer si la búsqueda de postulaciones está abierta. Las postulaciones quedan pendientes para revisión por parte del colectivo y recién cuando la postulación sea aceptada los datos quedarán a disposición del colectivo. Alternativamente, la postulación también puede ser rechazada, en cuyo caso los datos no se comparten.

Para esto, los colectivos deberán poder ver las postulaciones y aceptarlas o rechazarlas manualmente. Si hubiera un límite a la cantidad de colaboraciones para esa habilidad, no se deberá poder seguir aceptando una vez alcanzado.

**Desanotar:** Los colectivos podrán desasociar a una persona colaboradora de un proyecto. De igual forma, las personas también podrán darse de baja de un proyecto. En ambos casos, esta acción es permanente y la interfaz gráfica lo deberá advertir apropiadamente.

### Requerimientos mínimos

- Implementar todos los cambios del dominio
- Login y autenticación en las rutas privadas.
- Pantallas para al menos los siguientes casos de uso:
  - Registro y edición de organización
  - Registro y edición de colaboradora (carga de habilidades, datos de contacto, etc)
  - CRUD de proyectos
  - Búsquedas de colaboradoras y proyectos
  - Ver página del proyecto, en la que se ven sus atributos, los perfiles necesarios (en búsqueda abierta o no; en todo caso se indica quién o quiénes están ocupando ese rol), y una página con el estado de avance del proyecto (% finalizado, logros, enlace al repositorio público y enlace al sistema en producción).
  - Contacto interno con colaboradoras que encajen con un perfil
  - Listado de mensajes internos
  - Realizar, aceptar y rechazar una postulación
  - Desanotación de proyectos (tanto desde el lado de la colaboradora como del colectivo).
  - Consultar los datos de contacto de un perfil. Si quien accede al perfil es otra persona colaboradora o un colectivo que no tiene acceso a los datos de contacto, este pedido debe fallar.

### Lineamientos de UI

- **Interfaz Intuitiva:** El diseño de la aplicación debe ser claro y fácil de entender para usuarios sin experiencia previa en plataformas similares. Se debe utilizar una estructura de navegación coherente, asegurando que los usuarios puedan acceder a las funcionalidades principales en pocos clics.
- **Aprendizaje Rápido:** La interfaz debe seguir patrones de diseño comunes en aplicaciones de ecommerce para que los usuarios reconozcan fácilmente las funcionalidades. Se deben incluir textos descriptivos y elementos visuales que guíen a los usuarios en cada paso del proceso
- **Feedback Visual y Notificaciones:** Deben incluirse mensajes de error y confirmación en cada interacción relevante. Indicadores visuales (loaders, skeletons, etc.) deben mostrar el estado de carga de las solicitudes al Backend para evitar que el usuario piense que la aplicación está inactiva.
- **Diseño Responsivo:** El aplicativo debe ser completamente funcional en distintos dispositivos (desktop, tablets y móviles). Se debe asegurar que todos los elementos sean accesibles en pantallas de distintos tamaños sin afectar la usabilidad
- **Accesibilidad:** Se deben seguir buenas prácticas de accesibilidad, como el uso de contrastes adecuados, etiquetas ARIA y soporte para navegación mediante teclado. Los textos y botones deben ser lo suficientemente grandes para facilitar su uso en dispositivos móviles.
- **Consistencia en la UI:** Los estilos, colores y tipografías deben ser homogéneos en toda la aplicación para mejorar la experiencia del usuario. Los componentes reutilizables deben seguir un diseño coherente para evitar confusión.

### Entregables

- Implementación de todas las pantallas explicitadas y cualquier otra que el equipo considere necesarias con la correspondiente navegabilidad entre ellas y ajuste al cumplimiento de los requerimientos no funcionales listados en esta iteración.
- Justificación acerca del cumplimiento de los requerimientos no funcionales.
- Aplicación desplegada

### Tecnologías a Utilizar

- Todas las mencionadas en las entregas anteriores.
- Framework Frontend: React (CRA o NextJs). En caso de usar NextJs, no se emplearán rutas dinámicas.
- Framework de UI: React
- Cliente HTTP: Axios
- Tests de integración:
  - en la Capa de Controladores del Backend: solamente es necesario realizar 1 test, cuyo endpoint a testear queda a criterio del equipo.
  - en el Frontend: solamente es necesario realizar 1 test, cuya funcionalidad a testear queda a criterio del equipo.

---

## Otros Requerimientos Adicionales

A criterio de cada curso / docente, se podrán incluir en las entregas anteriores los siguientes requerimientos adicionales

### De integración

- **Importación desde LinkedIn:** Permitir importar datos del perfil desde LinkedIn.
- **Publicación en LinkedIn:** Opción para publicar automáticamente contribuciones o logros en LinkedIn.
- **Contribuciones Económicas:** Integración con plataformas de donación (ej.: Cafecito.app).
- **Autenticación Delegada / Login social:** Posibilidad de de registrarse e ingresar usando cuentas sociales y/o utilizando un servicio externo de autenticación (identity provider)
- **Notificaciones RSS:** publicar nuevos colectivos y proyectos a través de un RSS Feed
- **Webhooks para integraciones externas:** Permitir que un colectivo registre una URL de webhook que reciba eventos (nueva postulación, colaboración aceptada, proyecto cerrado) para integrarlo con sus propias herramientas (Discord, Slack, etc).

### De comportamiento

- **Moderación y Flaggeo Automático:** Notificación automática a administradores sobre proyectos u organizaciones que incumplan reglas (por ejemplo, una organización con fin de lucro no puede ofrecer proyectos, los proyectos no pueden contener incitaciones al odio, el código del proyecto no puede ser cerrado, etc) para su posterior revisión manual.
- **Aceptación y rechazo automático de postulaciones:** dependiendo de la configuración del proyecto algunas postulaciones podrán ser aceptadas o rechazadas automáticamente (teniendo los mismos efectos que sus contrapartidas manuales). Por ejemplo, estas son algunos modos posibles:
  - _Hasta llenar las vacantes:_ una vez que se alcanza el límite, se aceptan todas, se cierra la postulación y se rechazan las demás. Sólo se puede usar si hay límite.
  - _Todo suma:_ se aceptan todas las participaciones. Sólo se puede usar si no hay límite.
  - _Revisión manual:_ no hay rechazos ni aceptaciones automáticas.
- **Notificaciones automáticas:** Al cargar un proyecto o colaborador, se buscan candidatos/as compatibles y se los notifica (en tiempo real o de forma periódica/programada).
- **Cierre Automático de Proyectos:** En cualquier momento el colectivo podrá indicar una fecha límite de cierre para cualquiera de sus proyectos. Cuando se alcance esta fecha, el proyecto se cerrará automáticamente. El cierre automático tendrá las mismas consecuencias que uno manual, se rechazan todas las postulaciones existentes y ya no se pueden crear ni aceptar nuevas postulaciones.

### De seguridad

- **Sanitización:** asegurarse de que ninguno de los campos textuales que una persona pueda ingresar contengan tags HTML peligrosos, como iframes, scripts, etc.
- **Integración con HCaptcha** para la detección de perfiles fraudulentos
- **Perfiles administrativos y auditoría de acciones administrativas:** Permitir que un colectivo tenga múltiples usuarios administrativos y ofrecer trazabilidad sobre toda acción realizada sobre colectivos, proyectos y colaboraciones (suspensiones, bajas, revisión de denuncias, etc), con autor y fecha.
- **Límite de tasa (rate limiting) en endpoints públicos:** Proteger las búsquedas y APIs públicas contra scraping o abuso mediante límites de solicitudes por IP/usuario

### De visualización

- **Normalización de las ubicaciones y geolocalización:** Mapa interactivo de Argentina que muestre la distribución geográfica de los proyectos que cuenten con ubicación.
- **Estadísticas globales:** mostrar estadísticas globales del uso de la plataforma (cantidad de proyectos, colectivos, colaboraciones, etc). Las estadísticas deben implementarse mediante el Mongo Aggregation Framework
- **Estadísticas por organización:** las organizaciones contarán con un panel de control en el que podrán ver estadísticas globales de la organización y de los proyectos sobre la cantidad de proyectos, colaboraciones / contribuciones, visualizaciones, avances
- **Panel de proyectos destacados:** Permitir que el equipo administrativo marque proyectos como "destacados" para mostrarlos primero en la portada, con criterios de rotación o vencimiento.
- **Línea de tiempo (timeline) de un colectivo:** Vista cronológica que muestre todos los proyectos creados por un colectivo, logros cargados y colaboraciones cerradas de una organización, a modo de historial público.

### De accesibilidad, experiencia de usuario, protección de datos y consentimiento

- **Modo Daltónico:** Accesibilidad visual con paleta adaptada.
- **Términos y Condiciones:** Mecanismo para definir, actualizar y evaluar el cumplimiento de términos y condiciones en los proyectos, pudiendo dar de baja proyectos u organizaciones en infracción.
- **Sistema de Denuncias:** Permitir que una persona que haya participado en un proyecto con la organización denuncie a la misma por mal comportamiento. Queda a criterio del equipo administrativo de la plataforma evaluar la denuncia.
- **Eliminación de colectivos:** permitir que los colectivos eliminen su cuenta. La información histórica del colectivo no se elimina, pero ya se eliminan de la plataforma todos sus datos de contacto
- **Eliminación de cuentas personales:** Cuando lo hacen, los datos públicos de las personas son anonimizados.
- **Control granular de información:** permitir que la persona colaboradora controle qué atributos de su perfil son públicos y cuales sólo estarán disponibles cuando se anote en un proyecto. Al hacer esto, el sistema, en lugar de fallar cuando alguien intenta consultar el perfil de una persona con quien no colabora, deberá funcionar, pero mostrando únicamente los atributos públicos.
- **Portabilidad de datos personales:** Permitir que cualquier usuario descargue toda su información personal almacenada en la plataforma en un formato estructurado (JSON/CSV), en línea con principios de protección de datos.

### Otros

- **Redes Sociales:** Integración de enlaces a redes sociales tanto en perfiles de organizaciones como de personas.
- **Chat Interno:** Incorporación de un módulo de chat en tiempo real dentro de la plataforma.
- **Borradores (Drafts):** Estado en borrador para proyectos, visible solo para la organización hasta su publicación y posterior revisión/aprobación.
- **API Pública de Estadísticas:** Endpoint público con métricas globales de la plataforma.
- **Internacionalización (i18n):** Soporte multiidioma (español, portugués y al menos una de de las tres principales lenguas autóctonas de Argentina: quechua, guaraní o mapudungun).
- **Rendición de Gastos:** Permitir que los colaboradores carguen facturas o comprobantes para reembolsos.
- **Diagrama de Gantt:** Visualización de la planificación del proyecto (breakdown de tareas y calendario).
- **Etiquetado (Tags):** Permitir la carga de etiquetas en proyectos y organizaciones para optimizar las búsquedas.
- **Seguimiento de proyectos:** los proyectos iniciados que no hayan publicado actualizaciones también deberán ser marcados para revisión manual por el equipo administrativo de la plataforma.
- **Huella hídrica / Huella IA:** Dado que los efectos perniciosos de la “IA” están bien documentados y estudiados (impacto ambiental, destrucción y precarización de las fuentes de trabajo, destrucción de textos históricos, etc), los proyectos que declaren minimizar su uso se mostrarán primero. Por el momento esto es sólo a fines declamatorios y no se monitoreará que así lo sea efectivamente. Concretamente:
  - Permitir marcar en los proyectos si precisan o no del uso de plataformas de modelos generativos,
  - Cuando los proyectos necesiten utilizarla, se deberán cargar usos, con una breve justificación y una indicación estimativa de que grado de uso (bajo, medio, alto).
- **Experiencia de habilidades:** que cada persona colaboradora pueda adicionar (opcionalmente) a cada habilidad de su lista una cantidad de años de experiencia y una descripción de la misma.
- **Soporte para Markdown:** posibilidad de que cuando se ingrese una descripción de cualquier recurso del sistema (ejemplo, descripción de una habilidad, de un proyecto, de un perfil de colectivo o persona colaboradora, etc) el texto pueda contener marcas Markdown y el mismo se renderice correctamente.
- **Sistema de valoraciones (reviews) mutuas:** Al finalizar una colaboración, tanto el colectivo como la colaboradora pueden calificarse mutuamente (puntaje + comentario breve), visible en el historial público de ambos.

---

## Requerimientos Opcionales Elegidos

Requerimientos adicionales elegidos por el equipo, agrupados según su categoría en el enunciado.

### De integración

- **Importación desde LinkedIn:** Permitir importar datos del perfil desde LinkedIn.
- **Contribuciones Económicas:** Integración con plataformas de donación (ej.: Cafecito.app).
- **Autenticación Delegada / Login social:** Posibilidad de de registrarse e ingresar usando cuentas sociales y/o utilizando un servicio externo de autenticación (identity provider)

### De comportamiento

- **Notificaciones automáticas:** Al cargar un proyecto o colaborador, se buscan candidatos/as compatibles y se los notifica (en tiempo real o de forma periódica/programada).
- **Cierre Automático de Proyectos:** En cualquier momento el colectivo podrá indicar una fecha límite de cierre para cualquiera de sus proyectos. Cuando se alcance esta fecha, el proyecto se cerrará automáticamente. El cierre automático tendrá las mismas consecuencias que uno manual, se rechazan todas las postulaciones existentes y ya no se pueden crear ni aceptar nuevas postulaciones.

### De seguridad

- **Integración con HCaptcha** para la detección de perfiles fraudulentos

### De visualización

- **Estadísticas globales:** mostrar estadísticas globales del uso de la plataforma (cantidad de proyectos, colectivos, colaboraciones, etc). Las estadísticas deben implementarse mediante el Mongo Aggregation Framework

### De accesibilidad, experiencia de usuario, protección de datos y consentimiento

- **Modo Daltónico:** Accesibilidad visual con paleta adaptada.
- **Sistema de Denuncias:** Permitir que una persona que haya participado en un proyecto con la organización denuncie a la misma por mal comportamiento. Queda a criterio del equipo administrativo de la plataforma evaluar la denuncia.
- **Eliminación de colectivos:** permitir que los colectivos eliminen su cuenta. La información histórica del colectivo no se elimina, pero ya se eliminan de la plataforma todos sus datos de contacto

### Otros

- **Redes Sociales:** Integración de enlaces a redes sociales tanto en perfiles de organizaciones como de personas.
- **API Pública de Estadísticas:** Endpoint público con métricas globales de la plataforma.
- **Sistema de valoraciones (reviews) mutuas:** Al finalizar una colaboración, tanto el colectivo como la colaboradora pueden calificarse mutuamente (puntaje + comentario breve), visible en el historial público de ambos.
