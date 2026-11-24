# API

`es-compromise` está construido sobre la biblioteca en inglés [compromise](https://github.com/spencermountain/compromise/), y comparte sus métodos básicos. Funcionan igual en todos los idiomas.

La mayoría de los métodos devuelven una nueva **vista** (una selección del documento), así que se pueden encadenar:

```js
nlp(texto).match('#Sustantivo').first().text()
```

Los métodos que reciben un `match` usan la [sintaxis de patrones](./match.md).

## Métodos básicos

_(disponibles en todas las vistas)_

### Utilidades

- **`.found`** _[getter]_ — ¿contiene algo esta vista?
- **`.docs`** _[getter]_ — la lista de objetos término de esta vista
- **`.document`** _[getter]_ — el texto analizado completo
- **`.pointer`** _[getter]_ — los índices de la vista actual
- **`.fullPointer`** _[getter]_ — los índices explícitos de la vista actual
- **`.methods`** _[getter]_ — acceso a los métodos internos de la biblioteca
- **`.model`** _[getter]_ — acceso a los datos internos de la biblioteca
- **`.hooks`** _[getter]_ — qué métodos compute se ejecutan por defecto
- **`.isView`** _[getter]_ — sirve para reconocer un objeto de compromise
- **`.length`** _[getter]_ — el número de resultados de la vista
- **`.update(pointer)`** — crea una vista nueva a partir de este documento
- **`.toView(pointer)`** — convierte una vista Verb o Noun en una normal
- **`.fromText(text)`** — crea un documento nuevo
- **`.termList()`** — alias de .docs
- **`.compute(method)`** — ejecuta una operación con nombre sobre el documento
- **`.clone(shallow?)`** — copia el documento en profundidad, sin conservar ninguna referencia

### Bucles

- **`.forEach(fn)`** — ejecuta una función sobre cada resultado, como un documento aparte
- **`.map(fn, emptyResult?)`** — pasa cada resultado por una función, y crea un documento nuevo
- **`.filter(fn)`** — conserva solo los resultados que devuelven true
- **`.find(fn)`** — devuelve un documento con solo el primer resultado que cumple
- **`.some(fn)`** — devuelve true si al menos un resultado cumple
- **`.random(n?)`** — toma al azar una parte de los resultados

### Acceso

- **`.terms(n?)`** — divide los resultados en términos individuales
- **`.groups(name?)`** — obtiene un grupo de captura con nombre
- **`.eq(n)`** — usa solo el resultado número n
- **`.first(n?)`** — usa solo el primer resultado, o los primeros
- **`.last(n?)`** — usa solo el último resultado, o los últimos
- **`.firstTerms()`** — la primera palabra de cada resultado
- **`.lastTerms()`** — la última palabra de cada resultado
- **`.slice(start, end?)`** — toma una parte de los resultados
- **`.all()`** — devuelve el documento original entero («alejar el zoom»)
- **`.fullSentences()`** — devuelve la oración original completa de cada resultado
- **`.none()`** — devuelve una vista vacía
- **`.isDoc(view?)`** — ¿son estas dos vistas del mismo documento?
- **`.wordCount()`** — cuenta el número de términos

### Búsqueda

- **`.match(match, group?, options?)`** — devuelve las partes del documento que coinciden con el patrón
- **`.matchOne(match, group?, options?)`** — devuelve solo el primer resultado
- **`.has(match, group?, options?)`** — devuelve true o false: ¿existe este patrón?
- **`.if(match, group?, options?)`** — conserva solo los resultados que contienen este patrón
- **`.ifNo(match, group?, options?)`** — descarta los resultados que contienen este patrón
- **`.before(match, group?, options?)`** — devuelve los términos anteriores a cada resultado
- **`.after(match, group?, options?)`** — devuelve los términos posteriores a cada resultado
- **`.lookBehind(match, group?, options?)`** — alias de .before()
- **`.lookBefore(match, group?, options?)`** — alias de .before()
- **`.lookAhead(match, group?, options?)`** — alias de .after()
- **`.lookAfter(match, group?, options?)`** — alias de .after()
- **`.growLeft(match, group?, options?)`** — añade a la vista los términos coincidentes justo anteriores
- **`.growRight(match, group?, options?)`** — añade a la vista los términos coincidentes justo posteriores
- **`.grow(match, group?, options?)`** — amplía la vista con los términos coincidentes a izquierda o derecha
- **`.sweep(match, opts?)`** — aplica al documento una serie de patrones compilados
- **`.splitOn(match?, group?)`** — divide el resultado en tres: antes, el patrón y después
- **`.splitBefore(match?, group?)`** — corta justo antes de cada patrón encontrado
- **`.splitAfter(match?, group?)`** — corta justo después de cada patrón encontrado
- **`.split(match?, group?)`** — alias de .splitAfter()

### Mayúsculas y minúsculas

- **`.toLowerCase()`** — pone todas las letras en minúscula
- **`.toUpperCase()`** — pone todas las letras en mayúscula
- **`.toTitleCase()`** — pone en mayúscula la primera letra de cada término
- **`.toCamelCase()`** — quita los espacios y pone mayúscula inicial a cada término

### Inserción

- **`.concat(input)`** — añade estos elementos al final
- **`.insertBefore(input)`** — añade estas palabras antes de cada resultado
- **`.prepend(input)`** — alias de .insertBefore()
- **`.insertAfter(text)`** — añade estas palabras después de cada resultado
- **`.append(text)`** — alias de .insertAfter()
- **`.insert(text)`** — alias de .insertAfter()
- **`.remove(match)`** — elimina por completo estos términos del documento
- **`.delete(match)`** — alias de .remove()
- **`.replace(from, to?, keep?)`** — busca un patrón y lo sustituye por contenido nuevo
- **`.replaceWith(to, keep?)`** — sustituye la selección por contenido nuevo
- **`.unique()`** — elimina los resultados duplicados
- **`.reverse()`** — invierte el orden de los resultados, pero no el de las palabras
- **`.sort(method?)`** — reordena los resultados (en el sitio)
<!-- - **`.normalize(options?)`** — limpia varios aspectos de las palabras -->

### Espacios y puntuación

- **`.pre(str?, concat?)`** — añade esta puntuación o este espacio antes de cada resultado
- **`.post(str?, concat?)`** — añade esta puntuación o este espacio después de cada resultado
- **`.trim()`** — quita los espacios del principio y del final
- **`.hyphenate()`** — une las palabras con guiones, y quita los espacios
- **`.dehyphenate()`** — quita los guiones entre las palabras, y pone espacios
- **`.deHyphenate()`** — alias de .dehyphenate()
- **`.toQuotations(start?, end?)`** — pone las selecciones entre comillas
- **`.toQuotation(start?, end?)`** — alias de .toQuotations()
- **`.toParentheses(start?, end?)`** — pone las selecciones entre paréntesis

### Salida

- **`.text(options?)`** — devuelve el documento como texto
- **`.json(options?)`** — devuelve los metadatos deseados del documento
- **`.debug()`** — muestra de forma legible el documento actual y sus etiquetas
- **`.out(format?)`** — algunos formatos de salida con nombre
- **`.html(toHighlight)`** — produce una cadena html, con etiquetas alrededor de los patrones encontrados
- **`.wrap(matches)`** — produce una salida personalizada alrededor de los patrones encontrados

### Punteros

- **`.union(match)`** — devuelve todos los resultados, sin duplicados
- **`.and(match)`** — alias de .union()
- **`.intersection(match)`** — devuelve solo los resultados comunes
- **`.not(match, options?)`** — devuelve todos los resultados menos este
- **`.difference(match, options?)`** — alias de .not()
- **`.complement(match)`** — devuelve todo lo que no es un resultado
- **`.settle(match)`** — elimina los solapamientos entre resultados

### Etiquetas

- **`.tag(tag, reason?)`** — da esta etiqueta a todos los términos
- **`.tagSafe(tag, reason?)`** — aplica la etiqueta solo si es compatible con las actuales
- **`.unTag(tag, reason?)`** — quita esta etiqueta de los términos
- **`.canBe(tag)`** — devuelve solo los términos que pueden llevar esta etiqueta

### Caché

- **`.cache(options?)`** — congela el estado actual del documento, para ganar velocidad
- **`.uncache(options?)`** — libera el estado del documento, para que se pueda transformar
- **`.freeze()`** — impide que se quiten las etiquetas actuales
- **`.unfreeze()`** — permite cambiar las etiquetas actuales [por defecto]

### Listas de palabras

- **`.lookup(trie, opts?)`** — búsqueda rápida de una lista de palabras
- **`.autoFill()`** — completa los comienzos de palabra, según el diccionario de autocompletado

<!--
## Métodos del etiquetador

- **`.confidence()`** — medida media de la confianza en las etiquetas
- **`.swap(fromLemma, toLemma, guardTag?)`** — sustituye de forma inteligente las formas de una raíz
-->

## Selecciones

Las selecciones son búsquedas ya preparadas, como `.verbs()` o `.numbers()`, que devuelven una vista con métodos adicionales propios.
Se escriben para cada idioma, así que las disponibles aquí no son las mismas que en inglés.

### `.nouns()`

- **`.nouns()`** — devuelve los sustantivos del documento
- **`.nouns().conjugate()`** — da el singular y el plural de cada sustantivo
- **`.nouns().isPlural()`** — devuelve solo los sustantivos en plural
- **`.nouns().toPlural()`** — pone los sustantivos en plural
- **`.nouns().toSingular()`** — pone los sustantivos en singular

### `.verbs()`

- **`.verbs()`** — devuelve los verbos del documento
- **`.verbs().conjugate()`** — da todas las conjugaciones de cada verbo

### `.adjectives()`

- **`.adjectives()`** — devuelve los adjetivos del documento
- **`.adjectives().conjugate()`** — da el masculino, el femenino y los plurales de cada adjetivo

### `.numbers()`

- **`.numbers()`** — devuelve los números, escritos con cifras o con palabras
- **`.values()`** — alias de .numbers()
- **`.numbers().get()`** — devuelve el valor numérico de cada número
- **`.numbers().units()`** — devuelve la unidad que sigue a cada número
- **`.numbers().toNumber()`** — escribe los números con cifras (`40`)
- **`.numbers().toText()`** — escribe los números con palabras (`cuarenta`)
- **`.numbers().toCardinal()`** — los convierte en números cardinales (`cuarenta`)
- **`.numbers().toOrdinal()`** — los convierte en números ordinales (`cuadragésimo`)
- **`.numbers().isCardinal()`** — devuelve solo los números cardinales
- **`.numbers().isOrdinal()`** — devuelve solo los números ordinales
- **`.numbers().isEqual(n)`** — devuelve solo los números iguales a n
- **`.numbers().greaterThan(n)`** — devuelve solo los números mayores que n
- **`.numbers().lessThan(n)`** — devuelve solo los números menores que n
- **`.numbers().between(min, max)`** — devuelve solo los números entre min y max
- **`.numbers().set(n)`** — sustituye cada número por n
- **`.numbers().add(n)`** — suma n a cada número
- **`.numbers().subtract(n)`** — resta n a cada número
- **`.numbers().increment()`** — suma 1 a cada número
- **`.numbers().decrement()`** — resta 1 a cada número

## Métodos del constructor

_(se llaman sobre el objeto `nlp` importado, no sobre una vista)_

- **`nlp.tokenize(text, lexicon?)`** — analiza el texto sin ejecutar el etiquetador
<!-- - **`nlp.lazy(text, match?)`** — recorre el texto con un análisis mínimo -->
- **`nlp.plugin(plugin)`** — incorpora un plugin de compromise
- **`nlp.extend(plugin)`** — alias de nlp.plugin()
- **`nlp.addWords(words, isFrozen?)`** — añade palabras nuevas al léxico interno
- **`nlp.addTags(tags)`** — añade etiquetas nuevas al conjunto de etiquetas
- **`nlp.parseMatch(match, opts?)`** — convierte un patrón en json
- **`nlp.buildNet(matches)`** — compila un conjunto de patrones en una forma más rápida, para .sweep()
- **`nlp.buildTrie(words)`** — compila una lista de palabras en una forma más rápida, para .lookup()
- **`nlp.typeahead(words)`** — añade palabras al diccionario de autocompletado
- **`nlp.world()`** — acceso a los datos internos de la biblioteca
- **`nlp.model()`** — acceso a los datos lingüísticos de la biblioteca
- **`nlp.methods()`** — acceso a los métodos internos de la biblioteca
- **`nlp.hooks()`** — qué funciones compute se ejecutan automáticamente
- **`nlp.verbose(toLog?)`** — muestra las decisiones del etiquetador, para depurar
- **`nlp.version`** — la versión semver actual de la biblioteca
