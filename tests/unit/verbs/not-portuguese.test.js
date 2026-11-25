import test from 'tape'
import nlp from '../../_lib.js'
const here = '[not-portuguese] '

// the verb data once held ~1,200 portuguese verbs - 'trabalhar', 'falar', 'fazer'
// which made verbs out of spanish words like 'tía' (from 'ter')
test('no portuguese verbs:', function (t) {
  const lexicon = nlp.world().model.one.lexicon
  const isInfinitive = (str) => lexicon.hasOwnProperty(str) && [].concat(lexicon[str]).includes('Infinitive')
  const arr = ['trabalhar', 'falar', 'fazer', 'dizer', 'ter', 'vir', 'ler', 'conhecer', 'começar', 'passar', 'ficar', 'achar', 'chegar', 'olhar']
  arr.forEach((str) => {
    t.equal(isInfinitive(str), false, here + `'${str}' is not a spanish verb`)
  })
  // no infinitive is spelled the portuguese way
  const bad = Object.keys(lexicon).filter((str) => isInfinitive(str) && /[ãõç]|lh|ss/.test(str))
  t.deepEqual(bad, [], here + 'no portuguese spellings')
  // the spanish ones are still here
  ;['trabajar', 'hablar', 'hacer', 'decir', 'tener', 'venir', 'leer', 'conocer', 'pasar', 'llegar'].forEach((str) => {
    t.equal(isInfinitive(str), true, here + `'${str}' is a spanish verb`)
  })
  t.end()
})

test('present-tense is spanish:', function (t) {
  const verb = nlp.world().methods.two.transform.verb
  const arr = [
    ['nevar', 'nieva', 'nievan'],
    ['adquirir', 'adquiere', 'adquieren'],
    ['consolar', 'consuela', 'consuelan'],
    ['cegar', 'ciega', 'ciegan'],
    ['abdicar', 'abdica', 'abdican'],
    ['vomitar', 'vomita', 'vomitan'],
    ['digerir', 'digiere', 'digieren'],
    ['aborrecer', 'aborrece', 'aborrecen'],
    ['hablar', 'habla', 'hablan'],
    ['vivir', 'vive', 'viven'],
  ]
  arr.forEach((a) => {
    const [inf, third, plural] = a
    const res = verb.toPresent(inf)
    t.equal(res.third, third, here + `${inf} - ${third}`)
    t.equal(res.thirdPlural, plural, here + `${inf} - ${plural}`)
  })
  t.equal(nlp('es mi tía').match('tía').has('#Verb'), false, here + 'tía is not a verb')
  t.end()
})
