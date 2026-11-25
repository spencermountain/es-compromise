import test from 'tape'
import nlp from '../../_lib.js'
const here = '[homograph-verb] '

test('verbs that are also nouns:', function (t) {
  const arr = [
    ['Juego al fútbol.', 'juego', 'jugar'],
    ['Ella cierra la puerta.', 'cierra', 'cerrar'],
    ['Vino mañana.', 'vino', 'venir'],
    ['Dice que vino mañana.', 'vino', 'venir'],
    ['No sé si vino', 'vino', 'venir'],
    ['no vino', 'vino', 'venir'],
    ['Vivo en Madrid.', 'vivo', 'vivir'],
    ['Trabajo mucho.', 'trabajo', 'trabajar'],
    ['Camino a casa.', 'camino', 'caminar'],
    ['Trabajo de día y estudio de noche.', 'trabajo', 'trabajar'],
  ]
  arr.forEach(function (a) {
    const [str, word, root] = a
    const m = nlp(str).compute('root').match(word)
    t.equal(m.has('#Verb'), true, here + `'${str}' - ${word} is a verb`)
    t.equal(m.has(`{${root}}`), true, here + `'${str}' - ${word} is ${root}`)
  })
  // .. and still nouns
  const not = [
    ['El vino tinto.', 'vino'],
    ['Vino y queso.', 'vino'],
    ['Un juego de mesa.', 'juego'],
    ['Juego de tronos', 'juego'],
    ['Trabajo de equipo.', 'trabajo'],
    ['El camino a casa.', 'camino'],
    ['el trabajo es duro', 'trabajo'],
    ['el vino que traes es bueno', 'vino'],
    ['más alto que bajo', 'bajo'],
    ['dice que nada importa', 'nada'],
    ['yo vino', 'vino'],
    ['que vino tan bueno', 'vino'],
    ['Que trabajo más duro!', 'trabajo'],
  ]
  not.forEach(function (a) {
    const [str, word] = a
    t.equal(nlp(str).match(word).has('#Verb'), false, here + `'${str}' - ${word} is no verb`)
  })
  t.end()
})

test('names with an accent:', function (t) {
  const doc = nlp('María canta una canción.')
  t.equal(doc.has('^#FemaleName #PresentTense'), true, here + 'María is a name')
  t.equal(nlp('María').has('#Verb'), false, here + 'María is no verb')
  doc.verbs().toPastTense()
  t.equal(doc.text(), 'María cantó una canción.', here + 'María cantó')
  t.end()
})

test('the models give some verbs a reflexive root:', function (t) {
  const arr = [
    ['Llovió mucho en abril.', 'toPresentTense', 'Llueve mucho en abril.'],
    ['Te llamé más tarde.', 'toPresentTense', 'Te llamo más tarde.'],
    ['Llueve mucho.', 'toFutureTense', 'Lloverá mucho.'],
    ['¿Cómo te llamas?', 'toPastTense', '¿Cómo te llamaste?'],
  ]
  arr.forEach(function (a) {
    const [str, fn, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}'`)
  })
  t.equal(nlp('llovió').compute('root').has('{llover}'), true, here + 'llovió root')
  t.end()
})

test('second batch:', function (t) {
  const arr = [
    ['Pago la cuenta.', 'toPastTense', 'Pagué la cuenta.'],
    ['Me visto rápido.', 'toFutureTense', 'Me vestiré rápido.'],
    ['La mujer que canta es mi tía.', 'toPastTense', 'La mujer que cantó fue mi tía.'],
    ['Donde vivo, nieva mucho.', 'toPastTense', 'Donde viví, nevó mucho.'],
    ['Dejan de fumar.', 'toFutureTense', 'Dejarán de fumar.'],
    ['Nevó mucho.', 'toPresentTense', 'Nieva mucho.'],
  ]
  arr.forEach(function (a) {
    const [str, fn, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}'`)
  })
  t.equal(nlp('es mi tía').match('tía').has('#Noun'), true, here + 'tía is a noun')
  t.equal(nlp('me he visto').match('visto').has('#Perfecto'), true, here + 'he visto is a participle')
  t.equal(nlp('el pago de la cuenta').match('pago').has('#Noun'), true, here + 'el pago')
  t.end()
})
