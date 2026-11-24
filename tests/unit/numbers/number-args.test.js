import test from 'tape'
import nlp from '../../_lib.js'
const here = '[number-args] '
nlp.verbose(false)

test('numbers-set-string:', function (t) {
  let doc = nlp('tengo 4 euros')
  doc.numbers().set('doce')
  t.equal(doc.text(), 'tengo 12 euros', here + 'set text-string')

  doc = nlp('tengo cuatro euros')
  doc.numbers().set('12')
  t.equal(doc.text(), 'tengo doce euros', here + 'set digit-string')

  doc = nlp('tengo 4 euros')
  const res = doc.numbers().set('gato')
  t.equal(doc.text(), 'tengo 4 euros', here + 'set non-number is a no-op')
  t.equal(res.viewType, 'Numbers', here + 'set non-number returns numbers')
  t.end()
})

test('numbers-add-string:', function (t) {
  let doc = nlp('tengo 4 euros')
  doc.numbers().add('dos')
  t.equal(doc.text(), 'tengo 6 euros', here + 'add text-string')

  doc = nlp('tengo 4 euros')
  doc.numbers().plus('2')
  t.equal(doc.text(), 'tengo 6 euros', here + 'plus digit-string')

  doc = nlp('tengo 4 euros')
  doc.numbers().subtract('dos')
  t.equal(doc.text(), 'tengo 2 euros', here + 'subtract text-string')

  doc = nlp('tengo cuatro euros')
  doc.numbers().minus(1)
  t.equal(doc.text(), 'tengo tres euros', here + 'minus number')

  doc = nlp('tengo 4 euros')
  doc.numbers().add('gato')
  t.equal(doc.text(), 'tengo 4 euros', here + 'add non-number is a no-op')

  doc = nlp('tengo 4 euros')
  doc.numbers().increment().increment().decrement()
  t.equal(doc.text(), 'tengo 5 euros', here + 'increment/decrement')
  t.end()
})

test('numbers-json-nth:', function (t) {
  const str = 'tres perros y cinco gatos'
  let json = nlp(str).numbers().json(0)
  t.equal(json.length, 1, here + 'json(0) length')
  t.equal(json[0].number.num, 3, here + 'json(0) num')

  json = nlp(str).numbers().json(1)
  t.equal(json.length, 1, here + 'json(1) length')
  t.equal(json[0].number.num, 5, here + 'json(1) num')

  json = nlp(str).numbers().json(9)
  t.deepEqual(json, [], here + 'json out-of-range')

  json = nlp(str).numbers().json({ terms: false })
  t.equal(json.length, 2, here + 'json options length')
  t.equal(json[0].terms, undefined, here + 'json options respected')
  t.equal(json[1].number.num, 5, here + 'json options num')
  t.end()
})

test('numbers-empty:', function (t) {
  const nums = nlp('el gato come').numbers()
  t.deepEqual(nums.get(), [], here + 'get with no numbers')
  t.deepEqual(nums.parse(), [], here + 'parse with no numbers')
  t.deepEqual(nums.json(), [], here + 'json with no numbers')
  t.deepEqual(nlp('tres perros').numbers().get(5), [], here + 'get out-of-range')
  t.end()
})
