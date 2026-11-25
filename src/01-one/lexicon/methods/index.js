import {
  toPresent,
  toPast,
  toImperfect,
  toFuture,
  toConditional,
  toSubjunctive,
  toImperfectSubjunctive,
  toImperfectSubjunctiveSe,
  toImperative,
  all as allVerb
} from './verbs/tense.js'
import {
  fromPresent,
  fromPast,
  fromImperfect,
  fromFuture,
  fromConditional,
  fromSubjunctive,
  fromImperative
} from './verbs/toRoot.js'
import { toPlural, fromPlural, all as allNoun } from './nouns/index.js'
import toMasculine from './nouns/toMasculine.js'
import { takesEl } from './nouns/rules.js'
import adjective from './adjectives/index.js'
import { fromGerund, toGerund } from './verbs/gerund.js'
import { fromPerfecto, toPerfecto } from './verbs/perfecto.js'
import { toReflexive, stripReflexive } from './verbs/reflexive.js'
import { table, findHits, candidates, lookup } from './verbs/lookup.js'

export default {
  verb: {
    fromGerund,
    fromPresent,
    fromPast,
    fromImperfect,
    fromFuture,
    fromConditional,
    fromSubjunctive,
    fromImperative,
    toPresent,
    toPast,
    toImperfect,
    toFuture,
    toConditional,
    toGerund,
    toSubjunctive,
    toImperfectSubjunctive,
    toImperfectSubjunctiveSe,
    toImperative,
    fromPerfecto,
    toPerfecto,
    toReflexive,
    stripReflexive,
    table,
    findHits,
    candidates,
    lookup,
    all: allVerb
  },
  noun: {
    toPlural,
    fromPlural,
    toSingular: fromPlural,
    toMasculine,
    takesEl,
    all: allNoun
  },
  adjective
}
