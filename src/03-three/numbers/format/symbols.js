// the words for a symbol that is written on a number - '50%', '5€', '$5'
// [singular, plural, tag, isFemale]
const symbols = {
  '%': ['por ciento', 'por ciento', 'Unit'],
  '€': ['euro', 'euros', 'Currency'],
  $: ['dólar', 'dólares', 'Currency'],
  '£': ['libra', 'libras', 'Currency', true],
  '¥': ['yen', 'yenes', 'Currency'],
}

// 'euros' -> '€' - to find a unit that is already written out
const fromWord = {}
Object.keys(symbols).forEach(k => {
  const [single, plural] = symbols[k]
  fromWord[single] = k
  fromWord[plural] = k
})

// a unit that can stand as its own word - 'km', 'kg', 'm²'
const isWord = /^\p{L}+[²³]?$/u

// 'cinco euros', but 'un euro'
const unitWords = function (key, num) {
  const [single, plural] = symbols[key]
  return Math.abs(num) === 1 ? single : plural
}

export { symbols, fromWord, isWord, unitWords }
