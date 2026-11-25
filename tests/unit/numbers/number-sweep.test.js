import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-sweep] '
nlp.verbose(false)

// an independent spelling of each number, to compare with
const ones = 'cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve'.split(' ')
const tens = ',,,treinta,cuarenta,cincuenta,sesenta,setenta,ochenta,noventa'.split(',')
const hundreds = ',ciento,doscientos,trescientos,cuatrocientos,quinientos,seiscientos,setecientos,ochocientos,novecientos'.split(',')
const join = arr => arr.filter(s => s).join(' ')
// 'veintiún mil', 'un millón'
const short = str => str.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un')
const small = function (n) {
  if (n === 100) {
    return 'cien'
  }
  const rest = n % 100
  let str = ones[rest] || ''
  if (rest >= 30) {
    str = tens[Math.floor(rest / 10)] + (rest % 10 ? ' y ' + ones[rest % 10] : '')
  }
  return join([hundreds[Math.floor(n / 100)], rest ? str : ''])
}
const thousands = function (n) {
  const mil = Math.floor(n / 1000)
  return join([mil > 1 ? short(small(mil)) : '', mil ? 'mil' : '', small(n % 1000)])
}
const spell = function (n) {
  if (n === 0) {
    return 'cero'
  }
  const billions = Math.floor(n / 1e12)
  const millions = Math.floor((n % 1e12) / 1e6)
  return join([
    billions > 1 ? short(thousands(billions)) + ' billones' : '',
    billions === 1 ? 'un billón' : '',
    millions > 1 ? short(thousands(millions)) + ' millones' : '',
    millions === 1 ? 'un millón' : '',
    thousands(n % 1e6),
  ])
}

const nums = []
for (let i = 0; i <= 3000; i += 1) {
  nums.push(i)
}
nums.push(3001, 4567, 9999, 10000, 10001, 15015, 21000, 21021, 31000, 99999, 100000, 100001, 101000, 121121)
nums.push(200000, 500500, 999999, 1e6, 1000001, 1001000, 1200000, 2e6, 2000001, 21e6, 100e6, 101e6, 999999999)
nums.push(1e9, 1000000001, 2e9, 21e9, 123456789012, 999999999999, 1e12, 2e12, 1000001000001, 1e12 + 1e9)

test('the reference is right:', function (t) {
  const arr = [
    [0, 'cero'],
    [16, 'dieciséis'],
    [21, 'veintiuno'],
    [22, 'veintidós'],
    [30, 'treinta'],
    [31, 'treinta y uno'],
    [99, 'noventa y nueve'],
    [100, 'cien'],
    [101, 'ciento uno'],
    [110, 'ciento diez'],
    [200, 'doscientos'],
    [500, 'quinientos'],
    [700, 'setecientos'],
    [900, 'novecientos'],
    [999, 'novecientos noventa y nueve'],
    [1000, 'mil'],
    [1001, 'mil uno'],
    [1100, 'mil cien'],
    [2000, 'dos mil'],
    [2345, 'dos mil trescientos cuarenta y cinco'],
    [21000, 'veintiún mil'],
    [31000, 'treinta y un mil'],
    [100000, 'cien mil'],
    [101000, 'ciento un mil'],
    [1e6, 'un millón'],
    [1200000, 'un millón doscientos mil'],
    [2e6, 'dos millones'],
    [21e6, 'veintiún millones'],
    [1e9, 'mil millones'],
    [2e9, 'dos mil millones'],
    [1e12, 'un billón'],
    [2e12, 'dos billones'],
    [1e12 + 1e9, 'un billón mil millones'],
  ]
  arr.forEach(a => {
    t.equal(spell(a[0]), a[1], here + 'spell ' + a[0])
    t.equal(nlp(String(a[0])).numbers().toText().text(), a[1], here + 'toText ' + a[0])
    t.deepEqual(nlp(a[1]).numbers().get(), [a[0]], here + 'get ' + a[1])
  })
  t.end()
})

// each of these is a list of the numbers that fail
test('number sweep:', function (t) {
  const bad = { toText: [], chained: [], parse: [], one: [], toNumber: [], tagged: [] }
  nums.forEach(n => {
    const want = spell(n)
    const doc = nlp(String(n))
    const m = doc.numbers().toText()
    if (doc.text() !== want) {
      bad.toText.push(n)
    }
    // the same view still has the number
    if (m.get()[0] !== n) {
      bad.chained.push(n)
    }
    // and so does a new one
    if (doc.numbers().get()[0] !== n) {
      bad.tagged.push(n)
    }
    const found = nlp(want).numbers()
    if (found.length !== 1 || found.text() !== want) {
      bad.one.push(n)
    }
    if (found.get()[0] !== n) {
      bad.parse.push(n)
    }
    if (m.toNumber().text() !== String(n) || doc.text() !== String(n)) {
      bad.toNumber.push(n)
    }
  })
  Object.keys(bad).forEach(k => {
    t.deepEqual(bad[k], [], here + k + ' - ' + nums.length + ' numbers')
  })
  t.end()
})

test('ordinal sweep:', function (t) {
  const bad = { parse: [], toCardinal: [], toNumber: [] }
  for (let n = 1; n < 2000; n += 1) {
    const doc = nlp(spell(n))
    doc.numbers().toOrdinal()
    const str = doc.text()
    const m = nlp(str).numbers()
    if (m.length !== 1 || m.get()[0] !== n || m.isOrdinal().length !== 1) {
      bad.parse.push(n)
    }
    if (m.toNumber().text() !== n + 'º') {
      bad.toNumber.push(n)
    }
    if (doc.numbers().toCardinal().text() !== spell(n)) {
      bad.toCardinal.push(n)
    }
  }
  Object.keys(bad).forEach(k => {
    t.deepEqual(bad[k], [], here + 'ordinal ' + k)
  })
  t.end()
})

test('a multi-word number is one number:', function (t) {
  const arr = [
    ['dos mil trescientos cuarenta y cinco gatos', 'dos mil trescientos cuarenta y cinco', 2345],
    ['un millón doscientos mil', 'un millón doscientos mil', 1200000],
    ['hay un millón de personas', 'un millón', 1e6],
    ['tres millones de euros', 'tres millones', 3e6],
    ['mil millones de años', 'mil millones', 1e9],
    ['un billón de dólares', 'un billón', 1e12],
    ['quinientas mil personas', 'quinientas mil', 500000],
    ['treinta y un días', 'treinta y un', 31],
    ['ciento un gatos', 'ciento un', 101],
    ['5 millones', '5 millones', 5e6],
    ['2,5 millones de euros', '2,5 millones', 2500000],
    ['3 mil millones', '3 mil millones', 3e9],
  ]
  arr.forEach(a => {
    const m = nlp(a[0]).numbers()
    t.equal(m.length, 1, here + 'one number: ' + a[0])
    t.equal(m.text(), a[1], here + 'text: ' + a[0])
    t.deepEqual(m.get(), [a[2]], here + 'value: ' + a[0])
  })
  t.end()
})

test('a list of numbers is a list:', function (t) {
  const arr = [
    ['dos tres cuatro', [2, 3, 4]],
    ['uno, dos y tres', [1, 2, 3]],
    ['tres y cuatro', [3, 4]],
    ['veinte y treinta', [20, 30]],
    ['tres, cuatro', [3, 4]],
    ['dos mil, tres mil', [2000, 3000]],
    ['mil mil', [1000, 1000]],
    ['cien doscientos', [100, 200]],
    ['cuarenta y 3', [40, 3]],
    ['3 y cuarenta', [3, 40]],
    ['tres menos dos', [3, 2]],
    ['dos millones de personas y tres perros', [2e6, 3]],
    ['en 1999 y 2020', [1999, 2020]],
    ['primero segundo', [1, 2]],
    ['cinco primero', [5, 1]],
  ]
  arr.forEach(a => {
    t.deepEqual(nlp(a[0]).numbers().get(), a[1], here + a[0])
  })
  t.end()
})
