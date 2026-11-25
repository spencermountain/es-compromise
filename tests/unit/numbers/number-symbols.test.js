import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-symbols] '
nlp.verbose(false)

const run = function (str, fn) {
  const doc = nlp(str)
  fn(doc.numbers())
  return doc.text()
}

// a symbol is never left stuck to a word - 'cincuenta%'
test('percent toText:', function (t) {
  const doc = nlp('50%')
  doc.numbers().toText()
  t.equal(doc.text(), 'cincuenta por ciento', here + '50% toText')
  t.deepEqual(doc.numbers().get(), [50], here + 'value')
  t.equal(doc.numbers().length, 1, here + 'one number')
  t.equal(doc.has('#Percent'), true, here + 'percent')
  t.deepEqual(doc.numbers().units().out('array'), ['por ciento'], here + 'unit')
  // and back - with a space before the symbol
  doc.numbers().toNumber()
  t.equal(doc.text(), '50 %', here + 'toNumber')
  t.deepEqual(doc.numbers().get(), [50], here + 'value, again')
  t.equal(doc.has('#Percent'), true, here + 'percent, again')
  t.deepEqual(doc.numbers().units().out('array'), ['%'], here + 'unit, again')
  doc.numbers().toText()
  t.equal(doc.text(), 'cincuenta por ciento', here + '50 % toText')
  t.end()
})

test('por ciento:', function (t) {
  const arr = [
    ['cincuenta por ciento', 50],
    ['el veinticinco por ciento de la gente', 25],
    ['cien por ciento', 100],
    ['cien por cien', 100],
    ['un por ciento', 1],
    ['50 por ciento', 50],
    ['50 %', 50],
    ['12,5 %', 12.5],
    ['50%', 50],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.equal(m.length, 1, here + 'one number: ' + a[0])
    t.equal(m.get()[0], a[1], here + 'value: ' + a[0])
    t.equal(m.has('#Percent'), true, here + 'percent: ' + a[0])
  })
  t.equal(nlp('trabaja por cien euros').has('#Percent'), false, here + 'por cien euros')
  t.end()
})

test('symbol toText:', function (t) {
  const arr = [
    ['50%', 'cincuenta por ciento', 50],
    ['50 %', 'cincuenta por ciento', 50],
    ['1%', 'uno por ciento', 1],
    ['100%', 'cien por ciento', 100],
    ['tiene un 50% de descuento', 'tiene un cincuenta por ciento de descuento', 50],
    ['bajó -5% ayer', 'bajó menos cinco por ciento ayer', -5],
    // money
    ['5€', 'cinco euros', 5],
    ['€5', 'cinco euros', 5],
    ['5 €', 'cinco euros', 5],
    ['5 euros', 'cinco euros', 5],
    ['1€', 'un euro', 1],
    ['€1', 'un euro', 1],
    ['1 euro', 'un euro', 1],
    ['21€', 'veintiún euros', 21],
    ['31€', 'treinta y un euros', 31],
    ['100€', 'cien euros', 100],
    ['1.000 €', 'mil euros', 1000],
    ['1000000€', 'un millón de euros', 1e6],
    ['2.000.000 €', 'dos millones de euros', 2e6],
    ['1200000€', 'un millón doscientos mil euros', 1200000],
    ['$5', 'cinco dólares', 5],
    ['$1', 'un dólar', 1],
    ['£5', 'cinco libras', 5],
    ['£1', 'una libra', 1],
    ['£21', 'veintiuna libras', 21],
    ['pagó 5€ ayer.', 'pagó cinco euros ayer.', 5],
    // a unit with no words gets a space
    ['5km', 'cinco km', 5],
    ['5kg', 'cinco kg', 5],
    ['5Kg', 'cinco Kg', 5],
    ['corre 5km cada día', 'corre cinco km cada día', 5],
    ['5 km', 'cinco km', 5],
    ['1km', 'un km', 1],
    // no words for these
    ['#5', '#5', 5],
    ['5,50€', '5,50€', 5.5],
    ['3,5km', '3,5km', 3.5],
    ['+5', '+cinco', 5],
  ]
  arr.forEach(a => {
    const [str, want, num] = a
    const doc = nlp(str)
    const m = doc.numbers().toText()
    t.equal(doc.text(), want, here + str)
    // the same view still has the number
    t.deepEqual(m.get(), [num], here + str + ' chained value')
    // the new text is still a number
    t.deepEqual(doc.numbers().get(), [num], here + str + ' value')
    t.deepEqual(nlp(want).numbers().get(), [num], here + want + ' parses')
  })
  t.end()
})

test('symbol round-trip:', function (t) {
  const arr = [
    ['50%', '50 %', 50],
    ['50 %', '50 %', 50],
    ['cincuenta por ciento', '50 %', 50],
    ['5€', '5 euros', 5],
    ['€5', '5 euros', 5],
    ['5 €', '5 euros', 5],
    ['1€', '1 euro', 1],
    ['$5', '5 dólares', 5],
    ['1000000€', '1000000 euros', 1e6],
    ['dos millones de euros', '2000000 euros', 2e6],
    ['un millón de personas', '1000000 personas', 1e6],
    ['5km', '5 km', 5],
    ['5kg', '5 kg', 5],
  ]
  arr.forEach(a => {
    const [str, want, num] = a
    const doc = nlp(str)
    const m = doc.numbers().toText().toNumber()
    t.equal(doc.text(), want, here + str)
    t.deepEqual(m.get(), [num], here + str + ' chained value')
    t.deepEqual(doc.numbers().get(), [num], here + str + ' value')
  })
  // the role of the number is kept
  let doc = nlp('50%')
  doc.numbers().toText().toNumber()
  t.equal(doc.has('#Percent'), true, here + 'percent')
  doc = nlp('€5')
  doc.numbers().toText()
  t.equal(doc.has('#Money'), true, here + 'money')
  t.equal(doc.has('#Currency'), true, here + 'currency')
  doc.numbers().toNumber()
  t.equal(doc.has('#Money'), true, here + 'money, again')
  doc = nlp('5km')
  t.deepEqual(doc.numbers().toText().units().out('array'), ['km'], here + 'km unit')
  // a number that is already written is left alone
  t.equal(run('5 euros', m => m.toNumber()), '5 euros', here + '5 euros')
  t.equal(run('cinco euros', m => m.toNumber()), '5 euros', here + 'cinco euros')
  t.equal(run('cinco euros', m => m.toText()), 'cinco euros', here + 'cinco euros toText')
  t.equal(run('5%', m => m.toNumber()), '5%', here + '5% toNumber')
  // 'de' comes and goes with the millions
  t.equal(run('2000000 personas', m => m.toText()), 'dos millones de personas', here + 'de personas')
  t.equal(run('2000001 personas', m => m.toText()), 'dos millones un personas', here + 'no de')
  t.equal(run('dos millones de euros', m => m.add(500000)), 'dos millones quinientos mil euros', here + 'de is dropped')
  t.equal(run('dos millones quinientos mil euros', m => m.add(500000)), 'tres millones de euros', here + 'de is added')
  t.equal(run('dos millones', m => m.toNumber().toText()), 'dos millones', here + 'no de without a noun')
  t.end()
})

test('symbol math:', function (t) {
  const arr = [
    // [str, add(1), set(7), subtract(2)]
    ['50%', '51%', '7%', '48%'],
    ['50 %', '51 %', '7 %', '48 %'],
    ['5€', '6€', '7€', '3€'],
    ['€5', '€6', '€7', '€3'],
    ['5 €', '6 €', '7 €', '3 €'],
    ['$5', '$6', '$7', '$3'],
    ['5 euros', '6 euros', '7 euros', '3 euros'],
    ['5km', '6km', '7km', '3km'],
    ['5kg', '6kg', '7kg', '3kg'],
    ['5Kg', '6Kg', '7Kg', '3Kg'],
    ['3,5km', '4,5km', '7km', '1,5km'],
    ['5,30€', '6,3€', '7€', '3,3€'],
    ['bajó -5% ayer', 'bajó -4% ayer', 'bajó 7% ayer', 'bajó -7% ayer'],
    ['+5%', '+6%', '+7%', '+3%'],
    ['cincuenta por ciento', 'cincuenta y uno por ciento', 'siete por ciento', 'cuarenta y ocho por ciento'],
    ['cinco euros', 'seis euros', 'siete euros', 'tres euros'],
    ['un euro', 'dos euros', 'siete euros', 'menos un euro'],
    ['tres euros', 'cuatro euros', 'siete euros', 'un euro'],
    ['veinte euros', 'veintiún euros', 'siete euros', 'dieciocho euros'],
  ]
  arr.forEach(a => {
    const [str, add, set, minus] = a
    t.equal(run(str, m => m.add(1)), add, here + str + ' add')
    t.equal(run(str, m => m.increment()), add, here + str + ' increment')
    t.equal(run(str, m => m.set(7)), set, here + str + ' set')
    t.equal(run(str, m => m.subtract(2)), minus, here + str + ' subtract')
    // the value follows
    const before = nlp(str).numbers().get()[0]
    const doc = nlp(str)
    t.deepEqual(doc.numbers().add(1).get(), [before + 1], here + str + ' chained value')
    t.deepEqual(doc.numbers().get(), [before + 1], here + str + ' value')
  })
  // the unit agrees
  t.equal(run('5€', m => m.toText().set(1)), 'un euro', here + 'singular')
  t.equal(run('1€', m => m.toText().add(1)), 'dos euros', here + 'plural')
  // a negative number past zero
  t.equal(run('bajó -5% ayer', m => m.add(10)), 'bajó 5% ayer', here + '-5% + 10')
  t.equal(run('subió 5% ayer', m => m.subtract(10)), 'subió -5% ayer', here + '5% - 10')
  // tags are kept
  let doc = nlp('50%')
  doc.numbers().add(1)
  t.equal(doc.has('#Percent'), true, here + 'percent')
  doc = nlp('5km')
  doc.numbers().add(1)
  t.equal(doc.has('#Unit'), true, here + '6km unit')
  t.equal(doc.terms().length, 2, here + '6km is still split')
  t.end()
})

test('symbol ordinals:', function (t) {
  // an amount has no ordinal
  const arr = ['50%', '50 %', 'cincuenta por ciento', '5€', '€5', '5 €', '1€', '$5', 'cinco euros', '5km', '5kg']
  arr.forEach(str => {
    t.equal(run(str, m => m.toOrdinal()), str, here + str + ' toOrdinal')
    t.equal(run(str, m => m.toCardinal()), str, here + str + ' toCardinal')
  })
  t.end()
})

test('symbols in a sentence:', function (t) {
  const doc = nlp('paga 5€ por el 50% de 3km, o sea $7.')
  const m = doc.numbers()
  t.deepEqual(m.toText().get(), [5, 50, 3, 7], here + 'toText values')
  t.equal(doc.text(), 'paga cinco euros por el cincuenta por ciento de tres km, o sea siete dólares.', here + 'toText')
  t.deepEqual(m.add(1).get(), [6, 51, 4, 8], here + 'add values')
  t.equal(doc.text(), 'paga seis euros por el cincuenta y uno por ciento de cuatro km, o sea ocho dólares.', here + 'add')
  t.deepEqual(m.toNumber().get(), [6, 51, 4, 8], here + 'toNumber values')
  t.equal(doc.text(), 'paga 6 euros por el 51 % de 4 km, o sea 8 dólares.', here + 'toNumber')
  t.equal(m.length, 4, here + 'still four numbers')
  t.end()
})
