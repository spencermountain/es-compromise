import api from './api.js'
import { words } from './parse/_data.js'

export default {
  api,
  // 'doscientas', 'veintiún', 'primera', 'tercer'
  words,
  // the shared european-numbers plugin reads '1.234,56' - these are our ordinals: '2ª', '3er', '1.º'
  // .. and the currencies that follow a number - '1.500 pesos'
  model: {
    two: {
      europeanNumbers: {
        ordinal: '\\.?(?:[ºª°]|er)',
        currencies: ['euro', 'euros', 'peso', 'pesos', 'dólar', 'dólares', 'dolar', 'dolares', 'libra', 'libras'],
      },
    },
  },
}
