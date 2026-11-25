import test from 'tape'
import nlp from '../../_lib.js'
const here = '[es-constructor] '
const txt = 'El niño pequeño corrió hacia la montaña. ¿Dónde está el pingüino?'

test('constructor methods:', function (t) {
  t.ok(/^[0-9]+\.[0-9]+\.[0-9]+/.test(nlp.version), here + 'version is semver')
  t.equal(typeof nlp.world(), 'object', here + 'world')
  t.equal(typeof nlp.model().one.lexicon, 'object', here + 'model')
  t.equal(typeof nlp.methods().one.tokenize, 'object', here + 'methods')
  t.ok(nlp.hooks().includes('postTagger'), here + 'hooks')
  t.equal(nlp.verbose(false), nlp, here + 'verbose is chainable')
  t.equal(typeof nlp.extend, 'function', here + 'extend')
  t.end()
})

test('tokenize:', function (t) {
  const doc = nlp.tokenize(txt)
  t.equal(doc.length, 2, here + 'tokenize splits sentences')
  t.equal(doc.text(), txt, here + 'tokenize keeps the text')
  t.equal(doc.wordCount(), 11, here + 'tokenize splits words')
  t.equal(doc.has('#Noun'), false, here + 'tokenize does not tag')
  t.equal(doc.match('montaña').found, true, here + 'tokenize can match words')
  t.equal(doc.match('^dónde').found, true, here + 'tokenize sets ¿ aside')
  t.equal(doc.compute('preTagger').has('#Noun'), true, here + 'the tagger can run later')
  t.end()
})

test('parseMatch:', function (t) {
  const regs = nlp.parseMatch('#Noun+ (el|la)? [niño]')
  t.equal(regs.length, 3, here + 'three tokens')
  t.equal(regs[0].tag, 'Noun', here + 'tag')
  t.equal(regs[0].greedy, true, here + 'greedy')
  t.equal(regs[1].optional, true, here + 'optional')
  t.equal(regs[2].word, 'niño', here + 'word, with its ñ')
  // a parsed match can be re-used
  t.equal(nlp('veo el niño').match(nlp.parseMatch('el niño')).text(), 'el niño', here + 'use parsed match')
  t.equal(nlp('el ñandú duerme').match(nlp.parseMatch('el . duerme')).text(), 'el ñandú duerme', here + 'wildcard')
  t.end()
})

test('buildNet + sweep:', function (t) {
  const net = nlp.buildNet([
    { match: 'el niño', tag: 'Chico' },
    { match: 'pingüino', tag: 'Ave' },
    { match: 'el caballo', tag: 'Equino' },
  ])
  const doc = nlp(txt)
  const res = doc.sweep(net)
  t.deepEqual(res.view.out('array'), ['El niño', 'pingüino?'], here + 'view has both matches')
  t.equal(res.found.length, 2, here + 'two results')
  t.equal(res.found[0].match, 'el niño', here + 'first result')
  t.equal(doc.match('#Chico+').text(), 'El niño', here + 'sweep tags')
  t.equal(doc.match('#Ave').text(), 'pingüino', here + 'sweep tags the second sentence')
  t.equal(doc.has('#Equino'), false, here + 'sweep skips a miss')
  // no matches
  const none = nlp('la niña duerme').sweep(net)
  t.equal(none.view.found, false, here + 'empty view')
  t.deepEqual(none.found, [], here + 'empty found')
  // without tagging
  const d = nlp('veo un pingüino')
  t.equal(d.sweep(net, { tagger: false }).view.text(), 'pingüino', here + 'tagger:false still matches')
  t.equal(d.has('#Ave'), false, here + 'tagger:false does not tag')
  t.end()
})

test('sweep with roots:', function (t) {
  const net = nlp.buildNet([{ match: '{hablar/Verb}' }, { match: '{montaña/Noun}' }, { match: '{pequeño/Adjective}' }])
  const arr = [
    ['ayer hablamos mucho', 'hablamos'],
    ['ella habló de eso', 'habló'],
    ['dos montañas altas', 'montañas'],
    ['una montaña alta', 'montaña'],
    ['son muy pequeñas', 'pequeñas'],
  ]
  arr.forEach(a => {
    const [str, want] = a
    t.equal(nlp(str).sweep(net).view.text(), want, here + str)
  })
  t.end()
})

test('buildTrie + lookup:', function (t) {
  const trie = nlp.buildTrie(['el niño', 'montaña', 'caballo'])
  t.deepEqual(nlp(txt).lookup(trie).out('array'), ['El niño', 'montaña.'], here + 'lookup with a trie')
  t.deepEqual(nlp(txt).lookup(['el pingüino', 'hacia']).out('array'), ['hacia', 'el pingüino?'], here + 'lookup with an array')
  t.equal(nlp('MONTAÑA arriba').lookup(trie).text(), 'MONTAÑA', here + 'lookup is case-insensitive')
  t.equal(nlp('la niña duerme').lookup(trie).found, false, here + 'lookup finds nothing')
  t.end()
})

test('plugins:', function (t) {
  nlp.plugin({
    api: function (View) {
      View.prototype.criaturas = function () {
        return this.match('#Criatura+')
      }
    },
    tags: { Criatura: { is: 'Noun' } },
    words: { chupacabras: 'Criatura' },
    compute: {
      largo: function (view) {
        view.docs.forEach(terms => {
          terms.forEach(term => {
            term.len = term.normal.length
          })
        })
      },
    },
  })
  const doc = nlp('el chupacabras duerme')
  t.equal(doc.criaturas().text(), 'chupacabras', here + 'plugin api + words')
  t.equal(doc.match('chupacabras').has('#Noun'), true, here + 'plugin tag is a Noun')
  t.equal(doc.compute('largo').docs[0][1].len, 11, here + 'plugin compute')
  nlp.addWords({ ñacurutú: 'Criatura', 'luz mala': 'Criatura' })
  t.equal(nlp('el ñacurutú canta').criaturas().text(), 'ñacurutú', here + 'addWords')
  t.equal(nlp('viene la luz mala').criaturas().text(), 'luz mala', here + 'addWords multi-word')
  nlp.addTags({ Duende: { is: 'Criatura' } })
  nlp.addWords({ trasgu: 'Duende' })
  t.equal(nlp('el trasgu viene').criaturas().text(), 'trasgu', here + 'addTags')
  t.equal(nlp('el trasgu viene').match('trasgu').has('#Noun'), true, here + 'addTags inherits')
  t.equal(nlp('el cuélebre viene', { cuélebre: 'Criatura' }).criaturas().text(), 'cuélebre', here + 'lexicon as 2nd param')
  // adding words does not lose the numbers
  t.deepEqual(nlp('cero trasgus y tres perros').numbers().get(), [0, 3], here + 'numbers after addWords')
  t.deepEqual(nlp('treinta y un trasgus').numbers().get(), [31], here + 'number-words after addWords')
  t.end()
})

test('typeahead:', function (t) {
  nlp.typeahead(['chupacabras', 'ñacurutú', 'ñacurutúes'])
  // only the last word is filled-in
  const doc = nlp('el chupac')
  t.equal(doc.match('chupacabras').found, true, here + 'a prefix matches the full word')
  t.equal(doc.text(), 'el chupac', here + 'text is unchanged')
  t.equal(doc.autoFill().text(), 'el chupacabras', here + 'autoFill')
  t.equal(nlp('el ñacu').match('ñacurutú').found, false, here + 'an ambiguous prefix')
  t.equal(nlp('el chupac duerme').match('chupacabras').found, false, here + 'not in the middle')
  t.end()
})
