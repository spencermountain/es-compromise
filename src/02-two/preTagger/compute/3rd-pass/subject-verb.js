// 'yo como' - 'como' is usually a conjunction, 'vivo' an adjective, 'trabajo' a noun
// but 'yo' and 'tú' are only ever the subject of a verb,
// so a first-person form of a known verb, after 'yo', is that verb.
const subjects = {
  yo: ['FirstPerson', 'first'],
  tú: ['SecondPerson', 'second'],
}

// words that sit between a subject and its verb - 'yo no lo como'
const fillers = new Set([
  'no', 'nunca', 'ya', 'también', 'tampoco', 'siempre', 'casi', 'solo', 'sólo',
  'me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os',
])

const tenses = [
  ['PresentTense', 'fromPresent', 'toPresent'],
  ['PastTense', 'fromPast', 'toPast'],
  ['Imperfect', 'fromImperfect', 'toImperfect'],
  ['FutureTense', 'fromFuture', 'toFuture'],
]

const isInfinitive = function (str, lexicon) {
  if (!lexicon.hasOwnProperty(str)) {
    return false
  }
  const tags = lexicon[str]
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

const subjectVerb = function (terms, i, world) {
  const found = subjects[terms[i].normal]
  if (!found) {
    return
  }
  let n = i + 1
  while (terms[n] && fillers.has(terms[n].normal)) {
    n += 1
  }
  const term = terms[n]
  if (!term || term.tags.has('Verb')) {
    return
  }
  const [tag, form] = found
  const verb = world.methods.two.transform.verb
  const lexicon = world.model.one.lexicon
  const str = term.normal
  for (let k = 0; k < tenses.length; k += 1) {
    const [tense, from, to] = tenses[k]
    const inf = verb[from](str, tag)
    // it has to be a known verb, that conjugates back to this word
    if (inf && inf !== str && isInfinitive(inf, lexicon) && verb[to](inf)[form] === str) {
      world.methods.one.setTag([term], ['Verb', tense, tag], world, false, '3-subject-verb')
      return
    }
  }
}
export default subjectVerb
