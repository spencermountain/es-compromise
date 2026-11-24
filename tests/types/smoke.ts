// compile-time smoke-test for types/index.d.ts
// checked by `pnpm run test:types` - never executed
import nlp from 'es-compromise'
import type {
  EsView, Verbs, Nouns, Adjectives, Numbers,
  VerbConjugation, NounConjugation, AdjectiveConjugation, ConjugationSet,
  ParsedNumber, SpecOptions, SpecFailure,
} from 'es-compromise'
import type View from 'compromise/view/one'

const doc: EsView = nlp('los gatos negros comieron veinticinco libros')

// core compromise/one methods are inherited
const txt: string = doc.text()
const found: boolean = doc.has('#Verb')
doc.match('#Noun').tag('Checked').out('array')

// verbs
const verbs: Verbs = doc.verbs()
const conj: VerbConjugation[] = verbs.conjugate()
const past: ConjugationSet = conj[0].pastTense
const firstPerson: string = past.first
const subj: ConjugationSet = conj[0].subjunctive
const gerund: string = conj[0].gerund
const participle: string = conj[0].perfecto
const sets: ConjugationSet[] = [conj[0].presentTense, conj[0].futureTense, conj[0].conditional, conj[0].imperative]
verbs.conjugate(0)
doc.verbs(0)
// @ts-expect-error tense-conversion is not implemented in spanish
verbs.toPastTense()

// nouns
const nouns: Nouns = doc.nouns()
const nounConj: NounConjugation[] = nouns.conjugate()
const plural: string = nounConj[0].plural
const singular: string = nounConj[0].singular
nouns.toPlural().toSingular().conjugate(0)
const plurals: View = nouns.isPlural(0)
// @ts-expect-error there is no feminine form for nouns
nounConj[0].feminine

// adjectives
const adjs: Adjectives = doc.adjectives()
const adjConj: AdjectiveConjugation[] = adjs.conjugate()
const female: string = adjConj[0].female
const femalePlural: string = adjConj[0].femalePlural

// numbers
const nums: Numbers = nlp('cincuenta y cinco kilos').numbers()
const same: Numbers = doc.values(0)
const values: (number | null)[] = nums.get()
const parsed: ParsedNumber[] = nums.parse(0)
const num: number | null = parsed[0].num
const isText: boolean = parsed[0].isText
const units: View = nums.units()
nums.json()
nums.json({ terms: false })
nums.json(0)
nums.json('normal')
nums.toNumber().toText().toOrdinal().toCardinal()
nums.isOrdinal().isCardinal()
nums.add(5).subtract(2).increment().decrement()
nums.plus(5).minus(2)
nums.greaterThan(1).lessThan(100).between(1, 100).isBetween(1, 100)
nums.isEqual(55).equals(55).set(60)
nums.add('dos').subtract('uno').plus('2').minus('1').set('doce')

// constructor methods
const tokens: EsView = nlp.tokenize('un texto corto', { texto: 'Noun' })
const ver: string = nlp.version
const hooks: string[] = nlp.hooks()
nlp.verbose(true)
nlp.verbose('tagger')
nlp.plugin({})
nlp.extend({})
nlp.addWords({ 'patineta': 'Noun' })
nlp.addWords({ 'patineta': 'Noun' }, true)
nlp.addTags({ Checked: { is: 'Noun' } })
nlp.typeahead({ patineta: 'Noun' })
doc.lookup(nlp.buildTrie(['gatos', 'libros']))
nlp.compile(['gatos', 'libros'])
doc.sweep(nlp.buildNet([{ match: 'los #Noun' }]))
nlp.parseMatch('#Noun')
nlp.world()
nlp.model()
nlp.methods()
const specOpts: SpecOptions = { tags: 'use', failures: 'retain' }
const failures: SpecFailure[] = nlp.fromSpec('el gato come', specOpts).failures
const specNouns: Nouns = nlp.testSpec('el gato come', false).nouns()

// @ts-expect-error input text must be a string
nlp(25)

// silence noUnusedLocals
export {
  txt, found, firstPerson, subj, gerund, participle, sets, plural, singular, plurals,
  female, femalePlural, same, values, num, isText, units, tokens, ver, hooks,
  failures, specNouns,
}
