
# TP Desarrollo De Software "Código a Voluntad"

## Contexto del Proyecto
**Código a Voluntad** es una plataforma open-source que tiene como finalidad funcionar como un puente solidario y tecnológico entre dos actores clave:

* **Organizaciones con impacto social:** ONGs, fundaciones, asambleas y espacios territoriales que necesitan software de nivel profesional, pero carecen del presupuesto para costearlo.
* **Personas colaboradoras:** Desarrolladores y especialistas IT que buscan aportar su experiencia, mano de obra y asesoramiento de forma voluntaria.


### Arquitectura Tecnológica
El sistema se apoya en una arquitectura web cliente-servidor (cliente pesado), utilizando el siguiente stack tecnológico:
* **Backend:** Node.js y Express
* **Frontend:** React

## Metodologia de trabajo 

El proyecto se desarrolla siguiendo el enfoque **GithubFlow**, para mantener un flujo organizado y mejorar la coordinacion entre los colaboradores

## Estructura del Proyecto

### Backend

El backend es la capa responsable de la lógica de negocio, la validación de datos, la seguridad y la persistencia. Expone APIs que permiten la comunicación con el frontend y centraliza la lógica del sistema

```
───backend
   ├─── index.js
   ├─── package.json
   │   
   └───src
       ├─── controllers      # Encargados de la response a las request 
       ├─── models           # Entidades de dominio anemicas 
       ├─── repositories     # Encargados de la persistencia y acceso a datos
       ├─── routes           # Definicion de los endpoints 
       └─── services         # Encargados del comportamiento del dominio, contiene la logica y reglas de negocio
```


### Frontend

El frontend es la capa de interacción con el usuario. Se encarga de presentar la información, facilitar la navegación y permitir la ejecución de las acciones del sistema a través de una interfaz web intuitiva

```


```
