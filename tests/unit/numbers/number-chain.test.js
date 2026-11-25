import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-chain] '
nlp.verbose(false)

test('chained number changes:', function (t) {
  let doc = nlp('tengo cinco gatos negros')
  t.deepEqual(doc.numbers().add(2).get(), [7], here + 'add get')
  t.equal(doc.text(), 'tengo siete gatos negros', here + 'add text')

  doc = nlp('tengo cinco gatos negros')
  t.deepEqual(doc.numbers().add(2).add(1).get(), [8], here + 'add add')
  t.equal(doc.text(), 'tengo ocho gatos negros', here + 'add add text')

  doc = nlp('tengo cinco gatos negros')
  t.deepEqual(doc.numbers().set(10).get(), [10], here + 'set get')
  t.deepEqual(doc.numbers().increment().get(), [11], here + 'increment get')
  t.deepEqual(doc.numbers().decrement().subtract(3).get(), [7], here + 'decrement subtract')
  t.equal(doc.text(), 'tengo siete gatos negros', here + 'set text')

  doc = nlp('tengo cinco gatos negros')
  t.deepEqual(doc.numbers().toNumber().toText().get(), [5], here + 'toNumber toText')
  t.equal(doc.text(), 'tengo cinco gatos negros', here + 'toNumber toText text')
  t.deepEqual(doc.numbers().toText().toNumber().get(), [5], here + 'toText toNumber')
  t.equal(doc.text(), 'tengo 5 gatos negros', here + 'toText toNumber text')

  doc = nlp('diecisiete gatos')
  t.deepEqual(doc.numbers().toOrdinal().get(), [17], here + 'toOrdinal get')
  t.equal(doc.text(), 'decimoséptimo gatos', here + 'toOrdinal text')
  t.deepEqual(doc.numbers().toCardinal().get(), [17], here + 'toCardinal get')
  t.equal(doc.text(), 'diecisiete gatos', here + 'toCardinal text')
  t.end()
})

// a change in the length of a number must not move the view off of it
test('number view follows its changes:', function (t) {
  let doc = nlp('tengo cinco gatos negros')
  let m = doc.numbers()
  m.set(31)
  t.equal(doc.text(), 'tengo treinta y un gatos negros', here + 'longer')
  t.deepEqual(m.get(), [31], here + 'longer get')
  t.equal(m.text(), 'treinta y un', here + 'longer view')
  m.add(69)
  t.equal(doc.text(), 'tengo cien gatos negros', here + 'shorter')
  t.deepEqual(m.get(), [100], here + 'shorter get')
  m.toNumber()
  t.equal(doc.text(), 'tengo 100 gatos negros', here + 'numeric')
  m.increment()
  t.equal(doc.text(), 'tengo 101 gatos negros', here + 'numeric increment')
  m.toText()
  t.equal(doc.text(), 'tengo ciento un gatos negros', here + 'text again')
  t.deepEqual(m.get(), [101], here + 'text again get')
  t.equal(m.length, 1, here + 'still one number')

  // two numbers in one sentence
  doc = nlp('noventa y nueve globos y tres gatos')
  m = doc.numbers()
  t.deepEqual(m.add(1).get(), [100, 4], here + 'two add')
  t.deepEqual(m.get(), [100, 4], here + 'two original view')
  t.equal(doc.text(), 'cien globos y cuatro gatos', here + 'two text')
  t.deepEqual(m.add(21).get(), [121, 25], here + 'two add again')
  t.equal(doc.text(), 'ciento veintiún globos y veinticinco gatos', here + 'two text again')
  t.deepEqual(m.toNumber().get(), [121, 25], here + 'two toNumber')
  t.equal(doc.text(), '121 globos y 25 gatos', here + 'two numeric text')
  t.equal(m.length, 2, here + 'still two numbers')
  t.end()
})

// the new words are found as a number again
test('changed number is re-tagged:', function (t) {
  const bad = []
  for (let n = 0; n <= 130; n += 1) {
    const doc = nlp('tengo cinco gatos')
    doc.numbers().set(n)
    if (doc.numbers().get()[0] !== n || doc.numbers().length !== 1) {
      bad.push(n)
    }
  }
  t.deepEqual(bad, [], here + 'set 0-130, before a noun')
  const doc = nlp('tengo cinco gatos')
  doc.numbers().set(31)
  t.equal(doc.match('#Value+').text(), 'treinta y un', here + 'y un is a value')
  doc.numbers().toOrdinal()
  t.equal(doc.text(), 'tengo trigésimo primero gatos', here + 'ordinal text')
  t.equal(doc.match('#Ordinal+').text(), 'trigésimo primero', here + 'both words are ordinal')
  t.deepEqual(doc.numbers().get(), [31], here + 'ordinal get')
  // other tags are kept
  const money = nlp('cinco euros')
  money.numbers().add(2)
  t.equal(money.text(), 'siete euros', here + 'money text')
  t.equal(money.has('#Money'), true, here + 'money tag is kept')
  t.end()
})

test('punctuation is kept:', function (t) {
  const arr = [
    ['uno, dos y tres.', '1, 2 y 3.'],
    ['¿siete? ¡ocho!', '¿7? ¡8!'],
    ['"seis" o (-5)', '"6" o (-5)'],
    ['Cinco gatos', '5 gatos'],
  ]
  arr.forEach(a => {
    const doc = nlp(a[0])
    doc.numbers().toNumber()
    t.equal(doc.text(), a[1], here + a[0])
  })
  const doc = nlp('1, 2 y 3. ¿7?')
  doc.numbers().toText()
  t.equal(doc.text(), 'uno, dos y tres. ¿siete?', here + 'toText')
  t.end()
})
