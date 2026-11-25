// rule-based noun inflection - spanish plurals are regular, but their written accents move around

// [singular, plural]
const pairs = [
  // the stress moves over a syllable
  ['carácter', 'caracteres'],
  ['régimen', 'regímenes'],
  ['espécimen', 'especímenes'],
  // loanwords
  ['club', 'clubes'],
  ['film', 'filmes'],
  ['álbum', 'álbumes'],
  ['jersey', 'jerséis'],
  ['espray', 'espráis'],
  ['gay', 'gais'],
  ['lord', 'lores'],
  ['fan', 'fans'],
  ['sándwich', 'sándwiches'],
  ['hipérbaton', 'hipérbatos'],
  // consonant + s
  ['vals', 'valses'],
  ['reloj', 'relojes'],
  ['boj', 'bojes'],
  ['carcaj', 'carcajes']
]
const irregular = { toPlural: {}, fromPlural: {} }
pairs.forEach((a) => {
  irregular.toPlural[a[0]] = a[1]
  irregular.fromPlural[a[1]] = a[0]
})

// stressed '-í' and '-ú' take '-es', but not these - 'menús', 'esquís'
const plainS = new Set(['menú', 'champú', 'tutú', 'vermú', 'interviú', 'ragú', 'canesú', 'esquí', 'popurrí', 'pirulí', 'gachí'])

const strip = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }
const mark = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }
const hasAccent = /[áéíóú]/
const noAccent = (str) => str.replace(/[áéíóú]/g, (c) => strip[c])
const setChar = (str, i, c) => str.slice(0, i) + c + str.slice(i + 1)

// where the vowel of each syllable is - 'le|ón' is two, 'dios' is one
const nuclei = function (str) {
  const out = []
  let weak = -1
  let found = false
  for (let i = 0; i <= str.length; i += 1) {
    const c = str[i] || ''
    if (/[aeoáéíóú]/.test(c)) {
      out.push(i)
      found = true
    } else if (/[iuü]/.test(c)) {
      weak = i
    } else {
      // a diphthong of weak vowels - 'ruin'
      if (!found && weak !== -1) {
        out.push(weak)
      }
      weak = -1
      found = false
    }
  }
  return out
}

// a singular word, by its stress - 'país', 'mes', 'dios' - but not 'lunes'
const isOxytone = function (str) {
  const arr = nuclei(str)
  return arr.length < 2 || hasAccent.test(str[arr[arr.length - 1]])
}

// move the written accent, before adding '-es' - 'canción' -> 'cancion', 'joven' -> 'jóven'
const toStem = function (str) {
  const arr = nuclei(str)
  const last = arr[arr.length - 1]
  if (hasAccent.test(str[last])) {
    // a hiatus keeps it - 'país' -> 'países'
    if (/[aeo]h?[íú]$/.test(str.slice(0, last + 1))) {
      return str
    }
    return setChar(str, last, strip[str[last]])
  }
  // 'examen' -> 'exámenes'
  if (str.endsWith('n') && arr.length > 1 && !hasAccent.test(str)) {
    const i = arr[arr.length - 2]
    return setChar(str, i, mark[str[i]] || str[i])
  }
  return str
}

// .. and put it back, after removing '-es' - 'cancion' -> 'canción', 'jóven' -> 'joven'
const fromStem = function (str) {
  const arr = nuclei(str)
  const last = arr[arr.length - 1]
  if (!/[ns]$/.test(str) || hasAccent.test(str[last])) {
    return str
  }
  if (hasAccent.test(str)) {
    return noAccent(str)
  }
  return arr.length > 1 ? setChar(str, last, mark[str[last]] || str[last]) : str
}

// singular nouns that end in an unstressed '-s'
const same = new Set(
  ('vals,lunes,martes,miércoles,jueves,viernes,virus,campus,cactus,estatus,bonus,ómnibus,atlas,caries,iris,pelvis,brindis,tenis,' +
    'gratis,bíceps,tríceps,paraguas,cumpleaños,lavaplatos,abrelatas,sacacorchos,rascacielos,paracaídas,parabrisas,sacapuntas,' +
    'salvavidas,guardaespaldas,tocadiscos,portaaviones,pararrayos,lavavajillas,rompecabezas,saltamontes,ciempiés,traspiés').split(',')
)
// .. or in a stressed one - 'inglés', 'país', 'autobús' - but 'cafés', 'esquís', 'menús' are plurals
const stressed =
  /([aeiou]nés|ñés|glés|galés|rancés|océs|gués|ndés|obés|vés|siamés|marqués|rtés|ontés|terés|trés|prés|grés|ayés|compás|[dm]emás|jamás|trás|quizás|país|anís|diós|[oei]bús|jesús)$/

// 'crisis', 'tórax', 'lunes', 'mes' are not plurals
const isSingular = function (str) {
  if (!str.endsWith('s') || same.has(str) || stressed.test(str) || /([aeiouáéíóúp]sis|[^f]itis)$/.test(str)) {
    return true
  }
  // 'gas', 'dios', 'tos' - but 'pies'
  return nuclei(str).length < 2 && /[aeiou]s$/.test(str) && !/[aeiou]es$/.test(str)
}

// is this a noun, or an adjective, in the given lexicon?
const isWord = (str, lex) => Boolean(lex) && lex.hasOwnProperty(str) && /Noun|Adjective/.test(lex[str])

// feminine nouns that begin with a stressed 'a' take the masculine article - 'el agua', 'las aguas'
const takesEl = (str) => /^(h?á.*a|ave|hambre)$/.test(str) || (/^h?a.*a$/.test(str) && nuclei(str).length === 2)

export { irregular, plainS, noAccent, mark, isWord, takesEl, isOxytone, toStem, fromStem, isSingular }
