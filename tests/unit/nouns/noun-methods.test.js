import test from 'tape'
import nlp from '../../_lib.js'
const here = '[noun-methods] '
nlp.verbose(false)

test('nouns-isPlural:', function (t) {
  let m = nlp('los gatos comen').nouns().isPlural()
  t.deepEqual(m.out('array'), ['gatos'], here + 'isPlural finds plural')

  m = nlp('tengo dos perros y un gato').nouns().isPlural()
  t.deepEqual(m.out('array'), ['perros'], here + 'isPlural skips singular')

  m = nlp('el gato come').nouns().isPlural()
  t.equal(m.found, false, here + 'isPlural empty for singular')

  m = nlp('tengo dos perros y un gato').nouns().isPlural(0)
  t.deepEqual(m.out('array'), ['perros'], here + 'isPlural nth')
  t.end()
})

test('nouns-conjugate:', function (t) {
  let res = nlp('las casas').nouns().conjugate()
  t.deepEqual(res, [{ singular: 'casa', plural: 'casas' }], here + 'conjugate plural noun')

  res = nlp('la casa').nouns().conjugate()
  t.deepEqual(res, [{ singular: 'casa', plural: 'casas' }], here + 'conjugate singular noun')

  res = nlp('los gatos comen').nouns().conjugate(0)
  t.deepEqual(res, [{ singular: 'gato', plural: 'gatos' }], here + 'conjugate nth')
  t.end()
})
