import test from 'tape'
import nlp from '../../_lib.js'
const here = '[es-shared] '

// plugins that come from compromise/shared
const txt = 'Juan trabaja para la NASA (en Madrid, España); él escribe a test@x.es mañana.'

test('shared topics:', function (t) {
  const doc = nlp(txt)
  t.deepEqual(doc.people().out('array'), ['Juan'], here + 'people')
  t.deepEqual(doc.organizations().out('array'), ['NASA'], here + 'organizations')
  t.ok(doc.places().found, here + 'places')
  t.equal(doc.topics().length, 3, here + 'topics')
  t.end()
})

test('shared misc:', function (t) {
  const doc = nlp(txt)
  t.equal(doc.parentheses().length, 1, here + 'parentheses')
  t.deepEqual(doc.emails().out('array'), ['test@x.es'], here + 'emails')
  t.deepEqual(doc.acronyms().out('array'), ['NASA'], here + 'acronyms')
  t.ok(doc.prepositions().found, here + 'prepositions')
  t.end()
})

test('shared clauses:', function (t) {
  const m = nlp(txt).clauses()
  t.ok(m.length > 1, here + 'splits on the semicolon')
  t.equal(m.text(), txt, here + 'keeps all the text')
  t.end()
})

test('shared redact:', function (t) {
  const str = nlp(txt).redact().text()
  t.notOk(/NASA|Juan|test@x\.es/.test(str), here + 'hides names')
  t.end()
})

test('shared lazy:', function (t) {
  const want = nlp(txt).match('madrid').out('array')
  t.equal(want.length, 1, here + 'has a match')
  t.deepEqual(nlp.lazy(txt, 'madrid').out('array'), want, here + 'same result as a full parse')
  t.equal(nlp.lazy(txt, 'zzzz').found, false, here + 'no match')
  t.end()
})

// our own rules, in src/03-three/clauses
test('clause word-rules:', function (t) {
  const arr = [
    ['él es grande pero es lento', ['él es grande', 'pero es lento']],
    ['me quedo aunque estoy cansado', ['me quedo', 'aunque estoy cansado']],
    ['si vienes mañana entonces saldremos', ['si vienes mañana', 'entonces saldremos']],
  ]
  arr.forEach(a => {
    t.deepEqual(nlp(a[0]).clauses().out('array'), a[1], here + a[0])
  })
  t.end()
})
