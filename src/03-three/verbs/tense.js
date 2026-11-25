// re-conjugate a verb-phrase into another tense, in-place
// 'yo hablo' -> 'yo hablé' -> 'yo hablaré'
//
// only the finite verb is changed - 'quiero ir' -> 'quise ir'
// and its grammatical person is kept - 'hablamos' -> 'hablaremos'
// spanish drops its subject pronouns, so the person is read from the verb itself

const personTags = {
  FirstPerson: 'first',
  SecondPerson: 'second',
  ThirdPerson: 'third',
  FirstPersonPlural: 'firstPlural',
  SecondPersonPlural: 'secondPlural',
  ThirdPersonPlural: 'thirdPlural',
}
const toPersonTag = Object.keys(personTags).reduce((h, k) => {
  h[personTags[k]] = k
  return h
}, {})

const tenseTags = {
  present: 'PresentTense',
  past: 'PastTense',
  imperfect: 'Imperfect',
  future: 'FutureTense',
  conditional: 'Conditional',
}

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

// object-pronouns sit between the subject and its verb - 'yo no lo sé'
const clitics = new Set(['me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os'])
// other words allowed between a subject and its verb - 'yo nunca hablaba'
const fillers = new Set(['no', 'nunca', 'ya', 'también', 'tampoco', 'siempre', 'casi', 'solo', 'sólo', 'aún', 'todavía'])

// the preterites of 'ser' and 'ir' are identical - 'fui feliz' vs 'fui a casa'
const serOrIr = new Set(['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'])
const afterIr = new Set(['a', 'al', 'hacia', 'hasta', 'para', 'allí', 'allá', 'ahí'])

// verb-forms that are not an indicative tense
const skipTags = ['Infinitive', 'Gerund', 'Perfecto', 'Participle', 'Imperative', 'Subjunctive']

const reflexives = new Set(['me', 'te', 'se', 'nos', 'os'])

const getRoot = function (term, next, prev) {
  const str = term.normal
  if (serOrIr.has(str) && next && (afterIr.has(next.normal) || next.tags.has('Infinitive'))) {
    return 'ir'
  }
  // 'se fue', 'me fui' - 'irse' is to leave
  if (serOrIr.has(str) && prev && reflexives.has(prev.normal)) {
    return 'ir'
  }
  return term.root
}

const isInfinitive = function (str, lexicon) {
  const tags = lexicon.hasOwnProperty(str) ? lexicon[str] : null
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

// which tense + person is this word?
const parseTerm = function (term, next, methods, lexicon, prev) {
  const str = term.normal
  if (!term.tags.has('Verb') || clitics.has(str) || skipTags.some((tag) => term.tags.has(tag))) {
    return null
  }
  const root = getRoot(term, next, prev)
  if (!root) {
    return null
  }
  // the existential 'hay un gato'
  if (str === 'hay') {
    return { root, hits: [{ tense: 'present', person: 'third' }] }
  }
  // find the word in its own conjugation table
  // no root was found for this one
  // the tagger gives some verbs no tense, and so no root - 'sabe', 'pude'
  if (root === str) {
    return methods.lookup(str, { isVerb: (inf) => isInfinitive(inf, lexicon) })
  }
  const hits = methods.findHits(str, root)
  if (hits.length > 0) {
    return { root, hits }
  }
  // otherwise, trust the tagger
  // most-specific first - an #Imperfect is also a #PastTense
  const tense = ['imperfect', 'conditional', 'future', 'past', 'present'].find((k) => term.tags.has(tenseTags[k]))
  if (!tense) {
    return null
  }
  const tag = Object.keys(personTags).find((k) => term.tags.has(k))
  const found = tag ? [personTags[tag]] : ['first', 'third']
  return { root, hits: found.map((person) => ({ tense, person })) }
}

// look backwards for a subject-pronoun - 'yo no lo [sé]'
const getSubject = function (terms, i) {
  for (let k = i - 1; k >= 0; k -= 1) {
    const str = terms[k].normal
    if (subjects.hasOwnProperty(str)) {
      return subjects[str]
    }
    if (!clitics.has(str) && !fillers.has(str)) {
      return null
    }
  }
  return null
}

// 'hablaba' is both first and third person
const choosePerson = function (hits, term, terms, i) {
  const found = hits.map((o) => o.person).filter((p, k, arr) => arr.indexOf(p) === k)
  if (found.length === 1) {
    return found[0]
  }
  const tag = Object.keys(personTags).find((k) => term.tags.has(k))
  if (tag && found.includes(personTags[tag])) {
    return personTags[tag]
  }
  const subj = getSubject(terms, i)
  if (subj && found.includes(subj)) {
    return subj
  }
  return found.includes('third') ? 'third' : found[0]
}

// 'Hablo' -> 'Hablé'
const matchCase = function (str, term) {
  const orig = term.text || ''
  if (orig.length > 1 && orig === orig.toUpperCase() && orig !== orig.toLowerCase()) {
    return str.toUpperCase()
  }
  if (orig && orig[0] !== orig[0].toLowerCase()) {
    return str[0].toUpperCase() + str.slice(1)
  }
  return str
}

// 'comido', and also 'estado' - which the tagger calls a copula
const isParticiple = function (term, methods) {
  if (term.tags.has('Perfecto') || term.tags.has('Participle')) {
    return true
  }
  return Boolean(term.root) && term.root !== term.normal && methods.toPerfecto(term.root) === term.normal
}

// returns the (possibly shorter) pointer of the new verb-phrase
const convertOne = function (vb, want, methods, lexicon) {
  const ptr = vb.fullPointer[0]
  if (!ptr) {
    return null
  }
  vb.compute('root')
  const [n, start, end] = ptr
  const same = [n, start, end]
  const terms = vb.document[n]
  // the first conjugated verb in the phrase is the finite one
  let index = null
  let parsed = null
  for (let i = start; i < end; i += 1) {
    parsed = parseTerm(terms[i], terms[i + 1], methods, lexicon, terms[i - 1])
    if (parsed) {
      index = i
      break
    }
  }
  if (!parsed) {
    return same
  }
  const term = terms[index]
  const tenses = parsed.hits.map((o) => o.tense)
  // the conditional is a mood, not a tense - 'hablaría'
  if (tenses.every((t) => t === 'conditional')) {
    return same
  }
  const person = choosePerson(parsed.hits, term, terms, index)
  let root = parsed.root
  let len = 1
  const next = terms[index + 1]
  const isPerfect = root === 'haber' && Boolean(next) && index + 1 < end && isParticiple(next, methods)
  if (isPerfect) {
    // 'he comido' and 'había comido' are already in the past
    if (want === 'past') {
      return same
    }
    // 'habré comido' is already in the future
    if (want === 'future' && tenses.includes('future')) {
      return same
    }
    // collapse it to a simple tense - 'he comido' -> 'como'
    root = next.root
    len = 2
  } else if (tenses.includes(want) || (want === 'past' && tenses.includes('imperfect'))) {
    // already there
    return same
  }
  let str = methods.table(root, [want])[want][person]
  // existential - 'había un gato' -> 'hay un gato'
  if (root === 'haber' && want === 'present' && person === 'third' && !isPerfect) {
    str = 'hay'
  }
  if (!str) {
    return same
  }
  str = matchCase(str, term)
  const m = vb.update([[n, index, index + len]])
  m.replaceWith(str)
  // the new word may not be in our lexicon
  vb.update([[n, index, index + 1]]).tag(['Verb', tenseTags[want], toPersonTag[person]], 'to-' + want)
  return [n, start, end - (len - 1)]
}

// a verb-phrase can hold two clauses - 'la mujer que [canta es] mi tía', 'donde [vivo, nieva]'
// so give each conjugated verb a phrase of its own
const convertEach = function (vb, want, methods, lexicon) {
  const ptr = vb.fullPointer[0]
  if (!ptr) {
    return null
  }
  vb.compute('root')
  const [n, start, end] = ptr
  const terms = vb.document[n]
  const found = []
  for (let i = start; i < end; i += 1) {
    if (parseTerm(terms[i], terms[i + 1], methods, lexicon, terms[i - 1])) {
      found.push(i)
    }
  }
  if (found.length < 2) {
    return convertOne(vb, want, methods, lexicon)
  }
  // last one first, so that the indexes before it stay true
  let shrink = 0
  for (let k = found.length - 1; k >= 0; k -= 1) {
    const from = k === 0 ? start : found[k]
    const to = k === found.length - 1 ? end : found[k + 1]
    const res = convertOne(vb.update([[n, from, to]]), want, methods, lexicon)
    shrink += res ? to - res[2] : 0
  }
  return [n, start, end - shrink]
}

const convertTo = function (view, want) {
  const methods = view.methods.two.transform.verb
  // replacing a word orphans the pointer that held it, so rebuild them as we go
  const lexicon = view.model.one.lexicon
  const ptrs = []
  view.forEach((vb) => {
    const ptr = convertEach(vb, want, methods, lexicon)
    if (ptr) {
      ptrs.push(ptr)
    }
  })
  return view.update(ptrs)
}

export default convertTo
