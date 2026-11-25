import test from 'tape'
import nlp from '../../_lib.js'
import list from './_audit.js'
const here = '[adjective-audit] '
nlp.verbose(false)

// the string-level transform - with a lexicon to look in, and without it
test('adjective audit, transform:', function (t) {
  const { toFemale, toPlural, toFemalePlural, fromFemale, toSingular, fromFemalePlural, all } = nlp.methods().two.transform.adjective
  const lexicon = nlp.model().one.lexicon
  list.forEach((o) => {
    const { male, female, plural, femalePlural } = o.forms
    t.deepEqual([toFemale(male), toPlural(male), toFemalePlural(male)], [female, plural, femalePlural], here + male)
    const want = [male, male, male]
    t.deepEqual([fromFemale(female, lexicon), toSingular(plural, lexicon), fromFemalePlural(femalePlural, lexicon)], want, here + male + ' (lexicon)')
    if (!o.ambiguous) {
      t.deepEqual([fromFemale(female), toSingular(plural), fromFemalePlural(femalePlural)], want, here + 'to ' + male)
    }
  })
  t.deepEqual(all('rojo'), ['rojo', 'roja', 'rojos', 'rojas'], here + 'all')
  t.deepEqual(all('feliz'), ['feliz', 'felices'], here + 'all, common gender')
  t.end()
})

// each form, after 'ser'
test('adjective audit, in context:', function (t) {
  list.forEach((o) => {
    Object.keys(o.forms).filter((k) => !o.hmm.includes(k)).forEach((k) => {
      const str = (/lural/.test(k) ? 'son ' : 'es ') + o.forms[k]
      t.deepEqual(nlp(str).adjectives().conjugate(), [o.forms], here + str)
    })
  })
  t.end()
})

test('adjective audit, misc:', function (t) {
  const { toFemale, toPlural, fromFemale, toSingular } = nlp.methods().two.transform.adjective
  // shortened forms
  t.equal(toFemale('buen'), 'buena', here + 'buen')
  t.equal(toPlural('primer'), 'primeros', here + 'primer')
  // '-or' adds an '-a', but a comparative does not
  t.equal(toFemale('xyzador'), 'xyzadora', here + '-dor')
  t.equal(toFemale('posterior'), 'posterior', here + 'posterior')
  t.equal(toFemale('multicolor'), 'multicolor', here + 'multicolor')
  t.equal(fromFemale('xyzadora'), 'xyzador', here + '-dora')
  t.equal(fromFemale('sonora'), 'sonoro', here + 'sonora')
  // '-a' for both genders
  t.equal(fromFemale('socialista'), 'socialista', here + '-ista')
  t.equal(fromFemale('lista'), 'listo', here + 'lista')
  t.equal(fromFemale('prevista'), 'previsto', here + 'prevista')
  t.equal(fromFemale('ácida'), 'ácido', here + 'ácida')
  t.equal(fromFemale('homicida'), 'homicida', here + 'homicida')
  // the model has seen these
  t.equal(fromFemale('musulmana'), 'musulmán', here + 'musulmana')
  t.equal(fromFemale('cubana'), 'cubano', here + 'cubana')
  t.equal(fromFemale('obesa'), 'obeso', here + 'obesa')
  t.equal(toSingular('comunes'), 'común', here + 'comunes')
  t.equal(toSingular('grises'), 'gris', here + 'grises')

  // the forms of an adjective are in the lexicon
  let doc = nlp('son amarillos')
  t.ok(doc.has('#PluralAdjective'), here + 'amarillos is a plural adjective')
  t.notOk(nlp('son grandes').has('#FemaleAdjective'), here + 'grandes has no gender')
  t.notOk(nlp('es fácil').has('#FemaleAdjective'), here + 'fácil has no gender')
  // after 'ser' or 'estar', a verb-form or a name is an adjective that we know
  t.ok(nlp('la mesa está limpia').has('#FemaleAdjective'), here + 'está limpia')
  t.ok(nlp('ella limpia la mesa').match('limpia').has('#Verb'), here + 'ella limpia')
  t.ok(nlp('son rojas').has('#Adjective'), here + 'son rojas')
  t.notOk(nlp('es Roja').has('#Adjective'), here + 'es Roja')
  doc = nlp('las casas son rojas y bonitas').compute('root')
  t.equal(doc.match('rojas').json()[0].terms[0].root, 'rojo', here + 'root')
  t.end()
})
