import { convert } from 'suffix-thumb'
import model from '../models.js'
import { toGerund } from './gerund.js'
import { toPerfecto } from './perfecto.js'
import { toReflexive } from './reflexive.js'
const { presentTense, pastTense, imperfectTense, futureTense, conditional, subjunctive, imperfectSubjunctive, imperative } = model

// the pronoun is not part of the conjugation - 'acostarse' conjugates as 'acostar'
const plain = (str) => str.replace(/([aeií]r)se$/, '$1')

const doEach = function (str, m) {
  str = plain(str)
  return {
    first: convert(str, m.first),
    second: convert(str, m.second),
    third: convert(str, m.third),
    firstPlural: convert(str, m.firstPlural),
    secondPlural: convert(str, m.secondPlural),
    thirdPlural: convert(str, m.thirdPlural)
  }
}

const toPresent = (str) => doEach(str, presentTense)
const toPast = (str) => doEach(str, pastTense)
const toImperfect = (str) => doEach(str, imperfectTense)
const toFuture = (str) => doEach(str, futureTense)
const toSubjunctive = (str) => doEach(str, subjunctive)
// 'si pudiera...' (-ra series)
const toImperfectSubjunctive = (str) => doEach(str, imperfectSubjunctive)
// 'si pudiese...' - the -se series is a regular respelling of the -ra one
const toImperfectSubjunctiveSe = (str) => {
  const obj = toImperfectSubjunctive(str)
  return {
    first: obj.first ? obj.first.replace(/ra$/, 'se') : obj.first,
    second: obj.second ? obj.second.replace(/ras$/, 'ses') : obj.second,
    third: obj.third ? obj.third.replace(/ra$/, 'se') : obj.third,
    firstPlural: obj.firstPlural ? obj.firstPlural.replace(/ramos$/, 'semos') : obj.firstPlural,
    secondPlural: obj.secondPlural ? obj.secondPlural.replace(/rais$/, 'seis') : obj.secondPlural,
    thirdPlural: obj.thirdPlural ? obj.thirdPlural.replace(/ran$/, 'sen') : obj.thirdPlural,
  }
}
const toConditional = (str) => doEach(str, conditional)
// the short 'tú' commands, and the verbs built on them - 'pon', 'supón', 'ten', 'mantén', 'haz', 'sal', 'di', 'ven'
const shortCommand = /(p[oó]n|t[eé]n|v[eé]n|haz|sal|satisfaz)$/
// .. a longer verb takes an accent, to keep its stress - 'convén', 'detén', 'compón' - but 'rehaz', 'sobresal'
const compounds = /^(.+)(venir|tener|poner|hacer|salir)$/
const shortForms = { venir: 'vén', tener: 'tén', poner: 'pón', hacer: 'haz', salir: 'sal' }
const ownCommand = { ir: 've', ser: 'sé', haber: 'he', decir: 'di' }

const toImperative = (str) => {
  const obj = doEach(str, imperative)
  str = plain(str)
  // the model is only sure of the verbs it has seen - the rest follow from the other tenses:
  // 'tú' is the third-person present - 'habla'
  const compound = str.match(compounds)
  if (ownCommand.hasOwnProperty(str)) {
    obj.second = ownCommand[str]
  } else if (compound) {
    // 'intervenir' is 'intervén', as 'venir' is 'ven'
    obj.second = compound[1] + shortForms[compound[2]]
  } else if (!shortCommand.test(obj.second || '')) {
    obj.second = toPresent(str).third || obj.second
  }
  // 'usted' and 'ustedes' are the subjunctive - 'hable', 'hablen'
  const subj = toSubjunctive(str)
  obj.third = subj.third || obj.third
  obj.thirdPlural = subj.thirdPlural || obj.thirdPlural
  // 'vosotros' is the infinitive, with a 'd' - 'hablad'
  obj.secondPlural = /r$/.test(str) ? str.replace(/r$/, 'd') : obj.secondPlural
  // imperative has no first-person
  // because ...you can't tell yourself to do something.
  obj.first = ''
  obj.firstPlural = ''
  return obj
}

// an array of every inflection, for '{inf}' syntax
const all = function (str) {
  let res = [str]
    .concat(
      Object.values(toPresent(str)),
      Object.values(toPast(str)),
      Object.values(toImperfect(str)),
      Object.values(toFuture(str)),
      Object.values(toConditional(str)),
      Object.values(toImperative(str)),
      Object.values(toSubjunctive(str)),
      Object.values(toImperfectSubjunctive(str)),
      Object.values(toImperfectSubjunctiveSe(str)),
      Object.values(toReflexive(str)), //infinitive reflexive - 'quemarme'
      toGerund(str),
      toPerfecto(str)
    )
    .filter((s) => s)
  res = new Set(res)
  return Array.from(res)
}

export {
  all,
  toPresent,
  toPast,
  toImperfect,
  toFuture,
  toConditional,
  toSubjunctive,
  toImperfectSubjunctive,
  toImperfectSubjunctiveSe,
  toImperative
}
