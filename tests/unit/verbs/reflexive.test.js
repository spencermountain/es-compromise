import test from 'tape'
import nlp from '../../_lib.js'
const here = '[reflexive] '

const run = function (t, arr, fn) {
  arr.forEach((a) => {
    const [str, want] = a
    const doc = nlp(str)
    doc.verbs()[fn]()
    t.equal(doc.text(), want, here + `${fn}: '${str}'`)
  })
}

test('verbs that are only reflexive:', function (t) {
  run(t, [
    ['Me arrepiento de todo.', 'Me arrepentí de todo.'],
    ['Se queja siempre.', 'Se quejó siempre.'],
    ['No me atrevo.', 'No me atreví.'],
    ['Me jacto de eso.', 'Me jacté de eso.'],
    ['Me bronceo en la playa.', 'Me bronceé en la playa.'],
  ], 'toPastTense')
  run(t, [
    ['Me arrepentí.', 'Me arrepiento.'],
    ['Se enteró de todo.', 'Se entera de todo.'],
    ['Se zambulló en el agua.', 'Se zambulle en el agua.'],
    ['Me atreví a hablar.', 'Me atrevo a hablar.'],
  ], 'toPresentTense')
  run(t, [
    ['Me arrepiento de todo.', 'Me arrepentiré de todo.'],
    ['Se queja siempre.', 'Se quejará siempre.'],
  ], 'toFutureTense')
  t.end()
})

test('a reflexive infinitive conjugates as its plain verb:', function (t) {
  const verb = nlp.world().methods.two.transform.verb
  const arr = [
    ['acostarse', 'acuesto', 'acosté'],
    ['arrepentirse', 'arrepiento', 'arrepentí'],
    ['quejarse', 'quejo', 'quejé'],
    ['levantarse', 'levanto', 'levanté'],
    ['irse', 'voy', 'fui'],
  ]
  arr.forEach((a) => {
    const [inf, present, past] = a
    t.equal(verb.toPresent(inf).first, present, here + `${inf} present`)
    t.equal(verb.toPast(inf).first, past, here + `${inf} past`)
  })
  t.equal(verb.toPerfecto('acostarse'), 'acostado', here + 'participle')
  t.equal(verb.toGerund('levantarse'), 'levantando', here + 'gerund')
  // .. and the models give back the plain verb
  t.equal(verb.fromPast('llovió', 'ThirdPerson'), 'llover', here + 'llovió')
  t.equal(verb.fromPast('acostó', 'ThirdPerson'), 'acostar', here + 'acostó')
  t.end()
})

test('reflexive roots:', function (t) {
  const arr = [
    ['Me arrepentí.', 'arrepentí', 'arrepentir'],
    ['Se quejó mucho.', 'quejó', 'quejar'],
    ['Me levanto temprano.', 'levanto', 'levantar'],
    ['Nos queremos mucho.', 'queremos', 'querer'],
    ['Se sienten bien.', 'sienten', 'sentir'],
    ['Me siento mal.', 'siento', 'sentir'],
    ['Me siento en la silla.', 'siento', 'sentar'],
    ['Lo siento.', 'siento', 'sentir'],
    // commands, with the pronoun attached
    ['Levántate ahora.', 'levántate', 'levantar'],
    ['Acuéstate.', 'acuéstate', 'acostar'],
    ['Cállate.', 'cállate', 'callar'],
    ['Siéntate aquí.', 'siéntate', 'sentar'],
    ['Siéntese, por favor.', 'siéntese', 'sentar'],
    ['Póngase cómodo.', 'póngase', 'poner'],
    ['Vámonos.', 'vámonos', 'ir'],
  ]
  arr.forEach((a) => {
    const [str, word, root] = a
    const m = nlp(str).compute('root').match(word)
    t.equal(m.has(`{${root}}`), true, here + `'${str}' - ${word} is ${root}`)
  })
  t.end()
})

test('reflexive sentences:', function (t) {
  run(t, [
    // 'irse' is to leave
    ['Se fue ayer.', 'Se va ayer.'],
    ['Me fui a casa.', 'Me voy a casa.'],
    ['Se había ido.', 'Se va.'],
    ['Me he levantado tarde.', 'Me levanto tarde.'],
    ['Nos quisimos mucho.', 'Nos queremos mucho.'],
  ], 'toPresentTense')
  run(t, [
    ['Me voy a casa.', 'Me fui a casa.'],
    ['Me lo como todo.', 'Me lo comí todo.'],
    ['Se venden casas.', 'Se vendieron casas.'],
    ['Se sienten bien.', 'Se sintieron bien.'],
    ['Me siento mal.', 'Me sentí mal.'],
    ['Nos queremos mucho.', 'Nos quisimos mucho.'],
    ['Me llamo Ana.', 'Me llamé Ana.'],
    // a command has no tense
    ['Levántate ahora.', 'Levántate ahora.'],
    ['Siéntese, por favor.', 'Siéntese, por favor.'],
  ], 'toPastTense')
  run(t, [
    ['Quiero ducharme.', 'Querré ducharme.'],
    ['Me estoy duchando.', 'Me estaré duchando.'],
    ['Tengo que irme.', 'Tendré que irme.'],
  ], 'toFutureTense')
  // a tense wins over a command of some other verb
  t.equal(nlp('se sienten bien').match('sienten').has('#PresentTense'), true, here + 'sienten is present')
  t.equal(nlp('se venden casas').match('casas').has('#Noun'), true, here + 'casas is a noun')
  t.end()
})
