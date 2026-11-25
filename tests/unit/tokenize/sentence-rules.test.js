import test from 'tape'
import nlp from '../../_lib.js'
const here = '[es-sentence-rules] '

// each line is one text - a '|' marks where one sentence ends, and the next begins
const run = function (t, cases) {
  cases
    .split('\n')
    .map(str => str.trim())
    .filter(str => str)
    .forEach(str => {
      const want = str.split('|').map(s => s.trim())
      const text = want.join(' ')
      t.deepEqual(nlp(text).fullSentences().out('array'), want, here + text)
    })
  t.end()
}

test('abbreviations:', function (t) {
  run(
    t,
    `
    El Sr. García llegó. | La Sra. López no.
    Ud. tiene razón. | Uds. no.
    Vea la pág. 5 del libro.
    Vive en EE. UU. desde 2010.
    EE.UU. es grande. | México también.
    Compró pan, leche, etc. Luego volvió.
    Compró pan, etc. y leche.
    Por ej. esto. | O p. ej. aquello.
    El Lic. Pérez y la Dra. Ruiz vienen.
    Nació en el 300 a. C. en Roma.
    Av. Libertador núm. 5, tel. 555.
    D. Juan y Dña. Inés llegaron.
    Lo vi el 5 de dic. en Madrid.
    Llegó el 1.º de mayo. | Fue 3.ª.
    La Srta. Gómez trabaja aquí. | Es abogada.
    Los Sres. Martínez no vinieron.
    El Dr. Ramírez atiende de lun. a vie. por la tarde.
    El Gral. San Martín cruzó los Andes.
    El Ing. Torres y el Arq. Vega firmaron.
    Vd. no lo entiende.
    La Profa. Díaz enseña historia.
    El Excmo. Sr. Alcalde habló.
    Fr. Luis de León fue poeta.
    Sta. Teresa nació en Ávila.
    Vive en la Avda. de América, n.º 12.
    Consulte el cap. 3, págs. 40-45.
    Véase la fig. 2 del art. 5.
    El vol. 2 de la ed. de 1990 está agotado.
    Mide aprox. 2 m de alto.
    Llame al tel. 555 1234 o al tfno. 555 4321.
    Hnos. García S. A. cerró ayer.
    La Cía. Minera del Sur despidió a cien obreros.
    Ocurrió en el s. XIX en Europa.
    Ocurrió en el siglo V d. C. en Hispania.
    Son las 5 p. m. y hace frío.
    El partido es a las 8 a. m. en el estadio.
    J. L. Borges nació en Buenos Aires. | Murió en Ginebra.
    Gabriel G. Márquez escribió la novela.
    Atte. Juan Pérez.
    Págs. 10 y 11 del doc. adjunto.
    El Pdte. López firmó el decreto.
    Depto. de Ventas, 2.º piso.
    Nació el 3 de feb. de 1990 en Lima.
    Tiene máx. 3 días para pagar.
    Real Madrid vs. Barcelona es mañana.
    EE. UU. y Canadá firmaron. | México no.
    Mons. Romero fue asesinado en 1980.
    Ver apdo. 3 del reglamento.
    El Cnel. Ruiz y el Tte. Vargas llegaron.
    Sto. Domingo es la capital.
  `
  )
})

test('not abbreviations:', function (t) {
  run(
    t,
    `
    Vamos al mar. | Hace calor.
    Compré una col. | Estaba fresca.
    Es así, aprox. 5 kg. Vale.
    Me gusta el té. | A ella no.
    No tiene sal. | Pásamela.
    Hace sol. | Vamos a la playa.
    Ya me voy. | Hasta luego.
    Dijo que sí. | Yo dije que no.
    Él no lo vio. | Ella sí.
    Eso es un don. | Úsalo bien.
    Compró un par. | Yo compré tres.
    Es mi fin. | Lo sé.
    Tengo sed. | Dame agua.
    Vive en el sur. | Trabaja en el norte.
    Lo hizo ayer. | Hoy descansa.
    Canta muy mal. | Baila peor.
    Es de Perú. | Vive en Chile.
    No sé qué es. | Pregúntale a él.
    Vamos a ver. | Tal vez mañana.
    Tiene 20 años. | Su hermano tiene 25.
    Cuesta 3,50 euros. | Es barato.
    Llegó a las 10. | Salió a las 12.
    Nació en 1990. | Murió en 2020.
    Eso no es ley. | Es costumbre.
    Me duele el pie. | No puedo andar.
    Visita www.ejemplo.es para más. | Gracias.
    Su correo es ana@correo.es y funciona.
    El archivo datos.csv pesa 2.5 MB. | Es grande.
    Costó $1.500 en total. | Fue caro.
  `
  )
})

test('questions and exclamations:', function (t) {
  run(
    t,
    `
    ¿Vienes? | ¡Claro! | Vamos.
    ¿Cómo estás? | Yo estoy bien.
    ¡Qué bonito! | Me encanta.
    ¿Qué? | ¿Cómo? | ¿Cuándo?
    ¡Hola! | ¿Cómo te llamas?
    ¿En serio?, preguntó ella.
    ¿Y tú? | Yo no.
    ¡¡Increíble!! | No lo puedo creer.
    ¿¡Qué!? | No puede ser.
    Espera… Ya voy.
    No sé... Quizás mañana.
    No sé... quizás mañana.
    Bueno... no sé qué decir. | Gracias.
    Dijo que vendría... Nunca vino.
  `
  )
})

test('quotations and dialogue:', function (t) {
  run(
    t,
    `
    Dijo: «No. No voy.» Luego salió.
    Dijo: «No. No voy. Nunca. Jamás.» Luego salió.
    Dijo: "No sé." Luego salió.
    (No lo sé.) Quizás mañana.
    —No lo sé —dijo—. | Tal vez mañana.
    «¿Dónde estás?», preguntó. | Nadie respondió.
    Ella dijo: “No puedo.” Él insistió.
    Me dijo "hola" y se fue. | No volvió.
    Él pensó (por un momento) en ella. | Luego siguió.
    Gritó «¡Socorro!» y cayó al suelo.
    «Buenos días.» Entró sin mirar.
    «Se acabó», dijo ella. | Él lloró.
    Susurró: «Calla. Está dormido.» Salimos despacio.
  `
  )
})

test('harder cases:', function (t) {
  run(
    t,
    `
    Lo escribió J. R. R. Tolkien. | Es famoso.
    Son las 5 p. m. Vamos.
    Trabaja en Telefónica S.A. Vive en Madrid.
    «Hola.» «Adiós.»
    Llegó tarde (como siempre). | Nadie dijo nada.
    Visita example.com. | Luego hablamos.
    Llegó a las 5.30. | Luego cenó.
    EL SR. GARCÍA LLEGÓ. | LA SRA. LÓPEZ NO.
    1. Abre la puerta. | 2. Entra.
    a) Primero. | b) Segundo.
    ¿Qué hora es? | —Las cinco.
    Dijo "no". | Luego "sí".
    ‘Hola’, dijo. | ‘Adiós’, respondió.
    Compró 3 kg. de arroz.
    Pesa 3 kg. Mide 2 m.
    Corrió 5 km. Luego descansó.
    Llegó en dic. Se fue en ene.
    Abrimos de lun. a vie. Cerramos los domingos.
    Vea la pág. 5. | Luego la pág. 6.
    Nació en el 300 a. C. Los romanos gobernaban.
    Vive en EE. UU. Su hermana vive en Chile.
    Hable con Ud. mismo.
    Lo dijo Ud. Yo no.
    Fue el Dr. Él lo operó.
    Mi tel. es 555. | Llámame.
    Costó aprox. 100. | No más.
    No. | Sí. | Tal vez.
    Vino, vio, etc. Nada nuevo.
    La Sra. No, la Srta.
    Estudia en la Univ. de Chile.
    Trabaja en el Depto. de Ventas. | Gana bien.
    ¡Vamos! | ¡Rápido! | No hay tiempo.
    ¿Sí? | ¿No? | Decide.
    «No», dijo. | «Sí», respondí.
    Me dijo: «Ven». | Fui.
    El niño gritó: «¡Mamá!». | Nadie vino.
    Es la 1 p. m. en Lima.
    Mide 1,80 m. Pesa 80 kg.
    Hay 3 l. de leche.
    Tardó 5 min. en llegar.
    Tardó 5 min. Fue rápido.
    Vi al Pdte. Estaba cansado.
  `
  )
})

test('longer texts:', function (t) {
  run(
    t,
    `
    Véase la fig. A y la tab. B del anexo.
    Está en el vol. II de la obra.
    Consulte el cap. IV y el art. XII.
    La Univ. Nacional de Colombia es grande.
    Vive en la Av. Siempre Viva.
    El Dr. García y la Dra. Pérez llegaron a las 5 p. m. al hospital. | Luego operaron al paciente. | Todo salió bien.
    La empresa fue fundada en 1950. | Hoy tiene aprox. 500 empleados. | En 2023 facturó 80 millones.
    Llegó a las 7. | No había nadie. | Entonces esperó hasta las 8. | Después se fue.
    Necesitamos harina, huevos, azúcar, etc. ¿Lo tienes todo?
    Cervantes nació en 1547 en Alcalá de Henares. | Murió en Madrid en 1616.
    El Sr. Pérez vive en EE. UU. desde 2010. | Su esposa, la Sra. Gómez, es de Chile.
    Mide 1,80 m. Ella mide 1,65 m.
    El paquete pesa 2 kg. El envío cuesta 5 euros.
    Abrimos de lun. a vie. de 8 a 17 h. Los sábados solo hasta las 14 h.
    ¡Qué sorpresa! | ¿Cuándo llegaste? | No te esperaba hasta mañana.
    Juan G. No vino.
    Hable con el Lic. Él le ayudará.
    El texto está en la pág. 5. | Léalo con calma.
  `
  )
})
