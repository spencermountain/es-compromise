import data from '../data.js'

// words for each part of a number
const cardinals = {}
const ordinals = {}
;[...data.ones, ...data.tens, ...data.hundreds].forEach(a => {
  cardinals[a[0]] = a[1]
  ordinals[a[0]] = a[2]
})
const bigs = data.multiples.filter(a => a[0] > 1000)

// 1-999 - 'ciento veintiuno'
// `one` is how a last 'uno' ends - 'uno', 'una' or 'un'
const toGroup = function (num, fem, one) {
  const words = []
  const h = Math.floor(num / 100) * 100
  let rest = num % 100
  if (h) {
    const w = num === 100 ? 'cien' : cardinals[h]
    // 'doscientas'
    words.push(fem && h > 100 ? w.replace(/os$/, 'as') : w)
  }
  // 'treinta y dos'
  if (rest > 30 && rest % 10) {
    words.push(cardinals[rest - (rest % 10)], 'y')
    rest = rest % 10
  }
  if (rest === 21 && one === '') {
    words.push('veintiún')
  } else if (rest) {
    words.push(rest % 20 === 1 ? cardinals[rest].replace(/o$/, one) : cardinals[rest])
  }
  return words
}

// under a million - 'veintiún mil doscientos'
const toThousands = function (num, fem, one) {
  const mil = Math.floor(num / 1000)
  let words = []
  if (mil > 1) {
    words = toGroup(mil, fem, '')
  }
  if (mil) {
    words.push('mil')
  }
  return words.concat(toGroup(num % 1000, fem, one))
}

// write a whole number as words - `opts.isFemale` is 'una', and `opts.short` is 'un', before a noun
const toText = function (num, opts = {}) {
  if (!Number.isSafeInteger(num)) {
    return null
  }
  if (num === 0) {
    return ['cero']
  }
  let words = num < 0 ? ['menos'] : []
  let rest = Math.abs(num)
  bigs.forEach(a => {
    const [size, single, plural] = a
    const count = Math.floor(rest / size)
    rest -= count * size
    // 'un millón', 'dos millones'
    if (count === 1) {
      words.push('un', single)
    } else if (count) {
      words = words.concat(toThousands(count, false, ''), plural)
    }
  })
  let one = opts.short ? '' : 'o'
  one = opts.isFemale ? 'a' : one
  return words.concat(toThousands(rest, opts.isFemale, one))
}

// 'centésimo vigésimo primero' - up to 1999, and 'millonésimo'
const toTextOrdinal = function (num, opts = {}) {
  let words = []
  let rest = num
  const big = data.multiples.find(a => a[0] === num)
  if (big) {
    words.push(big[3])
  } else if (!Number.isInteger(num) || num < 1 || num >= 2000) {
    return null
  } else {
    if (rest > 1000) {
      words.push('milésimo')
      rest -= 1000
    }
    const parts = [rest - (rest % 100), rest % 100]
    if (parts[1] > 20) {
      parts.push(parts[1] % 10)
      parts[1] -= parts[2]
    }
    words = words.concat(parts.filter(n => n).map(n => ordinals[n]))
  }
  if (opts.isFemale) {
    return words.map(w => w.replace(/o$/, 'a'))
  }
  // 'primer día', 'tercer piso'
  if (opts.short) {
    const last = words.length - 1
    words[last] = words[last].replace(/(primer|tercer)o$/, '$1')
  }
  return words
}
export { toText, toTextOrdinal }
