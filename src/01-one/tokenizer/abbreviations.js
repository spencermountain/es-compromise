// abbreviations, and the other language-specific parts of the sentence-parser
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default {
  // these go before a name, a number or a letter ('Dr. X', 'fig. A'), and never end a sentence
  titles: toObj(`
    sr sra srta sres sras dr dra drs dras dña
    lic licda ing arq prof profa gral cnel tte cap pdte excmo excma ilmo ilma mons sto sta fr
    av avda cía hnos depto dpto atte vs univ ed eds
    a d s p ee
    pág págs núm art vol fig tab apdo
  `),
  // these end a sentence, when a capital comes next
  abbreviations: toObj(`
    ud uds vd vds
    ej tel tfno teléf aprox máx mín doc etc
    m uu
    lun mié jue vie sáb
    ene feb abr jun jul ago sept oct nov dic
  `),
  // longer ones, that end a sentence when a capital comes next
  enders: ['S\\.\\s?A', '[ad]\\.\\s?C'],
  // '5 kg.'
  units: ['kg', 'km', 'cm', 'mm', 'ml', 'gr', 'g', 'm', 'l', 'h', 'min', 'seg'],
  // words that begin a new sentence, and are never a name - 'Habla con el Dr. Él sabe.'
  starters: `Él Ella Ellos Ellas Yo Tú Nosotros Usted Luego Después Entonces Pero No Sí
    Es Era Fue Está Estaba Hay Había Tiene Vamos Su Sus Mi Me Se Nadie Nada Todo Todos
    Hoy Ayer Mañana Ahora Aquí Allí También Cuando Si Como Qué Quién Dónde Por`.split(/\s+/),
  quotes: [['«', '»'], ['“', '”'], ['"', '"'], ['(', ')']],
  ellipsis: true,
}
