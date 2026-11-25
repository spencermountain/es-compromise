import { cardinals, multiples, fractions, getOrdinal } from './_data.js'

const isDigit = term => /[0-9]/.test(term.text)
// is there anything between these two words? - 'tres, cuatro'
const isBroken = (a, b) => /\S/.test(a.post + b.pre)
// 'mil', and anything larger
const getMult = term => (term && multiples.hasOwnProperty(term.normal) ? multiples[term.normal] : 0)

// digits, and the words that multiply them - '1 000', '2,5 millones', '3 mil millones'
const readDigits = function (terms, i, res) {
  let end = i + 1
  const joins = () => terms[end] && !isBroken(terms[end - 1], terms[end])
  if (/^[0-9]{1,3}$/.test(terms[i].text)) {
    while (joins() && /^[0-9]{3}$/.test(terms[end].text)) {
      end += 1
    }
  }
  res.digits = [i, end]
  res.mult = 1
  if (/^[-+−]?[0-9][0-9.,]*$/.test(terms[end - 1].text)) {
    if (joins() && getMult(terms[end]) === 1000) {
      res.mult = 1000
      end += 1
    }
    if (joins() && getMult(terms[end]) > 1000) {
      res.mult *= getMult(terms[end])
      end += 1
    }
  }
  res.end = end
  return res
}

// read the one number that begins at this term, and say where it ends
// - each new word must fit beside the ones before it, so 'dos tres' is two numbers
const readNumber = function (terms, start) {
  const res = { start, end: start + 1, num: null, neg: false }
  let i = start
  if (terms[i].normal === 'menos' && terms[i + 1] && !isBroken(terms[i], terms[i + 1])) {
    res.neg = true
    i += 1
  }
  if (isDigit(terms[i])) {
    return readDigits(terms, i, res)
  }
  const isOrd = terms[i].tags.has('Ordinal')
  let total = 0 // the millions
  let section = 0 // the thousands
  let group = 0 // the hundreds, tens and ones
  // the next word must be smaller than this - 'ciento' leaves room for 'veinte', and then for nothing
  let room = 1000
  let lastBig = Infinity
  let usedMil = false
  let afterY = false
  let any = false
  let int = null // the whole part, before a 'coma'
  let zeros = ''
  let over = 1
  let extra = 0
  for (; i < terms.length; i += 1) {
    const term = terms[i]
    const w = term.normal
    const next = terms[i + 1]
    const joins = Boolean(next) && !isBroken(term, next)
    if ((i > start && isBroken(terms[i - 1], term)) || isDigit(term)) {
      break
    }
    if (term.tags.has('Fraction') && fractions.hasOwnProperty(w)) {
      if (isOrd || int !== null) {
        break
      }
      // 'medio millón'
      if (!any) {
        group = 1 / fractions[w]
        room = 0
        any = true
        continue
      }
      // 'dos y medio', or 'tres cuartos'
      if (afterY) {
        extra = 1 / fractions[w]
      } else {
        over = fractions[w]
      }
      i += 1
      break
    }
    if (w === 'y') {
      if (!any || isOrd || int !== null || !joins) {
        break
      }
      const v = cardinals[next.normal]
      const isHalf = next.tags.has('Fraction') && fractions[next.normal] === 2
      if (isHalf || (room === 10 && v > 0 && v < 10 && !isDigit(next))) {
        afterY = true
        continue
      }
      break
    }
    // 'tres coma cinco'
    if (w === 'coma') {
      if (!any || isOrd || int !== null || !joins || !cardinals.hasOwnProperty(next.normal)) {
        break
      }
      int = total + section + group
      total = 0
      section = 0
      group = 0
      room = 1000
      continue
    }
    if (isOrd !== term.tags.has('Ordinal')) {
      break
    }
    const mult = isOrd ? 0 : getMult(term)
    if (mult) {
      // 'mil mil', 'dos millones tres millones'
      if (int !== null || (mult === 1000 ? usedMil : mult >= lastBig)) {
        break
      }
      if (mult === 1000) {
        section = (group || 1) * 1000
      } else {
        total += (section + group || 1) * mult
        section = 0
        lastBig = mult
      }
      usedMil = mult === 1000
      group = 0
      room = 1000
      any = true
      continue
    }
    const v = isOrd ? getOrdinal(w) : cardinals[w]
    if (v === undefined) {
      break
    }
    // 'tres coma cero cinco'
    if (v === 0 && int !== null && room === 1000) {
      zeros += '0'
      continue
    }
    // 'milésimo primero'
    if (v >= 1000 && !any) {
      total = v
      any = true
      continue
    }
    // 'dos tres', 'cero uno', and 'treinta uno' - but 'treinta y uno', and 'vigésimo primero'
    if (v >= room || (v === 0 && any) || (room === 10 && !afterY && !isOrd)) {
      break
    }
    room = 0
    if (v >= 100) {
      room = 100
    } else if (v >= 30 || (isOrd && v % 10 === 0)) {
      room = 10
    }
    group += v
    afterY = false
    any = true
  }
  if (!any) {
    // an unknown word is its own number - and a loose 'y' is nothing
    return /^(y|coma|menos)$/.test(terms[start].normal) ? null : res
  }
  let num = total + section + group
  if (int !== null) {
    num = Number(int + '.' + zeros + group)
  }
  num = (num / over) + extra
  res.num = res.neg ? num * -1 : num
  res.end = i
  return res
}

// split these terms into each of their numbers
const scan = function (terms) {
  const out = []
  let i = 0
  while (i < terms.length) {
    const res = readNumber(terms, i)
    if (res) {
      out.push(res)
    }
    i = res ? res.end : i + 1
  }
  return out
}
export default scan
