// the lexicon gives 'limpia', 'duras', 'alegres' to a verb, and 'cara', 'rojas', 'china' to a name
// but after 'ser' or 'estar', a form of an adjective that we know is that adjective - 'es limpia', 'son rojas'
const copulaAdjective = function (view) {
  const world = view.world
  const setTag = world.methods.one.setTag
  const lexicon = world.model.one.lexicon
  const { fromFemale, fromFemalePlural, toSingular } = world.methods.two.transform.adjective
  const isAdj = (str) => lexicon[str] === 'Adjective'
  view.docs.forEach((terms) => {
    for (let i = 1; i < terms.length; i += 1) {
      const term = terms[i]
      const tags = term.tags
      if (!terms[i - 1].tags.has('Copula') || /\p{Lu}/u.test(term.text) || !(tags.has('Verb') || tags.has('ProperNoun'))) {
        continue
      }
      const str = term.normal
      const isPlural = str.endsWith('s')
      let isFemale = false
      let found = isAdj(str)
      if (!found && /as?$/.test(str)) {
        isFemale = isAdj(isPlural ? fromFemalePlural(str, lexicon) : fromFemale(str, lexicon))
        found = isFemale
      }
      if (found || (isPlural && isAdj(toSingular(str, lexicon)))) {
        tags.clear()
        const out = ['Adjective', isPlural ? 'PluralAdjective' : 'SingularAdjective']
        if (isFemale || /os?$/.test(str)) {
          out.push(isFemale ? 'FemaleAdjective' : 'MaleAdjective')
        }
        setTag([term], out, world, false, 'copula-adjective')
      }
    }
  })
}
export default copulaAdjective
