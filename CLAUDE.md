# Spacetime Forge — projectbrief

Lees dit voordat je iets aanpast.

## Wat dit is

Een Nederlandstalige web-app over de speciale relativiteitstheorie, gebouwd
als leermiddel voor één persoon (Ferro) op één apparaat. Geen framework,
geen bundler, geen build-stap: losse ES-modules die Safari rechtstreeks
inleest, gehost op GitHub Pages.

## Doelapparaat — dit is geen aanname maar een meting

iPad Pro 12,9" (gen 6), **uitsluitend landschap**, geen Stage Manager.

| Modus          | Viewport      |
|----------------|---------------|
| Safari-tabblad | 1590 × 1060   |
| PWA (beginscherm) | 1590 × 1160 |

devicePixelRatio 2. Veilige randen: alleen 20 px onderaan in Safari, nul
in PWA-modus.

Ontwerp hiervoor. Geen media queries, geen mobiele fallback, geen
responsive breakpoints. Diagrammen krijgen een vaste `viewBox` en schalen
mee via `preserveAspectRatio`, zodat de onderlinge verhoudingen — en dus
de labelposities — vastliggen ongeacht de zoominstelling van de browser.

## Werkwijze van de eigenaar

- Werkt uitsluitend op de iPad, via de GitHub-webeditor, vscode.dev of
  Claude Code. Geen lokale omgeving, geen terminal, geen npm.
- Kan geen patches toepassen: lever complete bestanden of commit zelf.
- Alles in het Nederlands: interface, uitleg, variabelenamen, commentaar.

## Bestandsindeling

```
index.html            schil met navigatie en module-lader
css/thema.css         het volledige lichte thema, één bron van waarheid
js/fysica.js          alle relativistische berekeningen, pure functies
js/teken.js           gedeelde SVG-helpers
js/register.js        modulelijst
js/modules/*.js       één bestand per module, exporteert render(doel)
manifest.json, sw.js  PWA en offline-cache
```

Een module exporteert `titel`, `onderschrift` en `render(doel)`. Nieuwe
modules aanmelden in `index.html` (de GROEPEN-lijst) én toevoegen aan de
cachelijst in `sw.js`, en daar het versienummer ophogen.

## Afspraken over de code

**Natuurkunde hoort in `js/fysica.js`.** Niet in de modules. Alle functies
puur, zonder neveneffecten. Eenheden: c = 1, snelheden als fractie beta.

**Tekenen gaat via `js/teken.js`.** Gebruik `maakSchaal` voor de omrekening
van natuurkundige coördinaten naar het scherm, en `maakLabelPlaatser` voor
alle tekst in een SVG. Nooit handmatig `<text>` plaatsen zonder de
plaatser, want dan ontstaat overlap.

De labelplaatser werkt in twee fasen: eerst `voegToe()` voor elk label,
daarna `tekenAlles()`. Labels met hogere `prioriteit` winnen bij botsing.
Markeer assen, lijnen en stippen vooraf als bezet met `blokkeerLijn`,
`blokkeerSchuin` (voor diagonalen) of `blokkeer`.

**Kleuren komen uit `css/thema.css`.** Gebruik de variabelen
(`var(--perron)`, `var(--trein)`, `var(--gebeurtenis)`, `var(--eigentijd)`,
`var(--licht)`, `var(--accent)`, `var(--blauw)`). Nooit vaste hexwaarden in
een module. Contrast minimaal 4,5:1 op de lichte achtergrond.

**Touch:** koppel touch-handlers met `addEventListener(..., {passive:false})`.
De standaardhandlers zijn soms passive, en dan blokkeert `preventDefault()`
de paginascroll niet — met als gevolg dat verticaal slepen hapert.

## Inhoudelijke afspraken

De uitleg is gebaseerd op drie boeken. **Altijd parafraseren, nooit
letterlijk citeren**, en de bron vermelden met auteur en hoofdstuk:

- Epstein, *Relativity Visualized*
- Einstein, *Relativity: The Special and General Theory*
- Takeuchi, *An Illustrated Guide to Relativity*

Ferro denkt visueel en meetkundig, niet algebraïsch. Een diagram dat het
idee laat zien is meer waard dan een afleiding in formules. Waar een
formule nodig is, hoort er een zichtbare tegenhanger bij.

## Modules

De vijf modules van de oorspronkelijke bouwlijst zijn af; de staaf in de
loods kwam er later bij. Negen in totaal, in `index.html` verdeeld over drie
groepen. Hieronder in diezelfde volgorde, met wat er in zit, zodat je niet
elk bestand hoeft te openen.

**Fundament**

- **Welkom** (`welkom.js`) — één wereldlijn, één schuif, de eerste kennismaking
  met tijdsdilatatie en de nu-lijn.

**Ruimtetijd**

- **Minkowski-diagram Pro** (`minkowski-pro.js`) — beide assenstelsels tegelijk,
  perron/trein omkeerbaar, ijk-hyperbolen, pinch-zoom en pannen, klikbare
  formules met stap-voor-stap afleidingen.
- **Lichtklok-afleiding** (`lichtklok.js`) — vier tabbladen: Pythagoras naar Δt,
  de horizontale lichtklok naar L, de twee-rulers-figuur uit Einsteins boek, en
  de ijk-hyperbolen.
- **Gelijktijdigheid** (`gelijktijdigheid.js`) — de trein met de lichtflits, in
  drie banden. Aankomsten kleuren mee met wie er al langs is, twee tikreeksen op
  de ct′-as (rond getal van de klok, en dezelfde hoogte als de perrontik), de
  x′-as met afleeslijnen, het inhaalmoment, ijk-hyperbolen, een groot beeld en
  negen vragen. De zwaarste module van de app.
- **Minkowski-diagram basis** (`minkowski.js`) — twee tot vier vrije objecten met
  eigen naam en snelheid, keuze van referentiekader, eigen-tijdstikken en een
  tabel met de snelheden in dat kader.
- **Lichtkegel** (`lichtkegel.js`) — sleepbare gebeurtenis, interval en soort,
  plus de laag **Telegraaf**: een vraag sneller dan het licht heen en een
  antwoord dat ogenblikkelijk is in het kader van het relais, en dus vóór de
  vraag aankomt zodra β > ct/x.

**Verdieping**

- **Tweelingparadox** (`tweeling.js`) — de gelijktijdigheidslijn die bij de
  omkeer doorslaat, met het overgeslagen stuk aardtijd in kleur. Daarnaast de
  lichtsignalen zelf (lagen *Aarde seint* en *Schip seint*): wat je zíet springt
  nergens, en telt toch op tot dezelfde eindstand. Daar zit ook de asymmetrie:
  de aarde ziet de omkeer pas op t = T(1+β).
- **Staaf in de loods** (`loods.js`) — de ladderparadox. Bovenaan staan
  **beide tonelen op hetzelfde moment**: de schuif zet één klok, die op de punt
  van de staaf, en elk kader legt daar zijn eigen nu doorheen (loods op
  t = γ·τ, staaf op t′ = τ). Zo zie je de lengtecontractie twee kanten op
  tegelijk, met dezelfde meters per pixel in allebei de tonelen. Daaronder het
  Minkowski-diagram waar die twee sneden vandaan komen, met de laag **Beide
  kaders**: één lijn van de loods door allebei de sluitingen en twee lijnen van
  de staaf, γ·β·D uit elkaar. Verder deuren die even dichtklappen, een
  lichtsignaal dat laat zien waarom een star lichaam niet kan bestaan, en drie
  sprongknoppen naar de drie sluitingen. Tijd én lengte in meters, zodat licht
  onder 45° loopt.

  Let op: op die ene klok duurt het staafverhaal langer dan het loodsverhaal —
  tot een factor zes bij hoge snelheid. Het bovenste toneel meldt dan zelf dat
  de staaf buiten beeld is; dat is geen fout maar het gevolg van twee sneden
  met een andere hoek.
- **Epstein-cirkel** (`epstein.js`) — de cirkel waarin ruimte en tijd samen
  altijd c opleveren.

### Ideeën die nog openstaan

Niet gekozen, alleen genoteerd:

1. **Epstein volledig** — zijn centrale beeld helemaal uitspelen: één draaibare
   pijl van vaste lengte, en de tweelingparadox nog eens in Epstein-coördinaten,
   waar het verschil een booglengte wordt. Wel expliciet erbij zeggen waar het
   beeld ophoudt te kloppen: Epstein-diagrammen geven eigen tijd goed en
   gelijktijdigheid niet.
2. **Snelheden tellen niet op, hoeken wel** — drie raketten van elk 0,6c, en
   ernaast het diagram waarin elke stap dezelfde hyperbolische hoek toevoegt.
   Dat verklaart meteen de ijk-hyperbolen uit Pro.
3. **De plank over de put** en **de kever met de klinknagel** — mooi, maar de
   oplossing hangt volledig op het vervormen van het voorwerp. Dan gaat het over
   materiaalgedrag in plaats van relativiteit.

## Verwachtingen bij het werken

- Verzin niets over iOS Safari, PWA-gedrag of service workers. Weet je het
  niet zeker, zeg dat.
- Reken natuurkunde na voordat je hem in een module zet.
- Waarschuw vooraf als een wijziging iets elders kan breken.
- Vertel wat je wel en niet getest hebt.
