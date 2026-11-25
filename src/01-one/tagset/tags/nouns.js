// only our own tags, and what differs from the shared tagset - see ../plugin.js
export default {
  Noun: {
    aliases: [null, 'Sustantivo'],
  },
  Singular: {
    not: ['Plural'],
  },
  ProperNoun: {
    aliases: [null, 'NombrePropio'],
  },
  Person: {
    aliases: [null, 'Persona'],
  },
  FirstName: {
    aliases: [null, 'Nombre'],
  },
  MaleName: {
    aliases: [null, 'NombreMasculino'],
  },
  FemaleName: {
    aliases: [null, 'NombreFemenino'],
  },
  LastName: {
    aliases: [null, 'Apellido'],
  },
  Honorific: {
    aliases: [null, 'Título'],
    is: 'Noun',
  },
  Place: {
    aliases: [null, 'Lugar'],
  },
  Country: {
    aliases: [null, 'País'],
  },
  City: {
    aliases: [null, 'Ciudad'],
  },
  Region: {
    aliases: [null, 'Región'],
  },
  Address: {
    aliases: [null, 'Dirección'],
  },
  Organization: {
    aliases: [null, 'Organización'],
  },
  SportsTeam: {
    aliases: [null, 'Equipo'],
  },
  School: {
    aliases: [null, 'Escuela'],
  },
  Company: {
    aliases: [null, 'Empresa'],
  },
  Plural: {
    not: ['Singular'],
  },
  Uncountable: {
    aliases: [null, 'Incontable'],
  },
  Pronoun: {
    aliases: [null, 'Pronombre'],
  },
  Actor: {
    not: ['Person', 'Place', 'Organization'],
  },
  Activity: {
    aliases: [null, 'Actividad'],
  },
  Unit: {
    aliases: [null, 'Unidad'],
  },
  Demonym: {
    aliases: [null, 'Gentilicio'],
  },
  Possessive: {
    aliases: [null, 'Posesivo'],
    is: undefined,
  },
  FemaleNoun: {
    aliases: [null, 'SustantivoFemenino'],
    is: 'Noun',
    not: ['MaleNoun'],
  },
  MaleNoun: {
    aliases: [null, 'SustantivoMasculino'],
    is: 'Noun',
    not: ['FemaleNoun'],
  },
}
