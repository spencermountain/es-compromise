// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Verb: {
    aliases: [null, 'Verbo'],
  },
  PresentTense: {
    aliases: [null, 'Presente'],
    not: ['PastTense'],
  },
  Infinitive: {
    aliases: [null, 'Infinitivo'],
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'FutureTense', 'Gerund'],
  },
  Gerund: {
    aliases: [null, 'Gerundio'],
    is: 'Verb',
    not: ['PresentTense', 'PastTense', 'FutureTense', 'Copula'],
  },
  PastTense: {
    aliases: [null, 'Pasado'],
  },
  Imperfect: {
    aliases: [null, 'Imperfecto'],
    is: 'PastTense',
    not: ['Conditional'],
  },
  FutureTense: {
    aliases: [null, 'Futuro'],
    not: ['PresentTense', 'Gerund', 'PastTense'],
  },
  Copula: {
    aliases: [null, 'Cópula'],
  },
  Negative: {
    aliases: [null, 'Negación'],
    not: undefined,
  },
  Modal: {
  },
  PerfectTense: {
    aliases: [null, 'PretéritoPerfecto'],
    is: 'Verb',
    not: ['Gerund'],
  },
  Pluperfect: {
    aliases: [null, 'Pluscuamperfecto'],
    is: 'Verb',
  },
  Participle: {
    aliases: [null, 'Participio'],
  },
  PhrasalVerb: {
  },
  Particle: {
  },
  Auxiliary: {
    aliases: [null, 'Auxiliar'],
  },
  Conditional: {
    aliases: [null, 'Condicional'],
    is: 'Verb',
    not: ['Infinitive', 'Imperative'],
  },
  Reflexive: {
    aliases: [null, 'Reflexivo'],
    is: 'Verb',
  },
  Perfecto: {
    is: 'Verb',
  },
  Imperative: {
    aliases: [null, 'Imperativo'],
    not: ['Subjunctive'],
  },
  Subjunctive: {
    aliases: [null, 'Subjuntivo'],
    is: 'Verb',
    not: ['Imperative'],
  },
  FirstPerson: {
    aliases: [null, 'PrimeraPersona'],
    is: 'Verb',
    not: ['SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  SecondPerson: {
    aliases: [null, 'SegundaPersona'],
    is: 'Verb',
    not: ['FirstPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  ThirdPerson: {
    aliases: [null, 'TerceraPersona'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'FirstPersonPlural', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  FirstPersonPlural: {
    aliases: [null, 'PrimeraPersonaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'SecondPersonPlural', 'ThirdPersonPlural'],
  },
  SecondPersonPlural: {
    aliases: [null, 'SegundaPersonaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'ThirdPersonPlural'],
  },
  ThirdPersonPlural: {
    aliases: [null, 'TerceraPersonaPlural'],
    is: 'Verb',
    not: ['FirstPerson', 'SecondPerson', 'ThirdPerson', 'FirstPersonPlural', 'SecondPersonPlural'],
  },
}
