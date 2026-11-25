// a negative command is the subjunctive - 'no vengas', 'no te vayas', 'no lo toques'
// some of these are also the present-tense of another verb:
// 'vengas' is 'venir' here, and not 'tú vengas' from 'vengar'

// object-pronouns go between 'no' and the verb
const clitics = new Set(['me', 'te', 'se', 'lo', 'la', 'le', 'los', 'las', 'les', 'nos', 'os'])
// the persons that can be told what to do
const persons = [
  ['SecondPerson', 'second'],
  ['ThirdPerson', 'third'],
  ['SecondPersonPlural', 'secondPlural'],
  ['ThirdPersonPlural', 'thirdPlural'],
  ['FirstPersonPlural', 'firstPlural'],
]
// their subjunctive is more likely than the present-tense of the verb it looks like:
// 'vengas' (vengar), 'sientas' (sentar), 'creas' (crear), 'mientas' (mentar)
const preferred = new Set(['venir', 'sentir', 'creer', 'mentir'])
const old = ['PresentTense', 'Subjunctive', 'FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural']

const isInfinitive = function (str, lexicon) {
  const tags = lexicon.hasOwnProperty(str) ? lexicon[str] : null
  return tags === 'Infinitive' || (Array.isArray(tags) && tags.includes('Infinitive'))
}

const negativeCommand = function (terms, world) {
  if (!terms[0] || terms[0].normal !== 'no') {
    return
  }
  let n = 1
  while (terms[n] && clitics.has(terms[n].normal)) {
    n += 1
  }
  const term = terms[n]
  if (!term || !term.tags.has('Verb') || term.tags.has('Imperative') || term.tags.has('Infinitive')) {
    return
  }
  // a statement has its subject - 'no vengas tú', but 'no viene nadie'
  const isSubjunctive = term.tags.has('Subjunctive')
  if (!isSubjunctive && !term.tags.has('PresentTense')) {
    return
  }
  const verb = world.methods.two.transform.verb
  const lexicon = world.model.one.lexicon
  const str = term.normal
  for (let k = 0; k < persons.length; k += 1) {
    const [tag, form] = persons[k]
    const inf = (verb.fromSubjunctive(str, tag) || '').replace(/([aeií]r)se$/, '$1')
    // it has to be the subjunctive of a verb that we know
    if (inf && inf !== str && isInfinitive(inf, lexicon) && verb.toSubjunctive(inf)[form] === str) {
      // 'no paras de hablar' is the present of 'parar' - only these verbs win over a present-tense
      if (!isSubjunctive && !preferred.has(inf)) {
        continue
      }
      const { setTag, unTag } = world.methods.one
      old.forEach((t) => unTag([term], t, world.model.one.tagSet))
      setTag([term], ['Verb', 'Imperative', tag], world, false, '3-negative-command')
      return
    }
  }
}
export default negativeCommand
