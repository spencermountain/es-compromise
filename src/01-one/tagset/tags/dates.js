// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Date: {
    aliases: [null, 'Fecha'],
  },
  Month: {
    aliases: [null, 'Mes'],
    is: 'Singular',
    also: ['Date'],
    not: ['Year', 'WeekDay', 'Time'],
  },
  WeekDay: {
    aliases: [null, 'DíaDeLaSemana'],
    is: 'Noun',
    also: ['Date'],
    not: undefined,
  },
  Year: {
    aliases: [null, 'Año'],
    not: ['RomanNumeral'],
  },
  FinancialQuarter: {
    aliases: [null, 'Trimestre'],
    not: 'Fraction',
  },
  Holiday: {
    aliases: [null, 'Festivo'],
  },
  Season: {
    aliases: [null, 'Estación'],
    not: undefined,
  },
  Timezone: {
    aliases: [null, 'ZonaHoraria'],
    is: 'Noun',
    also: ['Date'],
  },
  Time: {
    aliases: [null, 'Hora'],
    not: ['AtMention'],
  },
  Duration: {
    aliases: [null, 'Duración'],
    is: 'Noun',
    also: ['Date'],
  },
}
