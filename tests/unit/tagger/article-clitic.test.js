import test from 'tape'
import nlp from '../../_lib.js'
const here = '[article-clitic] '
nlp.verbose(false)

// la / los / las are articles, and object-pronouns too
// [word] is a verb, after its pronoun - {word} is a noun, after its article
const clitics = [
  'la [veo]',
  'los [tengo]',
  'no las [quiero]',
  'lo [sé]',
  'me la [dio]',
  'la [quiero] mucho',
  'los [vi] ayer',
  'las [compré] en el {mercado}',
  'lo [hago] mañana',
  'no lo [creo]',
  'ya la [conozco]',
  'te lo [digo]',
  'se la [mandé]',
  'nos los [dieron]',
  'me las [trajo]',
  'la [llamo] luego',
  'los [necesito] hoy',
  'las [encontré] en la {mesa}',
  'lo [tiene] Juan',
  'la [tienen] ellos',
  'no los [veo]',
  'siempre la [ayudo]',
  'nunca lo [dice]',
  'yo la [cuento]',
  'ella lo [sabe]',
  'él las [vende]',
  'nosotros los [esperamos]',
  'ellos la [buscan]',
  'tú lo [quieres]',
  'la [busco] en la {calle}',
  'los [llevo] a la {escuela}',
  'las [pongo] en la {mesa}',
  'lo [como] con pan',
  'la [abre] con cuidado',
  'los [cierra] cada noche',
  'las [lava] cada día',
  'lo [compra] en la {tienda}',
  'la [escribe] en español',
  'los [lee] en la {cama}',
  'las [canta] muy bien',
  'no la [toques]',
  'no lo [compres]',
  'no los [pierdas]',
  'no las [abras]',
  'si la [ves,] dile hola',
  'cuando lo [veo,] sonrío',
  'porque la [quiero]',
  'que lo [haga] él',
  'quien la [tiene]',
  'donde los [venden]',
  'me lo [dijo] ayer',
  'te la [presto] mañana',
  'se lo [cuento] todo',
  'se las [doy] mañana',
  'nos la [enseñó]',
  'me los [regaló] mi madre',
  'María la [visita] cada semana',
  'Juan lo [compra] todo',
  'mi madre la [cocina] muy bien',
  'el {niño} lo [rompe]',
  'la {mujer} los [llama]',
  'el {profesor} las [corrige]',
  'la {casa} la [pinta] mi padre',
  'el {libro} lo [escribe] ella',
  'las {cartas} las [envía] Pedro',
  'ya lo [entiendo]',
  'también la [conozco]',
  'todavía los [tengo]',
  'ahora la [veo]',
  'aquí lo [dejo]',
  'la [vi] y la [saludé]',
  'lo [abrió] y lo [cerró]',
  'la [compra] y la [vende]',
  'la [camino] cada día',
  'los [cambia] cada mes',
  'las [prueba] todas',
  'lo [cocina] con ajo',
  'lo [trabajo] mucho',
  'la {marcha} la [organiza] el {sindicato}',
  'me la [cuenta] siempre',
  'no la [cocina] nunca',
  'ella la [cuenta] bien',
  'no lo [bailo]',
  'la [limpia] cada día',
  'los [pinta] de rojo',
  'las [planta] en primavera',
  'la [baila] muy bien',
  'lo [practica] mucho'
]

const articles = [
  'la {casa} es grande',
  'las {casas} son grandes',
  'las {casas} y el {gato}',
  'los {libros} están en la {mesa}',
  'el {gato} come pescado',
  'un {perro} ladra en la {calle}',
  'una {mujer} canta en la {plaza}',
  'unos {niños} juegan en el {parque}',
  'unas {flores} crecen en el {jardín}',
  'la {cuenta} es muy alta',
  'las {cuentas} están pagadas',
  'la {compra} fue rápida',
  'las {compras} de hoy',
  'la {cocina} es pequeña',
  'las {cocinas} modernas',
  'el {trabajo} es duro',
  'los {trabajos} son difíciles',
  'la {marcha} fue larga',
  'la {toma} de la {ciudad}',
  'el {baile} empieza a las diez',
  'los {bailes} de salón',
  'la {calle} está vacía',
  'las {calles} de Madrid',
  'el {nombre} de la {rosa}',
  'los {nombres} de los {niños}',
  'el {viaje} fue largo',
  'los {viajes} son caros',
  'la {nieve} cae en invierno',
  'la {base} del {edificio}',
  'las {bases} del {proyecto}',
  'el {detalle} es importante',
  'los {detalles} del {plan}',
  'la {tienda} está cerrada',
  'las {tiendas} abren a las nueve',
  'la {cosa} es sencilla',
  'las {cosas} van bien',
  'el {vestido} es rojo',
  'los {vestidos} de novia',
  'el {partido} empieza a las ocho',
  'los {partidos} políticos',
  'el {hecho} es claro',
  'los {resultados} son buenos',
  'los {valores} de la {empresa}',
  'las {razones} son claras',
  'las {estaciones} del {año}',
  'los {planes} de mañana',
  'las {cruces} de madera',
  'los {disfraces} de carnaval',
  'los {cuadernos} están en la {mochila}',
  'los {vasos} están sucios',
  'los {sombreros} son negros',
  'los {pájaros} cantan',
  'los {números} son grandes',
  'los {gobiernos} europeos',
  'la {libertad} es importante',
  'el {lugar} es bonito',
  'el {hogar} es cálido',
  'los {niveles} son altos',
  'los {pasteles} están ricos',
  'los {intereses} del {banco}',
  'los {almacenes} están llenos',
  'las {tardes} de verano',
  'los {montes} están nevados',
  'los {peines} están en el {baño}',
  'veo la {casa}',
  'tengo los {libros}',
  'quiero las {manzanas}',
  'compré una {mesa}',
  'vendí el {coche}',
  'en la {casa} hay un {gato}',
  'con los {amigos} de mi hermano',
  'de las {ciudades} del {norte}',
  'para la {familia}',
  'por la {calle}',
  'sin los {zapatos}',
  'sobre la {mesa}',
  'desde la {ventana}',
  'hasta la {puerta}',
  'entre los {árboles}',
  'vivo en la {ciudad}',
  'voy a la {escuela}',
  'vengo de la {tienda}',
  'pienso en las {vacaciones}',
  'hablo con la {profesora}',
  'escribo sobre la {guerra}',
  'el {lunes} voy al {médico}',
  'los {lunes} trabajo',
  'la {crisis} es grave',
  'las {crisis} son frecuentes',
  'el {paraguas} está roto',
  'los {paraguas} son negros',
  'el {agua} está fría',
  'las {aguas} del {río}',
  'el {problema} es difícil',
  'los {problemas} son muchos',
  'la {mano} derecha',
  'los {cafés} del {centro}',
  'los {sofás} son cómodos',
  'los {menús} del {día}',
  'las {flores} son bonitas',
  'las {torres} son altas',
  'las {iglesias} son antiguas',
  'los {dolores} de cabeza',
  'María compra la {casa}',
  'la {casa} la [compra] María',
  'la {cuenta} la [paga] Juan',
  'las {cuentas} las [lleva] mi hermana',
  'me gusta la {cocina}',
  'me gustan las {flores}',
  'no tengo la {llave}',
  'no veo los {problemas}',
  'no quiero la {sopa}'
]

// each marked word, and the word before it
const parse = function (str) {
  const words = str.split(' ')
  const text = str.replace(/[[\]{}]/g, '')
  const doc = nlp(text)
  const terms = doc.json()[0].terms.filter((o) => o.text)
  const out = []
  words.forEach((w, i) => {
    if (/^[[{]/.test(w)) {
      // a contraction has a silent term - 'del' is 'de' + 'el'
      const n = terms.findIndex((o, k) => k >= i && o.text === w.replace(/[[\]{},]/g, ''))
      out.push({ isVerb: w.startsWith('['), term: terms[n], before: terms[n - 1], art: words[i - 1].toLowerCase() })
    }
  })
  return { text, out }
}

test('clitic + verb:', function (t) {
  clitics.forEach((str) => {
    const { text, out } = parse(str)
    out.forEach((o) => {
      const want = o.isVerb ? 'Verb' : 'Noun'
      t.ok(o.term.tags.includes(want), here + `'${text}' - ${o.term.text} is a ${want}`)
      if (o.isVerb && o.art !== 'lo') {
        t.ok(o.before.tags.includes('Pronoun'), here + `'${text}' - ${o.before.text} is a Pronoun`)
      }
    })
  })
  t.end()
})

test('article + noun:', function (t) {
  articles.forEach((str) => {
    const { text, out } = parse(str)
    out.forEach((o) => {
      const want = o.isVerb ? 'Verb' : 'Noun'
      t.ok(o.term.tags.includes(want), here + `'${text}' - ${o.term.text} is a ${want}`)
      if (!o.isVerb && /^(la|los|las)$/.test(o.art)) {
        t.ok(o.before.tags.includes('Determiner'), here + `'${text}' - ${o.before.text} is a Determiner`)
      }
    })
  })
  t.end()
})

test('article-clitic misc:', function (t) {
  // an auxiliary takes the pronoun
  let doc = nlp('la he visto')
  t.ok(doc.has('^#Pronoun #Auxiliary'), here + 'la he visto')
  doc = nlp('los puede ver')
  t.ok(doc.has('^#Pronoun'), here + 'los puede ver')
  // 'no' + pronoun
  doc = nlp('no lo creo')
  t.ok(doc.has('no #Pronoun #Verb'), here + 'no lo creo')
  // a subjunctive wants its 'no', or its 'que'
  t.ok(nlp('la calle').has('#Determiner #Noun'), here + 'la calle')
  t.ok(nlp('no la calle').has('#Pronoun #Verb'), here + 'no la calle')
  t.ok(nlp('espero que la toques').has('#Pronoun #Verb$'), here + 'que la toques')
  t.ok(nlp('creo que la calle es larga').has('#Determiner #Noun #Copula'), here + 'que la calle es')
  // feminine nouns in '-o'
  t.ok(nlp('la mano').has('#Determiner #Noun'), here + 'la mano')
  t.ok(nlp('la radio').has('#Determiner #Noun'), here + 'la radio')
  // number + gender
  t.ok(nlp('las partes').has('#Determiner #Plural'), here + 'las partes')
  t.ok(nlp('las luces').has('#Determiner #Plural'), here + 'las luces')
  t.ok(nlp('las tienes').has('#Pronoun #Verb'), here + 'las tienes')
  t.ok(nlp('los tenemos').has('#Pronoun #Verb'), here + 'los tenemos')
  // possessives
  t.ok(nlp('mis compras son caras').has('^#Possessive #Plural'), here + 'mis compras')
  t.ok(nlp('su cuenta').has('#Possessive #Noun'), here + 'su cuenta')
  // 'el' with no accent - a noun, unless the verb-form is its own
  t.ok(nlp('el programa es largo').has('^el #Noun'), here + 'el programa es')
  t.ok(nlp('el cura la bendice').has('^el #Noun'), here + 'el cura')
  t.ok(nlp('el agua').has('^el #Noun'), here + 'el agua')
  t.ok(nlp('el tiene un perro').has('^el #Verb'), here + 'el tiene')
  t.ok(nlp('el canta muy bien').has('^el #Verb'), here + 'el canta muy bien')
  t.ok(nlp('el salió ayer').has('^el #Verb'), here + 'el salió')
  // names keep their capital letter
  t.ok(nlp('la Rosa').has('#Person'), here + 'la Rosa')
  t.end()
})
