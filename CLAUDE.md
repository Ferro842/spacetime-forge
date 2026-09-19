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

Klaar: welkom, lichtkegel, epstein.

Nog te bouwen, in deze volgorde:

1. **Minkowski-diagram Pro** — bestaat al als React-component in de oude
   repo `relativity-toolkit` (`react_html/gelijktijdigheid_volledig.html`).
   Perron/trein omkeerbaar, ijk-hyperbolen, pinch-zoom, klikbare formules
   met stap-voor-stap afleidingen.
2. **Lichtklok-afleiding** — idem, `react_html/lichtklok_driehoek.html`.
   Pythagoras naar Δt, horizontale lichtklok naar L, de twee-rulers-figuur
   uit Einsteins boek, en de ijk-hyperbolen.
3. **Gelijktijdigheid** — trein met lichtflits, klokken die uit de pas
   lopen, het inhaalmoment waarop de perronklok de achterklok voorbijstreeft.
4. **Minkowski-diagram basis** — vrije worldlines, keuze van referentiekader.
5. **Tweelingparadox** — met een geanimeerde gelijktijdigheidslijn die bij
   de omkeer doorslaat, zodat zichtbaar wordt dat er op aarde tijd
   "voorbijspringt" die de reiziger niet meemaakt. Dit is het belangrijkste
   nieuwe element van de hele app.

## Verwachtingen bij het werken

- Verzin niets over iOS Safari, PWA-gedrag of service workers. Weet je het
  niet zeker, zeg dat.
- Reken natuurkunde na voordat je hem in een module zet.
- Waarschuw vooraf als een wijziging iets elders kan breken.
- Vertel wat je wel en niet getest hebt.
