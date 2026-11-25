// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Value: {
    aliases: [null, 'Número'],
  },
  Ordinal: {
  },
  Cardinal: {
  },
  Fraction: {
    aliases: [null, 'Fracción'],
  },
  Multiple: {
    aliases: [null, 'Múltiplo'],
    is: 'Value',
  },
  RomanNumeral: {
    aliases: [null, 'NúmeroRomano'],
    not: ['TextValue'],
  },
  TextValue: {
    aliases: [null, 'Numeral'],
    not: ['NumericValue'],
  },
  NumericValue: {
    aliases: [null, 'Numérico'],
    not: ['TextValue'],
  },
  Money: {
    aliases: [null, 'Dinero'],
  },
  Percent: {
    aliases: [null, 'Porcentaje'],
  },
}
