// epstein.js — de Epstein-cirkel.
// Kernidee: elk voorwerp beweegt altijd met snelheid c door ruimtetijd.
// De vraag is alleen hoeveel daarvan door de ruimte gaat en hoeveel door
// de tijd. Die twee vormen samen een rechthoekige driehoek met schuine
// zijde 1 — vandaar de cirkel.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Epstein-cirkel';
export const onderschrift =
  'Een ander mentaal model: je beweegt altijd met de lichtsnelheid door ruimtetijd. ' +
  'Sleep het punt over de boog en verdeel die snelheid tussen ruimte en tijd.';

const BREEDTE = 1100;
const HOOGTE = 620;

export function render(doel) {
  let beta = 0.6;
  let sleept = false;

  const uitleg = document.createElement('div');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    '<b>Waarom een cirkel?</b> De snelheid door de ruimte en de snelheid door de ' +
    'tijd vormen samen altijd precies c. In formulevorm: v\u00b2 + (c/\u03b3)\u00b2 = c\u00b2. ' +
    'Dat is de stelling van Pythagoras, en dus ligt het punt altijd op een cirkel ' +
    'met straal c. Sta je stil, dan gaat al je snelheid door de tijd. Beweeg je met ' +
    'bijna c, dan blijft er nauwelijks tijd over \u2014 je klok staat vrijwel stil.';
  doel.appendChild(uitleg);

  const vak = document.createElement('div');
  vak.className = 'diagram-vak';
  const svg = T.el('svg', {
    viewBox: '0 0 ' + BREEDTE + ' ' + HOOGTE,
    preserveAspectRatio: 'xMidYMid meet',
    style: 'cursor:grab',
  });
  vak.appendChild(svg);
  doel.appendChild(vak);

  const paneel = document.createElement('div');
  paneel.className = 'paneel';
  paneel.innerHTML =
    '<h3>Snelheid</h3>' +
    '<div class="regelaars">' +
    '  <div class="regelaar">' +
    '    <label for="ep-beta">Snelheid door de ruimte: <b id="ep-beta-w"></b></label>' +
    '    <input type="range" id="ep-beta" min="0" max="0.99" step="0.005" value="0.6" />' +
    '  </div>' +
    '  <div class="knoppen" id="ep-voorbeelden"></div>' +
    '</div>';
  doel.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  waarden.style.marginBottom = '14px';
  doel.appendChild(waarden);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Het model komt uit Epstein, "Relativity Visualized" \u2014 in eigen woorden ' +
    'weergegeven. De natuurkunde is identiek aan het Minkowski-diagram; alleen de ' +
    'manier van tekenen verschilt.';
  doel.appendChild(bron);

  // Voorbeeldknoppen
  const voorbeelden = [
    { naam: 'Stilstand', b: 0 },
    { naam: 'ISS', b: 7660 / F.C_MS },
    { naam: '0,6c', b: 0.6 },
    { naam: '0,9c', b: 0.9 },
    { naam: '0,99c', b: 0.99 },
  ];
  const knoppenVak = paneel.querySelector('#ep-voorbeelden');
  voorbeelden.forEach(function (v) {
    const k = document.createElement('button');
    k.className = 'knop';
    k.textContent = v.naam;
    k.addEventListener('click', function () {
      beta = v.b;
      schuif.value = String(Math.min(0.99, v.b));
      werkBij();
    });
    knoppenVak.appendChild(k);
  });

  // Vaste geometrie van de cirkel
  const R = 420;                    // straal in viewBox-eenheden
  const ox = 260, oy = HOOGTE - 110; // oorsprong linksonder

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const labels = T.maakLabelPlaatser();

    const g = beta > 0 ? F.gamma(beta) : 1;
    const vRuimte = beta;
    const vTijd = 1 / g;
    const px = ox + vRuimte * R;
    const py = oy - vTijd * R;

    // Assen
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox + R * 1.12, y2: oy,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox, y2: oy - R * 1.12,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.blokkeerLijn({ x1: ox, y1: oy, x2: ox + R * 1.12, y2: oy, dikte: 16 });
    labels.blokkeerLijn({ x1: ox, y1: oy, x2: ox, y2: oy - R * 1.12, dikte: 16 });

    labels.voegToe({
      tekst: 'snelheid door de ruimte \u2192', x: ox + R * 0.55, y: oy + 34,
      grootte: 15, kleur: 'var(--gebeurtenis)', anker: 'middle', gewicht: 600, prioriteit: 85,
    });
    labels.voegToe({
      tekst: '\u2191 snelheid door de tijd', x: ox - 30, y: oy - R * 0.55,
      grootte: 15, kleur: 'var(--eigentijd)', anker: 'middle', gewicht: 600, prioriteit: 85,
      verschuif: [[0, 0]],
    });

    // Kwartcirkel
    const boog = [];
    for (let a = 0; a <= Math.PI / 2 + 1e-9; a += 0.01) {
      boog.push((ox + Math.cos(a) * R).toFixed(2) + ',' + (oy - Math.sin(a) * R).toFixed(2));
    }
    svg.appendChild(T.el('polyline', {
      points: boog.join(' '), fill: 'none',
      stroke: 'var(--blauw)', 'stroke-width': 3,
    }));

    // Vulling onder de boog
    svg.appendChild(T.el('path', {
      d: 'M ' + ox + ' ' + oy + ' L ' + (ox + R) + ' ' + oy +
         ' A ' + R + ' ' + R + ' 0 0 0 ' + ox + ' ' + (oy - R) + ' Z',
      fill: 'var(--blauw)', opacity: 0.05,
    }));

    // Hulpstippellijnen
    svg.appendChild(T.el('line', {
      x1: px, y1: oy, x2: px, y2: py,
      stroke: 'var(--eigentijd)', 'stroke-width': 1.4, 'stroke-dasharray': '5 4',
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: py, x2: px, y2: py,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 1.4, 'stroke-dasharray': '5 4',
    }));

    // De drie zijden van de driehoek
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: px, y2: oy,
      stroke: 'var(--gebeurtenis)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: ox, y2: py,
      stroke: 'var(--eigentijd)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));
    svg.appendChild(T.el('line', {
      x1: ox, y1: oy, x2: px, y2: py,
      stroke: 'var(--accent)', 'stroke-width': 4, 'stroke-linecap': 'round',
    }));

    // Het sleeppunt
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: 18, fill: 'var(--accent)', opacity: 0.16,
    }));
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: 11, fill: 'var(--accent)',
      stroke: 'var(--kaart)', 'stroke-width': 3,
    }));
    labels.blokkeer({ links: px - 22, boven: py - 22, breedte: 44, hoogte: 44 });

    // Labels bij de zijden
    if (vRuimte > 0.04) {
      labels.voegToe({
        tekst: 'v = ' + F.nl(vRuimte, 3) + 'c',
        x: (ox + px) / 2, y: oy - 14,
        grootte: 15, kleur: 'var(--gebeurtenis)', anker: 'middle', gewicht: 650, prioriteit: 78,
        verschuif: [[0, 0], [0, -20], [0, 26]],
      });
    }
    labels.voegToe({
      tekst: '1/\u03b3 = ' + F.nl(vTijd, 3),
      x: ox + 16, y: (oy + py) / 2,
      grootte: 15, kleur: 'var(--eigentijd)', gewicht: 650, prioriteit: 78,
      verschuif: [[0, 0], [0, -22], [0, 22]],
    });
    labels.voegToe({
      tekst: 'altijd c',
      x: (ox + px) / 2 - 18, y: (oy + py) / 2 - 12,
      grootte: 15, kleur: 'var(--accent)', anker: 'end', gewicht: 650, prioriteit: 76,
      verschuif: [[0, 0], [0, -24], [-30, 0]],
    });

    // Vaste punten op de boog
    svg.appendChild(T.el('circle', { cx: ox, cy: oy - R, r: 6, fill: 'var(--eigentijd)' }));
    labels.voegToe({
      tekst: 'stilstand: alle snelheid door de tijd',
      x: ox + 16, y: oy - R - 14,
      grootte: 14, kleur: 'var(--eigentijd)', gewicht: 600, prioriteit: 72,
    });
    svg.appendChild(T.el('circle', { cx: ox + R, cy: oy, r: 6, fill: 'var(--gebeurtenis)' }));
    labels.voegToe({
      tekst: 'licht: klok staat stil',
      x: ox + R - 8, y: oy - 22,
      grootte: 14, kleur: 'var(--gebeurtenis)', anker: 'end', gewicht: 600, prioriteit: 72,
    });

    svg.appendChild(labels.tekenAlles());

    // Controle: de som moet exact 1 zijn
    const som = vRuimte * vRuimte + vTijd * vTijd;
    const kaarten = [
      ['Door de ruimte', F.nl(vRuimte, 4) + 'c', 'var(--gebeurtenis)'],
      ['Door de tijd', F.nl(vTijd, 4) + 'c', 'var(--eigentijd)'],
      ['Lorentzfactor \u03b3', F.nl(g, 4), 'var(--blauw)'],
      ['v\u00b2 + (1/\u03b3)\u00b2', F.nl(som, 6), 'var(--accent)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');
  }

  // Sleep over de boog: de hoek bepaalt de verdeling
  function verplaats(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return;
    const vx = ((clientX - rect.left) / rect.width) * BREEDTE;
    const vy = ((clientY - rect.top) / rect.height) * HOOGTE;
    let hoek = Math.atan2(oy - vy, vx - ox);
    hoek = Math.max(0.01, Math.min(Math.PI / 2 - 0.01, hoek));
    beta = Math.max(0, Math.min(0.99, Math.cos(hoek)));
    schuif.value = String(beta);
    werkBij();
  }

  function start(e) {
    sleept = true; svg.style.cursor = 'grabbing';
    const p = e.touches ? e.touches[0] : e;
    verplaats(p.clientX, p.clientY);
  }
  function beweeg(e) {
    if (!sleept) return;
    if (e.preventDefault) e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    verplaats(p.clientX, p.clientY);
  }
  function stop() { sleept = false; svg.style.cursor = 'grab'; }

  svg.addEventListener('touchstart', start, { passive: false });
  svg.addEventListener('touchmove', beweeg, { passive: false });
  svg.addEventListener('touchend', stop, { passive: false });
  svg.addEventListener('touchcancel', stop, { passive: false });
  svg.addEventListener('mousedown', start);
  svg.addEventListener('mousemove', beweeg);
  svg.addEventListener('mouseup', stop);
  svg.addEventListener('mouseleave', stop);

  const schuif = paneel.querySelector('#ep-beta');
  const betaW = paneel.querySelector('#ep-beta-w');

  function werkBij() {
    betaW.textContent = F.nl(beta, 3) + 'c';
    teken();
  }

  schuif.addEventListener('input', function () {
    beta = parseFloat(schuif.value);
    werkBij();
  });

  werkBij();
}
