// number-words that are known by their neighbours
//  - 'un' and 'una' are articles, and are a number only inside of one - 'un millón', 'ciento un',
//    'treinta y una' - or before a unit - 'un euro', 'un km', 'un por ciento'
//  - 'y' joins a ten to a one - 'treinta y dos' - but 'tres y cuatro' are two numbers
const tens = /^(treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)$/
const ones = /^(un[oa]?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve)$/
const isOne = /^una?$/
const isBig = /^[mb]ill[oó]n(es)?$/
// 'ciento un', 'mil una'
const beforeOne = /ient[oa]s?$|^cien$|^mil$|ll[oó]n(es)?$/
// 'tres cuartos'
const parts = /^(medios|tercios|cuartos|quintos|sextos|séptimos|octavos|novenos|décimos|centésimos|milésimos)$/
const isHalf = /^medi[oa]$/

const cardinal = ['Cardinal', 'TextValue']
const fraction = ['Fraction', 'TextValue']
const has = (term, tag) => Boolean(term) && term.tags.has(tag)
const isText = term => has(term, 'TextValue') && has(term, 'Cardinal')

const tagNumbers = function (view) {
  const world = view.world
  const setTag = world.methods.one.setTag
  // 'euros', 'pesos'
  const money = new Set(world.model.two.europeanNumbers.currencies)
  const isCurrency = term => has(term, 'Currency') || (Boolean(term) && money.has(term.normal))
  view.docs.forEach(terms => {
    // are these two words side-by-side?
    const joins = i => Boolean(terms[i] && terms[i + 1]) && !/\S/.test(terms[i].post + terms[i + 1].pre)
    // start again - an article, noun or adjective is now a number
    const tag = function (i, tags, reason) {
      if (terms[i].frozen !== true) {
        terms[i].tags.clear()
        setTag([terms[i]], tags, world, false, reason)
      }
    }
    // tag the whole number, before this word
    const tagBefore = function (i, str, reason) {
      for (let n = i - 1; n >= 0 && joins(n) && has(terms[n], 'Value'); n -= 1) {
        setTag([terms[n]], str, world, false, reason)
      }
    }
    const str = i => (terms[i] ? terms[i].normal : '')
    // does a number begin here?
    const isNumber = i => has(terms[i], 'Value') || (isOne.test(str(i)) && joins(i) && isBig.test(str(i + 1)))
    for (let i = 0; i < terms.length; i += 1) {
      const term = terms[i]
      const w = term.normal
      const before = joins(i - 1)
      const after = joins(i)
      if (isOne.test(w)) {
        // 'un millón', 'un euro', 'un por ciento'
        let found = after && (isBig.test(str(i + 1)) || isCurrency(terms[i + 1]) || has(terms[i + 1], 'Unit'))
        found = found || (after && joins(i + 1) && str(i + 1) === 'por' && str(i + 2) === 'ciento')
        // 'un medio', 'un tercio' - but 'un medio de transporte'
        const isMeans = str(i + 1) === 'medio' && joins(i + 1) && str(i + 2) === 'de'
        if (after && /^(medio|tercio)$/.test(str(i + 1)) && !isMeans) {
          found = true
          tag(i + 1, fraction, 'un-tercio')
        }
        // 'ciento un', 'treinta y una'
        found = found || (before && has(terms[i - 1], 'TextValue') && (beforeOne.test(str(i - 1)) || str(i - 1) === 'y'))
        if (found) {
          tag(i, cardinal, 'un-number')
        }
      } else if (w === 'y') {
        if (before && after && isText(terms[i - 1])) {
          if (tens.test(str(i - 1)) && ones.test(str(i + 1))) {
            tag(i, 'TextValue', 'treinta-y-dos')
          } else if (isHalf.test(str(i + 1))) {
            // 'dos y medio'
            tag(i, 'TextValue', 'dos-y-medio')
            tag(i + 1, fraction, 'dos-y-medio')
          }
        }
      } else if (w === 'menos') {
        // 'menos cinco', but 'tres menos dos'
        if (after && isNumber(i + 1) && !has(terms[i + 1], 'Ordinal') && !has(terms[i - 1], 'Value')) {
          tag(i, 'TextValue', 'menos-cinco')
        }
      } else if (w === 'coma') {
        // 'tres coma cinco'
        if (before && after && isText(terms[i - 1]) && isText(terms[i + 1])) {
          tag(i, 'TextValue', 'tres-coma-cinco')
        }
      } else if (w === 'por' && after && /^cien(to)?$/.test(str(i + 1)) && before && has(terms[i - 1], 'Value')) {
        // 'cinco por ciento'
        tagBefore(i, 'Percent', 'por-ciento')
        tag(i, 'Unit', 'por-ciento')
        tag(i + 1, 'Unit', 'por-ciento')
        i += 1
      } else if (isCurrency(term) && before && has(terms[i - 1], 'Value')) {
        // 'un euro'
        tagBefore(i, 'Money', 'value-currency')
        setTag([term], 'Currency', world, false, 'value-currency')
      } else if (parts.test(w)) {
        if (before && isText(terms[i - 1])) {
          tag(i, fraction, 'tres-cuartos')
        }
      } else if (isHalf.test(w) && !has(term, 'Fraction')) {
        // 'medio millón', 'medio litro', or the word by itself
        if (terms.length === 1 || (after && (isBig.test(str(i + 1)) || has(terms[i + 1], 'Unit')))) {
          tag(i, fraction, 'medio')
        }
      }
    }
  })
}
export default tagNumbers
