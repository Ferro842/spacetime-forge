// welkom.js — startpagina en proef op de som voor het fundament.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Spacetime Forge';
export const onderschrift =
  'Een werkbank voor de speciale relativiteitstheorie. Gebouwd voor één scherm, ' +
  'zodat elk diagram precies past en niets overlapt.';

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
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>Het fundament staat</summary>' +
    '<p>Dit diagram gebruikt de bouwstenen van alle komende modules: één ' +
    'schaalobject dat natuurkundige co\u00f6rdinaten omzet naar het scherm, en een ' +
    'labelplaatser die botsende teksten opschuift, om assen heen leidt, of ' +
    'weglaat als het te druk wordt. Sleep aan de snelheid: de trein-assen ' +
    'kantelen naar elkaar toe, het licht blijft onder 45\u00b0 staan.</p>';
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
    const xMax = 2.4;
    const tekenB = BREEDTE - MARGE.links - MARGE.rechts;
    const tekenH = HOOGTE - MARGE.boven - MARGE.onder;
    const tMax = xMax * tekenH / tekenB;
    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-xMax, xMax], yBereik: [-tMax, tMax],
      marge: MARGE,
    });

    const labels = T.maakLabelPlaatser();
    const xAs = schaal.naarY(0);
    const yAs = schaal.naarX(0);

    labels.blokkeerLijn({
      x1: schaal.naarX(-xMax), y1: xAs, x2: schaal.naarX(xMax), y2: xAs, dikte: 18,
    });
    labels.blokkeerLijn({
      x1: yAs, y1: schaal.naarY(-tMax), x2: yAs, y2: schaal.naarY(tMax), dikte: 18,
    });

    // Toekomstkegel zacht inkleuren (ligt helemaal achteraan)
    const kegel = [[0, 0], [tMax, tMax], [-tMax, tMax]]
      .map(function (p) { return schaal.naarX(p[0]) + ',' + schaal.naarY(p[1]); })
      .join(' ');
    svg.appendChild(T.el('polygon', {
      points: kegel, fill: 'var(--blauw)', opacity: 0.05,
    }));

    svg.appendChild(T.lichtkegel(schaal, { kleur: 'var(--licht)', naarVerleden: true }));

    // Perron-assen
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(-xMax), y1: xAs, x2: schaal.naarX(xMax), y2: xAs,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: schaal.naarY(-tMax), x2: yAs, y2: schaal.naarY(tMax),
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.voegToe({
      tekst: 'x', x: schaal.naarX(xMax) - 4, y: xAs - 16,
      grootte: 17, kleur: 'var(--perron)', anker: 'end', gewicht: 650, prioriteit: 95,
    });
    labels.voegToe({
      tekst: 'ct', x: yAs + 15, y: schaal.naarY(tMax) + 17,
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
      const rek = Math.min(xMax / as.dx, tMax / as.dt);
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

    // Tijdtikken op de ct-as
    const stap = F.netteStap(tMax / 3);
    for (let t = stap; t <= tMax - 0.05; t += stap) {
      [1, -1].forEach(function (richting) {
        const tt = t * richting;
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

      // Eigen-tijd stip op de ct'-as
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
      for (let t = stap; t <= tMax; t += stap) {
        const xLinks = Math.max(-xMax, -t / beta);
        const xRechts = Math.min(xMax, (tMax - t) / beta);
        if (xRechts <= xLinks) continue;
        svg.appendChild(T.nuLijn(schaal, {
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
      tekst: 'toekomst', x: yAs, y: schaal.naarY(tMax * 0.7),
      grootte: 15, kleur: 'var(--blauw)', anker: 'middle', prioriteit: 60,
      verschuif: [[0, 0], [60, 0], [-60, 0]],
    });
    labels.voegToe({
      tekst: 'verleden', x: yAs, y: schaal.naarY(-tMax * 0.7),
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
