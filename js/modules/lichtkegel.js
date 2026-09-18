// lichtkegel.js — causaliteit in ruimtetijd.
// Sleep een gebeurtenis rond en zie meteen of hij binnen of buiten de
// lichtkegel valt, en wat dat betekent voor oorzaak en gevolg.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Lichtkegel';
export const onderschrift =
  'Welke gebeurtenissen kunnen elkaar be\u00efnvloeden, en welke staan voor altijd los ' +
  'van elkaar? Sleep het punt rond en lees het antwoord af.';

const BREEDTE = 1100;
const HOOGTE = 620;
const BEREIK = 3.0;

export function render(doel) {
  let evT = 1.6, evX = 0.9;
  let beta = 0.0;          // snelheid van het bekijkende kader
  let sleept = false;

  const uitleg = document.createElement('div');
  uitleg.className = 'uitleg';
  uitleg.innerHTML =
    'De twee schuine lijnen zijn de paden van licht door de oorsprong. Ze delen ' +
    'ruimtetijd in drie gebieden. <b>Binnen</b> de kegel kan een signaal reizen, ' +
    'dus is oorzaak en gevolg mogelijk. <b>Buiten</b> de kegel niet: daar bestaat ' +
    'altijd een kader waarin de twee gebeurtenissen gelijktijdig zijn, en zelfs ' +
    '\u00e9\u00e9n waarin hun volgorde omdraait.';
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
    '<h3>Bekijk vanuit een bewegend kader</h3>' +
    '<div class="regelaars">' +
    '  <div class="regelaar">' +
    '    <label for="lk-beta">Snelheid van de waarnemer: <b id="lk-beta-w"></b></label>' +
    '    <input type="range" id="lk-beta" min="-0.9" max="0.9" step="0.01" value="0" />' +
    '  </div>' +
    '  <div class="knoppen">' +
    '    <button class="knop" id="lk-reset">Zet waarnemer stil</button>' +
    '  </div>' +
    '</div>';
  doel.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  waarden.style.marginBottom = '14px';
  doel.appendChild(waarden);

  const duiding = document.createElement('div');
  duiding.className = 'paneel';
  doel.appendChild(duiding);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Het causaliteitsargument volgt Takeuchi, "An Illustrated Guide to Relativity", ' +
    'hoofdstuk 5 \u2014 in eigen woorden weergegeven.';
  doel.appendChild(bron);

  function maakSchaal() {
    return T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-BEREIK, BEREIK], yBereik: [-BEREIK * 0.62, BEREIK * 0.62],
      marge: { boven: 26, onder: 34, links: 50, rechts: 50 },
    });
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const schaal = maakSchaal();
    const labels = T.maakLabelPlaatser();
    const xAs = schaal.naarY(0);
    const yAs = schaal.naarX(0);
    const tGrens = BEREIK * 0.62;

    labels.blokkeerLijn({ x1: schaal.naarX(-BEREIK), y1: xAs, x2: schaal.naarX(BEREIK), y2: xAs, dikte: 18 });
    labels.blokkeerLijn({ x1: yAs, y1: schaal.naarY(-tGrens), x2: yAs, y2: schaal.naarY(tGrens), dikte: 18 });

    // Gebieden inkleuren
    const gebieden = [
      { punten: [[0, 0], [tGrens, tGrens], [-tGrens, tGrens]], kleur: 'var(--eigentijd)', dek: 0.07 },
      { punten: [[0, 0], [tGrens, -tGrens], [-tGrens, -tGrens]], kleur: 'var(--accent)', dek: 0.07 },
      { punten: [[0, 0], [BEREIK, BEREIK], [BEREIK, -BEREIK]], kleur: 'var(--gebeurtenis)', dek: 0.05 },
      { punten: [[0, 0], [-BEREIK, BEREIK], [-BEREIK, -BEREIK]], kleur: 'var(--gebeurtenis)', dek: 0.05 },
    ];
    gebieden.forEach(function (gb) {
      svg.appendChild(T.el('polygon', {
        points: gb.punten.map(function (p) {
          return schaal.naarX(p[0]) + ',' + schaal.naarY(p[1]);
        }).join(' '),
        fill: gb.kleur, opacity: gb.dek,
      }));
    });

    // Lichtkegel
    svg.appendChild(T.lichtkegel(schaal, { kleur: 'var(--licht)', naarVerleden: true }));

    // Assen
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(-BEREIK), y1: xAs, x2: schaal.naarX(BEREIK), y2: xAs,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: schaal.naarY(-tGrens), x2: yAs, y2: schaal.naarY(tGrens),
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));

    // Wereldlijn van de waarnemer
    if (Math.abs(beta) > 0.005) {
      svg.appendChild(T.worldline(schaal, {
        beta: beta, kleur: 'var(--blauw)', dikte: 2.4,
      }));
      labels.voegToe({
        tekst: 'waarnemer', x: schaal.naarX(beta * tGrens) + 10,
        y: schaal.naarY(tGrens) + 22,
        grootte: 14, kleur: 'var(--blauw)', gewicht: 600, prioriteit: 70,
      });
      // Gelijktijdigheidslijn van de waarnemer door de gebeurtenis
      const ev = F.lorentz(evT, evX, beta);
      svg.appendChild(T.nuLijn(schaal, {
        beta: beta, x0: evX, t0: evT,
        kleur: 'var(--blauw)', dikte: 1.4, streep: '7 5',
      }));
      void ev;
    }

    // Zonelabels
    labels.voegToe({
      tekst: 'TOEKOMST', x: yAs, y: schaal.naarY(tGrens * 0.74),
      grootte: 15, kleur: 'var(--eigentijd)', anker: 'middle', gewicht: 650, prioriteit: 62,
      verschuif: [[0, 0], [70, 0], [-70, 0]],
    });
    labels.voegToe({
      tekst: 'VERLEDEN', x: yAs, y: schaal.naarY(-tGrens * 0.74),
      grootte: 15, kleur: 'var(--accent)', anker: 'middle', gewicht: 650, prioriteit: 60,
      verschuif: [[0, 0], [70, 0], [-70, 0]],
    });
    [1, -1].forEach(function (kant) {
      labels.voegToe({
        tekst: 'ELDERS', x: schaal.naarX(BEREIK * 0.74 * kant), y: xAs - 46,
        grootte: 15, kleur: 'var(--gebeurtenis)', anker: 'middle', gewicht: 650, prioriteit: 56,
      });
    });

    // De sleepbare gebeurtenis
    const ds2 = F.interval(evT, evX);
    const soort = F.intervalSoort(evT, evX);
    const kleur = soort === 'tijdachtig'
      ? (evT > 0 ? 'var(--eigentijd)' : 'var(--accent)')
      : (soort === 'lichtachtig' ? 'var(--trein)' : 'var(--gebeurtenis)');

    // Verbindingslijn naar de oorsprong
    svg.appendChild(T.el('line', {
      x1: yAs, y1: xAs, x2: schaal.naarX(evX), y2: schaal.naarY(evT),
      stroke: kleur, 'stroke-width': 1.6, 'stroke-dasharray': '4 4', opacity: 0.8,
    }));

    svg.appendChild(T.gebeurtenis(schaal, { t: 0, x: 0, kleur: 'var(--perron)', straal: 7 }));
    labels.blokkeer({ links: yAs - 13, boven: xAs - 13, breedte: 26, hoogte: 26 });

    const px = schaal.naarX(evX), py = schaal.naarY(evT);
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: 16, fill: kleur, opacity: 0.18,
    }));
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: 9, fill: kleur,
      stroke: 'var(--kaart)', 'stroke-width': 2.5,
    }));
    labels.blokkeer({ links: px - 20, boven: py - 20, breedte: 40, hoogte: 40 });
    labels.voegToe({
      tekst: 'sleep mij', x: px + 22, y: py + 5,
      grootte: 14, kleur: kleur, gewicht: 650, prioriteit: 80,
      verschuif: [[0, 0], [0, -22], [0, 24], [-44, -22]],
    });

    svg.appendChild(labels.tekenAlles());

    // --- Waardekaarten ---
    const kaarten = [
      ['Positie (ct, x)', F.nl(evT, 2) + ' ; ' + F.nl(evX, 2), 'var(--tekst)'],
      ['Interval ds\u00b2', F.nl(ds2, 3), kleur],
      ['Soort', soort, kleur],
      ['Causaal verbonden?', soort === 'ruimteachtig' ? 'nee' : 'ja',
       soort === 'ruimteachtig' ? 'var(--gebeurtenis)' : 'var(--eigentijd)'],
    ];
    waarden.innerHTML = kaarten.map(function (k) {
      return '<div class="waarde-kaart"><div class="k">' + k[0] + '</div>' +
             '<div class="v" style="color:' + k[2] + '">' + k[1] + '</div></div>';
    }).join('');

    // --- Duiding in woorden ---
    let tekst;
    if (soort === 'tijdachtig') {
      const eigenTijd = Math.sqrt(Math.abs(ds2));
      const benodigd = Math.abs(evX / evT);
      tekst =
        '<h3>Tijdachtig interval</h3>' +
        '<p style="margin:0 0 8px">Deze gebeurtenis ligt <b>binnen</b> de lichtkegel. ' +
        (evT > 0
          ? 'Hij ligt in jouw toekomst: je kunt er nog invloed op uitoefenen.'
          : 'Hij ligt in jouw verleden: hij kan jou be\u00efnvloed hebben.') +
        '</p><p style="margin:0">Een reiziger die rechtstreeks van de oorsprong ' +
        'naar dit punt gaat, heeft daarvoor snelheid ' + F.nl(benodigd, 2) + 'c nodig ' +
        'en ziet op zijn eigen klok ' + F.nl(eigenTijd, 3) + ' verstrijken. Dat is ' +
        'minder dan de ' + F.nl(Math.abs(evT), 2) + ' op de klok van het ruststelsel \u2014 ' +
        'precies de tijdsdilatatie.</p>';
    } else if (soort === 'lichtachtig') {
      tekst =
        '<h3>Lichtachtig interval</h3>' +
        '<p style="margin:0">Dit punt ligt exact <b>op</b> de lichtkegel. Alleen een ' +
        'lichtsignaal haalt het precies. Het interval is nul, en dat blijft zo in ' +
        'elk referentiekader \u2014 dit is de enige grens waar alle waarnemers het ' +
        'over eens zijn.</p>';
    } else {
      // Snelheid van het kader waarin beide gelijktijdig zijn: beta = t/x
      const betaGelijk = evT / evX;
      tekst =
        '<h3>Ruimteachtig interval</h3>' +
        '<p style="margin:0 0 8px">Deze gebeurtenis ligt <b>buiten</b> de lichtkegel. ' +
        'Geen enkel signaal kan de oorsprong en dit punt verbinden, dus er kan geen ' +
        'oorzakelijk verband bestaan.</p>' +
        '<p style="margin:0">Sterker nog: in een kader dat met ' +
        F.nl(Math.abs(betaGelijk), 2) + 'c beweegt, vinden beide gebeurtenissen ' +
        '<b>gelijktijdig</b> plaats. Beweegt het kader nog sneller, dan draait hun ' +
        'volgorde zelfs om. Daarom mag niets sneller dan het licht: anders zou een ' +
        'gevolg aan zijn oorzaak vooraf kunnen gaan.</p>';
    }
    duiding.innerHTML = tekst;
  }

  // --- Sleep-interactie ---
  function naarCoord(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    if (!rect.width) return null;
    const vx = ((clientX - rect.left) / rect.width) * BREEDTE;
    const vy = ((clientY - rect.top) / rect.height) * HOOGTE;
    const schaal = maakSchaal();
    return { x: schaal.vanX(vx), t: schaal.vanY(vy) };
  }

  function verplaats(clientX, clientY) {
    const c = naarCoord(clientX, clientY);
    if (!c) return;
    const tGrens = BEREIK * 0.62;
    evX = Math.max(-BEREIK * 0.95, Math.min(BEREIK * 0.95, c.x));
    evT = Math.max(-tGrens * 0.95, Math.min(tGrens * 0.95, c.t));
    teken();
  }

  function start(e) {
    sleept = true;
    svg.style.cursor = 'grabbing';
    const p = e.touches ? e.touches[0] : e;
    verplaats(p.clientX, p.clientY);
  }
  function beweeg(e) {
    if (!sleept) return;
    if (e.preventDefault) e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    verplaats(p.clientX, p.clientY);
  }
  function stop() {
    sleept = false;
    svg.style.cursor = 'grab';
  }

  // Native koppelen met passive:false, anders blokkeert de paginascroll niet
  svg.addEventListener('touchstart', start, { passive: false });
  svg.addEventListener('touchmove', beweeg, { passive: false });
  svg.addEventListener('touchend', stop, { passive: false });
  svg.addEventListener('touchcancel', stop, { passive: false });
  svg.addEventListener('mousedown', start);
  svg.addEventListener('mousemove', beweeg);
  svg.addEventListener('mouseup', stop);
  svg.addEventListener('mouseleave', stop);

  const schuif = paneel.querySelector('#lk-beta');
  const betaW = paneel.querySelector('#lk-beta-w');
  const reset = paneel.querySelector('#lk-reset');

  schuif.addEventListener('input', function () {
    beta = parseFloat(schuif.value);
    betaW.textContent = F.nl(beta, 2) + 'c';
    teken();
  });
  reset.addEventListener('click', function () {
    beta = 0;
    schuif.value = '0';
    betaW.textContent = '0,00c';
    teken();
  });

  betaW.textContent = '0,00c';
  teken();
}
