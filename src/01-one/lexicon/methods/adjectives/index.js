import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
import { toPlural as nounPlural, fromPlural as nounSingular } from '../nouns/index.js'
import { noAccent, mark, isWord } from '../nouns/rules.js'

// the model only knows adjectives with four forms - so the rules choose which ones those are
const fRev = reverse(model.adjectives.f)

// shortened forms - [female, plural]
const irregular = {
  buen: ['buena', 'buenos'],
  primer: ['primera', 'primeros'],
  tercer: ['tercera', 'terceros']
}
// consonant endings that add an '-a' - 'trabajador', 'alemán', 'inglés', 'español'
const gendered = /(or|[óáí]n|és|^español|^andaluz)$/
// .. but not these ones - 'mejor', 'superior', 'marrón', 'cortés'
const common = /(^(mejor|peor|mayor|menor)|[eu]rior|color|^marrón|afín|cortés)$/
// '-a' adjectives that have no '-o' form - 'optimista', 'agrícola', 'belga'
const commonA = /^(persa|maya|celta|rosa|lila|malva|violeta)$|([ií]sta|ícola|icida|crata|polita|elita|ócrita|[ip]ota|belga|azteca|nómada|indígena|naranja)$/
// .. but these ones do - 'lista', 'prevista'
const notCommon = /^(lista|mixta|(impre|pre|pro)?vista)$/

// 'rojo' -> 'roja', 'inglés' -> 'inglesa', but 'grande' -> 'grande'
const toFemale = (str) => {
  if (irregular.hasOwnProperty(str)) {
    return irregular[str][0]
  }
  if (str.endsWith('o')) {
    return str.slice(0, -1) + 'a'
  }
  if (gendered.test(str) && !common.test(str)) {
    return str.slice(0, -2) + noAccent(str.slice(-2)) + 'a'
  }
  return str
}
// the same spelling rules as the nouns - 'feliz' -> 'felices', 'joven' -> 'jóvenes'
const toPlural = (str) => (irregular.hasOwnProperty(str) ? irregular[str][1] : nounPlural(str))
const toFemalePlural = (str) => nounPlural(toFemale(str))

// 'alemana' -> 'alemán', 'habladora' -> 'hablador'
const toConsonant = function (str) {
  const stem = str.slice(0, -1)
  if (/([aoi]n|es)$/.test(stem)) {
    return stem.slice(0, -2) + mark[stem.slice(-2, -1)] + stem.slice(-1)
  }
  return stem
}

// 'roja' -> 'rojo', 'inglesa' -> 'inglés', but 'optimista' -> 'optimista'
// 'lex' is an optional lexicon, to look for the adjective in
const fromFemale = (str, lex) => {
  if (!str.endsWith('a')) {
    return str
  }
  const o = str.slice(0, -1) + 'o'
  const cons = toConsonant(str)
  if (isWord(o, lex)) {
    return o
  }
  // 'habladora' -> 'hablador'
  if (isWord(cons, lex) || /([aei]d|[ts])ora$/.test(str)) {
    return cons
  }
  if (commonA.test(str) && !notCommon.test(str)) {
    return str
  }
  // 'alemana' -> 'alemán', but 'cubana' -> 'cubano' - the model has seen these
  return convert(str, fRev) === cons && gendered.test(cons) ? cons : o
}
const toSingular = (str, lex) => nounSingular(str, lex)
const fromFemalePlural = (str, lex) => (str.endsWith('as') ? fromFemale(str.slice(0, -1), lex) : nounSingular(str, lex))

const all = function (str) {
  const arr = [str, toFemale(str), toPlural(str), toFemalePlural(str)]
  return Array.from(new Set(arr))
}

export default {
  all,
  toFemale,
  toPlural,
  toFemalePlural,
  fromFemale,
  toSingular,
  fromFemalePlural
}
