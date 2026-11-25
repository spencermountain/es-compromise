// 'quiero que vengas' - 'vengas' is the subjunctive of 'venir', but also the present-tense of 'vengar'
// after a verb of wanting, hoping or doubting, '.. que' takes the subjunctive.
const triggers = [
  'querer', 'esperar', 'desear', 'necesitar', 'pedir', 'preferir', 'dudar', 'temer', 'sugerir', 'recomendar',
  'exigir', 'permitir', 'prohibir', 'rogar', 'mandar', 'ordenar', 'aconsejar', 'insistir', 'gustar', 'importar',
  'molestar', 'alegrar',
]
// 'para que sepas', 'ojalá que llueva'
const before = new Set(['para', 'sin', 'ojalá', 'aunque'])
// 'es importante que estudies'
const impersonal = new Set(['importante', 'necesario', 'posible', 'imposible', 'mejor', 'probable', 'bueno', 'malo'])

// words that sit between 'que' and its verb - 'que ella no lo haga'
const fillers = new Set([
  'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros', 'vosotras', 'ellos', 'ellas', 'ustedes',
  'no', 'nunca', 'ya', 'también', 'me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os',
])

const persons = [
  ['ThirdPerson', 'third'],
  ['FirstPerson', 'first'],
  ['SecondPerson', 'second'],
  ['FirstPersonPlural', 'firstPlural'],
  ['SecondPersonPlural', 'secondPlural'],
  ['ThirdPersonPlural', 'thirdPlural'],
]

const isInfinitive = function (str, lexicon) {
  if (!lexicon.hasOwnProperty(str)) {
    return false
  }
  const tags = lexicon[str]
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

// every conjugation of our trigger verbs
let forms = null
const isTrigger = function (str, verb) {
  if (forms === null) {
    forms = new Set()
    triggers.forEach((inf) => verb.all(inf).forEach((w) => forms.add(w)))
  }
  return forms.has(str)
}

// does this 'que' follow something that wants a subjunctive?
const hasTrigger = function (terms, i, verb) {
  const prev = terms[i - 1]
  if (!prev) {
    return false
  }
  if (before.has(prev.normal) || impersonal.has(prev.normal)) {
    return true
  }
  // 'quiero que', 'te pido a ti que'
  for (let k = i - 1; k >= 0 && k >= i - 4; k -= 1) {
    if (isTrigger(terms[k].normal, verb)) {
      return true
    }
  }
  return false
}

const checkSubjunctive = function (terms, i, world) {
  if (terms[i].normal !== 'que') {
    return
  }
  let n = i + 1
  while (terms[n] && fillers.has(terms[n].normal)) {
    n += 1
  }
  const term = terms[n]
  if (!term || !term.tags.has('Verb') || term.tags.has('Subjunctive') || term.tags.has('Infinitive')) {
    return
  }
  const verb = world.methods.two.transform.verb
  if (!hasTrigger(terms, i, verb)) {
    return
  }
  const lexicon = world.model.one.lexicon
  const str = term.normal
  // prefer the person it already has
  const order = persons.filter((a) => term.tags.has(a[0])).concat(persons.filter((a) => !term.tags.has(a[0])))
  for (let k = 0; k < order.length; k += 1) {
    const [tag, form] = order[k]
    const inf = verb.fromSubjunctive(str, tag)
    if (inf && inf !== str && isInfinitive(inf, lexicon) && verb.toSubjunctive(inf)[form] === str) {
      const { setTag, unTag } = world.methods.one
      const old = ['PresentTense', 'Imperative'].concat(persons.map((a) => a[0]))
      old.forEach((t) => unTag([term], t, world.model.one.tagSet))
      setTag([term], ['Verb', 'Subjunctive', tag], world, false, '3-que-subjunctive')
      return
    }
  }
}
export default checkSubjunctive
