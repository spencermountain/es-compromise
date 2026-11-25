// many verb-forms are also a noun or an adjective - 'vino', 'juego', 'trabajo', 'camino', 'vivo'
// and the lexicon gives them to the noun.
// so look for one of these, in a place where a verb goes.

// each subject, and the person of its verb - 'yo vino' is not a verb
const subjects = {
  yo: 'first',
  tú: 'second',
  él: 'third',
  ella: 'third',
  usted: 'third',
  nosotros: 'firstPlural',
  nosotras: 'firstPlural',
  vosotros: 'secondPlural',
  vosotras: 'secondPlural',
  ellos: 'thirdPlural',
  ellas: 'thirdPlural',
  ustedes: 'thirdPlural',
}
// words that are followed by a verb - 'no [vino]', 'se [cierra]', 'dice que [vino]'
const before = new Set(['no', 'nunca', 'ya', 'también', 'tampoco', 'siempre', 'me', 'te', 'se', 'nos', 'os', 'le', 'les', 'que', 'si', 'cuando', 'porque', 'donde', 'quien'])
// .. these ones begin a clause, and a noun can follow them too
const clauseWords = new Set(['que', 'si', 'cuando', 'porque', 'donde', 'quien'])
// 'qué vino [tan] bueno'
const degrees = new Set(['tan', 'más', 'muy', 'menos'])
const reflexives = new Set(['me', 'te', 'se', 'nos', 'os'])
const joins = new Set(['y', 'o', 'pero'])
// 'vino [mañana]'
const dates = new Set(['mañana', 'ayer', 'hoy', 'tarde', 'temprano', 'anoche', 'ahora'])
// 'trabajo [de] noche' - but 'trabajo de equipo' is a noun-phrase
const deWords = new Set(['día', 'noche', 'tarde', 'mañana', 'nuevo', 'prisa', 'vez', 'pie'])
const tenses = { present: 'PresentTense', past: 'PastTense', imperfect: 'Imperfect', future: 'FutureTense' }
const persons = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
const nonFinite = ['Infinitive', 'Gerund', 'Perfecto', 'Participle']

const isInfinitive = function (str, lexicon) {
  const tags = lexicon.hasOwnProperty(str) ? lexicon[str] : null
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}
const isFiniteTag = (term) => term.tags.has('Verb') && !nonFinite.some((tag) => term.tags.has(tag))
// a verb-form after 'la' or 'mi' will become a noun - 'pago la [cuenta]'
const isFinite = function (term, i, terms) {
  const prev = terms[i - 1]
  return isFiniteTag(term) && !(prev && prev.tags.has('Determiner'))
}
const isNoun = (term) => Boolean(term) && term.tags.has('Noun') && !term.tags.has('Pronoun')
// something that a verb can lead into - 'juego [al] fútbol', 'cierra [la] puerta', 'vivo [aquí]'
const isObject = function (term) {
  if (!term) {
    return false
  }
  const tags = term.tags
  return tags.has('Determiner') || tags.has('Preposition') || tags.has('Adverb') || tags.has('Value') || dates.has(term.normal)
}

const homographVerbs = function (terms, world) {
  const lexicon = world.model.one.lexicon
  const verb = world.methods.two.transform.verb
  const isVerb = (inf) => isInfinitive(inf, lexicon)
  const lookup = function (term, i) {
    const tags = term.tags
    // 'me [visto]' is 'vestir' - a participle needs its auxiliary before it
    const prev = terms[i - 1]
    const isReflexive = tags.has('Perfecto') && Boolean(prev) && reflexives.has(prev.normal)
    if (!isReflexive && (tags.has('Verb') || !(tags.has('Noun') || tags.has('Adjective')))) {
      return null
    }
    if (tags.has('Pronoun') || term.implicit !== undefined) {
      return null
    }
    // a name, or a place - 'en Vino Tinto'
    if (term.normal.length < 3 || (i > 0 && /^\p{Lu}/u.test(term.text || ''))) {
      return null
    }
    return verb.lookup(term.normal, { isVerb, known: true, tenses: Object.keys(tenses) })
  }
  const tag = function (term, hit, reason) {
    term.tags.clear()
    world.methods.one.setTag([term], ['Verb', tenses[hit.tense], persons[hit.person]], world, false, reason)
  }
  // is there a verb already, in this part of the sentence? - 'trabajo de día | y estudio de noche'
  const hasVerb = function (i) {
    const isEdge = (t) => joins.has(t.normal) || /[,;:]/.test(t.post)
    let start = i
    while (start > 0 && !isEdge(terms[start - 1])) {
      start -= 1
    }
    let end = i
    while (end < terms.length - 1 && !isEdge(terms[end]) && !joins.has(terms[end + 1].normal)) {
      end += 1
    }
    return terms.slice(start, end + 1).some(isFinite)
  }
  let person = null
  for (let i = 0; i < terms.length; i += 1) {
    const term = terms[i]
    const prev = terms[i - 1]
    const next = terms[i + 1]
    const found = lookup(term, i)
    if (!found) {
      continue
    }
    // one more verb, for the same subject - 'trabajo de día y [estudio] de noche'
    if (person !== null && prev && joins.has(prev.normal)) {
      const same = found.hits.find((o) => o.person === person)
      if (same) {
        tag(term, same, '3-homograph-verb-and')
      }
      continue
    }
    let hit = null
    if (prev && subjects.hasOwnProperty(prev.normal)) {
      // 'ella cierra la puerta'
      hit = found.hits.find((o) => o.person === subjects[prev.normal])
    } else if (prev && before.has(prev.normal)) {
      // 'no vino', 'dice que vino mañana' - but 'más alto que bajo', 'dice que nada importa'
      // .. and 'donde vivo, nieva mucho'
      const isEnd = prev.normal !== 'que' && (!next || /,/.test(term.post))
      const isLoose = clauseWords.has(prev.normal) && !isObject(next) && !isEnd
      // an exclamation, with no clause before it - 'que vino tan bueno!'
      const isExclaim = i === 1 && prev.normal === 'que' && next && degrees.has(next.normal)
      hit = isLoose || isExclaim ? null : found.hits[0]
    } else if (hasVerb(i)) {
      // the sentence has its verb already
    } else if (!prev) {
      // 'Juego al fútbol.', 'Vino mañana.'
      const after = terms[i + 2]
      const isOf = next && next.normal === 'de' && !(after && (deWords.has(after.normal) || after.tags.has('Infinitive')))
      hit = isObject(next) && !isOf ? found.hits[0] : null
    } else if (isNoun(prev) && isObject(next)) {
      // 'mi madre cocina la cena'
      hit = found.hits.find((o) => o.person === 'third' || o.person === 'thirdPlural')
    }
    if (hit) {
      tag(term, hit, '3-homograph-verb')
      person = hit.person
    }
  }
}
export { subjects, tenses, persons }
export default homographVerbs
