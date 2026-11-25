import test from 'tape'
import nlp from '../../_lib.js'
const here = '[verb-tense] '
nlp.verbose(false)

const run = function (t, arr, fn) {
  arr.forEach(a => {
    const [str, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}' → '${want}'`)
  })
}

test('toPastTense - regular verbs, every person:', function (t) {
  run(t, [
    // -ar
    ['yo hablo español', 'yo hablé español'],
    ['tú hablas mucho', 'tú hablaste mucho'],
    ['ella habla español', 'ella habló español'],
    ['nosotros hablamos español', 'nosotros hablamos español'],
    ['vosotros habláis español', 'vosotros hablasteis español'],
    ['ellos hablan español', 'ellos hablaron español'],
    // -er
    ['yo bebo agua', 'yo bebí agua'],
    ['tú comes pan', 'tú comiste pan'],
    ['ella come una manzana', 'ella comió una manzana'],
    ['nosotros comemos pan', 'nosotros comimos pan'],
    ['vosotros coméis pan', 'vosotros comisteis pan'],
    ['ellos comen pan', 'ellos comieron pan'],
    // -ir
    ['yo escribo una carta', 'yo escribí una carta'],
    ['tú vives aquí', 'tú viviste aquí'],
    ['ella vive aquí', 'ella vivió aquí'],
    ['nosotros vivimos aquí', 'nosotros vivimos aquí'],
    ['vosotros vivís aquí', 'vosotros vivisteis aquí'],
    ['ellos viven aquí', 'ellos vivieron aquí'],
  ], 'toPastTense')
  t.end()
})

test('toPastTense - irregular verbs:', function (t) {
  run(t, [
    ['soy feliz', 'fui feliz'],
    ['ella es alta', 'ella fue alta'],
    ['somos amigos', 'fuimos amigos'],
    ['estoy cansado', 'estuve cansado'],
    ['ellos están aquí', 'ellos estuvieron aquí'],
    ['voy a la escuela', 'fui a la escuela'],
    ['ella va a casa', 'ella fue a casa'],
    ['tengo un perro', 'tuve un perro'],
    ['ella tiene un gato', 'ella tuvo un gato'],
    ['hace frío', 'hizo frío'],
    ['hago la tarea', 'hice la tarea'],
    ['ella dice la verdad', 'ella dijo la verdad'],
    ['puedo hablar', 'pude hablar'],
    ['ella viene mañana', 'ella vino mañana'],
    ['pongo la mesa', 'puse la mesa'],
    ['ella sabe la respuesta', 'ella supo la respuesta'],
    ['doy un regalo', 'di un regalo'],
    ['veo la casa', 'vi la casa'],
    // stem-changes
    ['el gato duerme', 'el gato durmió'],
    ['ellos duermen', 'ellos durmieron'],
    ['ella pide agua', 'ella pidió agua'],
    ['los niños juegan', 'los niños jugaron'],
    // spelling-changes
    ['busco mi libro', 'busqué mi libro'],
    ['llego tarde', 'llegué tarde'],
    ['empiezo hoy', 'empecé hoy'],
    ['ella lee un libro', 'ella leyó un libro'],
    ['conduzco el coche', 'conduje el coche'],
  ], 'toPastTense')
  t.end()
})

test('toPastTense - from other tenses:', function (t) {
  run(t, [
    // future
    ['comeré mañana', 'comí mañana'],
    ['ella hablará', 'ella habló'],
    ['nosotros viviremos aquí', 'nosotros vivimos aquí'],
    ['ellos tendrán un perro', 'ellos tuvieron un perro'],
    // already past - no change
    ['él habló ayer', 'él habló ayer'],
    ['dijo la verdad', 'dijo la verdad'],
    ['vine ayer', 'vine ayer'],
    // the imperfect is already a past-tense
    ['ella hablaba', 'ella hablaba'],
    ['yo era joven', 'yo era joven'],
    ['ella tenía hambre', 'ella tenía hambre'],
    // the perfect is already in the past
    ['he comido', 'he comido'],
    ['hemos hablado', 'hemos hablado'],
    ['ella había comido', 'ella había comido'],
  ], 'toPastTense')
  t.end()
})

test('toPresentTense:', function (t) {
  run(t, [
    // from preterite
    ['yo hablé español', 'yo hablo español'],
    ['tú hablaste mucho', 'tú hablas mucho'],
    ['él habló ayer', 'él habla ayer'],
    ['vosotros hablasteis', 'vosotros habláis'],
    ['ellos hablaron', 'ellos hablan'],
    ['ella comió una manzana', 'ella come una manzana'],
    ['ellos comieron pan', 'ellos comen pan'],
    ['ella vivió aquí', 'ella vive aquí'],
    ['dijo la verdad', 'dice la verdad'],
    ['vine ayer', 'vengo ayer'],
    ['lo hice', 'lo hago'],
    ['tuve un perro', 'tengo un perro'],
    ['ella durmió', 'ella duerme'],
    ['ellos pidieron agua', 'ellos piden agua'],
    // from imperfect
    ['tú comías', 'tú comes'],
    ['nosotros hablábamos', 'nosotros hablamos'],
    ['ellos vivían aquí', 'ellos viven aquí'],
    ['ella tenía hambre', 'ella tiene hambre'],
    // from future
    ['comeré mañana', 'como mañana'],
    ['ella hablará', 'ella habla'],
    ['ellos vendrán', 'ellos vienen'],
    ['tendremos tiempo', 'tenemos tiempo'],
    // already present - no change
    ['yo hablo español', 'yo hablo español'],
    ['ella come una manzana', 'ella come una manzana'],
    ['soy feliz', 'soy feliz'],
  ], 'toPresentTense')
  t.end()
})

test('toFutureTense:', function (t) {
  run(t, [
    ['yo hablo español', 'yo hablaré español'],
    ['tú hablas mucho', 'tú hablarás mucho'],
    ['ella habla', 'ella hablará'],
    ['nosotros hablamos', 'nosotros hablaremos'],
    ['vosotros habláis', 'vosotros hablaréis'],
    ['ellos hablan', 'ellos hablarán'],
    ['ella come una manzana', 'ella comerá una manzana'],
    ['nosotros vivimos aquí', 'nosotros viviremos aquí'],
    // irregular future-stems
    ['tengo un perro', 'tendré un perro'],
    ['hace frío', 'hará frío'],
    ['ella dice la verdad', 'ella dirá la verdad'],
    ['puedo hablar', 'podré hablar'],
    ['no quiero ir', 'no querré ir'],
    ['ella viene', 'ella vendrá'],
    ['pongo la mesa', 'pondré la mesa'],
    ['ella sabe', 'ella sabrá'],
    ['soy feliz', 'seré feliz'],
    ['estoy cansado', 'estaré cansado'],
    ['voy a la escuela', 'iré a la escuela'],
    // from past
    ['él habló ayer', 'él hablará ayer'],
    ['dijo la verdad', 'dirá la verdad'],
    ['ellos comieron pan', 'ellos comerán pan'],
    ['tú comías', 'tú comerás'],
    // already future - no change
    ['comeré mañana', 'comeré mañana'],
    ['ella hablará', 'ella hablará'],
  ], 'toFutureTense')
  t.end()
})

test('ambiguous person:', function (t) {
  // 'hablaba' is both first and third-person - use the subject
  run(t, [
    ['yo hablaba', 'yo hablo'],
    ['ella hablaba', 'ella habla'],
    ['él hablaba', 'él habla'],
    ['usted hablaba', 'usted habla'],
    ['hablaba', 'habla'],
    ['yo era joven', 'yo soy joven'],
    ['ella era joven', 'ella es joven'],
    ['yo tenía hambre', 'yo tengo hambre'],
    // look past any clitics and negatives
    ['yo no hablaba', 'yo no hablo'],
    ['yo no lo tenía', 'yo no lo tengo'],
    ['yo nunca comía', 'yo nunca como'],
    ['yo me levantaba', 'yo me levanto'],
  ], 'toPresentTense')
  run(t, [
    ['yo hablaba', 'yo hablaré'],
    ['ella hablaba', 'ella hablará'],
    ['yo vivía aquí', 'yo viviré aquí'],
  ], 'toFutureTense')
  t.end()
})

test('ser vs ir:', function (t) {
  // 'fui' is the past-tense of both
  run(t, [
    ['fui feliz', 'soy feliz'],
    ['fui a casa', 'voy a casa'],
    ['ella fue alta', 'ella es alta'],
    ['ella fue a la tienda', 'ella va a la tienda'],
    ['fuimos amigos', 'somos amigos'],
    ['fuimos al parque', 'vamos al parque'],
    ['fueron a comer', 'van a comer'],
  ], 'toPresentTense')
  run(t, [
    ['fui feliz', 'seré feliz'],
    ['fui a casa', 'iré a casa'],
    ['fueron al parque', 'irán al parque'],
  ], 'toFutureTense')
  t.end()
})

test('compound verb-phrases:', function (t) {
  // only the finite verb changes
  run(t, [
    ['no quiero ir', 'no quise ir'],
    ['puedo hablar', 'pude hablar'],
    ['debo estudiar', 'debí estudiar'],
    ['tengo que estudiar', 'tuve que estudiar'],
    ['voy a comer', 'fui a comer'],
    ['estamos hablando', 'estuvimos hablando'],
    ['sigue lloviendo', 'siguió lloviendo'],
  ], 'toPastTense')
  run(t, [
    ['estaba comiendo', 'está comiendo'],
    ['estábamos hablando', 'estamos hablando'],
    ['pude hablar', 'puedo hablar'],
    ['tuve que estudiar', 'tengo que estudiar'],
  ], 'toPresentTense')
  run(t, [
    ['estaba comiendo', 'estará comiendo'],
    ['estamos hablando', 'estaremos hablando'],
    ['voy a comer', 'iré a comer'],
    ['debo estudiar', 'deberé estudiar'],
  ], 'toFutureTense')
  t.end()
})

test('perfect tenses:', function (t) {
  // 'he comido' collapses into a simple tense
  run(t, [
    ['he comido', 'como'],
    ['has comido', 'comes'],
    ['ella ha comido pan', 'ella come pan'],
    ['hemos hablado', 'hablamos'],
    ['habéis hablado', 'habláis'],
    ['ellos han vivido aquí', 'ellos viven aquí'],
    ['ella había comido', 'ella come'],
    ['habrá comido', 'come'],
    ['he comido y he bebido mucho', 'como y bebo mucho'],
    ['ella ha estado comiendo', 'ella está comiendo'],
  ], 'toPresentTense')
  run(t, [
    ['he comido', 'comeré'],
    ['hemos hablado', 'hablaremos'],
    ['ellos han vivido aquí', 'ellos vivirán aquí'],
    ['he comido y he bebido mucho', 'comeré y beberé mucho'],
    ['ella ha estado comiendo', 'ella estará comiendo'],
    // the future-perfect is already in the future
    ['habrá comido', 'habrá comido'],
    ['habremos hablado', 'habremos hablado'],
  ], 'toFutureTense')
  t.end()
})

test('existential haber:', function (t) {
  run(t, [['hay un gato', 'hubo un gato']], 'toPastTense')
  run(t, [['había un gato', 'había un gato']], 'toPastTense')
  run(t, [['había un gato', 'hay un gato'], ['habrá una fiesta', 'hay una fiesta'], ['hubo un problema', 'hay un problema']], 'toPresentTense')
  run(t, [['hay un gato', 'habrá un gato'], ['había un gato', 'habrá un gato']], 'toFutureTense')
  t.end()
})

test('clitics and reflexives stay put:', function (t) {
  run(t, [
    ['me levanto temprano', 'me levanté temprano'],
    ['ella se levanta', 'ella se levantó'],
    ['se lava las manos', 'se lavó las manos'],
    ['no lo sé', 'no lo supe'],
    ['te quiero', 'te quise'],
    ['nos vemos', 'nos vimos'],
    ['me lo dice', 'me lo dijo'],
  ], 'toPastTense')
  run(t, [
    ['me levanto temprano', 'me levantaré temprano'],
    ['no lo sé', 'no lo sabré'],
    ['nos vemos', 'nos veremos'],
  ], 'toFutureTense')
  run(t, [
    ['me lo dijo', 'me lo dice'],
    ['se lavó las manos', 'se lava las manos'],
  ], 'toPresentTense')
  t.end()
})

test('leaves non-indicative verbs alone:', function (t) {
  const arr = [
    'dámelo', // imperative
    'hablar', // infinitive
    'comiendo', // gerund
    'yo comería', // conditional
    'ella hablaría', // conditional
    'quisiera ir', // subjunctive
    'el gato negro', // no verb
    '',
  ]
  arr.forEach(str => {
    ;['toPastTense', 'toPresentTense', 'toFutureTense'].forEach(fn => {
      const doc = nlp(str)
      doc.verbs()[fn]()
      t.equal(doc.text(), str, here + `${fn}: no-change '${str}'`)
    })
  })
  // the infinitive subject is kept
  run(t, [['hablar es fácil', 'hablar fue fácil']], 'toPastTense')
  run(t, [['hablar es fácil', 'hablar será fácil']], 'toFutureTense')
  t.end()
})

test('punctuation and case:', function (t) {
  run(t, [
    ['¿Hablas español?', '¿Hablaste español?'],
    ['¡Ella come pan!', '¡Ella comió pan!'],
    ['Hablo español.', 'Hablé español.'],
    ['HABLO español', 'HABLÉ español'],
    ['Él no come carne.', 'Él no comió carne.'],
    ['Ella come pan, bebe agua, y duerme.', 'Ella comió pan, bebió agua, y durmió.'],
    ['Hablo español. Ella come pan, y bebe agua.', 'Hablé español. Ella comió pan, y bebió agua.'],
    ['"Tengo hambre", dice ella.', '"Tuve hambre", dijo ella.'],
  ], 'toPastTense')
  run(t, [
    ['¿Hablas español?', '¿Hablarás español?'],
    ['Hablo español. Ella come pan, y bebe agua.', 'Hablaré español. Ella comerá pan, y beberá agua.'],
  ], 'toFutureTense')
  t.end()
})

test('tags of the new verb:', function (t) {
  let doc = nlp('yo hablo español')
  doc.verbs().toPastTense()
  t.equal(doc.has('hablé'), true, here + 'new word is matchable')
  t.equal(doc.match('hablé').has('#PastTense'), true, here + 'past #PastTense')
  t.equal(doc.match('hablé').has('#FirstPerson'), true, here + 'past #FirstPerson')
  t.equal(doc.match('hablé').has('#PresentTense'), false, here + 'past not #PresentTense')

  doc = nlp('ellos comieron pan')
  doc.verbs().toFutureTense()
  t.equal(doc.match('comerán').has('#FutureTense'), true, here + 'future #FutureTense')
  t.equal(doc.match('comerán').has('#ThirdPersonPlural'), true, here + 'future #ThirdPersonPlural')
  t.equal(doc.match('comerán').has('#PastTense'), false, here + 'future not #PastTense')

  doc = nlp('tú comías')
  doc.verbs().toPresentTense()
  t.equal(doc.match('comes').has('#PresentTense'), true, here + 'present #PresentTense')
  t.equal(doc.match('comes').has('#SecondPerson'), true, here + 'present #SecondPerson')
  t.equal(doc.match('comes').has('#Imperfect'), false, here + 'present not #Imperfect')
  // the root is still found
  t.equal(doc.verbs().conjugate()[0].futureTense.second, 'comerás', here + 'conjugate after transform')
  t.end()
})

test('return value:', function (t) {
  let doc = nlp('he comido pan y ella bebe agua. Ellos hablan.')
  let m = doc.verbs().toFutureTense()
  t.equal(m.viewType, 'Verbs', here + 'returns a Verbs view')
  t.deepEqual(m.out('array'), ['comeré', 'beberá', 'hablarán.'], here + 'returns the new verbs')
  t.equal(doc.text(), 'comeré pan y ella beberá agua. Ellos hablarán.', here + 'changes the document')

  // chainable
  doc = nlp('yo hablo y ella come')
  m = doc.verbs().toPastTense().toFutureTense().toPresentTense().toPastTense()
  t.equal(doc.text(), 'yo hablé y ella comió', here + 'chained')
  t.deepEqual(m.out('array'), ['hablé', 'comió'], here + 'chained result')

  // round-trips
  const arr = ['yo hablo español', 'ella come una manzana', 'ellos viven aquí', 'tengo un perro', 'soy feliz', 'voy a la escuela', 'no lo sé']
  arr.forEach(str => {
    doc = nlp(str)
    doc.verbs().toPastTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `past round-trip '${str}'`)
    doc.verbs().toFutureTense()
    doc.verbs().toPresentTense()
    t.equal(doc.text(), str, here + `future round-trip '${str}'`)
  })
  t.end()
})

test('nth verb only:', function (t) {
  let doc = nlp('yo hablo y ella come')
  doc.verbs().toPastTense(1)
  t.equal(doc.text(), 'yo hablo y ella comió', here + 'toPastTense(1)')
  doc = nlp('yo hablo y ella come')
  doc.verbs(0).toFutureTense()
  t.equal(doc.text(), 'yo hablaré y ella come', here + 'verbs(0)')
  doc = nlp('yo hablo y ella come')
  doc.verbs().toPastTense(5)
  t.equal(doc.text(), 'yo hablo y ella come', here + 'out-of-range')
  // only the matched part of the document
  doc = nlp('yo hablo. ella come.')
  doc.eq(1).verbs().toPastTense()
  t.equal(doc.text(), 'yo hablo. ella comió.', here + 'second sentence only')
  t.end()
})

test('verbs the tagger used to miss:', function (t) {
  // 'como' is a conjunction, 'vivo' an adjective, 'trabajo' a noun - but not after 'yo'
  run(t, [
    ['yo como pan', 'yo comí pan'],
    ['yo vivo aquí', 'yo viví aquí'],
    ['yo trabajo mucho', 'yo trabajé mucho'],
    ['yo camino', 'yo caminé'],
    ['yo no como carne', 'yo no comí carne'],
    ['yo bajo', 'yo bajé'],
  ], 'toPastTense')
  run(t, [
    ['yo como pan', 'yo comeré pan'],
    ['yo vivo aquí', 'yo viviré aquí'],
    ['yo no como carne', 'yo no comeré carne'],
  ], 'toFutureTense')
  run(t, [
    ['yo comí pan', 'yo como pan'],
    ['yo viví aquí', 'yo vivo aquí'],
  ], 'toPresentTense')
  t.end()
})

test('the subjunctive after que is left alone:', function (t) {
  run(t, [
    ['quiero que vengas', 'quise que vengas'],
    ['dudo que venga', 'dudé que venga'],
    ['espero que tengas suerte', 'esperé que tengas suerte'],
    ['quiero que lo hagas', 'quise que lo hagas'],
    ['espero que ella coma', 'esperé que ella coma'],
  ], 'toPastTense')
  run(t, [
    ['quiero que vengas', 'querré que vengas'],
    ['dudo que venga', 'dudaré que venga'],
  ], 'toFutureTense')
  // .. but the indicative after que is not
  run(t, [
    ['creo que vienes', 'creí que viniste'],
    ['dice que come pan', 'dijo que comió pan'],
  ], 'toPastTense')
  t.end()
})
