// words that end in a period, but don't end a sentence - 'Dr.'
// (these replace the english abbreviations, which collide with real words here)
const toObj = str => Object.fromEntries(str.trim().split(/\s+/).map(w => [w, true]))

export default toObj(`
  sr sra srta sres sras dr dra drs dras dña ud uds vd vds
  lic licda ing arq prof profa gral cnel tte cap pdte excmo excma ilmo ilma mons sto sta fr
  av avda cía hnos depto dpto atte vs univ ed eds
  pág págs núm art vol fig tab apdo ej p.ej tel tfno teléf aprox máx mín doc etc
  ee uu ee.uu
  kg km cm mm ml min
  lun mié jue vie sáb
  ene feb abr jun jul ago sept oct nov dic
`)
