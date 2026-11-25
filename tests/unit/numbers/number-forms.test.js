import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-forms] '
nlp.verbose(false)

const get = str => nlp(str).numbers().get()
const run = function (str, fn) {
  const doc = nlp(str)
  fn(doc.numbers())
  return doc.text()
}

test('negatives:', function (t) {
  t.deepEqual(get('-5'), [-5], here + '-5')
  t.deepEqual(get('−5'), [-5], here + 'minus sign')
  t.deepEqual(get('menos cinco'), [-5], here + 'menos cinco')
  t.deepEqual(get('menos 5'), [-5], here + 'menos 5')
  t.deepEqual(get('menos un millón'), [-1e6], here + 'menos un millón')
  t.deepEqual(get('hace menos cinco grados'), [-5], here + 'in a sentence')
  t.equal(nlp('menos cinco').numbers().length, 1, here + 'one number')
  const arr = [
    // [str, toText/toNumber, add(10), set(-3), subtract(2)]
    ['-5', 'menos cinco', '5', '-3', '-7'],
    ['menos cinco', '-5', 'cinco', 'menos tres', 'menos siete'],
    ['tiene -5 aquí', 'tiene menos cinco aquí', 'tiene 5 aquí', 'tiene -3 aquí', 'tiene -7 aquí'],
    ['(-5)', '(menos cinco)', '(5)', '(-3)', '(-7)'],
  ]
  arr.forEach(a => {
    const [str, other, add, set, minus] = a
    t.equal(run(str, m => m.toText().toNumber().toText()), /[0-9]/.test(str) ? other : str, here + str + ' toText')
    t.equal(run(str, m => m.toNumber().toText().toNumber()), /[0-9]/.test(str) ? str : other, here + str + ' toNumber')
    t.equal(run(str, m => m.add(10)), add, here + str + ' add')
    t.equal(run(str, m => m.set(-3)), set, here + str + ' set')
    t.equal(run(str, m => m.subtract(2)), minus, here + str + ' subtract')
  })
  t.equal(run('5', m => m.subtract(10)), '-5', here + 'below zero')
  t.equal(run('cinco', m => m.subtract(10)), 'menos cinco', here + 'below zero, in words')
  t.equal(run('menos cinco', m => m.add(5)), 'cero', here + 'back to zero')
  let doc = nlp('menos cinco')
  t.deepEqual(doc.numbers().subtract(1).add(2).get(), [-4], here + 'chained')
  doc = nlp('-5')
  t.deepEqual(doc.numbers().toText().get(), [-5], here + 'chained toText')
  t.deepEqual(doc.numbers().get(), [-5], here + 'found again')
  t.end()
})

test('decimals and grouping:', function (t) {
  const arr = [
    ['3,5', 3.5],
    ['1.000', 1000],
    ['1.234,56', 1234.56],
    ['1.000.000', 1e6],
    ['1 000', 1000],
    ['0,25', 0.25],
    ['tres coma cinco', 3.5],
    ['cero coma cinco', 0.5],
    ['tres coma catorce', 3.14],
    ['tres coma cero cinco', 3.05],
    ['dos mil coma cinco', 2000.5],
  ]
  arr.forEach(a => {
    t.deepEqual(get(a[0]), [a[1]], here + a[0])
  })
  // math keeps the way it was written
  t.equal(run('1,5', m => m.add(1)), '2,5', here + '1,5 add')
  t.equal(run('1.234', m => m.add(2)), '1.236', here + '1.234 add')
  t.equal(run('1.234,56', m => m.add(1000)), '2.234,56', here + '1.234,56 add')
  t.equal(run('999', m => m.add(1)), '1000', here + 'no new grouping')
  t.equal(run('1.000', m => m.subtract(1)), '999', here + 'under a thousand')
  t.equal(run('0,1', m => m.add(0.2)), '0,3', here + 'no float noise')
  t.equal(run('2,5', m => m.add(0.5)), '3', here + 'to a whole number')
  t.equal(run('1,5', m => m.set(3.25)), '3,25', here + 'set')
  t.equal(run('1,5 litros', m => m.toText()), '1,5 litros', here + 'no words for a decimal')
  t.equal(run('1.000 gatos', m => m.toText()), 'mil gatos', here + '1.000 toText')
  t.equal(run('tres coma cinco', m => m.toNumber()), '3,5', here + 'coma toNumber')
  t.equal(run('tres coma cero cinco', m => m.toNumber()), '3,05', here + 'coma cero toNumber')
  // a comma between two numbers is not 'coma'
  t.deepEqual(get('tres, cinco'), [3, 5], here + 'a list')
  t.equal(nlp('pon una coma').numbers().found, false, here + 'coma is a word')
  t.end()
})

test('text ordinals:', function (t) {
  const arr = [
    ['primero', 1],
    ['primer', 1],
    ['primera', 1],
    ['segundo', 2],
    ['segunda', 2],
    ['tercero', 3],
    ['tercer', 3],
    ['tercera', 3],
    ['cuarto', 4],
    ['quinto', 5],
    ['sexto', 6],
    ['séptimo', 7],
    ['sétimo', 7],
    ['octavo', 8],
    ['noveno', 9],
    ['décimo', 10],
    ['décima', 10],
    ['undécimo', 11],
    ['duodécimo', 12],
    ['decimotercero', 13],
    ['décimo tercero', 13],
    ['vigésimo', 20],
    ['vigésimo primero', 21],
    ['vigésima primera', 21],
    ['trigésimo', 30],
    ['centésimo', 100],
    ['centésimo vigésimo tercero', 123],
    ['milésimo', 1000],
    ['millonésimo', 1e6],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.deepEqual(m.get(), [a[1]], here + a[0])
    t.equal(m.isOrdinal().length, 1, here + a[0] + ' is ordinal')
  })
  t.deepEqual(get('el primer día'), [1], here + 'primer día')
  t.deepEqual(get('la primera vez'), [1], here + 'primera vez')
  t.deepEqual(get('vive en el tercer piso'), [3], here + 'tercer piso')
  t.end()
})

test('numeric ordinals:', function (t) {
  const arr = [
    ['1º', 1],
    ['1.º', 1],
    ['1ª', 1],
    ['1.ª', 1],
    ['1er', 1],
    ['1.er', 1],
    ['2º', 2],
    ['3er', 3],
    ['21º', 21],
    ['100ª', 100],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.deepEqual(m.get(), [a[1]], here + a[0])
    t.equal(m.isOrdinal().length, 1, here + a[0] + ' is ordinal')
    t.equal(nlp(a[0]).terms().length, 1, here + a[0] + ' is one term')
  })
  t.deepEqual(get('el 3er piso'), [3], here + 'in a sentence')
  t.end()
})

test('ordinal conversions:', function (t) {
  const arr = [
    // [str, toCardinal, toNumber]
    ['primero', 'uno', '1º'],
    ['primera', 'una', '1ª'],
    ['el primer día', 'el un día', 'el 1er día'],
    ['la primera vez', 'la una vez', 'la 1ª vez'],
    ['el tercer día', 'el tres día', 'el 3er día'],
    ['la tercera vez', 'la tres vez', 'la 3ª vez'],
    ['segundo', 'dos', '2º'],
    ['décimo', 'diez', '10º'],
    ['undécimo', 'once', '11º'],
    ['vigésimo primero', 'veintiuno', '21º'],
    ['vigésima primera', 'veintiuna', '21ª'],
    ['centésimo', 'cien', '100º'],
  ]
  arr.forEach(a => {
    const [str, card, num] = a
    t.equal(run(str, m => m.toCardinal()), card, here + str + ' toCardinal')
    t.equal(run(str, m => m.toNumber()), num, here + str + ' toNumber')
    // and back again
    t.equal(run(str, m => m.toNumber().toText()), str, here + str + ' toNumber toText')
    t.equal(run(str, m => m.toCardinal().toOrdinal()), str, here + str + ' toCardinal toOrdinal')
    t.equal(run(str, m => m.toOrdinal()), str, here + str + ' toOrdinal')
  })
  const nums = [
    // [str, toText, toCardinal]
    ['1º', 'primero', '1'],
    ['1ª', 'primera', '1'],
    ['1er', 'primer', '1'],
    ['2º', 'segundo', '2'],
    ['3er', 'tercer', '3'],
    ['21ª', 'vigésima primera', '21'],
    ['el 3er piso', 'el tercer piso', 'el 3 piso'],
  ]
  nums.forEach(a => {
    const [str, text, card] = a
    t.equal(run(str, m => m.toText()), text, here + str + ' toText')
    t.equal(run(str, m => m.toCardinal()), card, here + str + ' toCardinal')
    t.equal(run(str, m => m.toText().toNumber()), str, here + str + ' toText toNumber')
  })
  t.equal(run('1.º', m => m.toText()), 'primero', here + '1.º toText')
  t.equal(run('décima', m => m.toNumber()), '10ª', here + 'décima toNumber')
  t.equal(run('10ª', m => m.toText()), 'décima', here + '10ª toText')
  // from a cardinal
  t.equal(run('cinco', m => m.toOrdinal()), 'quinto', here + 'cinco')
  t.equal(run('veintiuno', m => m.toOrdinal()), 'vigésimo primero', here + 'veintiuno')
  t.equal(run('ciento veintitrés', m => m.toOrdinal()), 'centésimo vigésimo tercero', here + '123')
  t.equal(run('5', m => m.toOrdinal()), '5º', here + '5')
  t.equal(run('el 1 día', m => m.toOrdinal()), 'el 1er día', here + '1 día')
  t.equal(run('el 2 día', m => m.toOrdinal()), 'el 2º día', here + '2 día')
  t.equal(run('la 1 vez', m => m.toOrdinal()), 'la 1ª vez', here + '1 vez')
  t.equal(run('el 1 día', m => m.toText().toOrdinal()), 'el primer día', here + 'primer día')
  t.equal(run('la 1 vez', m => m.toText().toOrdinal()), 'la primera vez', here + 'primera vez')
  t.equal(run('el 3 día', m => m.toText().toOrdinal()), 'el tercer día', here + 'tercer día')
  // math
  t.equal(run('el segundo día', m => m.subtract(1)), 'el primer día', here + 'segundo - 1')
  t.equal(run('el segundo día', m => m.add(1)), 'el tercer día', here + 'segundo + 1')
  t.equal(run('la segunda vez', m => m.add(1)), 'la tercera vez', here + 'segunda + 1')
  t.equal(run('el primer día', m => m.add(1)), 'el segundo día', here + 'primer + 1')
  t.equal(run('1.º', m => m.add(1)), '2.º', here + '1.º + 1')
  t.equal(run('2ª', m => m.add(1)), '3ª', here + '2ª + 1')
  t.equal(run('1er', m => m.add(1)), '2º', here + '1er + 1')
  t.equal(run('2º', m => m.add(1)), '3º', here + '2º + 1')
  // no ordinal for these
  t.equal(run('cero', m => m.toOrdinal()), 'cero', here + 'cero')
  t.equal(run('menos cinco', m => m.toOrdinal()), 'menos cinco', here + 'menos cinco')
  t.equal(run('3,5', m => m.toOrdinal()), '3,5', here + '3,5')
  t.equal(run('primero', m => m.subtract(1)), 'primero', here + 'primero - 1')
  t.end()
})

test('fractions:', function (t) {
  const arr = [
    ['1/2', 0.5],
    ['3/4', 0.75],
    ['medio', 0.5],
    ['un medio', 0.5],
    ['un tercio', 1 / 3],
    ['dos tercios', 2 / 3],
    ['tres cuartos', 0.75],
    ['dos quintos', 0.4],
    ['un tercio de los votos', 1 / 3],
    ['tres cuartos de litro', 0.75],
    ['medio litro', 0.5],
    ['medio millón', 500000],
    ['dos y medio', 2.5],
    ['tres y media', 3.5],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.equal(m.length, 1, here + 'one number: ' + a[0])
    t.equal(m.get()[0], a[1], here + a[0])
  })
  // not fractions
  t.deepEqual(get('el cuarto piso'), [4], here + 'el cuarto')
  t.deepEqual(get('un medio de transporte'), [], here + 'un medio de')
  t.deepEqual(get('el medio ambiente'), [], here + 'medio ambiente')
  t.deepEqual(get('en medio de la calle'), [], here + 'en medio de')
  t.deepEqual(get('cinco segundos'), [5], here + 'segundos')
  // nothing sensible to write
  t.equal(run('tres cuartos', m => m.toNumber()), 'tres cuartos', here + 'toNumber')
  t.equal(run('tres cuartos', m => m.toOrdinal()), 'tres cuartos', here + 'toOrdinal')
  t.equal(run('tres cuartos', m => m.add(1)), 'tres cuartos', here + 'add')
  t.equal(run('1/2', m => m.toText()), '1/2', here + 'toText')
  t.equal(run('tres cuartos', m => m.set(5)), 'cinco', here + 'set')
  t.end()
})

// 'un' and 'una' are articles - and a number only inside of one, or before a unit
test('un, una, uno:', function (t) {
  const arr = [
    ['uno', [1]],
    ['tengo uno', [1]],
    ['un gato', []],
    ['una casa', []],
    ['tengo un gato', []],
    ['un día de un mes', []],
    ['un millón', [1e6]],
    ['un billón', [1e12]],
    ['treinta y un días', [31]],
    ['cuarenta y una personas', [41]],
    ['ciento un gatos', [101]],
    ['mil una noches', [1001]],
    ['veintiún gatos', [21]],
    ['veintiuna casas', [21]],
    ['un euro', [1]],
    ['una libra', [1]],
    ['un por ciento', [1]],
    ['un km', [1]],
  ]
  arr.forEach(a => {
    t.deepEqual(get(a[0]), a[1], here + a[0])
  })
  // written before a noun
  t.equal(run('tengo 1 gato', m => m.toText()), 'tengo un gato', here + '1 gato')
  t.equal(run('tengo 1 casa', m => m.toText()), 'tengo una casa', here + '1 casa')
  t.equal(run('tengo 1', m => m.toText()), 'tengo uno', here + '1')
  t.equal(run('tengo 21 gatos', m => m.toText()), 'tengo veintiún gatos', here + '21 gatos')
  t.equal(run('tengo 31 gatos', m => m.toText()), 'tengo treinta y un gatos', here + '31 gatos')
  t.equal(run('el 21 de mayo', m => m.toText()), 'el veintiuno de mayo', here + '21 de mayo')
  t.equal(run('página 21', m => m.toText()), 'página veintiuno', here + 'página 21')
  // and still found, in the same document
  const doc = nlp('tengo 1 gato')
  t.deepEqual(doc.numbers().toText().get(), [1], here + 'chained')
  t.deepEqual(doc.numbers().get(), [1], here + 'found again')
  t.equal(doc.numbers().toNumber().all().text(), 'tengo 1 gato', here + 'and back')
  t.end()
})

test('agreement forms:', function (t) {
  const arr = [
    ['veintiún', 21],
    ['veintiuna', 21],
    ['veintiuno', 21],
    ['doscientas', 200],
    ['trescientas', 300],
    ['quinientas', 500],
    ['novecientas', 900],
    ['doscientas mil', 200000],
    ['cien', 100],
    ['ciento', 100],
    ['cien mil', 100000],
    ['ciento uno', 101],
    ['ciento una', 101],
    ['ciento veinte', 120],
    ['cien millones', 100e6],
    // without their accents
    ['dieciseis', 16],
    ['veintidos', 22],
    ['veintitres', 23],
    ['veintiseis', 26],
    ['un millon', 1e6],
  ]
  arr.forEach(a => {
    t.deepEqual(get(a[0]), [a[1]], here + a[0])
  })
  // the gender that was written is kept
  t.equal(run('veintiuna casas', m => m.add(10)), 'treinta y una casas', here + 'veintiuna + 10')
  t.equal(run('doscientas casas', m => m.add(100)), 'trescientas casas', here + 'doscientas + 100')
  t.equal(run('doscientas casas', m => m.add(1)), 'doscientas una casas', here + 'doscientas + 1')
  t.equal(run('veintiún gatos', m => m.add(1)), 'veintidós gatos', here + 'veintiún + 1')
  t.equal(run('veinte gatos', m => m.add(1)), 'veintiún gatos', here + 'veinte + 1')
  // cien or ciento
  t.equal(run('noventa y nueve', m => m.add(1)), 'cien', here + '99 + 1')
  t.equal(run('cien', m => m.add(1)), 'ciento uno', here + 'cien + 1')
  t.equal(run('ciento uno', m => m.subtract(1)), 'cien', here + 'ciento uno - 1')
  t.equal(run('cien', m => m.toNumber()), '100', here + 'cien toNumber')
  t.equal(run('cien gatos', m => m.set(100000)), 'cien mil gatos', here + 'cien mil')
  t.end()
})

test('number arguments:', function (t) {
  t.equal(run('cinco', m => m.set('un millón')), 'un millón', here + 'set un millón')
  t.equal(run('5', m => m.add('mil')), '1005', here + 'add mil')
  t.equal(run('5', m => m.set('3,5')), '3,5', here + 'set 3,5')
  t.equal(run('cinco', m => m.add('treinta y uno')), 'treinta y seis', here + 'add treinta y uno')
  t.equal(run('cinco', m => m.set('menos dos')), 'menos dos', here + 'set menos dos')
  t.equal(run('cinco', m => m.add('dos tres')), 'cinco', here + 'two numbers is not one')
  t.end()
})
