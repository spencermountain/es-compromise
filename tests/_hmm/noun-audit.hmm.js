import test from 'tape'
import nlp from '../_lib.js'
import list from '../unit/nouns/_audit.js'
const here = '[es-noun-audit-hmm] '

// phrases marked with a '*' in _audit.js - they inflect properly as bare words, but not after their article,
// because the tagger does not find the noun.
//  - 'el segundo', 'el cuarto' - an Ordinal first ('el cuarto piso'), and a second, or a room, after that
//  - 'el millón', 'los millones' - a Cardinal, which .numbers() wants - not a noun to inflect
//  - 'la paz' - the lexicon has 'la paz' as a City, and does not ask for its capital letters
test('noun audit, tagging:', function (t) {
  list.forEach((o) => {
    const want = [{ singular: o.singular.noun, plural: o.plural.noun }]
    ;[o.singular, o.plural].filter((p) => p.hmm).forEach((p) => {
      t.deepEqual(nlp(p.str).nouns().conjugate(), want, here + p.str)
    })
  })
  t.end()
})

// articles that the nouns leave behind
test('noun articles:', function (t) {
  const arr = [
    // demonstratives are not checked for a verb-form, like the articles are - 'libro' is 'librar'
    ['este libro', 'estos libros'],
    // adjectives, and verbs, do not follow their noun
    ['la casa roja', 'las casas rojas'],
    ['el gato come', 'los gatos comen'],
  ]
  arr.forEach((a) => {
    const doc = nlp(a[0])
    doc.nouns().toPlural()
    t.equal(doc.text(), a[1], here + a[0])
  })
  t.end()
})

// 'la' before an '-ar' verb-form, and then a preposition - 'la toma de la ciudad', but 'la toma con agua'
test('article or clitic:', function (t) {
  const arr = ['la cuenta a todos', 'la toma con agua', 'la lleva a la escuela']
  arr.forEach((str) => {
    t.ok(nlp(str).has('^#Pronoun #Verb'), here + str)
  })
  // a '-tú' form with no subject, and no other verb - 'las compras de hoy', but 'los compras en la tienda'
  t.ok(nlp('las pintas en la pared').has('^#Pronoun #Verb'), here + 'las pintas en la pared')
  // 'manos' is an adjective in the lexicon, and 'limpias' a verb
  t.ok(nlp('las manos limpias').has('#Determiner #Noun #Adjective'), here + 'las manos limpias')
  t.end()
})
