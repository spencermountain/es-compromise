import { convert, reverse } from 'suffix-thumb'
import model from '../models.js'

const { gerunds } = model
// =-=-
const m = {
  fromGerund: reverse(gerunds.gerunds),
  toGerund: gerunds.gerunds,
}

const fromGerund = function (str) {
  return convert(str, m.fromGerund)
}
const toGerund = function (str) {
  // 'acostarse' conjugates as 'acostar'
  str = str.replace(/([aeií]r)se$/, '$1')
  return convert(str, m.toGerund)
}


export { fromGerund, toGerund }
