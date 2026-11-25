import test from 'tape'
import nlp from '../../_lib.js'
const here = '[imperative] '

test('toImperative:', function (t) {
  const verb = nlp.world().methods.two.transform.verb
  // [tú, usted, vosotros, ustedes] - the positive command, not 'no hables'
  const arr = [
    ['hablar', ['habla', 'hable', 'hablad', 'hablen']],
    ['comer', ['come', 'coma', 'comed', 'coman']],
    ['vivir', ['vive', 'viva', 'vivid', 'vivan']],
    ['llamar', ['llama', 'llame', 'llamad', 'llamen']],
    ['juntar', ['junta', 'junte', 'juntad', 'junten']],
    ['llegar', ['llega', 'llegue', 'llegad', 'lleguen']],
    ['romper', ['rompe', 'rompa', 'romped', 'rompan']],
    ['destruir', ['destruye', 'destruya', 'destruid', 'destruyan']],
    ['pensar', ['piensa', 'piense', 'pensad', 'piensen']],
    ['dormir', ['duerme', 'duerma', 'dormid', 'duerman']],
    ['pedir', ['pide', 'pida', 'pedid', 'pidan']],
    ['reír', ['ríe', 'ría', 'reíd', 'rían']],
    ['toser', ['tose', 'tosa', 'tosed', 'tosan']],
    // the short ones
    ['tener', ['ten', 'tenga', 'tened', 'tengan']],
    ['poner', ['pon', 'ponga', 'poned', 'pongan']],
    ['hacer', ['haz', 'haga', 'haced', 'hagan']],
    ['salir', ['sal', 'salga', 'salid', 'salgan']],
    ['venir', ['ven', 'venga', 'venid', 'vengan']],
    ['decir', ['di', 'diga', 'decid', 'digan']],
    ['ir', ['ve', 'vaya', 'id', 'vayan']],
    ['ser', ['sé', 'sea', 'sed', 'sean']],
    ['suponer', ['supón', 'suponga', 'suponed', 'supongan']],
    ['mantener', ['mantén', 'mantenga', 'mantened', 'mantengan']],
    ['prevenir', ['prevén', 'prevenga', 'prevenid', 'prevengan']],
    // .. and the verbs built on the short ones
    ['intervenir', ['intervén', 'intervenga', 'intervenid', 'intervengan']],
    ['convenir', ['convén', 'convenga', 'convenid', 'convengan']],
    ['detener', ['detén', 'detenga', 'detened', 'detengan']],
    ['obtener', ['obtén', 'obtenga', 'obtened', 'obtengan']],
    ['componer', ['compón', 'componga', 'componed', 'compongan']],
    ['rehacer', ['rehaz', 'rehaga', 'rehaced', 'rehagan']],
    ['sobresalir', ['sobresal', 'sobresalga', 'sobresalid', 'sobresalgan']],
    ['predecir', ['predice', 'prediga', 'predecid', 'predigan']],
    // verbs that are not in the imperative data
    ['atrever', ['atreve', 'atreva', 'atreved', 'atrevan']],
    ['quejar', ['queja', 'queje', 'quejad', 'quejen']],
    ['adquirir', ['adquiere', 'adquiera', 'adquirid', 'adquieran']],
    ['consolar', ['consuela', 'consuele', 'consolad', 'consuelen']],
    ['nevar', ['nieva', 'nieve', 'nevad', 'nieven']],
    ['tuitear', ['tuitea', 'tuitee', 'tuitead', 'tuiteen']],
    // a reflexive infinitive
    ['acostarse', ['acuesta', 'acueste', 'acostad', 'acuesten']],
  ]
  arr.forEach((a) => {
    const [inf, want] = a
    const res = verb.toImperative(inf)
    t.deepEqual([res.second, res.third, res.secondPlural, res.thirdPlural], want, here + inf)
    t.equal(res.first, '', here + inf + ' has no first-person')
  })
  t.end()
})

test('commands agree with the other tenses:', function (t) {
  const verb = nlp.world().methods.two.transform.verb
  const arr = ['hablar', 'comer', 'vivir', 'cerrar', 'volver', 'jugar', 'conocer', 'traducir', 'escribir', 'empezar', 'buscar', 'pagar']
  arr.forEach((inf) => {
    const res = verb.toImperative(inf)
    t.equal(res.second, verb.toPresent(inf).third, here + `${inf} - tú is the present`)
    t.equal(res.third, verb.toSubjunctive(inf).third, here + `${inf} - usted is the subjunctive`)
    t.equal(res.thirdPlural, verb.toSubjunctive(inf).thirdPlural, here + `${inf} - ustedes is the subjunctive`)
    t.equal(res.secondPlural, inf.replace(/r$/, 'd'), here + `${inf} - vosotros`)
  })
  t.end()
})

test('command tags:', function (t) {
  t.equal(nlp('hablad').has('#Imperative'), true, here + 'hablad')
  t.equal(nlp('comed').has('#Imperative'), true, here + 'comed')
  t.equal(nlp('¡Corre más rápido!').has('^#Imperative'), true, here + 'corre')
  // the negative command is the subjunctive form
  const arr = [
    ['no hables', 'hablar'],
    ['no comas eso', 'comer'],
    ['¡Corre más rápido!', 'correr'],
    ['hablad', 'hablar'],
  ]
  arr.forEach((a) => {
    const [str, root] = a
    const doc = nlp(str).compute('root')
    t.equal(doc.has('#Imperative'), true, here + `'${str}' is a command`)
    t.equal(doc.has(`{${root}}`), true, here + `'${str}' is ${root}`)
  })
  t.end()
})

test('negative commands:', function (t) {
  const arr = [
    ['no vengas', 'vengas', 'venir'],
    ['No vengas tarde.', 'vengas', 'venir'],
    ['No sientas miedo.', 'sientas', 'sentir'],
    ['no te vayas', 'vayas', 'ir'],
    ['no lo toques', 'toques', 'tocar'],
    ['No me digas.', 'digas', 'decir'],
    ['no se lo digas a nadie', 'digas', 'decir'],
    ['no salgas', 'salgas', 'salir'],
  ]
  arr.forEach((a) => {
    const [str, word, root] = a
    const m = nlp(str).compute('root').match(word)
    t.equal(m.has('#Imperative'), true, here + `'${str}' is a command`)
    t.equal(m.has(`{${root}}`), true, here + `'${str}' is ${root}`)
    // .. and a command keeps its tense
    const doc = nlp(str)
    doc.verbs().toPastTense()
    t.equal(doc.text(), str, here + `'${str}' is unchanged`)
  })
  // these are statements
  const not = ['No comes carne.', 'No viene nadie.', 'No lo sé.', 'No hablamos mucho.', 'No tengo tiempo.', 'No paras de hablar.', 'No es verdad.']
  not.forEach((str) => {
    t.equal(nlp(str).has('#Imperative'), false, here + `'${str}' is not a command`)
  })
  t.end()
})
