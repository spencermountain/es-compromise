import test from 'tape'
import nlp from '../../_lib.js'
const here = '[como] '

test("'como' as a verb:", function (t) {
  const isVerb = [
    'como pan',
    'Como pan todos los días.',
    'como una manzana',
    'como el pan',
    'como dos huevos',
    'como en casa',
    'no como carne',
    'nunca como',
    'no como mucho',
    'siempre como tarde',
    'hoy como pescado',
    'ya como solo',
    'como y bebo',
    'bebo y como',
    'yo como pan',
  ]
  isVerb.forEach(function (str) {
    const doc = nlp(str).compute('root')
    const m = doc.match('como')
    t.equal(m.has('(#PresentTense && #FirstPerson)'), true, here + `'${str}' is a verb`)
    t.equal(m.has('{comer}'), true, here + `'${str}' is comer`)
  })
  const isNot = [
    'como siempre',
    'como tú',
    'como si nada',
    'como mucho',
    'como resultado',
    'así como',
    'es tan alto como su padre',
    'trabajo como médico',
    'tal como dijo',
    'corre como un loco',
    'lo hizo como siempre',
    'habla como su madre',
  ]
  isNot.forEach(function (str) {
    t.equal(nlp(str).match('como').has('#Verb'), false, here + `'${str}' is not a verb`)
  })
  t.end()
})

test("'como' changes tense:", function (t) {
  const arr = [
    ['como pan', 'toPastTense', 'comí pan'],
    ['Como pan todos los días.', 'toPastTense', 'Comí pan todos los días.'],
    ['no como carne', 'toFutureTense', 'no comeré carne'],
    ['como y bebo', 'toPastTense', 'comí y bebí'],
    ['como siempre', 'toPastTense', 'como siempre'],
    ['es tan alto como su padre', 'toPastTense', 'fue tan alto como su padre'],
  ]
  arr.forEach(function (a) {
    const [str, fn, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}'`)
  })
  t.end()
})
