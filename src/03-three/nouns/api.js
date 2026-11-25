export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// each determiner, and its plural
const toPluralArt = {
  el: 'los',
  la: 'las',
  un: 'unos',
  una: 'unas',
  mi: 'mis',
  tu: 'tus',
  su: 'sus',
  nuestro: 'nuestros',
  nuestra: 'nuestras',
  vuestro: 'vuestros',
  vuestra: 'vuestras',
  este: 'estos',
  esta: 'estas',
  ese: 'esos',
  esa: 'esas',
  aquel: 'aquellos',
  aquella: 'aquellas'
}
const toSingularArt = {}
Object.keys(toPluralArt).forEach((k) => {
  toSingularArt[toPluralArt[k]] = k
})
// 'el agua' is feminine - 'las aguas'
const female = { el: 'las', un: 'unas', las: 'el', unas: 'un' }

// flip 'los' → 'el', etc
const swapArticle = function (m, mapping, isEl) {
  // 'del gato' ↔ 'de los gatos', 'al agua' ↔ 'a las aguas'
  const isPlural = mapping === toPluralArt
  const prep = m.before(isPlural ? '(de|a) el$' : '(de|a) (los|las)$')
  if (prep.found) {
    const str = prep.text('normal')
    const p = str.startsWith('a') ? 'a' : 'de'
    if (isPlural) {
      prep.replaceWith(p + (isEl ? ' las' : ' los'))
    } else if (isEl || str.endsWith('los')) {
      prep.replaceWith(p === 'a' ? 'al' : 'del')
    } else {
      prep.replaceWith(p + ' la')
    }
    return
  }
  const art = m.before(`(${Object.keys(mapping).join('|')})$`)
  if (art.found) {
    const w = art.text('normal')
    if (mapping.hasOwnProperty(w)) {
      art.replaceWith(isEl && female.hasOwnProperty(w) ? female[w] : mapping[w])
    }
  }
}

const api = function (View) {
  class Nouns extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Nouns'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.noun
      const lexicon = this.model.one.lexicon
      return getNth(this, n).map(m => {
        const str = m.text('normal')
        if (m.has('#Plural')) {
          return {
            singular: methods.fromPlural(str, lexicon),
            plural: str
          }
        }
        return {
          singular: str,
          plural: methods.toPlural(str)
        }
      }, [])
    }
    isPlural(n) {
      return getNth(this, n).if('#Plural')
    }
    toPlural(n) {
      const methods = this.methods.two.transform.noun
      getNth(this, n).ifNo('(#Plural|#Pronoun)').forEach(m => {
        const str = m.text('normal')
        m.replaceWith(methods.toPlural(str))
        m.tag('Plural', 'toPlural')
        // flip article, too
        swapArticle(m, toPluralArt, methods.takesEl(str))
      })
      return this
    }
    toSingular(n) {
      const methods = this.methods.two.transform.noun
      const lexicon = this.model.one.lexicon
      getNth(this, n).if('#Plural').ifNo('#Pronoun').forEach(m => {
        const singular = methods.fromPlural(m.text('normal'), lexicon)
        m.replaceWith(singular)
        m.tag('Singular', 'toSingular')
        // flip article, too
        swapArticle(m, toSingularArt, methods.takesEl(singular))
      })
      return this
    }
  }

  View.prototype.nouns = function (n) {
    let m = this.match('#Noun')
    m = getNth(m, n)
    return new Nouns(this.document, m.pointer)
  }
}
export default api
