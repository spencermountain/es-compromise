import genders from '../preTagger/methods/guessGender/exceptions.js'
import { subjects, tenses, persons } from '../preTagger/compute/3rd-pass/homograph-verb.js'

// la / los / las are articles, and are also object-pronouns - 'las compras' is 'the purchases', and 'you buy them'
// so when the next word is a verb-form, choose between them:
//  1. can it follow this article at all? - 'los tengo', 'la veo', 'la tienen' can not
//  2. is it a real verb-form? - 'la calle', 'los bailes' are only a subjunctive, and want a 'no' or a 'que'
//     and 'la tiene', 'los vendes' are '-er' verbs, that do not look like a noun
//  3. what is around it? - 'ella la cuenta' and 'la paga Juan', but 'en la cuenta' and 'la cuenta es alta'
// .. while un / una / unos / unas, and mi / tu / su, are never pronouns - and 'el' is one only by a typo ('el tiene')

// is it a plural?
const articles = { el: false, un: false, una: false, unos: true, unas: true, la: false, los: true, las: true }
const clitics = new Set(['la', 'los', 'las', 'lo'])
// feminine nouns in '-o'
const femaleO = new Set(['mano', 'foto', 'moto', 'radio', 'modelo'])
// words that an object-pronoun follows - 'no la veo', 'ella la cuenta', 'se la doy'
const verbBefore = new Set('no,nunca,tampoco,me,te,se,nos,os,le,les'.split(',').concat(Object.keys(subjects)))
// .. or a noun - 'si la cuenta es alta', but 'si la compra'
const clauseBefore = new Set('que,si,cuando,porque,donde,quien,como,ya,también,siempre,aquí,ahora,hoy'.split(','))
const joins = new Set(['y', 'o', 'pero', 'ni'])

const getStr = (term) => term.implicit || term.normal
const has = (term, tag) => Boolean(term) && term.tags.has(tag)
const hasPunct = (term) => /[,;:.!?]/.test(term.post || '')
const isFinite = (term) => has(term, 'Verb') && !['Infinitive', 'Gerund', 'Perfecto'].some((tag) => has(term, tag))
const isAdverb = (term) => has(term, 'Adverb') || has(term, 'Negative')

const tagArticles = function (view) {
  const world = view.world
  const setTag = world.methods.one.setTag
  const { noun, verb } = world.methods.two.transform
  const lexicon = world.model.one.lexicon
  const isVerb = (inf) => lexicon.hasOwnProperty(inf) && [].concat(lexicon[inf]).includes('Infinitive')
  // a noun that we know - 'la parte', 'las partes'
  const isKnown = (str) => [str, noun.fromPlural(str)].some((s) => genders.f.has(s) || genders.m.has(s) || lexicon[s] === 'Noun')

  view.docs.forEach((terms) => {
    // does a verb begin here? - '[es] alta', '[la paga] Juan', '[ya no] van'
    const verbAt = function (n) {
      while (isAdverb(terms[n])) {
        n += 1
      }
      const term = terms[n]
      if (term && (clitics.has(getStr(term)) || verbBefore.has(getStr(term)))) {
        return isFinite(terms[n + 1])
      }
      return isFinite(term)
    }
    let choose = null
    // what do the words after it say?
    const lookAfter = function (i) {
      const next = terms[i + 1]
      if (!next || hasPunct(terms[i])) {
        return null
      }
      // 'la intenta comprar'
      if (has(next, 'Infinitive') || has(next, 'Gerund')) {
        return 'Verb'
      }
      // 'la cuenta es alta', 'la toma de la ciudad', 'las cocinas modernas'
      if (verbAt(i + 1) || getStr(next) === 'de' || has(next, 'Adjective')) {
        return 'Noun'
      }
      // 'la compra y la vende', but 'las casas y el gato'
      if (joins.has(getStr(next)) && terms[i + 2]) {
        const str = getStr(terms[i + 2])
        if (articles.hasOwnProperty(str) && has(terms[i + 3], 'Verb')) {
          return choose(i + 2)
        }
        return verbAt(i + 2) ? 'Verb' : 'Noun'
      }
      // 'la limpia cada día', 'la paga Juan', 'la canta muy bien'
      const isAfter = ['Adverb', 'Determiner', 'Value', 'ProperNoun', 'Pronoun', 'Date'].some((tag) => has(next, tag))
      return isAfter ? 'Verb' : null
    }
    // is the verb-form after this article a noun, or a verb?
    choose = function (i) {
      const art = getStr(terms[i])
      const term = terms[i + 1]
      const str = term.normal
      const prev = terms[i - 1]
      const before = prev && !hasPunct(prev) ? getStr(prev) : ''
      // 'el baile', 'un viaje', 'del hecho' - but 'el' may be 'él', before its own verb-form - 'el tiene'
      const isEl = art === 'el'
      if (!clitics.has(art) && !(isEl && has(term, 'ThirdPerson'))) {
        return 'Noun'
      }
      // 'la mujer', 'los vestidos', 'los cuadernos' - and 'en la cuenta', 'pago la cuenta'
      const isObject = before && (has(prev, 'Preposition') || has(prev, 'Verb'))
      if (!isFinite(term) || (/[^m]os$/.test(str) && art !== 'la') || isObject) {
        return 'Noun'
      }
      // 'los tengo', 'la veo', 'la vi', 'la tienen', 'la tienes', 'los tenemos' - but 'la caries'
      const agrees = art === 'la' ? !/[oéíón]$/.test(str) && (!str.endsWith('s') || noun.fromPlural(str) === str) : isEl || /[sx]$/.test(str)
      if (!agrees || has(term, 'FirstPersonPlural')) {
        return 'Verb'
      }
      // 'la calle', 'los bailes' are only a subjunctive - 'no la calle', 'que la calle', but 'que la calle es larga'
      const isPresent = has(term, 'PresentTense')
      if (has(term, 'Subjunctive') || has(term, 'Imperative') || (!isPresent && !has(term, 'PastTense') && !has(term, 'FutureTense') && !has(term, 'Conditional'))) {
        const isClause = verbBefore.has(before) || (clauseBefore.has(before) && lookAfter(i + 1) !== 'Noun')
        return isClause ? 'Verb' : 'Noun'
      }
      // 'la tenía', 'la tiene', 'los vendes' - but 'la parte', 'las luces'
      if (!isPresent || (/es?$/.test(str) && !isKnown(str))) {
        return 'Verb'
      }
      // 'ella la cuenta', 'María la visita', 'mi madre la cocina'
      if (!isEl && (verbBefore.has(before) || (before && has(prev, 'Noun') && !has(prev, 'Date')))) {
        return 'Verb'
      }
      // 'si la cuenta es alta', but 'dice que la compra'
      return lookAfter(i + 1) || (clauseBefore.has(before) ? 'Verb' : 'Noun')
    }

    for (let i = 0; i < terms.length - 1; i += 1) {
      const art = getStr(terms[i])
      const term = terms[i + 1]
      const str = term.normal
      // 'mi cuenta', 'sus viajes' - but 'tu compras' is a typo
      const isPossessive = has(terms[i], 'Possessive') && has(terms[i], 'Determiner') && !(art === 'tu' && has(term, 'SecondPerson'))
      if (!clitics.has(art) && !articles.hasOwnProperty(art) && !isPossessive) {
        continue
      }
      const isPlural = isPossessive ? art.endsWith('s') : articles[art]
      const isClitic = clitics.has(art) && (terms[i].tags.has('Determiner') || art === 'lo')
      // 'la ha visto', 'los puede ver'
      if (isClitic && (has(term, 'Auxiliary') || (has(term, 'Modal') && isFinite(term)))) {
        terms[i].tags.clear()
        setTag([terms[i]], 'Pronoun', world, false, 'clitic-aux')
        continue
      }
      if (has(term, 'Pronoun') || has(term, 'Copula') || has(term, 'Auxiliary') || /\p{Lu}/u.test(term.text) || !(isClitic || terms[i].tags.has('Determiner'))) {
        continue
      }
      if (has(term, 'Verb')) {
        // 'el puede' is 'él puede' - but 'el suelo'
        if (art === 'lo' || (has(term, 'Modal') && has(term, 'ThirdPerson'))) {
          continue
        }
        if (choose(i) === 'Noun') {
          term.tags.clear()
          setTag([term], 'Noun', world, false, 'article-noun')
        } else {
          if (isClitic) {
            terms[i].tags.clear()
            setTag([terms[i]], 'Pronoun', world, false, 'clitic-verb')
          }
          continue
        }
      } else if (isClitic && (has(term, 'Noun') || (has(term, 'Adjective') && art !== 'lo'))) {
        // a word in the lexicon, that can not follow this article - 'la trabajo', 'los camino', 'lo cuento', 'la presto'
        const agrees = art === 'la' ? !str.endsWith('o') || femaleO.has(str) : art !== 'lo' && /[sx]$/.test(str)
        const found = agrees || str.length < 3 ? null : verb.lookup(str, { isVerb, known: true, tenses: Object.keys(tenses) })
        if (found) {
          const hit = found.hits[0]
          terms[i].tags.clear()
          setTag([terms[i]], 'Pronoun', world, false, 'clitic-verb')
          term.tags.clear()
          setTag([term], ['Verb', tenses[hit.tense], persons[hit.person]], world, false, 'clitic-verb')
          continue
        }
      }
      if (!has(term, 'Noun') || art === 'lo') {
        continue
      }
      // 'las flores', 'la rosa' are not names
      if (has(term, 'ProperNoun')) {
        term.tags.clear()
        setTag([term], 'Noun', world, false, 'article-noun')
      }
      // 'los lunes', 'las crisis' - but 'el paraguas'
      if (isPlural && /[sx]$/.test(str)) {
        setTag([term], 'Plural', world, false, 'plural-article')
      } else if (!isPlural && has(term, 'Plural')) {
        setTag([term], 'Singular', world, false, 'singular-article')
      }
    }
  })
}
export default tagArticles
