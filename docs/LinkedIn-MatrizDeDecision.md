# Integración con LinkedIn: alternativas y matriz de decisión

> Requerimiento opcional elegido: **«Importación desde LinkedIn: permitir importar datos del perfil desde LinkedIn»**. El equipo también quiere **exportar** (publicar en LinkedIn las colaboraciones y los logros), que en el enunciado figura como otro opcional: «Publicación en LinkedIn».
>
> Contexto: proyecto universitario, equipo chico, poco tiempo, deploy en un único servidor y Keycloak ya en el `docker-compose`. Información relevada en noviembre de 2026.

## 1. Qué permite LinkedIn hoy (lo que condiciona todo)

- **La API de perfil completo no es pública.** Sin ser partner de LinkedIn, el login con OpenID Connect («Sign In with LinkedIn using OpenID Connect», autoservicio) solo entrega `openid`, `profile` y `email`: id, nombre, apellido, foto, idioma y email. **No entrega habilidades, experiencia ni educación** ([docs](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2)). Los scopes viejos (`r_liteprofile` y `r_emailaddress`) se dieron de baja en agosto de 2023.
- **La Member Data Portability API sí entrega el perfil completo, pero solo para miembros de la UE/EEE y Suiza**, porque existe para cumplir la Digital Markets Act ([ayuda de LinkedIn](https://www.linkedin.com/help/linkedin/answer/a6214075), [docs](https://learn.microsoft.com/en-us/linkedin/dma/member-data-portability)). Nuestras usuarias están en Argentina: **no aplica**.
- **El scraping está descartado.** LinkedIn demandó a Proxycurl en enero de 2025 y la empresa cerró en julio de 2025 ([LinkedIn](https://news.linkedin.com/2025/LinkedInWinsLegalBattleToProtectMemberData), [Social Media Today](https://www.socialmediatoday.com/news/linkedin-wins-legal-case-data-scrapers-proxycurl/756101/)). Viola los términos de uso y obliga a usar datos de terceros.
- **Cada persona puede descargar sus propios datos** desde *Configuración → Privacidad de datos → Obtener una copia de tus datos*. Llega un ZIP con CSV: `Profile.csv`, `Positions.csv`, `Skills.csv`, `Education.csv`, `Certifications.csv`, etc. ([ayuda de LinkedIn](https://www.linkedin.com/help/linkedin/answer/50191)). Son datos de la persona que ella decide subir: no hace falta pedirle permiso a LinkedIn.
- **Hay dos formas de exportar sin API:**
  - El enlace `linkedin.com/sharing/share-offsite/?url=…` abre la caja de «compartir» con una vista previa de la URL. Solo respeta el parámetro `url`; el título y la descripción salen de las etiquetas Open Graph de la página ([referencia](https://css-tricks.com/?p=248120)).
  - El botón **«Add to Profile»** (`linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=…&organizationName=…&issueYear=…&certUrl=…`) agrega una «licencia o certificación» al perfil de la persona, que confirma en LinkedIn ([LinkedIn](https://addtoprofile.linkedin.com), [ayuda](https://www.linkedin.com/help/linkedin/answer/53128)).
- **Publicar por API** («Share on LinkedIn», permiso `w_member_social`, Posts API) requiere un OAuth con ese scope, guardar y renovar tokens y tener la app asociada a una página de empresa ([docs](https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api)). No pude confirmar si hoy se aprueba en forma automática.

## 2. Alternativas

### Importar

| | Alternativa | Qué trae | Cómo funciona |
|---|---|---|---|
| **A** | Login con LinkedIn (OIDC) **vía Keycloak** | Nombre, apellido, email y foto | Keycloak trae el proveedor LinkedIn OIDC de fábrica ([Javadoc](https://www.keycloak.org/docs-api/latest/javadocs/org/keycloak/social/linkedin/LinkedInOIDCIdentityProviderFactory.html)). Con los datos del token se completa el registro de la colaboradora. Cubre también el opcional **«Login social»**. |
| **B** | Subir el **ZIP o CSV** que exporta LinkedIn | Habilidades, experiencia, educación, presentación y nombre | Un endpoint `POST /colaboradoras/:id/importar-linkedin` recibe el archivo y lee `Profile.csv` y `Skills.csv` (y, si se quiere, `Positions.csv`). Las habilidades se cruzan con el catálogo **por título normalizado, que es justamente el código de la habilidad**. La persona confirma qué se carga antes de guardar. |
| **C** | Member Data Portability API (DMA) | Todo el perfil | OAuth con un scope DMA. Solo para miembros de la UE/EEE/Suiza. |
| **D** | Scraping o APIs de terceros que scrapean | Todo el perfil público | Se pide el perfil por URL. Viola los términos de uso, es pago y hoy hay juicios. |
| **E** | Solo guardar la URL del perfil | Un enlace | Ya existe: red social `linkedin`. No importa datos. |

### Exportar

| | Alternativa | Qué hace | Cómo funciona |
|---|---|---|---|
| **G** | Botón **«Compartir en LinkedIn»** (share-offsite) | Publica un post con la vista previa del proyecto | Un enlace, sin API. *Ojo:* el front es una SPA, así que la vista previa necesita etiquetas Open Graph por proyecto. Se resuelve con una ruta del backend (`GET /og/proyectos/:id`) que arma el HTML con las `meta`, y nginx se la sirve al crawler de LinkedIn. |
| **H** | Botón **«Agregar a mi perfil»** (Add to Profile) | Suma «Colaboración en Código a Voluntad: <proyecto>» como certificación, con fecha y enlace al proyecto | Un enlace armado en el front con los datos de la colaboración. Sin API y sin cuenta de desarrollador. |
| **I** | Publicación automática por **Posts API** | Publica sola al terminar una colaboración o al cargar un logro | OAuth con `w_member_social`, tokens guardados de 60 días, y una app asociada a una página de empresa. |

## 3. Criterios y pesos

| Criterio | Peso | Por qué pesa eso en un TP |
|---|---|---|
| **Viabilidad del acceso**: se puede usar sin aprobación de LinkedIn ni requisitos que no cumplimos | 25 % | Si LinkedIn no nos habilita, no hay entrega. |
| **Esfuerzo de implementación** (5 = poco) | 20 % | Quedan pocas semanas y faltan el login y el endpoint de contactos. |
| **Valor para el dominio**: datos útiles para buscar y matchear (habilidades) o para mostrar contribuciones | 20 % | Es lo que justifica el requerimiento. |
| **Legalidad, términos de uso y privacidad** | 15 % | La plataforma maneja datos personales; no podemos defender el scraping en una corrección. |
| **Demostrabilidad**: funciona en el deploy y quien corrige lo puede probar | 10 % | Se evalúa en la demo. |
| **Mantenimiento y riesgo de que se rompa** | 10 % | Formatos sin documentación oficial o APIs que cambian. |

Además hay un **filtro eliminatorio**: la alternativa tiene que **cumplir el requerimiento**, es decir, importar datos del perfil o publicar en LinkedIn. **E** no lo pasa: guardar la URL no importa nada.

Puntaje de 1 (malo) a 5 (bueno).

## 4. Matriz de decisión

### Importar

| Alternativa | Filtro | Viabilidad 25 % | Esfuerzo 20 % | Valor 20 % | Legal 15 % | Demo 10 % | Mant. 10 % | **Total** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **B** · ZIP/CSV del export | ✅ | 5 | 3 | 5 | 5 | 4 | 3 | **4,30** |
| **A** · Login OIDC vía Keycloak | ✅ | 5 | 4 | 2 | 5 | 4 | 4 | **4,00** |
| C · DMA API | ✅ | 1 | 2 | 5 | 5 | 1 | 3 | 2,80 |
| D · Scraping / terceros | ✅ | 2 | 3 | 5 | 1 | 2 | 1 | 2,55 |
| E · Solo URL | ❌ | — | — | — | — | — | — | descartada |

### Exportar

| Alternativa | Filtro | Viabilidad 25 % | Esfuerzo 20 % | Valor 20 % | Legal 15 % | Demo 10 % | Mant. 10 % | **Total** |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **H** · Add to Profile | ✅ | 5 | 5 | 4 | 5 | 5 | 3 | **4,60** |
| **G** · Compartir (share-offsite) | ✅ | 5 | 4 | 3 | 5 | 4 | 4 | **4,20** |
| I · Posts API automática | ✅ | 3 | 2 | 4 | 4 | 2 | 2 | 2,95 |

### Pros y contras

| | Pros | Contras |
|---|---|---|
| **A** | Autoservicio; viene de fábrica en Keycloak (que ya está en el compose); suma el opcional «Login social»; email verificado por LinkedIn. | Solo trae nombre, email y foto: **no trae habilidades**. Hay que crear la app en el portal de LinkedIn con la URL de callback del deploy. |
| **B** | Es **lo único accesible desde Argentina que trae las habilidades**; el mapeo al catálogo es directo (código = título normalizado); los datos los sube la persona, con su consentimiento; no depende de aprobaciones. | La persona tiene que pedir el archivo y esperar el mail; el formato de los CSV no está documentado oficialmente y puede cambiar; hay que manejar la subida de archivos y validar tamaño y tipo. |
| **C** | Datos completos por API oficial. | Excluye a usuarias fuera de la UE: no sirve para este proyecto. |
| **D** | Datos completos sin que la persona haga nada. | Viola los términos de uso, tiene riesgo legal, es pago y se rompe seguido. Indefendible en la corrección. |
| **H** | Un enlace; la persona confirma en LinkedIn; muestra la contribución en su perfil con enlace a la plataforma (le da visibilidad al proyecto); cero tokens. | Los parámetros del enlace no tienen una especificación oficial completa; solo admite «certificación», no «experiencia». |
| **G** | Un enlace; sirve para logros y proyectos; también lo puede usar el colectivo. | Para que la vista previa no sea genérica hace falta Open Graph por proyecto (una ruta del backend más una regla de nginx). En el celular a veces abre el feed en lugar de la caja de compartir. |
| **I** | Publicación automática y sin clics. | OAuth y tokens que hay que guardar de forma segura; aprobación incierta; publicar a nombre de alguien exige un consentimiento muy explícito. Mucho trabajo para un opcional. |

## 5. Recomendación

**Importar: B + A.**
- **B** es la que realmente cumple «importar datos del perfil» con valor para el dominio (habilidades).
- **A** sale casi gratis cuando se integre Keycloak y además cumple «Login social». Sirve para completar nombre y email en el registro y dejar un botón «Importar mis habilidades desde LinkedIn (ZIP)» en *Mi perfil*.

**Exportar: H (y G si sobra tiempo).**
- «Agregar a mi perfil» en cada colaboración terminada de *Mis proyectos*.
- «Compartir en LinkedIn» en los logros. Mientras no estén las etiquetas Open Graph, la vista previa va a ser la genérica del sitio.

### Esfuerzo estimado (orientativo)

| Pieza | Dónde | Estimación |
|---|---|---|
| B · endpoint de importación: `multer` + lectura de ZIP/CSV + mapeo al catálogo + tests | backend | 1,5–2 días |
| B · diálogo «Importar desde LinkedIn» con vista previa y confirmación | front | 1 día |
| A · proveedor LinkedIn en Keycloak + mapeo de atributos | Keycloak | 0,5 día *(después del login)* |
| H · armado del enlace «Agregar a mi perfil» | front | 2–3 horas |
| G · botón de compartir | front | 1 hora |
| G · Open Graph por proyecto (ruta del backend + nginx) | back + deploy | 0,5–1 día *(opcional)* |

### Para la justificación ante la cátedra

«LinkedIn no ofrece a terceros una API pública de perfil completo. La API de portabilidad (DMA) se limita a la UE, y el scraping viola sus términos (antecedente: el juicio a Proxycurl en 2025). Por eso la importación se basa en el **derecho de la persona a descargar sus propios datos**: ella sube su export y elige qué cargar. Para exportar usamos los mecanismos oficiales que no requieren API (*Add to Profile* y *share-offsite*): la persona confirma la acción en LinkedIn y la plataforma nunca guarda tokens con permiso de escritura.»

### Riesgos y cómo mitigarlos

- **Cambia el formato del ZIP:** el lector busca las columnas por nombre (no por posición) e ignora las que no conoce. Si no encuentra ninguna habilidad, se le avisa a la persona en lugar de fallar. Conviene tener un ZIP de ejemplo en `test/fixtures`.
- **Privacidad:** el archivo se procesa en memoria y no se guarda. Solo se persiste lo que la persona confirma.
- **La demo:** llevar un export real de alguien del equipo, o el ZIP de ejemplo, para no depender de la espera del mail.
