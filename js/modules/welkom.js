// welkom.js — startpagina en proef op de som voor het fundament.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Spacetime Forge';
export const onderschrift =
  'Een werkbank voor de speciale relativiteitstheorie. Gebouwd voor één scherm, ' +
  'zodat elk diagram precies past en niets overlapt.';

const BREEDTE = 1240;
const HOOGTE = 560;

export function render(doel) {
  let beta = 0.6;
  let toonNu = true;

  const uitleg = document.createElement('div');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<b>Het fundament staat.</b> Dit diagram gebruikt dezelfde bouwstenen als ' +
    'alle komende modules: één schaalobject dat natuurkundige co\u00f6rdinaten omzet ' +
    'naar het scherm, en een labelplaatser die botsende teksten opschuift, om ' +
    'assen heen leidt, of weglaat als het echt te druk wordt. Sleep aan de ' +
    'snelheid: de trein-assen kantelen naar elkaar toe, de lichtkegel blijft staan.';
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
  doel.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  waarden.style.marginBottom = '14px';
  doel.appendChild(waarden);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Opzet naar het Minkowski-diagram zoals besproken in Takeuchi, ' +
    '"An Illustrated Guide to Relativity", hoofdstuk 4 \u2014 in eigen woorden weergegeven.';
  doel.appendChild(bron);

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const g = F.gamma(beta);
    const xMax = 2.4, tMax = 1.25;
    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-xMax, xMax], yBereik: [-tMax, tMax],
      marge: { boven: 30, onder: 34, links: 54, rechts: 54 },
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
    });

    // Trein-assen (door de oorsprong, beide richtingen)
    var treinAssen = [
      { dx: xMax, dt: xMax * beta, naam: "x'" },
      { dx: tMax * beta, dt: tMax, naam: "ct'" },
    ];
    treinAssen.forEach(function (as) {
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(-as.dx), y1: schaal.naarY(-as.dt),
        x2: schaal.naarX(as.dx), y2: schaal.naarY(as.dt),
        stroke: 'var(--trein)', 'stroke-width': 2.2,
      }));
      labels.voegToe({
        tekst: as.naam, x: schaal.naarX(as.dx) - 6, y: schaal.naarY(as.dt) - 11,
        grootte: 17, kleur: 'var(--trein)', anker: 'end', gewicht: 650, prioriteit: 90,
      });
    });

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
      labels.voegToe({
        tekst: '\u03c4=' + F.nl(tau, 2),
        x: schaal.naarX(xg) + 12, y: schaal.naarY(t) + 5,
        grootte: 14, kleur: 'var(--trein)', gewicht: 600, prioriteit: 55,
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

    // Gelijktijdigheidslijnen van de trein
    if (toonNu) {
      for (let t = stap; t <= tMax; t += stap) {
        [1, -1].forEach(function (richting) {
          svg.appendChild(T.nuLijn(schaal, {
            beta: beta, x0: 0, t0: t * richting,
            kleur: 'var(--trein)', dikte: 0.9, streep: '3 6',
          }));
        });
      }
    }

    // Gebeurtenis in de oorsprong
    svg.appendChild(T.gebeurtenis(schaal, {
      t: 0, x: 0, kleur: 'var(--gebeurtenis)', straal: 7,
    }));
    labels.blokkeer({ links: yAs - 13, boven: xAs - 13, breedte: 26, hoogte: 26 });
    labels.voegToe({
      tekst: 'hier en nu', x: yAs + 18, y: xAs - 20,
      grootte: 14, kleur: 'var(--gebeurtenis)', gewicht: 650, prioriteit: 75,
      verschuif: [[0, 0], [0, -18], [16, -32], [-36, -20]],
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
