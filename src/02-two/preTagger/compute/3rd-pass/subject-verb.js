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

const tenses = { present: 'PresentTense', past: 'PastTense', imperfect: 'Imperfect', future: 'FutureTense' }

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
  // it has to be a known verb, that conjugates back to this word
  const res = verb.lookup(term.normal, { isVerb: (inf) => isInfinitive(inf, lexicon), known: true, tenses: Object.keys(tenses) })
  const hit = res ? res.hits.find((o) => o.person === form) : null
  if (hit) {
    world.methods.one.setTag([term], ['Verb', tenses[hit.tense], tag], world, false, '3-subject-verb')
  }
}
export default subjectVerb
