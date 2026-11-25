import data from '../data.js'

// 'dieciséis' is often written 'dieciseis'
const noAccent = str => str.normalize('NFD').replace(/\p{M}/gu, '')

// number-words, and their values
const cardinals = { cero: 0, cien: 100, un: 1, una: 1, veintiún: 21, veintiuna: 21 }
const ordinals = { sétimo: 7, decimoprimero: 11, decimosegundo: 12 }
const multiples = {}
// the bottom of a fraction - 'tres cuartos'
const fractions = { medio: 2, media: 2, medios: 2, tercio: 3, tercios: 3, centésimos: 100, milésimos: 1000 }

const list = [...data.ones, ...data.tens, ...data.hundreds]
list.forEach(a => {
  const [num, card, ord] = a
  cardinals[card] = num
  if (ord) {
    ordinals[ord] = num
  }
  // 'doscientas'
  if (num > 100) {
    cardinals[card.replace(/os$/, 'as')] = num
  }
  // 'quintos'
  if (num > 3 && num <= 10) {
    fractions[ord + 's'] = num
  }
})
data.multiples.forEach(a => {
  const [num, single, plural, ord] = a
  multiples[single] = num
  multiples[plural] = num
  ordinals[ord] = num
})
;[cardinals, ordinals, multiples].forEach(obj => {
  Object.keys(obj).forEach(k => {
    obj[noAccent(k)] = obj[k]
  })
})

// 'primera' or 'primer' -> 1
const getOrdinal = function (w) {
  const str = [w, w.replace(/a$/, 'o'), w + 'o'].find(s => ordinals.hasOwnProperty(s))
  return str === undefined ? undefined : ordinals[str]
}

// the words that are a number, wherever they are - 'un', 'una' and 'medio' are tagged by their neighbours
const words = {}
Object.keys(cardinals).forEach(k => {
  words[k] = ['Cardinal', 'TextValue']
})
Object.keys(multiples).forEach(k => {
  words[k] = ['Cardinal', 'TextValue']
})
Object.keys(ordinals).forEach(k => {
  words[k] = ['Ordinal', 'TextValue']
  words[k.replace(/o$/, 'a')] = ['Ordinal', 'TextValue']
})
words.primer = words.primero
words.tercer = words.primero
delete words.un
delete words.una

export { cardinals, ordinals, multiples, fractions, getOrdinal, words }
