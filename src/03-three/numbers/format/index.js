import { europeanNumbers } from 'compromise/shared'
import { toText, toTextOrdinal } from './toText.js'

const { write } = europeanNumbers.methods.two.europeanNumbers

// returns null when a number can't be written this way
const formatNumber = function (parsed, fmt) {
  const num = parsed.num
  if (fmt === 'TextOrdinal' || fmt === 'TextCardinal') {
    const words = fmt === 'TextOrdinal' ? toTextOrdinal(num, parsed) : toText(num, parsed)
    return words ? words.join(' ') : null
  }
  // numeric formats
  if (fmt === 'Ordinal') {
    if (!Number.isInteger(num) || num < 1) {
      return null
    }
    const old = parsed.ordinal || ''
    let end = parsed.isFemale ? 'ª' : 'º'
    // '1er' and '3er' - but '11º'
    if (end === 'º' && parsed.short && /(^|[^1])[13]$/.test(String(num))) {
      end = 'er'
    }
    // '1.º' keeps its period
    return String(num) + (old[0] === '.' ? '.' : '') + end
  }
  // digits go back the way they were found - '1.234,5', '5,3€'
  return write(num, parsed)
}
export default formatNumber
