// 'como' is nearly always a conjunction - 'tan alto como su padre', 'como siempre'
// but it is also 'I eat' - 'como pan', 'no como carne', 'como y bebo'
// a comparison needs a clause to hang from, so when 'como' leads a sentence that has
// no other verb, it is the verb.

// words that may come before the verb - 'hoy no lo como'
const before = new Set([
  'no', 'nunca', 'ya', 'también', 'tampoco', 'siempre', 'casi', 'solo', 'sólo', 'hoy', 'ahora', 'aquí',
  'normalmente', 'generalmente', 'mañana', 'luego', 'después', 'entonces', 'y', 'pero',
  'me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os',
])
// 'como siempre', 'como tú', 'como si nada', 'como resultado'
const notAfter = new Set([
  'siempre', 'nunca', 'antes', 'si', 'que', 'yo', 'tú', 'él', 'ella', 'usted', 'nosotros', 'nosotras', 'vosotros',
  'ellos', 'ellas', 'ustedes', 'mucho', 'máximo', 'mínimo', 'resultado', 'consecuencia', 'ejemplo', 'respuesta',
  'parte', 'regla', 'norma', 'tal', 'era', 'es', 'ayer', 'hoy', 'mañana', 'entonces', 'nadie', 'todos', 'todo',
  'cualquier', 'cualquiera', 'quien', 'cuando', 'para', 'por', 'de', 'prueba', 'muestra',
])
const pronouns = new Set(['me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os'])
// verb-forms that can not hold-up a clause on their own
const nonFinite = ['Infinitive', 'Gerund', 'Perfecto', 'Participle']

const isFinite = (term) => term.tags.has('Verb') && !nonFinite.some((tag) => term.tags.has(tag))

const como = function (terms, i, world) {
  const term = terms[i]
  if (term.normal !== 'como' || term.tags.has('Verb')) {
    return
  }
  const setVerb = (reason) => {
    term.tags.clear()
    world.methods.one.setTag([term], ['Verb', 'PresentTense', 'FirstPerson'], world, false, reason)
  }
  const prev = terms[i - 1]
  const next = terms[i + 1]
  // 'como y bebo', 'bebo y como'
  const isFirst = (t) => Boolean(t) && t.tags.has('Verb') && t.tags.has('FirstPerson')
  if (next && (next.normal === 'y' || next.normal === 'o') && isFirst(terms[i + 2])) {
    setVerb('3-como-y-verb')
    return
  }
  if (prev && (prev.normal === 'y' || prev.normal === 'o') && isFirst(terms[i - 2]) && !terms[i - 2].tags.has('Copula')) {
    setVerb('3-verb-y-como')
    return
  }
  // 'me lo como todo' - an object-pronoun is right before its verb
  if (prev && pronouns.has(prev.normal)) {
    setVerb('3-clitic-como')
    return
  }
  // nothing before it, but words like 'no', 'hoy'
  if (!terms.slice(0, i).every((t) => before.has(t.normal))) {
    return
  }
  // .. and no other verb for it to lean on
  if (terms.some((t, k) => k !== i && isFinite(t))) {
    return
  }
  if (!next) {
    // 'nunca como'
    if (i > 0) {
      setVerb('3-neg-como')
    }
    return
  }
  // 'no como mucho'
  const isNegated = prev && ['no', 'nunca', 'tampoco', 'casi'].includes(prev.normal)
  if (next.normal === 'mucho' && isNegated) {
    setVerb('3-como-mucho')
    return
  }
  if (notAfter.has(next.normal) || next.tags.has('Pronoun') || next.tags.has('Conjunction')) {
    return
  }
  setVerb('3-como-verb')
}
export default como
