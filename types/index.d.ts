import type View from 'compromise/view/one'
import type { Lexicon, Plugin, matchOptions, Match, Net } from 'compromise/misc'

/** conjugated forms for each grammatical person */
export interface ConjugationSet {
  first: string
  second: string
  third: string
  firstPlural: string
  secondPlural: string
  thirdPlural: string
}

/** all conjugations of a verb */
export interface VerbConjugation {
  /** 'hablo', 'hablas' .. */
  presentTense: ConjugationSet
  /** 'hablé', 'hablaste' .. */
  pastTense: ConjugationSet
  /** 'hablaré', 'hablarás' .. */
  futureTense: ConjugationSet
  /** 'hablaría', 'hablarías' .. */
  conditional: ConjugationSet
  /** 'hablando' */
  gerund: string
  /** past-participle - 'hablado' */
  perfecto: string
  /** 'habla', 'hable' .. (first-person forms are empty strings) */
  imperative: ConjugationSet
  /** 'hable', 'hables' .. */
  subjunctive: ConjugationSet
}

export interface NounConjugation {
  singular: string
  plural: string
}

export interface AdjectiveConjugation {
  male: string
  female: string
  plural: string
  femalePlural: string
}

/** the interpretation of one number */
export interface ParsedNumber {
  hasComma: boolean
  prefix: string
  num: number | null
  suffix: string
  isText: boolean
  isOrdinal: boolean
  isFraction: boolean
  isMoney: boolean
}

export interface Verbs extends View {
  /** get all conjugated forms of these verbs - 'como', 'comí', 'comeré' .. */
  conjugate(n?: number): VerbConjugation[]
}

export interface Nouns extends View {
  /** get the singular and plural forms of these nouns - 'gato', 'gatos' */
  conjugate(n?: number): NounConjugation[]
  /** return only the plural nouns - 'gatos' */
  isPlural(n?: number): View
  /** re-write these nouns as plural - 'el gato' → 'los gatos' */
  toPlural(n?: number): Nouns
  /** re-write these nouns as singular - 'los gatos' → 'el gato' */
  toSingular(n?: number): Nouns
}

export interface Adjectives extends View {
  /** get all gender/plural forms of these adjectives - 'negro', 'negra', 'negros', 'negras' */
  conjugate(n?: number): AdjectiveConjugation[]
}

export interface Numbers extends View {
  /** get the interpretation of each number */
  parse(n?: number): ParsedNumber[]
  /** get the numeric value of each number - 'veinticinco' → 25 */
  get(n?: number): (number | null)[]
  /** json output, with parsed number data for each match - a number returns only the nth match */
  json(n?: number | string | object): any
  /** return the unit following each number - 'kilos' */
  units(): View
  /** return only ordinal numbers - 'quinto' */
  isOrdinal(): Numbers
  /** return only cardinal numbers - 'cinco' */
  isCardinal(): Numbers
  /** re-write these numbers as digits - 'cuarenta' → '40' */
  toNumber(): Numbers
  /** re-write these numbers as words - '40' → 'cuarenta' */
  toText(): Numbers
  /** re-write these numbers as cardinal - 'cuadragésimo' → 'cuarenta' */
  toCardinal(): Numbers
  /** re-write these numbers as ordinal - 'cuarenta' → 'cuadragésimo' */
  toOrdinal(): Numbers
  /** return only numbers with this value */
  isEqual(n: number): Numbers
  /** alias of .isEqual() */
  equals(n: number): Numbers
  /** return only numbers larger than n */
  greaterThan(n: number): Numbers
  /** return only numbers smaller than n */
  lessThan(n: number): Numbers
  /** return only numbers between min and max */
  between(min: number, max: number): Numbers
  /** alias of .between() */
  isBetween(min: number, max: number): Numbers
  /** set these numbers to n, given as a number or as text ('doce', '12') - 'cuarenta' → 'doce' */
  set(n: number | string): Numbers
  /** add n to these numbers - 'cuarenta' → 'cuarenta y dos' */
  add(n: number | string): Numbers
  /** alias of .add() */
  plus(n: number | string): Numbers
  /** subtract n from these numbers */
  subtract(n: number | string): Numbers
  /** alias of .subtract() */
  minus(n: number | string): Numbers
  /** add 1 to these numbers */
  increment(): Numbers
  /** subtract 1 from these numbers */
  decrement(): Numbers
}

/** options for nlp.fromSpec() */
export interface SpecOptions {
  tags?: 'ignore' | 'use'
  failures?: 'ignore' | 'throw' | 'retain' | 'log'
  verbose?: boolean
}

/** a validation problem found by nlp.fromSpec() or nlp.testSpec() */
export interface SpecFailure {
  code: 'length' | 'tags' | 'syntax' | 'match'
  line: number
  text: string
  message: string
  term?: number
  word?: string
  expected?: string[] | number
  actual?: string[] | number
}

/** a compromise document, with spanish-specific methods */
export interface EsView extends View {
  /** return any verbs, with conjugation methods - 'comieron' */
  verbs(n?: number): Verbs
  /** return any nouns, with inflection methods - 'gatos' */
  nouns(n?: number): Nouns
  /** return any adjectives, with gender/plural methods - 'negros' */
  adjectives(n?: number): Adjectives
  /** return any numbers, with parsing and math methods - 'veinticinco' */
  numbers(n?: number): Numbers
  /** alias of .numbers() */
  values(n?: number): Numbers
}

/** parse the given spanish text */
declare function nlp(text?: string, lexicon?: Lexicon): EsView

declare namespace nlp {
  /** interpret text without tagging */
  export function tokenize(text: string, lexicon?: Lexicon): EsView
  /** mix in a compromise-plugin */
  export function plugin(plugin: Plugin): any
  /** alias of nlp.plugin() */
  export function extend(plugin: Plugin): any
  /** turn a match-string into json */
  export function parseMatch(match: string, opts?: matchOptions): object[]
  /** grab library internals */
  export function world(): object
  /** grab library metadata */
  export function model(): object
  /** grab exposed library methods */
  export function methods(): object
  /** which compute functions run automatically */
  export function hooks(): string[]
  /** log our decision-making for debugging - true, 'tagger', 'match' or 'chunker' */
  export function verbose(toLog?: boolean | string): any
  /** current semver version of the library */
  export const version: string
  /** connect new tags to tagset graph */
  export function addTags(tags: object): any
  /** add new words to internal lexicon */
  export function addWords(words: Lexicon, isFrozen?: boolean): any
  /** turn a list of words into a searchable graph, for .lookup() */
  export function buildTrie(words: string[]): object
  /** like buildTrie, but returns a compressed (serializable) form */
  export function compile(words: string[]): object
  /** compile a set of match objects to a more optimized form, for .sweep() */
  export function buildNet(matches: Match[]): Net
  /** add words to the autoFill dictionary */
  export function typeahead(words: Lexicon): any
  /** parse spec text, optionally applying tags or validating its constraints */
  export function fromSpec(spec: string, options?: SpecOptions): EsView & { failures: SpecFailure[] }
  /** returns untagged sentences and failing tagged lines, with validation failures */
  export function testSpec(spec: string, verbose?: boolean, throwError?: boolean): EsView & { failures: SpecFailure[] }
}

export default nlp
