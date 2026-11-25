// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Adjective: {
    aliases: [null, 'Adjetivo'],
  },
  FemaleAdjective: {
    aliases: [null, 'AdjetivoFemenino'],
    is: 'Adjective',
    not: ['MaleAdjective'],
  },
  MaleAdjective: {
    aliases: [null, 'AdjetivoMasculino'],
    is: 'Adjective',
    not: ['FemaleAdjective'],
  },
  PluralAdjective: {
    aliases: [null, 'AdjetivoPlural'],
    is: 'Adjective',
    not: ['SingularAdjective'],
  },
  SingularAdjective: {
    aliases: [null, 'AdjetivoSingular'],
    is: 'Adjective',
    not: ['PluralAdjective'],
  },
  Comparable: {
  },
  Comparative: {
    aliases: [null, 'Comparativo'],
  },
  Superlative: {
    aliases: [null, 'Superlativo'],
  },
  NumberRange: {
    aliases: [null, 'RangoNumérico'],
  },
  Adverb: {
    aliases: [null, 'Adverbio'],
  },
  Determiner: {
    aliases: [null, 'Determinante', 'Artículo'],
  },
  Conjunction: {
    aliases: [null, 'Conjunción'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'Value', 'QuestionWord'],
  },
  Preposition: {
    aliases: [null, 'Preposición'],
    is: undefined,
    not: ['Noun', 'Verb', 'Adjective', 'Adverb', 'QuestionWord'],
  },
  QuestionWord: {
    aliases: [null, 'Interrogativo'],
  },
  Currency: {
    aliases: [null, 'Moneda'],
  },
  Expression: {
    aliases: [null, 'Interjección'],
  },
  Abbreviation: {
    aliases: [null, 'Abreviatura'],
  },
  Url: {
    not: ['HashTag', 'PhoneNumber', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  PhoneNumber: {
    aliases: [null, 'Teléfono'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention', 'Email'],
  },
  HashTag: {
  },
  AtMention: {
    aliases: [null, 'Mención'],
    not: ['HashTag', 'Email'],
  },
  Emoji: {
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Emoticon: {
    aliases: [null, 'Emoticono'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Email: {
    aliases: [null, 'Correo'],
    not: ['HashTag', 'Verb', 'Adjective', 'Value', 'AtMention'],
  },
  Acronym: {
    aliases: [null, 'Acrónimo'],
    not: ['Plural', 'RomanNumeral'],
  },
  Condition: {
    aliases: [null, 'Condición'],
    is: undefined,
  },
}
