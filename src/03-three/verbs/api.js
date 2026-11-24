import convertTo from './tense.js'

export const getNth = (doc, n) => (typeof n === 'number' ? doc.eq(n) : doc)

// get root form of adjective
const getRoot = function (m) {
  m.compute('root')
  const str = m.text('root')
  return str
}

const api = function (View) {
  class Verbs extends View {
    constructor(document, pointer, groups) {
      super(document, pointer, groups)
      this.viewType = 'Verbs'
    }
    conjugate(n) {
      const methods = this.methods.two.transform.verb
      const { toPresent, toPast, toFuture, toConditional, toGerund, toPerfecto, toImperative, toSubjunctive } = methods
      return getNth(this, n).map(m => {
        const str = getRoot(m, methods)
        return {
          presentTense: toPresent(str),
          pastTense: toPast(str),
          futureTense: toFuture(str),
          conditional: toConditional(str),
          gerund: toGerund(str),
          perfecto: toPerfecto(str),
          imperative: toImperative(str),
          subjunctive: toSubjunctive(str),
        }
      }, [])
    }
    /** 'hablo' -> 'hablé' (pretérito) */
    toPastTense(n) {
      return convertTo(getNth(this, n), 'past')
    }
    /** 'hablé' -> 'hablo' */
    toPresentTense(n) {
      return convertTo(getNth(this, n), 'present')
    }
    /** 'hablo' -> 'hablaré' */
    toFutureTense(n) {
      return convertTo(getNth(this, n), 'future')
    }
    // overloaded - keep Verb class
    update(pointer) {
      const m = new Verbs(this.document, pointer)
      m._cache = this._cache
      return m
    }
  }

  View.prototype.verbs = function (n) {
    let m = this.match('#Verb+')
    m = getNth(m, n)
    return new Verbs(this.document, m.pointer)
  }
}
export default api