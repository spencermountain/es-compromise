// an audit of common adjectives - used by adjective-audit.test.js, and tests/_hmm/adjective-audit.hmm.js
// male female plural femalePlural
//  - '*' means the tagger does not see an adjective in 'es <word>', yet - these are tested in tests/_hmm
//  - '?' means the feminine is ambiguous without a lexicon - 'holgazana' is 'holgazán', but 'cubana' is 'cubano'
const list = `
rojo roja rojos rojas
blanco blanca blancos blancas
negro negra negros negras
amarillo amarilla amarillos amarillas
alto alta altos altas
bajo baja bajos bajas
largo larga largos largas
corto corta cortos cortas
pequeño pequeña pequeños pequeñas
bueno buena buenos buenas
malo mala malos malas
nuevo nueva nuevos nuevas
viejo vieja viejos viejas
bonito bonita bonitos bonitas
feo fea feos feas
hermoso hermosa hermosos hermosas
rico rica ricos ricas
limpio limpia limpios limpias
sucio sucia sucios sucias
frío fría fríos frías
barato barata baratos baratas
caro cara caros caras
rápido rápida rápidos rápidas
lento lenta lentos lentas
simpático simpática simpáticos simpáticas
tranquilo tranquila tranquilos tranquilas
cansado cansada cansados cansadas
contento contenta contentos contentas
enfermo enferma enfermos enfermas
famoso famosa famosos famosas
antiguo antigua antiguos antiguas
moderno moderna modernos modernas
*pesado *pesada *pesados *pesadas
ligero ligera ligeros ligeras
gordo gorda gordos gordas
delgado delgada delgados delgadas
guapo guapa guapos guapas
listo lista listos listas
tonto tonta tontos tontas
serio seria serios serias
divertido divertida divertidos divertidas
aburrido aburrida aburridos aburridas
honesto honesta honestos honestas
generoso generosa generosos generosas
peligroso peligrosa peligrosos peligrosas
seguro segura seguros seguras
oscuro oscura oscuros oscuras
claro clara claros claras
duro dura duros duras
tímido tímida tímidos tímidas
público pública públicos públicas
político política políticos políticas
único única únicos únicas
último última últimos últimas
mexicano mexicana mexicanos mexicanas
italiano italiana italianos italianas
chino china chinos chinas
argentino argentina argentinos argentinas
grande grande grandes grandes
verde verde verdes verdes
triste triste tristes tristes
alegre alegre alegres alegres
fuerte fuerte fuertes fuertes
pobre pobre pobres pobres
libre libre libres libres
amable amable amables amables
importante importante importantes importantes
interesante interesante interesantes interesantes
inteligente inteligente inteligentes inteligentes
diferente diferente diferentes diferentes
dulce dulce dulces dulces
enorme enorme enormes enormes
simple simple simples simples
posible posible posibles posibles
terrible terrible terribles terribles
caliente caliente calientes calientes
elegante elegante elegantes elegantes
excelente excelente excelentes excelentes
fácil fácil fáciles fáciles
difícil difícil difíciles difíciles
útil útil útiles útiles
débil débil débiles débiles
ágil ágil ágiles ágiles
azul azul azules azules
igual igual iguales iguales
especial especial especiales especiales
normal normal normales normales
general general generales generales
principal principal principales principales
natural natural naturales naturales
social social sociales sociales
cruel cruel crueles crueles
fiel fiel fieles fieles
feliz feliz felices felices
capaz capaz capaces capaces
veloz veloz veloces veloces
feroz feroz feroces feroces
popular popular populares populares
familiar familiar familiares familiares
*regular *regular regulares regulares
joven joven jóvenes jóvenes
común común comunes comunes
gris gris grises grises
cortés cortés corteses corteses
marrón marrón marrones marrones
mejor mejor mejores mejores
peor peor peores peores
mayor mayor mayores mayores
menor menor menores menores
superior superior superiores superiores
inferior inferior inferiores inferiores
anterior anterior anteriores anteriores
exterior exterior exteriores exteriores
trabajador trabajadora trabajadores trabajadoras
hablador habladora habladores habladoras
encantador encantadora encantadores encantadoras
conservador conservadora conservadores conservadoras
español española españoles españolas
*inglés inglesa ingleses inglesas
francés francesa franceses francesas
alemán alemana alemanes alemanas
portugués portuguesa portugueses portuguesas
japonés japonesa japoneses japonesas
irlandés irlandesa irlandeses irlandesas
holandés holandesa holandeses holandesas
catalán catalana catalanes catalanas
andaluz andaluza andaluces andaluzas
cabezón cabezona cabezones cabezonas
dormilón dormilona dormilones dormilonas
holgazán holgazana holgazanes holgazanas ?
pequeñín pequeñina pequeñines pequeñinas ?
optimista optimista optimistas optimistas
pesimista pesimista pesimistas pesimistas
egoísta egoísta egoístas egoístas
realista realista realistas realistas
belga belga belgas belgas
agrícola agrícola agrícolas agrícolas
israelí israelí israelíes israelíes
iraní iraní iraníes iraníes
marroquí marroquí marroquíes marroquíes
hindú hindú hindúes hindúes
`

export default list.trim().split('\n').map((line) => {
  const [male, female, plural, femalePlural, amb] = line.split(' ')
  const forms = { male, female, plural, femalePlural }
  // the forms that are parked
  const hmm = Object.keys(forms).filter((k) => forms[k].startsWith('*'))
  Object.keys(forms).forEach((k) => {
    forms[k] = forms[k].replace(/^\*/, '')
  })
  return { forms, hmm, ambiguous: amb === '?' }
})
