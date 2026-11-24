# Conjunto de etiquetas

Las etiquetas de es-compromise. Cada etiqueta se puede usar en los patrones con su nombre en inglés o con su alias en español:

```js
const doc = nlp('el perro pequeño')
doc.match('#Artículo #Sustantivo #Adjetivo')
doc.match('#Determiner #Noun #Adjective') // equivalente
```

`—` significa que no tiene alias propio, porque la palabra es igual en español o no tiene una buena traducción. El nombre en inglés funciona igualmente.

`*` significa que el etiquetador no asigna esta etiqueta automáticamente a este ejemplo por ahora. Se puede asignar con `.tag()`.

## Sustantivos

| Inglés | Español | Ejemplo |
|---|---|---|
| `#Noun` | `#Sustantivo` | `perro` |
| `#Singular` | — | `perro` * |
| `#ProperNoun` | `#NombrePropio` | `Madrid` |
| `#Person` | `#Persona` | `Tony` |
| `#FirstName` | `#Nombre` | `Tony` |
| `#MaleName` | `#NombreMasculino` | `Tony` |
| `#FemaleName` | `#NombreFemenino` | `Rita` |
| `#LastName` | `#Apellido` | `Wong` |
| `#Honorific` | `#Título` | `Dr.` |
| `#Place` | `#Lugar` | `Colorado` |
| `#Country` | `#País` | `España` |
| `#City` | `#Ciudad` | `Madrid` |
| `#Region` | `#Región` | `Florida` |
| `#Address` | `#Dirección` | `Calle Mayor 5` * |
| `#Organization` | `#Organización` | `Telefónica` * |
| `#SportsTeam` | `#Equipo` | `Real Madrid` * |
| `#School` | `#Escuela` | `Universidad de Salamanca` * |
| `#Company` | `#Empresa` | `Telefónica` * |
| `#Plural` | — | `perros` |
| `#Uncountable` | `#Incontable` | `agua` * |
| `#Pronoun` | `#Pronombre` | `yo` |
| `#Actor` | — | `maestro` * |
| `#Activity` | `#Actividad` | `natación` * |
| `#Unit` | `#Unidad` | `km` |
| `#Demonym` | `#Gentilicio` | `español` * |
| `#Possessive` | `#Posesivo` | `mi` |
| `#FemaleNoun` | `#SustantivoFemenino` | `casa` |
| `#MaleNoun` | `#SustantivoMasculino` | `perro` |

## Verbos

| Inglés | Español | Ejemplo |
|---|---|---|
| `#Verb` | `#Verbo` | `hablar` |
| `#PresentTense` | `#Presente` | `hablo` |
| `#Infinitive` | `#Infinitivo` | `hablar` |
| `#Gerund` | `#Gerundio` | `hablando` |
| `#PastTense` | `#Pasado` | `hablé` |
| `#Imperfect` | `#Imperfecto` | `hablaba` |
| `#FutureTense` | `#Futuro` | `hablaré` |
| `#Copula` | `#Cópula` | `es` |
| `#Negative` | `#Negación` | `no` |
| `#Modal` | — | `debo` |
| `#PerfectTense` | `#PretéritoPerfecto` | `he hablado` * |
| `#Pluperfect` | `#Pluscuamperfecto` | `había hablado` * |
| `#Participle` | `#Participio` | `hablado` * |
| `#PhrasalVerb` | — | `darse cuenta` * |
| `#Particle` | — | `darse cuenta` * |
| `#Auxiliary` | `#Auxiliar` | `ha` |
| `#Conditional` | `#Condicional` | `hablaría` |
| `#Reflexive` | `#Reflexivo` | `lavarse` |
| `#Perfecto` | — | `hablado` |
| `#Imperative` | `#Imperativo` | `habla` * |
| `#Subjunctive` | `#Subjuntivo` | `quedes` |
| `#FirstPerson` | `#PrimeraPersona` | `hablo` |
| `#SecondPerson` | `#SegundaPersona` | `hablas` |
| `#ThirdPerson` | `#TerceraPersona` | `habla` |
| `#FirstPersonPlural` | `#PrimeraPersonaPlural` | `hablamos` |
| `#SecondPersonPlural` | `#SegundaPersonaPlural` | `habláis` |
| `#ThirdPersonPlural` | `#TerceraPersonaPlural` | `hablan` |

## Números

| Inglés | Español | Ejemplo |
|---|---|---|
| `#Value` | `#Número` | `234` |
| `#Ordinal` | — | `primero` |
| `#Cardinal` | — | `diez` |
| `#Fraction` | `#Fracción` | `1/2` |
| `#Multiple` | `#Múltiplo` | `cien` * |
| `#RomanNumeral` | `#NúmeroRomano` | `XIV` * |
| `#TextValue` | `#Numeral` | `diez` |
| `#NumericValue` | `#Numérico` | `234` |
| `#Money` | `#Dinero` | `10€` |
| `#Percent` | `#Porcentaje` | `50%` |

## Fechas y horas

| Inglés | Español | Ejemplo |
|---|---|---|
| `#Date` | `#Fecha` | `3 de mayo` |
| `#Month` | `#Mes` | `junio` |
| `#WeekDay` | `#DíaDeLaSemana` | `jueves` |
| `#Year` | `#Año` | `en 2026` |
| `#FinancialQuarter` | `#Trimestre` | `Q3` * |
| `#Holiday` | `#Festivo` | `Navidad` * |
| `#Season` | `#Estación` | `verano` * |
| `#Timezone` | `#ZonaHoraria` | `CET` * |
| `#Time` | `#Hora` | `16:30` |
| `#Duration` | `#Duración` | `meses` * |

## Otros

| Inglés | Español | Ejemplo |
|---|---|---|
| `#Adjective` | `#Adjetivo` | `rojo` |
| `#FemaleAdjective` | `#AdjetivoFemenino` | `roja` |
| `#MaleAdjective` | `#AdjetivoMasculino` | `rojo` |
| `#PluralAdjective` | `#AdjetivoPlural` | `nuevas` |
| `#SingularAdjective` | `#AdjetivoSingular` | `roja` |
| `#Comparable` | — | `rápido` * |
| `#Comparative` | `#Comparativo` | `mayor` * |
| `#Superlative` | `#Superlativo` | `rapidísimo` * |
| `#NumberRange` | `#RangoNumérico` | `5-10` |
| `#Adverb` | `#Adverbio` | `muy` |
| `#Determiner` | `#Determinante`, `#Artículo` | `el` |
| `#Conjunction` | `#Conjunción` | `y` |
| `#Preposition` | `#Preposición` | `en` |
| `#QuestionWord` | `#Interrogativo` | `cuándo` |
| `#Currency` | `#Moneda` | `euro` * |
| `#Expression` | `#Interjección` | `ay` * |
| `#Abbreviation` | `#Abreviatura` | `etc` |
| `#Url` | — | `www.example.com` |
| `#PhoneNumber` | `#Teléfono` | `555-123-4567` |
| `#HashTag` | — | `#nlp` |
| `#AtMention` | `#Mención` | `@spencer` |
| `#Emoji` | — | `😀` * |
| `#Emoticon` | `#Emoticono` | `:-)` * |
| `#Email` | `#Correo` | `info@example.com` |
| `#Acronym` | `#Acrónimo` | `FBI` |
| `#Condition` | `#Condición` | `si` |
