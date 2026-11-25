import test from 'tape'
import nlp from '../_lib.js'
const here = '[es-numbers-hmm] '

const run = function (str, fn) {
  const doc = nlp(str)
  fn(doc.numbers())
  return doc.text()
}

// a number takes the gender of its noun - but the tagger's gender of a plural noun is not good enough to use
// ('días' is a FemaleNoun, 'mujeres' a MaleNoun, and 'casas' is a verb after a number) - so only a singular is followed
test('gender of the counted noun:', function (t) {
  const arr = [
    ['tengo 21 casas', 'tengo veintiuna casas'],
    ['hay 200 personas', 'hay doscientas personas'],
    ['hay 300 mujeres', 'hay trescientas mujeres'],
    ['hay 31 semanas', 'hay treinta y una semanas'],
    ['hay 500000 personas', 'hay quinientas mil personas'],
  ]
  arr.forEach(a => {
    t.equal(run(a[0], m => m.toText()), a[1], here + a[0])
  })
  // and the gender that was written is lost, by way of digits
  t.equal(run('doscientas casas', m => m.toNumber().toText()), 'doscientas casas', here + 'doscientas, both ways')
  t.end()
})

// the noun does not follow its number
test('number of the counted noun:', function (t) {
  t.equal(run('un gato', m => m.add(1)), 'dos gatos', here + 'un gato + 1')
  t.equal(run('1 casa', m => m.add(1)), '2 casas', here + '1 casa + 1')
  t.equal(run('dos gatos', m => m.set(1)), 'un gato', here + 'dos gatos = 1')
  t.end()
})

// the ordinal is short before a masculine noun - but 'piso' is a verb here ('yo piso'), so nothing says there is a noun
test('apocope before an untagged noun:', function (t) {
  t.equal(run('el segundo piso', m => m.add(1)), 'el tercer piso', here + 'tercer piso')
  t.equal(run('el 1 piso', m => m.toText().toOrdinal()), 'el primer piso', here + 'primer piso')
  t.end()
})

// a decimal has words - 'tres coma cinco' is read, but it is not written
test('decimals in words:', function (t) {
  t.equal(run('3,5', m => m.toText()), 'tres coma cinco', here + '3,5 toText')
  t.equal(run('tres coma cinco', m => m.add(1)), 'cuatro coma cinco', here + 'tres coma cinco + 1')
  t.equal(run('dos y medio', m => m.toNumber()), '2,5', here + 'dos y medio toNumber')
  t.equal(run('tres cuartos', m => m.toNumber()), '0,75', here + 'tres cuartos toNumber')
  t.end()
})

// ordinals in words stop at 1999 - 'dosmilésimo' and the rest are not written
test('large ordinals:', function (t) {
  t.equal(run('dos mil', m => m.toOrdinal()), 'dosmilésimo', here + 'dos mil')
  t.deepEqual(nlp('dosmilésimo').numbers().get(), [2000], here + 'dosmilésimo')
  t.end()
})

// plural ordinals are adjectives - 'los primeros días', 'las primeras veces'
test('plural ordinals:', function (t) {
  t.deepEqual(nlp('los primeros días').numbers().get(), [1], here + 'primeros')
  t.deepEqual(nlp('las terceras partes').numbers().get(), [3], here + 'terceras')
  t.end()
})

// a range is three terms - '3', 'to' and '4' - and only the first one is read
test('number ranges:', function (t) {
  t.deepEqual(nlp('3-4').numbers().get(), [3, 4], here + '3-4')
  t.end()
})

// one word at a time - a second 'millones' is not looked-ahead for
test('two numbers with the same multiple:', function (t) {
  t.deepEqual(nlp('dos millones tres millones').numbers().get(), [2e6, 3e6], here + 'dos millones tres millones')
  t.end()
})

// the string argument of .set() is javascript's - '1.000' is 1, though the text '1.000' is a thousand
test('grouped digits as an argument:', function (t) {
  t.equal(run('5', m => m.set('1.000')), '1000', here + `set('1.000')`)
  t.end()
})

// more fraction-words would be guesses - 'un cuarto' is also a room, 'un quinto' a conscript, 'un décimo' a lottery ticket
test('singular fractions:', function (t) {
  t.deepEqual(nlp('un cuarto de litro').numbers().get(), [0.25], here + 'un cuarto de litro')
  t.deepEqual(nlp('la mitad').numbers().get(), [0.5], here + 'la mitad')
  t.end()
})
