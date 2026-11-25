import test from 'tape'
import nlp from '../../_lib.js'
import list, { pluralOnly } from './_audit.js'
const here = '[noun-audit] '
nlp.verbose(false)

// the string-level transform - with a lexicon to look in, and without it
test('noun audit, transform:', function (t) {
  const { toPlural, fromPlural, toSingular } = nlp.methods().two.transform.noun
  const lexicon = nlp.model().one.lexicon
  list.forEach((o) => {
    const { singular, plural } = o
    const want = [plural.noun, singular.noun]
    t.deepEqual([toPlural(singular.noun), fromPlural(plural.noun)], want, here + singular.noun)
    t.equal(fromPlural(plural.noun, lexicon), singular.noun, here + plural.noun + ' (lexicon)')
  })
  t.equal(toSingular, fromPlural, here + 'toSingular is fromPlural')
  t.end()
})

// the same nouns, after their article
test('noun audit, in context:', function (t) {
  list.forEach((o) => {
    const { singular, plural } = o
    const want = [{ singular: singular.noun, plural: plural.noun }]
    if (!singular.hmm) {
      const doc = nlp(singular.str)
      t.deepEqual(doc.nouns().conjugate(), want, here + 'conjugate ' + singular.str)
      t.equal(doc.nouns().isPlural().found, false, here + 'not plural ' + singular.str)
      doc.nouns().toPlural()
      t.equal(doc.text(), plural.str, here + 'toPlural ' + singular.str)
    }
    if (!plural.hmm) {
      const doc = nlp(plural.str)
      t.deepEqual(doc.nouns().conjugate(), want, here + 'conjugate ' + plural.str)
      t.equal(doc.nouns().isPlural().text(), plural.noun, here + 'isPlural ' + plural.str)
      doc.nouns().toSingular()
      t.equal(doc.text(), singular.str, here + 'toSingular ' + plural.str)
    }
  })
  t.end()
})

test('noun audit, plural-only:', function (t) {
  pluralOnly.forEach((str) => {
    const doc = nlp(str)
    t.equal(doc.nouns().isPlural().found, true, here + 'isPlural ' + str)
    doc.nouns().toPlural()
    t.equal(doc.text(), str, here + 'toPlural ' + str)
  })
  t.end()
})

test('noun audit, misc:', function (t) {
  const { toPlural, fromPlural, all } = nlp.methods().two.transform.noun
  const lexicon = nlp.model().one.lexicon
  // the written accent moves with the stress
  t.equal(toPlural('xyzación'), 'xyzaciones', here + '-ción')
  t.equal(fromPlural('xyzaciones'), 'xyzación', here + '-ciones')
  t.equal(fromPlural('xyzadades'), 'xyzadad', here + '-dades')
  t.equal(toPlural('certamen'), 'certámenes', here + 'certamen')
  t.equal(fromPlural('certámenes'), 'certamen', here + 'certámenes')
  t.equal(toPlural('tahúr'), 'tahúres', here + 'a hiatus keeps its accent')
  t.equal(toPlural('guion'), 'guiones', here + 'guion is one syllable')
  t.equal(fromPlural('guiones'), 'guion', here + 'guiones')
  t.equal(fromPlural('camaleones'), 'camaleón', here + 'camaleones')
  // '-es' or '-s'
  t.equal(fromPlural('héroes'), 'héroe', here + 'héroes')
  t.equal(fromPlural('alcaldes'), 'alcalde', here + 'a consonant cluster')
  t.equal(fromPlural('xyzales'), 'xyzal', here + 'default')
  t.equal(fromPlural('xyzajes'), 'xyzaje', here + '-ajes')
  t.equal(fromPlural('clubs'), 'club', here + 'clubs')
  // both plurals are right - 'rubís', 'tabús'
  t.equal(fromPlural('rubís'), 'rubí', here + 'rubís')
  t.equal(fromPlural('tabús'), 'tabú', here + 'tabús')
  t.equal(fromPlural('bambúes'), 'bambú', here + 'bambúes')
  // loanwords
  t.equal(toPlural('récord'), 'récords', here + 'récord')
  t.equal(toPlural('ferry'), 'ferris', here + 'ferry')
  t.equal(toPlural('web'), 'webs', here + 'web')
  t.equal(toPlural('test'), 'tests', here + 'test')
  // nothing to do
  t.equal(toPlural('casas'), 'casas', here + 'toPlural of a plural')
  t.equal(fromPlural('casa'), 'casa', here + 'fromPlural of a singular')
  t.equal(fromPlural('inglés'), 'inglés', here + 'inglés is singular')
  t.equal(fromPlural('bronquitis'), 'bronquitis', here + '-itis')
  t.deepEqual(all('crisis'), ['crisis'], here + 'all, invariable')
  t.deepEqual(all('luz'), ['luz', 'luces'], here + 'all')
  // a lexicon chooses between two singulars
  t.equal(fromPlural('badones', { badone: 'Noun' }), 'badone', here + 'lexicon hint, -e')
  t.equal(fromPlural('badenes', { badén: 'Noun' }), 'badén', here + 'lexicon hint, consonant')
  t.equal(fromPlural('verdes', lexicon), 'verde', here + 'verdes')

  // number comes from the article, when the noun does not show it
  t.ok(nlp('los lunes').has('#Plural'), here + 'los lunes is plural')
  t.notOk(nlp('el lunes').has('#Plural'), here + 'el lunes is singular')
  t.notOk(nlp('el portaaviones').has('#Plural'), here + 'el portaaviones is singular')
  t.ok(nlp('los cafés').has('#Plural'), here + 'los cafés is plural')
  t.notOk(nlp('el país').has('#Plural'), here + 'el país is singular')
  // a lowercase name after an article is a noun
  t.notOk(nlp('las flores').has('#Person'), here + 'las flores')
  t.ok(nlp('la Torres').has('#Person'), here + 'la Torres')
  t.deepEqual(nlp('las flores son rojas').nouns().conjugate(), [{ singular: 'flor', plural: 'flores' }], here + 'las flores son rojas')

  // articles follow their noun
  const arr = [
    ['un águila', 'unas águilas'],
    ['mi casa y tu coche', 'mis casas y tus coches'],
    ['su amigo', 'sus amigos'],
    ['esa ciudad', 'esas ciudades'],
    ['aquel árbol', 'aquellos árboles'],
    ['la casa del pueblo', 'las casas de los pueblos'],
    ['voy al mercado', 'voy a los mercados'],
    ['bebo del agua', 'bebo de las aguas'],
    ['hablo de la canción', 'hablo de las canciones'],
    ['el lunes y el martes', 'los lunes y los martes']
  ]
  arr.forEach((a) => {
    let doc = nlp(a[0])
    doc.nouns().toPlural()
    t.equal(doc.text(), a[1], here + 'toPlural ' + a[0])
    doc.nouns().toSingular()
    t.equal(doc.text(), a[0], here + 'and back ' + a[0])
    doc = nlp(a[1])
    doc.nouns().toSingular()
    t.equal(doc.text(), a[0], here + 'toSingular ' + a[1])
  })
  // an object-pronoun is not a noun to inflect
  let doc = nlp('la veo en la casa')
  doc.nouns().toPlural()
  t.equal(doc.text(), 'la veo en las casas', here + 'toPlural skips a pronoun')
  doc = nlp('los tengo en las cajas')
  doc.nouns().toSingular()
  t.equal(doc.text(), 'los tengo en la caja', here + 'toSingular skips a pronoun')

  // root
  doc = nlp('las canciones de los jóvenes ingleses').compute('root')
  t.deepEqual(doc.json()[0].terms.map((o) => o.root).filter((s) => s), ['canción', 'joven', 'inglés'], here + 'root')
  t.end()
})
