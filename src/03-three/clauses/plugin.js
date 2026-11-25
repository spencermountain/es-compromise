// spanish word-rules for .clauses() - the method itself comes from compromise/shared
const clauses = {
  // a comma, but not a clause break
  notClause: [
    '@hasComma (y|e|o|u) .', // grande, y fuerte
  ],
  // split a clause after these
  splitAfter: [
    '^#Pron (dijo|dice)', // él dijo
  ],
  // split a clause before these
  splitBefore: [
    '(dijo|dice) #Prop$',
    '. . si .{4}', // ... si fuera así
    'y mientras',
    'mientras que',
    'ahora que',
    'desde que',
    'hasta que',
    'aunque',
    '(incluso|aun) (si|cuando)',
    'como si',
    '(cuyo|cuya|cuyos|cuyas)', // whose
  ],
  // split a clause before the [captured] word
  splitBeforeGroup: [
    '#Verb .* [pero] .* #Verb', // es bueno pero es ..
    'si .{2,9} [entonces] .', // si es esto entonces aquello
  ],
}

export default {
  model: { three: { clauses } },
}
