# Sintaxis de patrones

Este es el lenguaje de patrones que usa compromise para seleccionar partes de un documento.
Se parece a una expresión regular, pero trabaja con palabras enteras (términos), no con caracteres.
Lo usan `.match()`, `.has()`, `.if()`, `.not()`, `.before()`, `.replace()` y otros métodos parecidos.

```js
nlp('el gato duerme').match('#Artículo #Sustantivo').text()
// 'el gato'
```

## Referencia rápida

| Patrón             | Significado                                        | Ejemplo                    | Encuentra                        |
| ------------------ | -------------------------------------------------- | -------------------------- | -------------------------------- |
| `palabra`          | esta palabra exacta (sin distinguir mayúsculas)    | `duerme`                   | «duerme»                         |
| `#Etiqueta`        | cualquier término con esta [etiqueta](./tagset.md) | `#Sustantivo`              | «gato»                           |
| `.`                | un término cualquiera                              | `el . duerme`              | «el gato duerme»                 |
| `*`                | cero o más términos cualesquiera                   | `el * duerme`              | «el gato negro duerme»           |
| `(a\|b)`           | uno u otro                                         | `(rojo\|azul)`             | «rojo» o «azul»                  |
| `(a && b)`         | un término que es las dos cosas a la vez           | `(cocina && #Verbo)`       | «cocina», solo como verbo        |
| `palabra?`         | opcional                                           | `el pequeño? coche`        | «el coche» y «el pequeño coche»  |
| `palabra+`         | uno o más                                          | `#Adjetivo+`               | «rojo pequeño»                   |
| `palabra{m,n}`     | entre m y n                                        | `.{2,3}`                   | dos o tres términos              |
| `!palabra`         | cualquier cosa menos esto                          | `el !#Verbo`               | «el gato»                        |
| `^`                | principio de la oración                            | `^el`                      | un «el» al principio             |
| `$`                | final de la oración                                | `duerme$`                  | un «duerme» al final             |
| `[palabra]`        | grupo de captura                                   | `precio de la [.]`         | «leche»                          |
| `[<nombre>palabra]` | grupo de captura con nombre                       | `precio de la [<cosa>.]`   | «leche», con el nombre `cosa`    |
| `{raíz}`           | cualquier forma de esta palabra                    | `{caminar}`                | «camina», «caminamos», «caminó»  |
| `~palabra~`        | búsqueda aproximada, para grafías parecidas        | `~dirección~`              | «direccion»                      |
| `/regex/`          | una expresión regular, probada en un solo término  | `/mé[xj]ico/`              | «México», «Méjico»               |
| `@método`          | una prueba sobre el término                        | `@isTitleCase`             | «Hola»                           |

Se pueden combinar: `#Sustantivo+?` es una serie opcional de sustantivos, y `^[<primero>.]` captura el primer término.

## Palabras

Una palabra sola encuentra únicamente esa palabra, sin distinguir mayúsculas de minúsculas. No encuentra otras formas de la palabra:

```js
nlp('caminamos al trabajo').has('caminamos') // true
nlp('caminamos al trabajo').has('caminar') // false
```

Usa `{caminar}` para encontrar todas las formas. Consulta las [raíces](#raíces) más abajo.

## Etiquetas

Una `#Etiqueta` encuentra cualquier término que la tenga. Las etiquetas válidas están en el [conjunto de etiquetas](./tagset.md).

Las etiquetas forman una jerarquía: un `#Nombre` es también una `#Persona` y un `#Sustantivo`.

```js
nlp('el gato duerme').match('#Sustantivo').text() // 'gato'
```

Una etiqueta desconocida no encuentra nada, y no lanza ningún error:

```js
nlp('el gato duerme').match('#Sustantivos').found // false
```

Los nombres de las etiquetas en español y en inglés se pueden usar indistintamente. También se pueden usar formas al estilo Penn, como `#RB`.

```js
nlp('el gato duerme').match('#Artículo #Sustantivo').text() // 'el gato'
nlp('el gato duerme').match('#Determiner #Noun').text() // 'el gato'
```

## Comodines

`.` es exactamente un término. `*` es cualquier número de términos, también ninguno, y toma tantos como puede.

```js
nlp('el gato duerme').match('el . duerme').text() // 'el gato duerme'
nlp('el gato negro duerme').match('el * duerme').text() // 'el gato negro duerme'
```

## Opciones

`(a|b)` encuentra cualquiera de las opciones. `(a && b)` exige que el término las cumpla todas, lo cual es útil para una palabra que puede tener dos categorías gramaticales.

```js
nlp('me gusta el rojo y el azul').match('(rojo|azul)').out('array') // ['rojo', 'azul']
nlp('ella cocina en la cocina').match('(cocina && #Verbo)').out('array') // ['cocina']
```

Los grupos no se pueden anidar. `(gran (rojo|azul))` no está admitido, así que usa dos llamadas a `.match()`.

## Términos opcionales y repetidos

```js
nlp('el coche').match('el pequeño? coche').text() // 'el coche'
nlp('el pequeño coche').match('el pequeño? coche').text() // 'el pequeño coche'

nlp('un coche rojo pequeño').match('#Adjetivo+').text() // 'rojo pequeño'
nlp('a b c d').match('.{2,3}').text() // 'a b c'
```

`{n}` es exactamente n, `{m,n}` es de m a n, `{m,}` es m o más, y `{,n}` es hasta n.

## Negación

```js
nlp('el gato duerme').match('el !#Verbo').text() // 'el gato'
```

## Principio y final

`^` y `$` son el principio y el final de una oración, no del documento.

```js
nlp('el gato duerme').match('^el').text() // 'el'
nlp('el gato duerme').match('duerme$').text() // 'duerme'
```

## Grupos de captura

Los corchetes marcan la parte del resultado que quieres conservar. Se obtiene con `.groups()`, o pasando el grupo como segundo argumento:

```js
const doc = nlp('el precio de la leche es alto')
doc.match('precio de la [<cosa>.]').groups('cosa').text() // 'leche'
doc.match('precio de la [.]', 0).text() // 'leche'
```

Sin nombre, los grupos se numeran desde 0. Un grupo puede contener más de un término.

## Raíces

`{raíz}` encuentra todas las formas flexionadas de una palabra, a partir de su forma de diccionario:

```js
nlp('caminamos al trabajo').match('{caminar}').text() // 'caminamos'
nlp('ella caminó a casa').match('{caminar}').text() // 'caminó'
```

<!-- Las raíces no se calculan por defecto. Si esta búsqueda no devuelve nada, ejecuta antes `doc.compute('root')`. -->

## Búsqueda aproximada

`~palabra~` encuentra grafías parecidas, según la distancia entre cadenas. El umbral por defecto es 0,85, y se puede cambiar en las [opciones](#opciones-de-búsqueda).

```js
nlp('una direccion').match('~dirección~').text() // 'direccion'
```

## Expresiones regulares

Una `/regex/` se prueba sobre un término cada vez, así que no puede abarcar dos palabras.

```js
nlp('México Méjico').match('/mé[xj]ico/').out('array') // ['México', 'Méjico']
```

## Pruebas sobre los términos

`@método` aplica una prueba incorporada a cada término. Las más comunes son `@isTitleCase`, `@isUpperCase`, `@hasComma`, `@hasHyphen`, `@hasContraction` y `@hasQuote`.

```js
nlp('Hola María y gracias').match('@isTitleCase').out('array') // ['Hola', 'María']
```

## Opciones de búsqueda

`.match()`, `.matchOne()`, `.has()`, `.if()`, `.ifNo()`, `.before()` y `.after()` aceptan un objeto de opciones como tercer argumento, después del grupo de captura.

| Opción          | Por defecto | Efecto                                                                  |
| --------------- | ----------- | ----------------------------------------------------------------------- |
| `fuzzy`         | `0.85`      | el parecido que exige un `~palabra~`, de 0 a 1                          |
| `caseSensitive` | `false`     | compara con el texto original, no con la forma normalizada              |
| `noRegex`       | `false`     | trata `/regex/` como una palabra normal, para que nunca se ejecute      |

```js
nlp('Hola hola').match('Hola', null, { caseSensitive: true }).out('array') // ['Hola']
```

Usa `{ noRegex: true }` cuando el patrón lo haya escrito un usuario, para que no pueda ejecutarse una regex lenta o inválida.

## Buscar una lista de palabras

Para una lista larga de palabras sencillas, `.lookup()` es mucho más rápido que muchas llamadas a `.match()`. No usa la sintaxis de patrones, así que también es seguro para palabras escritas por un usuario.

```js
nlp('vi a maría y a juan').lookup(['maría', 'juan']).out('array') // ['maría', 'juan']
```

## Reutilizar un patrón

`nlp.parseMatch(str)` analiza un patrón una sola vez, para poder usarlo muchas veces. `nlp.buildNet([...])` compila muchos patrones en uno, para ejecutarlos juntos con `.sweep()`. Conviene usarlos cuando los mismos patrones se aplican a mucho texto.

## Lo que no está admitido

- **Grupos anidados.** Usa más de una llamada a `.match()`.
- **Patrones que cruzan de una oración a otra.** Cada resultado se queda dentro de una oración.
- **Una regex sobre varias palabras.** Una `/regex/` se prueba sobre un término cada vez.

## Cuando una búsqueda no encuentra nada

1. Comprueba que la etiqueta está en el [conjunto de etiquetas](./tagset.md).
2. Usa `doc.debug()` para ver cómo se etiquetó cada palabra.
3. Recuerda que una palabra sola es una búsqueda exacta. Usa `{raíz}` para todas sus formas.
4. Recuerda que los patrones no cruzan de una oración a otra.
