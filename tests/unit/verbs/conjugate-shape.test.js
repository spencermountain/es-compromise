import test from 'tape'
import nlp from '../../_lib.js'
const here = '[conjugate-shape] '
nlp.verbose(false)

const persons = ['first', 'second', 'third', 'firstPlural', 'secondPlural', 'thirdPlural']
const tenses = ['presentTense', 'pastTense', 'futureTense', 'conditional', 'subjunctive']
const conjugate = str => nlp(str).verbs().conjugate()[0]

test('conjugate shape:', function (t) {
  const verbs = ['ser', 'ir', 'tener', 'hablar', 'comer', 'vivir']
  verbs.forEach(inf => {
    const res = nlp(inf).verbs().conjugate()
    t.equal(res.length, 1, here + inf + ' - one result')
    const o = res[0]
    t.equal(o.infinitive, inf, here + inf + ' - infinitive')
    tenses.forEach(tense => {
      t.deepEqual(Object.keys(o[tense] || {}), persons, here + inf + ' - ' + tense + ' persons')
      const forms = Object.values(o[tense] || {})
      t.ok(forms.every(str => typeof str === 'string' && str.length > 0), here + inf + ' - ' + tense + ' forms')
    })
    t.equal(typeof o.gerund, 'string', here + inf + ' - gerund')
    t.equal(typeof o.perfecto, 'string', here + inf + ' - perfecto')
  })
  t.deepEqual(nlp('el gato negro').verbs().conjugate(), [], here + 'no verb')
  t.end()
})

test('regular verbs:', function (t) {
  const arr = [
    ['hablar', 'presentTense', ['hablo', 'hablas', 'habla', 'hablamos', 'habláis', 'hablan']],
    ['comer', 'presentTense', ['como', 'comes', 'come', 'comemos', 'coméis', 'comen']],
    ['comer', 'futureTense', ['comeré', 'comerás', 'comerá', 'comeremos', 'comeréis', 'comerán']],
    ['comer', 'conditional', ['comería', 'comerías', 'comería', 'comeríamos', 'comeríais', 'comerían']],
    ['comer', 'subjunctive', ['coma', 'comas', 'coma', 'comamos', 'comáis', 'coman']],
    ['vivir', 'presentTense', ['vivo', 'vives', 'vive', 'vivimos', 'vivís', 'viven']],
    ['vivir', 'pastTense', ['viví', 'viviste', 'vivió', 'vivimos', 'vivisteis', 'vivieron']],
    ['vivir', 'subjunctive', ['viva', 'vivas', 'viva', 'vivamos', 'viváis', 'vivan']],
  ]
  arr.forEach(a => {
    const [inf, tense, want] = a
    t.deepEqual(Object.values(conjugate(inf)[tense]), want, here + inf + ' ' + tense)
  })
  t.equal(conjugate('vivir').perfecto, 'vivido', here + 'vivido')
  t.end()
})

test('irregular verbs:', function (t) {
  const arr = [
    ['ser', 'presentTense', ['soy', 'eres', 'es', 'somos', 'sois', 'son']],
    ['ser', 'pastTense', ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron']],
    ['ser', 'futureTense', ['seré', 'serás', 'será', 'seremos', 'seréis', 'serán']],
    ['ser', 'subjunctive', ['sea', 'seas', 'sea', 'seamos', 'seáis', 'sean']],
    ['ir', 'presentTense', ['voy', 'vas', 'va', 'vamos', 'vais', 'van']],
    ['ir', 'pastTense', ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron']],
    ['ir', 'futureTense', ['iré', 'irás', 'irá', 'iremos', 'iréis', 'irán']],
    ['ir', 'subjunctive', ['vaya', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan']],
    ['tener', 'presentTense', ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen']],
    ['tener', 'pastTense', ['tuve', 'tuviste', 'tuvo', 'tuvimos', 'tuvisteis', 'tuvieron']],
    ['tener', 'futureTense', ['tendré', 'tendrás', 'tendrá', 'tendremos', 'tendréis', 'tendrán']],
    ['tener', 'conditional', ['tendría', 'tendrías', 'tendría', 'tendríamos', 'tendríais', 'tendrían']],
    ['tener', 'subjunctive', ['tenga', 'tengas', 'tenga', 'tengamos', 'tengáis', 'tengan']],
  ]
  arr.forEach(a => {
    const [inf, tense, want] = a
    t.deepEqual(Object.values(conjugate(inf)[tense]), want, here + inf + ' ' + tense)
  })
  t.equal(conjugate('ser').gerund, 'siendo', here + 'siendo')
  t.equal(conjugate('ser').perfecto, 'sido', here + 'sido')
  t.equal(conjugate('ir').gerund, 'yendo', here + 'yendo')
  t.equal(conjugate('ir').perfecto, 'ido', here + 'ido')
  t.equal(conjugate('tener').gerund, 'teniendo', here + 'teniendo')
  t.equal(conjugate('tener').perfecto, 'tenido', here + 'tenido')
  // from a conjugated form
  t.equal(conjugate('nosotros tenemos hambre').infinitive, 'tener', here + 'tenemos')
  t.equal(conjugate('ellos tuvieron suerte').presentTense.first, 'tengo', here + 'tuvieron')
  t.equal(conjugate('yo soy alto').infinitive, 'ser', here + 'soy')
  t.equal(conjugate('ella va a casa').infinitive, 'ir', here + 'va')
  t.end()
})
