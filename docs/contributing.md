# Contribuir

Esta biblioteca está en desarrollo, y depende de la ayuda tanto de desarrolladores como de hispanohablantes.

No hace falta saber programar para ayudar. Avisarnos de una palabra mal etiquetada, en una [incidencia](https://github.com/nlp-compromise/es-compromise/issues), ya es una contribución útil. Puedes escribirla en español o en inglés.

Todas las pull-requests son bienvenidas, y se revisan con prontitud. Esta biblioteca es de código abierto y tiene licencia MIT.

### Instalación

Crea un fork personal del repositorio en GitHub, y después:

```bash
git clone git@github.com:{TU_USUARIO}/es-compromise.git
cd es-compromise
pnpm install
pnpm test
```

Este proyecto usa [pnpm](https://pnpm.io/). `npm install` y `npm test` también funcionan.

### Hacer un cambio

- `./src` contiene el código. Está dividido en `01-one` (división en palabras), `02-two` (etiquetado) y `03-three` (selecciones como `.verbs()`).
- `./data` contiene las listas de palabras y los modelos. Están comprimidos, así que ejecuta `pnpm run pack` después de cambiarlos para ver el resultado.
- `./tests` contiene las pruebas. Por favor, añade una prueba para tu cambio.
- `./scratch.js` es un archivo para hacer pruebas rápidas. `pnpm run watch` lo vuelve a ejecutar cada vez que guardas.

Para ver cómo se etiquetó una oración, usa `.debug()`:

```js
nlp('Ella vende conchas en la playa.').debug()
```

### Enviar una pull-request

Por favor, trabaja a partir de la rama `dev`, y envía ahí tu pull-request.

Si tu cambio es grande, crea antes una incidencia para que podamos comentarlo.
