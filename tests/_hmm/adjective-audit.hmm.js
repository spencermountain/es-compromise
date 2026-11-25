import test from 'tape'
import nlp from '../_lib.js'
import list from '../unit/adjectives/_audit.js'
const here = '[es-adjective-audit-hmm] '

// forms marked with a '*' in _audit.js - they inflect properly as bare words, but the tagger does not see an adjective.
//  - 'pesado' - is not in the lexicon as an adjective, only as the participle of 'pesar' - 'es pesado', 'son pesadas'
//  - 'regular' - is the infinitive 'regular' in the lexicon
//  - 'inglés' - is in the lexicon as a noun ('el inglés'), which wins over the adjective
test('adjective audit, tagging:', function (t) {
  list.forEach((o) => {
    o.hmm.forEach((k) => {
      const str = (/lural/.test(k) ? 'son ' : 'es ') + o.forms[k]
      t.deepEqual(nlp(str).adjectives().conjugate(), [o.forms], here + str)
    })
  })
  t.end()
})
