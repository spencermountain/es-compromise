import { isSingular } from '../../../01-one/lexicon/methods/nouns/rules.js'

// 'gatos', 'cafés' - but not 'lunes', 'crisis', 'país', 'paraguas'
const looksPlural = function (str) {
  // not long enough to be plural - 'gas', 'mes', 'res', 'tos'
  if (!str || str.length <= 3) {
    return false
  }
  return !isSingular(str)
}
export default looksPlural
