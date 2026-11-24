# es-compromise

`es-compromise` es una biblioteca de JavaScript para analizar texto en español.

Divide el texto en oraciones y palabras, y asigna a cada palabra una etiqueta con su categoría gramatical.
Después se pueden seleccionar partes del documento, de forma parecida a una expresión regular, o transformarlas.

La biblioteca es lo bastante pequeña para funcionar en el navegador, funciona sin conexión y no tiene dependencias.
Se basa en reglas y es configurable. Toma decisiones rápidas y «suficientemente buenas», y no usa un modelo neuronal.

Es una versión en español de la [biblioteca original en inglés](https://github.com/spencermountain/compromise/).

```bash
npm install es-compromise
```

```js
import nlp from 'es-compromise'

const doc = nlp('Ella vende conchas en la playa.')
doc.match('#Verbo').text() // 'vende'
```

o en el navegador:

```html
<script src="https://unpkg.com/es-compromise"></script>
```

### Documentación

- [Conjunto de etiquetas](./tagset.md)
- [Sintaxis de patrones](./match.md)
- [API](./api.md)
- [Contribuir](./contributing.md)

### Cómo funciona

El texto se divide en una lista de oraciones, y cada oración en una lista de términos:

```
Sentence [
  Term { text: 'Ella', pre: '', post: ' ', normal: 'ella', tags: ['Noun', 'Pronoun'] },
  Term { text: 'vende', pre: '', post: ' ', normal: 'vende', tags: ['Verb', 'PresentTense', 'ThirdPerson'] },
  ...
]
```

- `text` es la palabra tal como se escribió
- `pre` y `post` son los espacios y la puntuación que la rodean
- `normal` es una versión limpia, que se usa para las búsquedas
- `tags` son sus [etiquetas gramaticales](./tagset.md)

Estos datos se obtienen con `.json()`:

```js
const doc = nlp('Ella vende conchas en la playa.')
doc.json()
// [{ terms: [{ text: 'Ella', tags: ['Noun', 'Pronoun'], ... }, ...] }]
```

### Buscar

Para seleccionar partes del documento, usa `.match()`:

```js
const doc = nlp('Ella vende conchas en la playa.')
const m = doc.match('#Pronombre vende .')
m.text() // 'Ella vende conchas'
m.json() // [{ text: 'Ella vende conchas', terms: [...] }]

doc.has('#Verbo #Sustantivo') // true
doc.match('#Sustantivo').out('array') // ['Ella', 'conchas', 'playa.']
```

Consulta la [sintaxis de patrones](./match.md) para ver todo lo que puede hacer un patrón, y el [conjunto de etiquetas](./tagset.md) para la lista de etiquetas admitidas.

### Transformar

Las partes del documento se pueden transformar, y el cambio se aplica al documento original:

```js
const doc = nlp('Ella vende conchas en la playa.')
doc.match('conchas').replaceWith('trajes de baño')
doc.text() // 'Ella vende trajes de baño en la playa.'
```

También hay selecciones ya preparadas, como `.verbs()`, `.nouns()` y `.numbers()`, que tienen sus propios métodos, como `.conjugate()` o `.add()`:

```js
const doc = nlp('Tengo cuarenta euros.')
doc.numbers().get() // [40]
doc.numbers().add(10)
doc.text() // 'Tengo cincuenta euros.'

nlp('El perro persigue al gato.').nouns().conjugate()
// [{ singular: 'perro', plural: 'perros' }, { singular: 'gato', plural: 'gatos' }]
```

Estas selecciones cambian de un idioma a otro. Consulta la [API](./api.md) para ver las de esta biblioteca.

### Cosas que conviene saber

**Cada método devuelve una vista.** Una vista es una selección de términos del documento. `nlp(texto)` es una vista del documento entero, y `.match()` devuelve una más pequeña. La mayoría de los métodos devuelven una vista, así que se pueden encadenar. Usa `.all()` para volver al documento entero.

**Las transformaciones modifican el propio documento.** La vista que devuelve una transformación es solo la selección, así que el resultado se lee desde el documento original:

```js
const doc = nlp('Ella vende conchas en la playa.')
doc.match('conchas').replaceWith('piedras').text() // 'piedras' (solo la selección)
doc.text() // 'Ella vende piedras en la playa.'
```

Para no tocar el original, trabaja sobre una copia con `.clone()`:

```js
const doc = nlp('Ella vende conchas en la playa.')
const copia = doc.clone()
copia.match('conchas').remove()
copia.text() // 'Ella vende en la playa.'
doc.text() // 'Ella vende conchas en la playa.'
```

**Los patrones no cruzan de una oración a otra.**

```js
nlp('Eso es todo. De vuelta a Winnipeg!').has('todo de') // false
```

**Una etiqueta desconocida no encuentra nada, y no da error.** Si una búsqueda vuelve vacía, comprueba la etiqueta en el [conjunto de etiquetas](./tagset.md), y usa `doc.debug()` para ver cómo se etiquetó cada palabra.

### Configuración

Si una palabra está mal etiquetada, o falta, puedes indicarla tú mismo:

```js
// para un solo documento
nlp('kermit saludó', { kermit: 'Nombre' }).match('#Nombre').text() // 'kermit'

// para todos los documentos
nlp.addWords({ kermit: 'Nombre' })
```

Las etiquetas deben ser del [conjunto de etiquetas](./tagset.md), o añadirse con `nlp.addTags()`.

Un plugin puede añadir palabras, etiquetas y métodos nuevos a la vez:

```js
nlp.plugin({
  words: { kermit: 'Nombre' },
  tags: { Muppet: { isA: 'Persona' } },
  api: (View) => {
    View.prototype.exclamar = function () {
      return this.post('!')
    }
  }
})

const doc = nlp('hola a todos')
doc.match('todos').exclamar()
doc.text() // 'hola a todos!'
```
