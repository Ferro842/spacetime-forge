// welkom.js — startpagina en proef op de som voor het fundament.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Spacetime Forge';
export const onderschrift =
  'Speciale relativiteit om naar te kijken. Speel hier met \u00e9\u00e9n trein, en volg ' +
  'daarna de leerroute langs de andere modules. Die staat rechts.';

// De leerroute: de modules in de volgorde waarin ze op elkaar bouwen, met in
// een paar woorden wat je er leert. Dezelfde volgorde als het menu. De
// zelftest controleert dat elke module hier voorkomt en andersom.
export const route = [
  { id: 'lichtklok', naam: 'Lichtklok-afleiding', leert: 'waarom een bewegende klok trager tikt' },
  { id: 'gelijktijdig', naam: 'Gelijktijdigheid', leert: 'tegelijk is niet voor iedereen tegelijk' },
  { id: 'minkowski', naam: 'Minkowski-diagram', leert: 'levenslopen op \u00e9\u00e9n kaart' },
  { id: 'minkowski-pro', naam: 'Minkowski-diagram Pro', leert: 'de maatlat van de ruimtetijd' },
  { id: 'lichtkegel', naam: 'Lichtkegel', leert: 'oorzaak, gevolg en de lichtsnelheid' },
  { id: 'tweeling', naam: 'Tweelingparadox', leert: 'wie is er jonger, en waarom' },
  { id: 'loods', naam: 'Staaf in de loods', leert: 'te lang, en toch past hij' },
  { id: 'kever', naam: 'Kever en klinknagel', leert: 'nieuws gaat niet sneller dan licht' },
  { id: 'optellen', naam: 'Snelheden optellen', leert: 'waarom 0,6 plus 0,6 geen 1,2 is' },
  { id: 'epstein', naam: 'Epstein-cirkel', leert: 'altijd even snel door ruimte en tijd' },
];

// Het verhaal voor de uitlegmodus (js/uitlegmodus.js): de stappen in volgorde,
// met per stap de stand van knoppen en schuiven. De getallen in de tekst horen
// bij die stand; verander je de stand, reken ze dan opnieuw na.
export const verhaal = {
  basis: {
    aan: { '#nu-knop': false },
    stel: { '#beta': 0.6 },
  },
  stappen: [
    {
      kop: 'Een kaart van ruimte en tijd',
      tekst:
        'Naar rechts is plaats, omhoog is tijd. Wie op het perron blijft staan, ' +
        'gaat op deze kaart recht omhoog: alleen de tijd verstrijkt. De gestreepte ' +
        'lijnen onder 45\u00b0 zijn licht dat hier en nu vertrekt. De trein rijdt nog ' +
        'bijna niet.',
      stel: { '#beta': 0.05 },
    },
    {
      kop: 'De trein gaat rijden',
      tekst:
        'Nu rijdt hij met 0,6 keer de lichtsnelheid. Zijn spoor door de ruimtetijd, ' +
        'de lijn ct\u2032, helt naar rechts: elke eenheid tijd komt hij 0,6 verder. Hoe ' +
        'sneller, hoe schuiner \u2014 maar nooit voorbij de 45\u00b0 van het licht.',
    },
    {
      kop: 'De klok in de trein',
      tekst:
        'De stippen staan op perrontijd 1, 2 en 3. Ernaast staat wat de klok in de ' +
        'trein op dat moment aanwijst: bij ct\u00a0=\u00a02 pas \u03c4\u00a0=\u00a01,60. De bewegende klok ' +
        'loopt achter, hier op 0,8 van het tempo.',
    },
    {
      kop: 'Wat de trein "nu" noemt',
      tekst:
        'De stippellijnen verbinden alles wat voor de trein op hetzelfde moment ' +
        'gebeurt. Voor het perron ligt zo\'n lijn vlak, voor de trein helt hij. Ze ' +
        'zijn het dus niet eens over wat gelijktijdig is. Onthoud dat: alles wat ' +
        'volgt komt hieruit voort.',
      aan: { '#nu-knop': true },
    },
    {
      kop: 'Sneller',
      tekst:
        'Bij 0,9c klappen de twee assen van de trein als een schaar naar de ' +
        'lichtlijn toe. Zijn klok loopt nog maar op 0,44 van het tempo. De ' +
        'lichtlijn zelf blijft staan waar hij stond: iedereen meet dezelfde ' +
        'lichtsnelheid.',
      aan: { '#nu-knop': true },
      stel: { '#beta': 0.9 },
    },
  ],
};

// Maat van het diagramvak op het doelscherm: ongeveer 940 x 935 px.
// De viewBox volgt die verhouding, zodat er geen strook leeg blijft.
const BREEDTE = 960;
const HOOGTE = 940;
const MARGE = { boven: 34, onder: 42, links: 58, rechts: 58 };

export function render(doel) {
  let beta = 0.6;
  let toonNu = true;

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<summary>Zo lees je dit diagram</summary>' +
    '<p>Naar rechts is plaats, omhoog is tijd. Wie stilstaat op het perron gaat ' +
    'recht omhoog; een trein die rijdt volgt de schuine lijn <b>ct\u2032</b>. De ' +
    'gestreepte lijnen onder 45\u00b0 zijn licht. Schuif aan de snelheid: de twee ' +
    'assen van de trein kantelen naar elkaar toe, en het licht blijft staan ' +
    'waar het stond. De stippen laten zien hoeveel tijd er in de trein ' +
    'verstreken is.</p>' +
    '<p style="margin-top:7px"><b>Zo werkt de app.</b> Rechts staan tabbladen: ' +
    'bediening, getallen, vragen en uitleg. In veel tekeningen kun je slepen. ' +
    'Met <b>Uitlegmodus</b> rechtsboven loopt de app in stappen door een ' +
    'verhaal, handig om het aan iemand te laten zien; je kunt er dan ook bij ' +
    'tekenen. <b>Deel link</b> maakt een link naar precies dit beeld, en ' +
    '<b>Beginstand</b> zet een module terug zoals ze begon. Linksonder staat ' +
    'de versie.</p>';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Minkowski-diagram met perron- en treinassen',
  });
  vak.appendChild(svg);
  doel.appendChild(vak);

  // Alles wat geen diagram is, staat rechts onder elkaar in de zijkolom
  const zijkolom = document.createElement('div');
  zijkolom.className = 'zijkolom';
  doel.appendChild(zijkolom);

  const paneel = document.createElement('div');
  paneel.className = 'paneel';
  paneel.innerHTML =
    '<h3>Instellingen</h3>' +
    '<div class="regelaars">' +
    '  <div class="regelaar">' +
    '    <label for="beta">Snelheid van de trein: <b id="beta-waarde"></b></label>' +
    '    <input type="range" id="beta" min="0.05" max="0.95" step="0.01" value="0.6" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop aan" id="nu-knop">Gelijktijdigheidslijnen</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  // De route: een eigen tabblad, want de lijst vult de kolom. Een tik stuurt
  // een bericht naar de schil, die de module laadt in de stand van de vorige keer.
  const routePaneel = document.createElement('div');
  routePaneel.className = 'paneel route';
  routePaneel.setAttribute('data-tab', 'Route');
  routePaneel.innerHTML = '<h3>Leerroute</h3>';
  route.forEach(function (stap, i) {
    const knop = document.createElement('button');
    knop.className = 'route-stap';
    const nr = document.createElement('span');
    nr.className = 'nr';
    nr.textContent = String(i + 1);
    const tekst = document.createElement('span');
    const naam = document.createElement('b');
    naam.textContent = stap.naam;
    const leert = document.createElement('small');
    leert.textContent = stap.leert;
    tekst.appendChild(naam);
    tekst.appendChild(leert);
    knop.appendChild(nr);
    knop.appendChild(tekst);
    knop.addEventListener('click', function () {
      knop.dispatchEvent(new CustomEvent('ga-naar', { bubbles: true, detail: { id: stap.id } }));
    });
    routePaneel.appendChild(knop);
  });
  zijkolom.appendChild(routePaneel);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Opzet naar het Minkowski-diagram zoals besproken in Takeuchi, ' +
    '"An Illustrated Guide to Relativity", hoofdstuk 4 \u2014 in eigen woorden weergegeven.';
  zijkolom.appendChild(bron);

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const g = F.gamma(beta);
    // Even veel pixels per eenheid x als per eenheid ct: daardoor lopen de
    // lichtlijnen precies onder 45°, zoals het in een Minkowski-diagram hoort.
    // Hoeveel eenheden ct daarmee in het vlak passen ligt dus vast; wat vrij
    // is, is waar de x-as komt te liggen. Alles wat dit diagram laat zien
    // gebeurt boven die as: de trein-assen, de eigen-tijdstippen en de
    // gelijktijdigheidslijnen. Het verleden hoeft alleen breed genoeg te zijn
    // voor de onderste helft van het lichtkruis en het woord dat erbij staat,
    // dus krijgt het een kwart en de toekomst de rest.
    const xMax = 2.4;
    const tekenB = BREEDTE - MARGE.links - MARGE.rechts;
    const tekenH = HOOGTE - MARGE.boven - MARGE.onder;
    const ctSpan = 2 * xMax * tekenH / tekenB;
    const ctOnder = -0.25 * ctSpan;
    const ctBoven = ctSpan + ctOnder;
    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-xMax, xMax], yBereik: [ctOnder, ctBoven],
      marge: MARGE,
    });

    const labels = T.maakLabelPlaatser();
    const xAs = schaal.naarY(0);
    const yAs = schaal.naarX(0);

    labels.blokkeerLijn({
      x1: schaal.naarX(-xMax), y1: xAs, x2: schaal.naarX(xMax), y2: xAs, dikte: 18,
    });
    labels.blokkeerLijn({
      x1: yAs, y1: schaal.naarY(ctOnder), x2: yAs, y2: schaal.naarY(ctBoven), dikte: 18,
    });

    // De toekomst reikt nu hoger dan het vlak breed is, dus lopen de kegel en
    // de lichtlijnen aan de zijkanten het beeld uit. Een knipmasker om het
    // tekenvlak houdt ze binnen, zonder dat elke lijn zijn eigen rand hoeft
    // uit te rekenen.
    const defs = T.el('defs');
    const knip = T.el('clipPath', { id: 'wk-vlak' });
    knip.appendChild(T.el('rect', {
      x: MARGE.links, y: MARGE.boven,
      width: tekenB, height: tekenH,
    }));
    defs.appendChild(knip);
    svg.appendChild(defs);
    const vlak = T.el('g', { 'clip-path': 'url(#wk-vlak)' });
    svg.appendChild(vlak);

    // Toekomstkegel zacht inkleuren (ligt helemaal achteraan)
    const kegel = [[0, 0], [ctBoven, ctBoven], [-ctBoven, ctBoven]]
      .map(function (p) { return schaal.naarX(p[0]) + ',' + schaal.naarY(p[1]); })
      .join(' ');
    vlak.appendChild(T.el('polygon', {
      points: kegel, fill: 'var(--blauw)', opacity: 0.05,
    }));

    vlak.appendChild(T.lichtkegel(schaal, { kleur: 'var(--licht)', naarVerleden: true }));

    // Perron-assen
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(-xMax), y1: xAs, x2: schaal.naarX(xMax), y2: xAs,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: schaal.naarY(ctOnder), x2: yAs, y2: schaal.naarY(ctBoven),
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.voegToe({
      tekst: 'x', x: schaal.naarX(xMax) - 4, y: xAs - 16,
      grootte: 17, kleur: 'var(--perron)', anker: 'end', gewicht: 650, prioriteit: 95,
    });
    labels.voegToe({
      tekst: 'ct', x: yAs + 15, y: schaal.naarY(ctBoven) + 17,
      grootte: 17, kleur: 'var(--perron)', gewicht: 650, prioriteit: 95,
      // Boven dit label is geen ruimte meer, dus opzij of omlaag uitwijken
      verschuif: [[0, 0], [-52, 0], [0, 20], [-52, 20]],
    });

    // Trein-assen: alleen vanaf de oorsprong naar één kant. Doorgetrokken
    // naar linksonder zouden ze het verleden-deel vullen zonder iets toe te
    // voegen; zo blijft te zien dat beide assen in de oorsprong beginnen.
    var treinAssen = [
      { dx: 1, dt: beta, naam: "x'" },
      { dx: beta, dt: 1, naam: "ct'" },
    ];
    treinAssen.forEach(function (as) {
      // Oprekken tot de eerste rand van het tekenvlak, niet verder
      const rek = Math.min(xMax / as.dx, ctBoven / as.dt);
      const ex = as.dx * rek, et = as.dt * rek;
      svg.appendChild(T.el('line', {
        x1: yAs, y1: xAs,
        x2: schaal.naarX(ex), y2: schaal.naarY(et),
        stroke: 'var(--trein)', 'stroke-width': 2.2,
      }));
      // Ook deze assen blokkeren, anders lopen de bredere tijdlabels erover
      labels.blokkeerSchuin({
        x1: yAs, y1: xAs, x2: schaal.naarX(ex), y2: schaal.naarY(et), dikte: 10,
      });
      // Het label komt loodrecht naast het uiteinde te staan. Recht erboven zou
      // bij een steile as buiten het diagram vallen, en dan is het onleesbaar
      // zonder dat de labelplaatser dat merkt.
      const lx = schaal.naarX(ex) - yAs, ly = schaal.naarY(et) - xAs;
      const lengte = Math.hypot(lx, ly) || 1;
      labels.voegToe({
        tekst: as.naam,
        x: schaal.naarX(ex) + (ly / lengte) * 24,
        // Niet zo hoog dat het tekstvak boven de viewBox uit steekt
        y: Math.max(schaal.naarY(et) - (lx / lengte) * 24 + 5, 17),
        grootte: 17, kleur: 'var(--trein)', anker: 'end', gewicht: 650, prioriteit: 90,
        // Niet verder omhoog uitwijken, wel naar beide kanten en omlaag
        verschuif: [[0, 0], [-12, 0], [14, 0], [-24, 0], [28, 0], [-36, 0], [42, 0],
                    [56, 0], [70, 0], [84, 0], [-48, 0], [0, 22], [-24, 22], [24, 22]],
      });
    });

    // Hoeveel pixels is één eenheid? Nodig om labels langs een schuine as
    // te laten uitwijken: hoger betekent daar ook verder naar rechts.
    const pxPerT = schaal.naarY(0) - schaal.naarY(1);

    // Tijdtikken op de ct-as. Boven en onder de as loopt hij verschillend ver
    // door, dus krijgt elke tik zijn eigen randtoets.
    // Delen door vier, niet door drie: het bereik is met de asymmetrische as
    // meegegroeid, en bij /3 valt netteStap net over de grens naar stap 2 —
    // dan blijft er nog maar een enkele tik over.
    const stap = F.netteStap(ctBoven / 4);
    const verste = Math.max(ctBoven, -ctOnder);
    for (let t = stap; t <= verste - 0.05; t += stap) {
      [1, -1].forEach(function (richting) {
        const tt = t * richting;
        if (tt > ctBoven - 0.05 || tt < ctOnder + 0.05) return;
        svg.appendChild(T.el('line', {
          x1: yAs - 6, y1: schaal.naarY(tt), x2: yAs + 6, y2: schaal.naarY(tt),
          stroke: 'var(--perron)', 'stroke-width': 1.6,
        }));
        labels.voegToe({
          tekst: F.nl(tt, 1), x: yAs - 14, y: schaal.naarY(tt) + 5,
          grootte: 14, kleur: 'var(--perron)', anker: 'end', prioriteit: 45,
          verschuif: [[0, 0], [0, -15], [0, 15]],
        });
      });

      // Eigen-tijd stip op de ct'-as. Die hoort alleen te staan waar de as zelf
      // nog loopt: bij een hoge snelheid verlaat hij het vlak door de zijkant,
      // en dan ligt de volgende tik er al buiten.
      if (t > ctBoven - 0.05 || Math.abs(beta * t) > xMax - 0.05) continue;
      const xg = beta * t;
      const tau = t / g;
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(xg), cy: schaal.naarY(t), r: 5,
        fill: 'var(--trein)', stroke: 'var(--kaart)', 'stroke-width': 1.5,
      }));
      // Beide klokken naast elkaar: wat het perron meet, en wat de trein meet.
      // Dit label is breed, en de wig waarin het moet staan is dat lang niet
      // altijd: bij lage snelheid knijpt de x'-as hem dicht, bij hoge snelheid
      // de ct-as. Uitwijken gaat daarom langs de ct'-as omhoog, om beurten aan
      // de rechter- en de linkerkant, want hoe hoger, hoe ruimer het wordt.
      const labelTekst = 'ct=' + F.nl(t, 1) + ' \u2192 \u03c4=' + F.nl(tau, 2);
      // Zelfde breedteschatting als de labelplaatser zelf gebruikt
      const labelBreed = labelTekst.length * 14 * 0.58;
      const labelX = schaal.naarX(xg) + 12, labelY = schaal.naarY(t) + 5;
      // De as staat schuin: boven het label ligt hij verder naar rechts dan
      // eronder, dus elke kant rekent met zijn eigen rand van het tekstvak.
      function asBij(dy, rand) {
        return schaal.naarX(beta * (t - (dy + rand) / pxPerT));
      }
      // Ruim om de as heen: de blokkades volgen de schuinte in stukjes, dus
      // vlak langs de lijn rekenen valt altijd net te krap uit.
      const asRuim = 34;
      function rechtsVanAs(dy) { return asBij(dy, -11) + asRuim - labelX; }
      function linksVanAs(dy) {
        // Niet tot over de ct-as heen schuiven
        const links = Math.max(asBij(dy, 4) - asRuim - labelBreed, yAs + 14);
        return links - labelX;
      }
      // Laatste uitweg: net voorbij de x'-as, in de elders-zone. Daar is het
      // altijd leeg en blijft het label op dezelfde hoogte als zijn stip.
      function voorbijXAs(dy) {
        const tBoven = schaal.vanY(labelY + dy - 11) + 20 / pxPerT;
        return schaal.naarX(tBoven / beta) + 12 - labelX;
      }
      // Een plek telt alleen mee als het hele label binnen de viewBox valt;
      // wat erbuiten valt is net zo onleesbaar als weggelaten.
      const uitwijk = [];
      function bied(dx, dy) {
        const links = labelX + dx;
        if (links < 6 || links + labelBreed > BREEDTE - 6) return;
        uitwijk.push([dx, dy]);
      }
      // Eerst alles op de hoogte van de stip zelf — daar hoort het label bij —
      // en pas als niets daar past trapsgewijs langs de as omhoog.
      bied(0, 0);
      bied(rechtsVanAs(0), 0);
      bied(linksVanAs(0), 0);
      bied(voorbijXAs(0), 0);
      for (let n = 1; n <= 4; n++) {
        const dy = -20 * n;
        bied(rechtsVanAs(dy), dy);   // rechts van de ct'-as
        bied(linksVanAs(dy), dy);    // links ervan
        bied(voorbijXAs(dy), dy);    // voorbij de x'-as
      }
      labels.voegToe({
        tekst: labelTekst, x: labelX, y: labelY,
        // Gaat vóór de zonenamen: die kunnen makkelijker opzij, dit label niet
        grootte: 14, kleur: 'var(--trein)', gewicht: 600, prioriteit: 65,
        verschuif: uitwijk,
      });
    }

    // Ruimtetikken op de x-as
    const xStap = F.netteStap(xMax / 4);
    for (let x = xStap; x <= xMax - 0.1; x += xStap) {
      [1, -1].forEach(function (richting) {
        const xx = x * richting;
        svg.appendChild(T.el('line', {
          x1: schaal.naarX(xx), y1: xAs - 6, x2: schaal.naarX(xx), y2: xAs + 6,
          stroke: 'var(--perron)', 'stroke-width': 1.6,
        }));
        labels.voegToe({
          tekst: F.nl(xx, 1), x: schaal.naarX(xx), y: xAs + 27,
          grootte: 14, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 25,
          verschuif: [[0, 0], [0, 17]],
        });
      });
    }

    // Gelijktijdigheidslijnen van de trein, alleen in de toekomst-helft:
    // afgekapt waar de lijn de x-as kruist en waar hij de bovenrand raakt.
    if (toonNu) {
      for (let t = stap; t <= ctBoven; t += stap) {
        const xLinks = Math.max(-xMax, -t / beta);
        const xRechts = Math.min(xMax, (ctBoven - t) / beta);
        if (xRechts <= xLinks) continue;
        vlak.appendChild(T.nuLijn(schaal, {
          beta: beta, x0: 0, t0: t, xVan: xLinks, xTot: xRechts,
          kleur: 'var(--trein)', dikte: 0.9, streep: '3 6',
        }));
      }
    }

    // Gebeurtenis in de oorsprong
    svg.appendChild(T.gebeurtenis(schaal, {
      t: 0, x: 0, kleur: 'var(--gebeurtenis)', straal: 7,
    }));
    labels.blokkeer({ links: yAs - 13, boven: xAs - 13, breedte: 26, hoogte: 26 });
    // Boven de x-as is het druk geworden met de twee trein-assen; eronder is
    // het nu juist leeg, dus daar staat de oorsprong het rustigst benoemd.
    labels.voegToe({
      tekst: 'hier en nu', x: yAs + 16, y: xAs + 26,
      grootte: 14, kleur: 'var(--gebeurtenis)', gewicht: 650, prioriteit: 75,
      verschuif: [[0, 0], [0, 20], [-115, 0], [-115, 20]],
    });

    // Zones benoemen
    labels.voegToe({
      // Precies tussen twee gelijktijdigheidslijnen in: die liggen op de ct-as
      // op hele stappen, dus een halve stap ertussen houdt het woord vrij.
      tekst: 'toekomst', x: yAs,
      y: schaal.naarY(Math.floor(ctBoven * 0.78 / stap) * stap + stap / 2),
      grootte: 15, kleur: 'var(--blauw)', anker: 'middle', prioriteit: 60,
      verschuif: [[0, 0], [60, 0], [-60, 0]],
    });
    labels.voegToe({
      tekst: 'verleden', x: yAs, y: schaal.naarY(ctOnder * 0.62),
      grootte: 15, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 58,
      verschuif: [[0, 0], [60, 0], [-60, 0]],
    });
    labels.voegToe({
      tekst: 'elders', x: schaal.naarX(xMax * 0.8), y: xAs - 44,
      grootte: 15, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 50,
    });

    svg.appendChild(labels.tekenAlles());

    const kaarten = [
      ['Snelheid', F.nl(beta, 2) + 'c', 'var(--trein)'],
      ['Lorentzfactor \u03b3', F.nl(g, 4), 'var(--blauw)'],
      ['Kloktempo 1/\u03b3', F.nl(1 / g, 4), 'var(--eigentijd)'],
      ['Kantelhoek assen', F.nl(Math.atan(beta) * 180 / Math.PI, 1) + '\u00b0', 'var(--accent)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
  }

  const schuif = paneel.querySelector('#beta');
  const betaWaarde = paneel.querySelector('#beta-waarde');
  const nuKnop = paneel.querySelector('#nu-knop');

  schuif.addEventListener('input', function () {
    beta = parseFloat(schuif.value);
    betaWaarde.textContent = F.nl(beta, 2) + 'c';
    teken();
  });
  nuKnop.addEventListener('click', function () {
    toonNu = !toonNu;
    nuKnop.classList.toggle('aan', toonNu);
    teken();
  });

  betaWaarde.textContent = F.nl(beta, 2) + 'c';
  teken();
}
