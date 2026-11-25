import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'
import { irregular, plainS, noAccent, isWord, isOxytone, toStem, fromStem, isSingular } from './rules.js'

const { plurals } = model.nouns
const pRev = reverse(plurals)

// irregulars -> invariables -> spelling rules -> model -> '-s'
const toPlural = (str) => {
  if (irregular.toPlural.hasOwnProperty(str)) {
    return irregular.toPlural[str]
  }
  // 'casa' -> 'casas', 'café' -> 'cafés'
  if (/[aeiouáéó]$/.test(str)) {
    return str + 's'
  }
  // 'rubí' -> 'rubíes', 'menú' -> 'menús'
  if (/[íú]$/.test(str)) {
    return str + (plainS.has(str) ? 's' : 'es')
  }
  // 'luz' -> 'luces'
  if (str.endsWith('z')) {
    return str.slice(0, -1) + 'ces'
  }
  if (/[sx]$/.test(str)) {
    // 'lunes', 'crisis', 'tórax', 'bíceps' never change - but 'mes' -> 'meses', 'inglés' -> 'ingleses'
    return isOxytone(str) && !/[^aeiouáéíóú]s$/.test(str) ? toStem(str) + 'es' : str
  }
  // 'papel' -> 'papeles', 'canción' -> 'canciones', 'joven' -> 'jóvenes'
  if (/[aeiouáéíóú]([lrndj]|ch)$/.test(str)) {
    return toStem(str) + 'es'
  }
  // 'ferry' -> 'ferris'
  if (/[^aeiouáéíóú]y$/.test(str)) {
    return str.slice(0, -1) + 'is'
  }
  // a loanword - 'cómic' -> 'cómics', 'récord' -> 'récords' - or 'rey' -> 'reyes'
  const res = convert(str, plurals)
  if (res === str + 's' || res === str + 'es') {
    return res
  }
  return str + (str.endsWith('y') ? 'es' : 's')
}

// does this '-es' plural have a singular in '-e'? - 'clases' -> 'clase', but 'meses' -> 'mes'
const isE = function (str, e, cons, lex) {
  // 'canciones', 'ciudades', 'reyes', 'faxes'
  if (/(iones|[dt]ades|tudes|[yx]es)$/.test(str)) {
    return false
  }
  // is only one of them a word that we know?
  if (isWord(e, lex) !== isWord(cons, lex)) {
    return isWord(e, lex)
  }
  // has the model seen it? - 'cines', 'índices' - or 'luces', 'sándwiches'
  const res = convert(str, pRev)
  if (res === e) {
    return true
  }
  if (noAccent(res) === noAccent(cons)) {
    return false
  }
  // 'viajes', 'coches'
  return /[jh]e$/.test(e)
}

// irregulars -> invariables -> spelling rules -> known words -> model -> consonant
// 'lex' is an optional lexicon, to look for the singular in
const fromPlural = (str, lex) => {
  if (irregular.fromPlural.hasOwnProperty(str)) {
    return irregular.fromPlural[str]
  }
  if (isSingular(str)) {
    return str
  }
  const stem = str.slice(0, -2)
  // 'rubíes' -> 'rubí'
  if (/[íú]es$/.test(str)) {
    return stem
  }
  // 'casas' -> 'casa', 'cafés' -> 'café', 'cómics' -> 'cómic' - and 'héroes', 'bosques', 'padres', 'jefes'
  const e = str.slice(0, -1)
  if (!str.endsWith('es') || !/([aeiouáéíóú][lrndsjyxc]|[cs]h)$/.test(stem)) {
    return e
  }
  // 'luces' -> 'luz', 'canciones' -> 'canción', 'jóvenes' -> 'joven', 'árboles' -> 'árbol'
  const cons = stem.endsWith('c') ? stem.slice(0, -1) + 'z' : fromStem(stem)
  return isE(str, e, cons, lex) ? e : cons
}

const all = function (str) {
  const plur = toPlural(str)
  if (str === plur) {
    return [str]
  }
  return [str, plur]
}

export { toPlural, fromPlural, all }
