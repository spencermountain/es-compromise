import lexData from './_data.js'
import { unpack } from 'efrt'
import methods from './methods/index.js'
import misc from './misc.js'
import { properNouns } from 'compromise/shared'

const {
  toPresent,
  toPast,
  toImperfect,
  toFuture,
  toConditional,
  toGerund,
  toPerfecto,
  toImperative,
  toSubjunctive,
  toImperfectSubjunctive,
  toImperfectSubjunctiveSe,
  toReflexive
} = methods.verb
const lexicon = {}
const infinitives = []

const tagMap = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural'
}

const addWords = function (obj, tag, lex) {
  // when two persons share a form ('hablaba' is 1st + 3rd person),
  // don't pick one - just tag the tense
  const counts = {}
  Object.keys(obj).forEach((k) => {
    counts[obj[k]] = (counts[obj[k]] || 0) + 1
  })
  Object.keys(obj).forEach((k) => {
    const w = obj[k]
    if (!w || lex[w]) {
      return
    }
    if (counts[w] > 1) {
      lex[w] = [tag]
    } else {
      lex[w] = [tag, tagMap[k]]
    }
  })
}

// attach the reflexive clitic to affirmative imperatives - 'lávate', 'lávese'
const toImperativeReflexive = function (obj) {
  const out = {}
  if (obj.second) {
    out.second = obj.second + 'te'
  }
  if (obj.third) {
    out.third = obj.third + 'se'
  }
  if (obj.firstPlural) {
    out.firstPlural = obj.firstPlural + 'nos'
  }
  if (obj.thirdPlural) {
    out.thirdPlural = obj.thirdPlural + 'se'
  }
  return out
}

Object.keys(lexData).forEach((tag) => {
  const wordsObj = unpack(lexData[tag])
  Object.keys(wordsObj).forEach((w) => {
    lexicon[w] = tag

    // add conjugations for our verbs
    if (tag === 'Infinitive') {
      // add present tense
      let obj = toPresent(w)
      addWords(obj, 'PresentTense', lexicon)
      // add past tense
      obj = toPast(w)
      addWords(obj, 'PastTense', lexicon)
      // add imperfect
      obj = toImperfect(w)
      addWords(obj, 'Imperfect', lexicon)
      // add future tense
      obj = toFuture(w)
      addWords(obj, 'FutureTense', lexicon)
      // add conditional
      obj = toConditional(w)
      addWords(obj, 'Conditional', lexicon)
      // add gerund
      let str = toGerund(w)
      lexicon[str] = lexicon[str] || 'Gerund'
      // add perfecto
      str = toPerfecto(w)
      lexicon[str] = lexicon[str] || 'Perfecto'
      // add reflexive infinitive forms
      obj = toReflexive(w)
      addWords(obj, 'Reflexive', lexicon)
      // the moods come after every verb has its tenses
      infinitives.push(w)
    }
    if (tag === 'Adjective') {
      const { toFemale, toPlural, toFemalePlural } = methods.adjective
      const f = toFemale(w)
      // 'rojos' - or 'grandes', for both genders
      const p = toPlural(w)
      lexicon[p] = lexicon[p] || ['Adjective', 'PluralAdjective']
      if (f !== w) {
        lexicon[f] = lexicon[f] || ['Adjective', 'FemaleAdjective', 'SingularAdjective']
        const fs = toFemalePlural(w)
        lexicon[fs] = lexicon[fs] || ['Adjective', 'FemaleAdjective', 'PluralAdjective']
      }
    }
    if (tag === 'Cardinal') {
      lexicon[w] = ['Cardinal', 'TextValue']
    }
    if (tag === 'Ordinal') {
      lexicon[w] = ['Ordinal', 'TextValue']
    }
  })
})

// a tense wins over a mood - 'sienten' is the present of 'sentir', before it is a command of 'sentar'
infinitives.forEach((w) => {
  // add imperative
  let obj = toImperative(w)
  addWords(obj, 'Imperative', lexicon)
  // add reflexive for some imperative forms
  obj = toImperativeReflexive(obj)
  addWords(obj, 'Reflexive', lexicon)
  // add toSubjunctive
  obj = toSubjunctive(w)
  addWords(obj, 'Subjunctive', lexicon)
  // imperfect subjunctive - 'si pudiera', 'si pudiese'
  obj = toImperfectSubjunctive(w)
  addWords(obj, 'Subjunctive', lexicon)
  obj = toImperfectSubjunctiveSe(w)
  addWords(obj, 'Subjunctive', lexicon)
})

// hand-curated entries always win
Object.assign(lexicon, misc)
// console.log(lexicon['ganado'])

// names of people and places, shared by every language - our own words win
Object.keys(properNouns).forEach(tag => {
  Object.keys(unpack(properNouns[tag])).forEach(w => {
    lexicon[w] = lexicon[w] || tag
  })
})

export default lexicon
