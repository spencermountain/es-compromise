import test from 'tape'
import nlp from '../_lib.js'
const here = '[es-api-hmm] '

// the imperative model mixes the command ('habla', 'comed') with the negative command ('no comas', 'no habléis')
test('affirmative imperative:', function (t) {
  const arr = [
    ['hablar', 'habla', 'hablad'],
    ['comer', 'come', 'comed'],
    ['tener', 'ten', 'tened'],
    ['ser', 'sé', 'sed'],
    ['ir', 've', 'id'],
  ]
  arr.forEach(a => {
    const o = nlp(a[0]).verbs().conjugate()[0].imperative
    t.equal(o.second, a[1], here + a[0] + ' - tú')
    t.equal(o.secondPlural, a[2], here + a[0] + ' - vosotros')
  })
  t.end()
})

// core sorts by code-point, so 'ñ' and the accented vowels come after 'z'
test('sort in spanish order:', function (t) {
  const doc = nlp('zorro. ñu. árbol. nube. barco.')
  t.deepEqual(doc.sort('alpha').out('array'), ['árbol.', 'barco.', 'nube.', 'ñu.', 'zorro.'], here + 'sort alpha')
  t.end()
})

// 'al' and 'del' are split into two terms, but there is no .contractions() method to find or expand them
test('expand contractions:', function (t) {
  const doc = nlp('Vamos al parque del niño.')
  t.equal(typeof doc.contractions, 'function', here + 'contractions method')
  if (doc.contractions) {
    t.equal(doc.contractions().expand().all().text(), 'Vamos a el parque de el niño.', here + 'expand')
  }
  t.end()
})

// a lone '(5)' keeps its brackets inside the term, so it has no words - '(-5)' and 'tengo (5) gatos' are fine
test('number in brackets:', function (t) {
  const doc = nlp('(5)')
  doc.numbers().toText()
  t.equal(doc.text(), '(cinco)', here + '(5)')
  t.end()
})
