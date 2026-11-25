import { europeanNumbers } from 'compromise/shared'
import toText from './toText.js'
import { toOrdinal } from './_data.js'

const { write } = europeanNumbers.methods.two.europeanNumbers

const formatNumber = function (parsed, fmt) {
  if (fmt === 'TextOrdinal') {
    let words = toText(parsed.num)
    words = words.map(w => {
      if (toOrdinal.hasOwnProperty) {
        return toOrdinal[w]
      }
      return w
    })
    return words.join(' ')
  }
  if (fmt === 'TextCardinal') {
    return toText(parsed.num).join(' ')
  }
  // numeric formats
  if (fmt === 'Ordinal') {
    return String(parsed.num) + '°'
  }
  // digits go back the way they were found - '1.234,5', '5,3€'
  // .. but a unit is its own (implicit) term - '9km'
  const suffix = /\p{L}/u.test(parsed.suffix || '') ? '' : parsed.suffix
  return write(parsed.num, { ...parsed, suffix })
}
export default formatNumber