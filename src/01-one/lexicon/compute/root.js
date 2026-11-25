const verbForm = function (term) {
  const want = [
    'FirstPerson',
    'SecondPerson',
    'ThirdPerson',
    'FirstPersonPlural',
    'SecondPersonPlural',
    'ThirdPersonPlural'
  ]
  return want.find((tag) => term.tags.has(tag))
}

//relajarse -> relajar
const stripReflexive = function (str) {
  str = str.replace(/se$/, '')
  str = str.replace(/te$/, '')
  str = str.replace(/me$/, '')
  return str
}

const persons = {
  FirstPerson: 'first',
  SecondPerson: 'second',
  ThirdPerson: 'third',
  FirstPersonPlural: 'firstPlural',
  SecondPersonPlural: 'secondPlural',
  ThirdPersonPlural: 'thirdPlural',
}

// 'haber' is our auxiliary verb - the tagger gives it no tense
let haber = null
const isHaber = function (str, verb) {
  if (haber === null) {
    haber = new Set(verb.all('haber'))
    haber.add('hay')
  }
  return haber.has(str)
}

// the subjunctive is often person-ambiguous ('hable' is 1st or 3rd)
// so try each person, and keep an infinitive that conjugates back to our word
const fromSubjunctive = function (str, form, verb) {
  const order = [form].concat(Object.keys(persons)).filter((s) => s)
  for (let i = 0; i < order.length; i += 1) {
    const inf = verb.fromSubjunctive(str, order[i])
    if (inf && inf !== str && verb.toSubjunctive(inf)[persons[order[i]]] === str) {
      return inf
    }
  }
  return verb.fromPresent(str, form)
}

// most-specific first - an #Imperfect is also a #PastTense
const tenses = [
  ['Imperfect', 'fromImperfect'],
  ['PresentTense', 'fromPresent'],
  ['PastTense', 'fromPast'],
  ['FutureTense', 'fromFuture'],
  ['Conditional', 'fromConditional'],
]

// the tagger's tense + person are often a guess, and so is the infinitive we get from them.
// if it does not conjugate back into our word, look for a known verb that does
const checkRoot = function (str, guess, world) {
  const verb = world.methods.two.transform.verb
  // the models learned some verbs in their reflexive form - 'llovió' -> 'lloverse'
  guess = (guess || '').replace(/([aeií]r)se$/, '$1')
  const lexicon = world.model.one.lexicon
  const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive')
  const isOk = Boolean(guess) && guess !== str && verb.findHits(str, guess).length > 0
  if (isOk && isVerb(guess)) {
    return guess
  }
  // a verb that we know beats one that we do not - 'queremos' is 'querer', not the future of 'quer'
  const found = verb.lookup(str, { isVerb, known: true })
  return found ? found.root : guess
}

// the infinitive of a command with pronouns attached - the tagger has left its stem in 'machine'
// 'levántate' is 'levanta' + 'te', and 'siéntese' is 'siente' + 'se'
const fromCommand = function (term, world) {
  const verb = world.methods.two.transform.verb
  const lexicon = world.model.one.lexicon
  const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive')
  const stem = term.machine
  // the 'tú' command is the present-tense - 'levanta'
  const present = verb.candidates(stem, ['present']).filter((o) => isVerb(o.root) && o.hits.some((h) => h.person === 'third' || h.person === 'firstPlural'))
  // the 'usted' command is the subjunctive - 'levante'
  let formal = null
  const tags = ['ThirdPerson', 'ThirdPersonPlural']
  for (let i = 0; i < tags.length && !formal; i += 1) {
    const inf = (verb.fromSubjunctive(stem, tags[i]) || '').replace(/([aeií]r)se$/, '$1')
    if (inf && isVerb(inf) && verb.toSubjunctive(inf)[persons[tags[i]]] === stem) {
      formal = inf
    }
  }
  // '-se' is only for 'usted' - 'siéntese' is 'sentar', but 'siéntete' is 'sentir'
  const isFormal = /se$/.test(term.normal)
  const informal = present.length > 0 ? present[0].root : null
  return isFormal ? formal || informal : informal || formal
}

const sitWords = new Set(['en', 'a', 'al', 'junto', 'aquí', 'allí', 'ahí', 'cerca', 'delante', 'detrás'])

const root = function (view) {
  const { verb, noun, adjective } = view.world.methods.two.transform
  const lexicon = view.world.model.one.lexicon
  view.docs.forEach((terms) => {
    terms.forEach((term) => {
      // 'machine' may hold a clitic-stripped stem - 'dámelo' → 'da'
      let str = term.implicit || term.machine || term.normal || term.text

      if (term.tags.has('Verb')) {
        // copulas are a closed set - ser + estar
        if (term.tags.has('Copula')) {
          term.root = /^est/.test(str) ? 'estar' : 'ser'
          return
        }
        // get infinitive form of the verb
        if (term.tags.has('Reflexive')) {
          term.root = stripReflexive(str)
          return
        }
        if (isHaber(str, verb)) {
          term.root = 'haber'
          return
        }
        const form = verbForm(term)
        // 'levántate', 'siéntese' - a command, with its pronouns attached
        const imp = term.machine && term.tags.has('Imperative') ? fromCommand(term, view.world) : null
        if (imp) {
          term.root = imp
        } else if (term.tags.has('Subjunctive')) {
          term.root = fromSubjunctive(str, form, verb)
        } else if (term.tags.has('Gerund')) {
          term.root = verb.fromGerund(str, form)
        } else if (term.tags.has('Perfecto')) {
          term.root = verb.fromPerfecto(str, form)
        } else {
          // an indicative tense - 'hablo', 'habló', 'hablaba', 'hablará', 'hablaría'
          const from = tenses.find((o) => term.tags.has(o[0]))
          if (!from && term.tags.has('Imperative')) {
            term.root = verb.fromImperative(str, form)
          } else {
            // .. or a guess
            term.root = checkRoot(str, verb[(from || tenses[1])[1]](str, form), view.world)
          }
        }
      }

      // 'me siento mal' is 'sentir', but 'me siento en la silla' is 'sentar'
      if (term.tags.has('Verb') && term.normal === 'siento') {
        const next = terms[terms.indexOf(term) + 1]
        term.root = next && sitWords.has(next.normal) ? 'sentar' : 'sentir'
      }

      // nouns -> singular masculine form
      if (term.tags.has('Noun')) {
        if (term.tags.has('Plural')) {
          str = noun.toSingular(str, lexicon)
        }
        if (term.tags.has('FemaleNoun')) {
          // not sure about this
          // str = noun.toMasculine(str)
        }
        term.root = str
      }

      // nouns -> singular masculine form
      if (term.tags.has('Adjective')) {
        if (term.tags.has('PluralAdjective')) {
          if (term.tags.has('FemaleAdjective')) {
            str = adjective.fromFemalePlural(str, lexicon)
          } else {
            str = adjective.toSingular(str, lexicon)
          }
        }
        if (term.tags.has('FemaleAdjective')) {
          str = adjective.fromFemale(str, lexicon)
        }
        term.root = str
      }
    })
  })
  return view
}
export default root
