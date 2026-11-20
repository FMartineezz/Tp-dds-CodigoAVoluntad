# estilos/ · estilos universales

Todo el aspecto del sitio sale de acá. Los componentes **no** escriben colores ni tamaños propios.

| Archivo | Qué define | Si lo editás |
|---|---|---|
| `paleta.css` | Todos los hex (único lugar) | Cambia ese color en todo el sitio |
| `colores-semanticos.css` | Qué color cumple cada rol (fondo, acento, peligro…) | Cambia el rol sin tocar la paleta |
| `tipografia.css` | Fuentes y tamaños del texto | Cambia el texto de interfaz y de lectura |
| `titulos.css` | h1–h6 y display (tamaño, interlineado, ancho) | Cambia los títulos de ese nivel en todo el sitio |
| `espaciado-y-forma.css` | Espacios, esquinas, bordes, sombra | Cambia el «aire» y la forma de todo |
| `base.css` | Reset, foco, utilidades, reglas por área | Rara vez hace falta tocarlo |
| `temas/daltonico.css` | Colores alternativos para daltonismo | Se activa con `data-theme="daltonico"` |
| `index.css` | Orden en que se cargan | Agregá acá archivos nuevos |

Regla de oro: **un color nuevo se declara en `paleta.css` y recién después se usa**.
