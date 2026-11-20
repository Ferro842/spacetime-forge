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
js/tabbladen.js       verdeelt de zijkolom van elke module over tabbladen
js/uitlegmodus.js     de app als uitlegbord: verhaal in stappen, met tekenlaag
js/geheugen.js        onthoudt de stand per module en zet hem in het adres
js/versie.js          het versienummer dat linksonder in het menu staat
js/modules/*.js       één bestand per module, exporteert render(doel)
manifest.json, sw.js  PWA en offline-cache
```

Een module exporteert `titel`, `onderschrift`, `verhaal` en `render(doel)`. Nieuwe
modules aanmelden in `index.html` (de GROEPEN-lijst) én toevoegen aan de
cachelijst in `sw.js`.

**Versienummer: bij elke uitgave op twee plekken ophogen**, in `js/versie.js`
(met de datum) en in de naam van de cache bovenaan `sw.js`. Ze horen gelijk te
zijn. Het nummer staat linksonder in het menu. De app haalt `sw.js` vers van
het net en toont een herlaadknop als daar een hoger nummer in staat dan in de
code die draait; zo zie je op de iPad of een nieuwe uitgave al is aangekomen.

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

**Vingerformaat:** alles wat je aantikt is minstens 44 px hoog. Dat regelt
`css/thema.css` met `--raak` voor `.knop`, schuiven, menuknoppen en de koppen
van inklapbare blokken; maak in een module geen eigen, kleinere knoppen.

**Indeling:** het diagram krijgt de volle hoogte van het werkblad. Een module
zet zijn panelen gewoon onder elkaar in de `.zijkolom`; `js/tabbladen.js`
verdeelt ze daarna over tabbladen: Bediening, Getallen, Vragen of Afleiding,
en Uitleg (de `.uitleg` en de `.bron`). De soort volgt uit de inhoud van een
paneel: knoppen en schuiven is Bediening, `.formule` is Vragen (of Afleiding
als de kop niet met "Vragen" begint), de rest is Getallen. Wil je het anders,
zet dan `data-tab="..."` op het paneel. Wat samen in beeld past wordt
samengevoegd, dus een lichte module heeft alleen Bediening en Uitleg. Een
module regelt zelf geen tabbladen en klapt de uitleg niet zelf open of dicht.

**Uitlegmodus:** de knop rechtsboven verbergt menu, kop en zijkolom en zet
naast de tekening één stap van een verhaal in grote letters, met een tekenlaag
voor vinger of pen. Een module levert dat verhaal als gegevens, niet als code:
`export const verhaal = { basis, stappen }`. Elke stap heeft een `kop`, een
`tekst` en de stand die erbij hoort: `aan` (schakelknoppen), `stel` (schuiven
en tekstvelden), `tik` (knoppen) en zo nodig `stand` (voor wat geen knop heeft;
komt aan als het event `verhaal-stand` op het `.diagram-vak`, zie de
lichtkegel). De precieze afspraken staan bovenaan `js/uitlegmodus.js`. Elke
stap begint bij de basis, dus een stap mag niet leunen op de vorige. De
getallen in een tekst horen bij de stand van die stap: verander je de stand of
de natuurkunde, reken de tekst dan na. Houd een tekst onder de 300 tekens, dan
past hij zonder schuiven. Een knop waar een verhaal naar wijst mag je niet
zomaar hernoemen of weghalen.

**Geheugen en link:** de app onthoudt de laatste module, het gekozen tabblad
en per module wat je aan knoppen en schuiven hebt veranderd (lokale opslag),
en zet datzelfde verschil in het adres: `#loods?lo-beta=0.8&lo-beide=uit`.
`js/geheugen.js` leest dat af van de bediening zelf, dus een module hoeft er
niets voor te doen behalve dit: **elke knop en schuif die tot de stand hoort
heeft een id**, ook als hij in een lus gemaakt wordt (`mk-beta-2`,
`lk-deel-staaf`). Wat geen knop heeft, of preciezer is dan zijn schuif, zet de
module als JSON in `data-stand` op haar `.diagram-vak` en neemt ze terug via
het event `verhaal-stand`; de schuif zelf krijgt dan `data-stand="nee"` (zie
de tijd in tweeling, loods en gelijktijdigheid). Een adres met een module erin
is de hele waarheid: `#loods` zonder meer is de beginstand. Het geheugen dient
voor het menu en voor een start zonder adres. Hernoem je een id, dan vervalt
dat stukje uit oude links en uit het geheugen, zonder foutmelding. En alles
wat uit een link komt is vreemde invoer: nooit ongezien in `innerHTML`.

**Touch:** koppel touch-handlers met `addEventListener(..., {passive:false})`.
De standaardhandlers zijn soms passive, en dan blokkeert `preventDefault()`
de paginascroll niet — met als gevolg dat verticaal slepen hapert.

**Slepen:** gebruik `koppelSleep` uit `js/teken.js`; die regelt vinger en muis
en geeft punten in viewBox-eenheden. Bewaar bij het tekenen de schaal, zodat
de sleepfunctie van een punt terug kan rekenen naar tijd of plaats. Zet een
`greep` op elke lijn die je kunt verslepen. Onderdelen van een tekening
vangen zelf geen aanrakingen op (`pointer-events: none` in het thema): elke
module tekent bij elke beweging opnieuw, en een aanraking die begon op een
element dat daarna verdwijnt komt nergens meer aan. In Chromium stopte het
slepen daardoor na de eerste beweging.

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
loods, de kever met de klinknagel en het optellen van snelheden kwamen er
later bij. Elf in totaal, in `index.html` verdeeld over drie groepen. Hieronder in diezelfde volgorde, met wat er in zit, zodat je niet
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
- **Kever en klinknagel** (`kever.js`) — een klinknagel die in rust te kort is
  voor het gat, met een kever op de bodem. De muur ziet een gekrompen steel en
  verwacht dat de kop eerst stuit; de nagel ziet een gekrompen gat en verwacht
  dat de punt eerst beneden is. Opzet als de loods: de schuif zet de klok op de
  punt, twee tonelen tonen elk hun eigen nu door dat moment, daaronder het
  diagram in het kader van muur of nagel. De uitkomst volgt uit één ding: het
  nieuws dat de kop gestuit is gaat hooguit met de lichtsnelheid door de steel,
  en tot het aankomt vliegt de punt door. Hij komt daardoor minstens tot
  L·√((1+β)/(1−β)), de steel maal de dopplerfactor; elk gat ondieper dan dat
  is dodelijk. Tijd en lengte in millimeters.

  Bewust buiten beeld: wat de nagel doet als het nieuws er eenmaal is. Dat is
  materiaalgedrag. Het lichte, gestreepte deel van de steel is het deel dat
  het nieuws al heeft; de module beweert daar niets over.
- **Snelheden optellen** (`optellen.js`) — één tot vier raketten op elkaar, elk
  met dezelfde snelheid ten opzichte van de trap eronder. Bovenaan twee
  linialen: de hoek φ (rapiditeit), waar elke trap dezelfde stap zet, en de
  snelheid, waar die stappen tegen c aan krimpen. Daaronder het diagram met de
  ijk-hyperbool: de hoek tussen twee wereldlijnen is het oppervlak van de wig
  ertussen (½φ), en dat is voor elke trap even groot, vanuit welk kader je ook
  kijkt. De dunne lijn ct = 1 is de snelheidsliniaal in het diagram zelf. Met
  **Vergelijk met een cirkel** dezelfde tekening voor gewone hellingen: daar
  staat een min waar de ruimtetijd een plus heeft, en draai je door voorbij
  loodrecht.
- **Epstein-cirkel** (`epstein.js`) — twee delen. **De pijl**: de kwartcirkel
  waarin ruimte en tijd samen altijd c opleveren. **De tweeling**: dezelfde
  pijl tien jaar lang gevolgd, met plaats opzij en eigen tijd omhoog. Elk pad
  is na t jaar precies t lang, dus iedereen ligt op dezelfde cirkel; het
  geknikte pad van de reiziger eindigt teruggeklapt weer op die cirkel, en
  thuis is het leeftijdsverschil een verschil in hoogte. De laag **Valkuil**
  laat zien waar het beeld ophoudt: gelijke hoogte is gelijke klokstand, niet
  hetzelfde moment, en een punt is hier geen gebeurtenis.

### Ideeën die nog openstaan

Niet gekozen, alleen genoteerd:

1. **De plank over de put** — een plank die in het kader van het gat past en
   valt, en in zijn eigen kader over een gekrompen gat schuift. De oplossing
   hangt volledig op het doorbuigen van de plank: om het te tekenen moet je een
   materiaalmodel kiezen, en dan gaat het over stijfheid in plaats van over
   relativiteit. Daarom niet gebouwd.

## Verwachtingen bij het werken

- Verzin niets over iOS Safari, PWA-gedrag of service workers. Weet je het
  niet zeker, zeg dat.
- Reken natuurkunde na voordat je hem in een module zet.
- Waarschuw vooraf als een wijziging iets elders kan breken.
- Vertel wat je wel en niet getest hebt.
