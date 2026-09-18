// welkom.js — startpagina, en tegelijk een proef op de som voor het
// fundament: schaal, lichtkegel, worldlines, gelijktijdigheidslijnen
// en de labelplaatser doen hier allemaal mee.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Spacetime Forge';
export const onderschrift =
  'Een werkbank voor de speciale relativiteitstheorie. Gebouwd voor één scherm, ' +
  'zodat elk diagram precies past en niets overlapt.';

const BREEDTE = 1180;
const HOOGTE = 620;

export function render(doel) {
  let beta = 0.6;

  // --- Uitleg ---
  const uitleg = document.createElement('div');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<b>Het fundament staat.</b> Het diagram hieronder gebruikt dezelfde ' +
    'bouwstenen als alle komende modules: één schaalobject dat natuurkundige ' +
    'coördinaten omzet naar het scherm, en een labelplaatser die botsende ' +
    'teksten opschuift of weglaat. Sleep aan de snelheid en let op de labels — ' +
    'ze lopen nooit door elkaar heen.';
  doel.appendChild(uitleg);

  // --- Diagram ---
  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: `0 0 ${BREEDTE} ${HOOGTE}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Minkowski-diagram met perron- en treinassen',
  });
  vak.appendChild(svg);
  doel.appendChild(vak);

  // --- Regelaars ---
  const paneel = document.createElement('div');
  paneel.className = 'paneel';
  paneel.innerHTML = `
    <h3>Instellingen</h3>
    <div class="regelaars">
      <div class="regelaar">
        <label for="beta">Snelheid van de trein: <b id="beta-waarde"></b></label>
        <input type="range" id="beta" min="0.05" max="0.95" step="0.01" value="0.6" />
      </div>
    </div>
  `;
  doel.appendChild(paneel);

  // --- Waarden ---
  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  waarden.style.marginBottom = '14px';
  doel.appendChild(waarden);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Opzet naar het Minkowski-diagram zoals besproken in Takeuchi, ' +
    '"An Illustrated Guide to Relativity", hoofdstuk 4 — in eigen woorden weergegeven.';
  doel.appendChild(bron);

  // --- Tekenen ---
  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const g = F.gamma(beta);
    const bereik = 2.0;
    const schaal = T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-bereik, bereik], yBereik: [0, bereik],
      marge: { boven: 34, onder: 54, links: 70, rechts: 46 },
    });

    const labels = T.maakLabelPlaatser();

    // Lichtkegel eerst (ligt achter alles)
    svg.appendChild(T.lichtkegel(schaal, { kleur: 'var(--licht)' }));

    // Perron-assen
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(-bereik), y1: schaal.naarY(0),
      x2: schaal.naarX(bereik), y2: schaal.naarY(0),
      stroke: 'var(--perron)', 'stroke-width': 1.8,
    }));
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(0), y1: schaal.naarY(0),
      x2: schaal.naarX(0), y2: schaal.naarY(bereik),
      stroke: 'var(--perron)', 'stroke-width': 1.8,
    }));
    labels.voegToe({
      tekst: 'x', x: schaal.naarX(bereik) - 6, y: schaal.naarY(0) - 10,
      grootte: 16, kleur: 'var(--perron)', anker: 'end', gewicht: 600, prioriteit: 90,
    });
    labels.voegToe({
      tekst: 'ct', x: schaal.naarX(0) + 10, y: schaal.naarY(bereik) + 14,
      grootte: 16, kleur: 'var(--perron)', gewicht: 600, prioriteit: 90,
    });

    // Trein-assen (gekanteld)
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(0), y1: schaal.naarY(0),
      x2: schaal.naarX(bereik), y2: schaal.naarY(bereik * beta),
      stroke: 'var(--trein)', 'stroke-width': 1.8, 'stroke-dasharray': '7 4',
    }));
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(0), y1: schaal.naarY(0),
      x2: schaal.naarX(bereik * beta), y2: schaal.naarY(bereik),
      stroke: 'var(--trein)', 'stroke-width': 1.8, 'stroke-dasharray': '7 4',
    }));
    labels.voegToe({
      tekst: "x'", x: schaal.naarX(bereik) - 4, y: schaal.naarY(bereik * beta) - 10,
      grootte: 16, kleur: 'var(--trein)', anker: 'end', gewicht: 600, prioriteit: 88,
    });
    labels.voegToe({
      tekst: "ct'", x: schaal.naarX(bereik * beta) + 10, y: schaal.naarY(bereik) + 14,
      grootte: 16, kleur: 'var(--trein)', gewicht: 600, prioriteit: 88,
    });

    // Tijdtikken op de ct-as, plus de bijbehorende eigen tijd op ct'
    const stap = F.netteStap(bereik / 5);
    for (let t = stap; t <= bereik + 1e-9; t += stap) {
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(-0.035), y1: schaal.naarY(t),
        x2: schaal.naarX(0.035), y2: schaal.naarY(t),
        stroke: 'var(--perron)', 'stroke-width': 1.4,
      }));
      labels.voegToe({
        tekst: 'ct=' + F.nl(t, 1),
        x: schaal.naarX(0) - 14, y: schaal.naarY(t) + 5,
        grootte: 14, kleur: 'var(--perron)', anker: 'end', prioriteit: 40,
      });

      const tau = t / g;
      const xg = beta * t;
      svg.appendChild(T.el('circle', {
        cx: schaal.naarX(xg), cy: schaal.naarY(t), r: 4,
        fill: 'var(--trein)',
      }));
      labels.voegToe({
        tekst: "\u03c4=" + F.nl(tau, 2),
        x: schaal.naarX(xg) + 11, y: schaal.naarY(t) + 5,
        grootte: 14, kleur: 'var(--trein)', prioriteit: 35,
      });
    }

    // Ruimtetikken op de x-as
    for (let x = -bereik + stap; x <= bereik - stap + 1e-9; x += stap) {
      if (Math.abs(x) < 1e-9) continue;
      svg.appendChild(T.el('line', {
        x1: schaal.naarX(x), y1: schaal.naarY(0) - 5,
        x2: schaal.naarX(x), y2: schaal.naarY(0) + 5,
        stroke: 'var(--perron)', 'stroke-width': 1.4,
      }));
      labels.voegToe({
        tekst: F.nl(x, 1), x: schaal.naarX(x), y: schaal.naarY(0) + 24,
        grootte: 14, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 20,
        verschuif: [[0, 0], [0, 18]],
      });
    }

    // Gelijktijdigheidslijnen van de trein
    for (let t = stap; t <= bereik + 1e-9; t += stap) {
      svg.appendChild(T.nuLijn(schaal, {
        beta, x0: 0, t0: t, kleur: 'var(--trein)', dikte: 0.9, streep: '3 5',
      }));
    }

    // Een lichtflits vanuit de oorsprong, als voorbeeldgebeurtenis
    svg.appendChild(T.gebeurtenis(schaal, {
      t: 0, x: 0, kleur: 'var(--gebeurtenis)', straal: 7,
    }));
    labels.voegToe({
      tekst: 'flits op t=0', x: schaal.naarX(0) + 14, y: schaal.naarY(0) - 14,
      grootte: 14, kleur: 'var(--gebeurtenis)', gewicht: 600, prioriteit: 70,
    });

    // Alle labels in één keer, botsingsvrij
    svg.appendChild(labels.tekenAlles());

    // Waardekaarten bijwerken
    waarden.innerHTML = [
      ['Snelheid', F.nl(beta, 2) + 'c', 'var(--trein)'],
      ['Lorentzfactor \u03b3', F.nl(g, 4), 'var(--blauw)'],
      ['Kloktempo 1/\u03b3', F.nl(1 / g, 4), 'var(--eigentijd)'],
      ['Kantelhoek assen', F.nl(Math.atan(beta) * 180 / Math.PI, 1) + '\u00b0', 'var(--accent)'],
    ].map(([k, v, kleur]) =>
      `<div class="waarde-kaart"><div class="k">${k}</div>` +
      `<div class="v" style="color:${kleur}">${v}</div></div>`
    ).join('');
  }

  const schuif = paneel.querySelector('#beta');
  const betaWaarde = paneel.querySelector('#beta-waarde');
  function bijwerken() {
    beta = parseFloat(schuif.value);
    betaWaarde.textContent = F.nl(beta, 2) + 'c';
    teken();
  }
  schuif.addEventListener('input', bijwerken);
  bijwerken();
}
