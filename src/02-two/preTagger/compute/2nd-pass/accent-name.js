// our list of names has few accents - 'María' is found as 'maria'
// (and without this, the '-ría' suffix makes it a conditional verb)
const names = ['FemaleName', 'MaleName', 'FirstName', 'LastName']
const plain = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }

const accentName = function (terms, i, world) {
  const term = terms[i]
  const text = term.text || ''
  if (term.tags.size > 0 || !/^\p{Lu}\p{Ll}/u.test(text) || !/[áéíóú]/.test(term.normal)) {
    return null
  }
  const str = term.normal.replace(/[áéíóú]/g, (c) => plain[c])
  const lexicon = world.model.one.lexicon
  const tags = lexicon.hasOwnProperty(str) ? [].concat(lexicon[str]) : []
  if (tags.some((tag) => names.includes(tag))) {
    world.methods.one.setTag([term], tags, world, false, '2-accent-name')
    return true
  }
  return null
}
export default accentName
