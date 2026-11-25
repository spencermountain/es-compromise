import makeLookup from './_lookup.js'
import { toPresent, toPast, toImperfect, toFuture, toConditional } from './tense.js'
import { fromPresent, fromPast, fromImperfect, fromFuture, fromConditional } from './toRoot.js'

// the reverse-models take a tag for the person
const tags = {
  first: 'FirstPerson',
  second: 'SecondPerson',
  third: 'ThirdPerson',
  firstPlural: 'FirstPersonPlural',
  secondPlural: 'SecondPersonPlural',
  thirdPlural: 'ThirdPersonPlural',
}
// the models learned some verbs in their reflexive form - 'llovió' -> 'lloverse'
const wrap = (fn) => (str, person) => (fn(str, tags[person]) || '').replace(/([aeií]r)se$/, '$1')

// the indicative tenses
const tenses = [
  { name: 'present', to: toPresent, from: wrap(fromPresent) },
  { name: 'past', to: toPast, from: wrap(fromPast) },
  { name: 'imperfect', to: toImperfect, from: wrap(fromImperfect) },
  { name: 'future', to: toFuture, from: wrap(fromFuture) },
  { name: 'conditional', to: toConditional, from: wrap(fromConditional) },
]

const { table, findHits, candidates, lookup } = makeLookup(tenses, { shape: /[aeií]r$/ })

export { table, findHits, candidates, lookup }
