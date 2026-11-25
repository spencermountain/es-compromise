### Unreleased

- **[breaking]** - `nlp.TypedPlugin` type is removed
- **[change]** - typescript types rewritten from the real api - core `View` types now come from `compromise`, and the document type is `EsView`
- **[new]** - types for `nlp.fromSpec()`, `nlp.testSpec()` and `nlp.compile()`
- **[change]** - remove `nlp.lazy()` from types and docs - it lives in a plugin now
- **[fix]** - `.nouns().isPlural()` finds plural nouns, and `.nouns().conjugate()` is right for them - 'casas' → { singular: 'casa', plural: 'casas' }
- **[fix]** - noun plurals are done by rule, before the model - written accents move with the stress ('canción' ↔ 'canciones', 'joven' ↔ 'jóvenes', 'país' ↔ 'países'), 'lunes', 'crisis' and 'paraguas' do not change, 'rubí' → 'rubíes', 'club' → 'clubes'
- **[fix]** - the singular of an '-es' plural - 'meses' → 'mes', 'ingleses' → 'inglés', but 'clases' → 'clase', 'cafés' → 'café'
- **[fix]** - 272 pairs removed from the plurals model that were not plurals - 'tío' → 'tías', 'botón' → 'botoncillos'
- **[fix]** - adjectives with one form for both genders - 'grande', 'fácil', 'feliz', 'mejor', 'optimista', 'marrón' - no longer get a feminine ('fácila')
- **[fix]** - adjective plurals and their singulars - 'feliz' ↔ 'felices', 'joven' ↔ 'jóvenes', 'inglesa' → 'inglés', 'buena' → 'bueno'
- **[fix]** - la/los/las before a verb-form - 'las casas', 'la calle es larga' are nouns, and 'la veo', 'los tengo', 'ella la cuenta' are a Pronoun and a Verb
- **[fix]** - a verb-form after el/un/una/unos/unas or mi/tu/su is a noun - 'el baile', 'un viaje', 'sus compras'
- **[fix]** - 'los cuadernos', 'los pájaros' are not an infinitive + 'nos'/'os'
- **[fix]** - a lowercase name after an article is a noun - 'las flores', 'las torres' - and after ser/estar, a form of a known adjective is that adjective - 'es limpia', 'son rojas'
- **[fix]** - a noun's number follows its article, when it does not show it - 'los lunes', 'las crisis' are Plural, 'el paraguas' is not - and 'los cafés', 'los sofás' are Plural
- **[fix]** - `.nouns().toPlural()` and `.toSingular()` - 'el agua' ↔ 'las aguas', 'del gato' ↔ 'de los gatos', and su/este/ese/aquel follow their noun
- **[change]** - `.nouns().toPlural()` and `.toSingular()` skip pronouns
- **[new]** - `fromPlural(str, lexicon?)` in the noun methods - `toSingular` is the same function - and a lexicon as second parameter of the adjective `fromFemale`, `toSingular`, `fromFemalePlural`
- **[change]** - male plurals of the lexicon's adjectives are in the lexicon - 'rojos' is a PluralAdjective
- **[fix]** - `.numbers().set()`, `.add()` and `.subtract()` accept a written number - `.add('dos')` - and ignore a string that isn't one
- **[fix]** - `.numbers().json(n)` returns the nth number, instead of throwing
- **[fix]** - `.numbers().get()` and `.parse()` return `[]` when there are no numbers
- **[fix]** - numbers over a thousand - 'veintiún mil', 'ciento un mil', 'mil cien', 'un millón', 'mil millones' - and a 'billón' is a million millions (10^12), not a thousand
- **[fix]** - `.numbers()` finds one number at a time - 'dos mil trescientos' is one, and 'dos tres', 'tres, cuatro', 'tres y cuatro' and 'cuarenta y 3' are two
- **[fix]** - 'un' and 'una' are part of a number - 'un millón', 'treinta y un días', 'ciento una' - or count a unit - 'un euro', 'un km', 'un por ciento'. They are still articles before any other noun
- **[fix]** - a second change on the same `.numbers()` view, or a chain of them - `.add(2).add(1)`, `.toText().toNumber()` - no longer eats the words beside the number, and the new number is tagged as one
- **[fix]** - `.toText()` of '50%', '5€', '$5' and '5km' - 'cincuenta por ciento', 'cinco euros', 'cinco dólares', 'cinco km' - with 'un euro', 'una libra', 'veintiún euros' and 'un millón de euros'. `.toNumber()` gives '50 %' and '5 euros'
- **[fix]** - 'cincuenta por ciento' is one number, and a #Percent - not 50 and 100
- **[new]** - a number agrees with what comes next - 'un gato', 'veintiún gatos', 'una casa', 'primer día', 'primera vez' - and keeps the gender it was written in - 'doscientas' + 100 is 'trescientas', '2ª' + 1 is '3ª'
- **[new]** - feminine and short number-words - 'veintiún', 'veintiuna', 'doscientas', 'primera', 'primer', 'tercer' - and numbers without their accents - 'dieciseis', 'un millon'
- **[change]** - a numeric ordinal is written '5º', '5ª' or '1er' - not with a degree-sign '5°' - and '1.º' keeps its period. '1.er' is read, too
- **[fix]** - ordinals - 'séptimo' (not 'sétimo', which is still read), 'octingentésimo', 'millonésimo', and 'centésimo vigésimo tercero' for 123. A number with no ordinal - 0, -5, '3,5', '5€' - is left alone
- **[new]** - fractions - 'medio', 'un tercio', 'tres cuartos', 'dos y medio', 'medio millón' - and decimals in words - 'tres coma cinco' is 3.5
- **[fix]** - 'menos' is a minus-sign only at the start of a number - 'menos cinco', but 'tres menos dos' - and '-5' to text is 'menos cinco', without its dash
- **[fix]** - `.numbers().set()` and `.add()` take 'un millón' or 'treinta y uno' as their argument
- **[fix]** - spanish unit-words - 'litros', 'metros', 'kilómetros' - where there were french ones
- **[update]** - api tests - text, json, offsets, match, splits, insert, replace, clone, tags, sweep, lookup, plugins and typeahead, with ñ, accents and ¿ ¡
- **[change]** - minimum node version is 18
- **[update]** - tests moved to `tests/unit`, `tests/types`, `tests/_hmm` and `tests/_backlog`
- **[update]** - suffix-thumb 6.1.0

### 0.3.2 [Nov 2026]

- **[update]** - smaller suffix-thumb format
- **[new]** - support localized tag names
- **[update]** - dependencies

### 0.3.0 [July 2026]

- **[new]** - imperfect tense (pretérito imperfecto) - conjugation, tagging + toRoot ('trabajaba', 'vivíamos')
- **[new]** - imperfect subjunctive, -ra and -se series ('si pudiera', 'si pudiese')
- **[new]** - enclitic pronoun recognition - 'dámelo', 'vistiéndose', 'quemarme', 'vámonos'
- **[fix]** - core function-words - 'que' is a Conjunction, 'se' a Pronoun, 'hay' a Verb; accented 'qué/cómo/dónde/cuándo' are the QuestionWords
- **[fix]** - 'mi/tu/su' are Possessive Determiners; missing demonstratives added ('esa', 'aquel'..)
- **[fix]** - lexicon build is first-wins - corpus-learned lists no longer clobber function words ('aquí', 'más', 'una')
- **[fix]** - suffix false-positives - 'librería' is not a Conditional, 'fotos' not an Adjective, 'examen' not a Verb
- **[fix]** - common-gender adjectives ('grande', 'feliz') no longer default to MaleAdjective
- **[fix]** - singular -s words ('país', 'inglés', 'crisis') no longer tagged Plural
- **[fix]** - haber conjugations are the Auxiliary list; tener is no longer a Modal
- **[fix]** - imperative verb-model column misalignment + data cleanup ('vomit', 'mudar(se)', secarse row)
- **[new]** - mood-in-context rules - subjunctive after 'que/ojalá' ('espero que tengas'), negative commands ('no hables tan alto'), exclamation commands ('¡corre más rápido!')
- **[fix]** - toPlural/toSingular now also flip articles and possessives ('el gato' → 'los gatos')
- **[fix]** - noun-gender guessing
- **[fix]** - corrupt learned pair pluralized 'gato' to 'gatitos'
- **[change]** - Infinitive and Gerund no longer imply PresentTense; Negative is a feature-tag, not a Verb
- **[change]** - homograph rules - 'él vino' is a verb, 'el vino' a noun; copulas root to ser/estar
- **[update]** - dependencies

### 0.2.11 [Jan 2024]

- **[fix]** - tagging+conjugation fixes

### 0.2.10 [Aug 2023]

- **[fix]** - conjugation fixes

### 0.2.9 [Feb 2023]

- **[fix]** - numbers().toText()
- **[fix]** - tagger improvements
- **[new]** - contractions

### 0.2.7 [Dec 2022]

- **[fix]** - check root text for root-matches
- **[new]** - Subjunctive and Imperative verb forms
- **[change]** - tagger improvements

### 0.1.3 [Oct 2022]

- **[fix]** - fixes for inflections in toRoot
- **[new]** - verbs() nouns() and adjectives() methods

### 0.1.2 [August 2022]

- **[fix]** - fixes for inflections in toRoot

### 0.1.1 [July 2022]

- **[change]** - add 'browser' field in package.json

### 0.1.0 [June 2022]

- **[new]** - `.compute('root')`
- **[new]** - number-parsing

### 0.0.2 [June 2022]

- **[new]** - support root matches
- **[new]** - `.compute('root')`
- **[new]** - FirstPerson, SecondPerson tags etc.
