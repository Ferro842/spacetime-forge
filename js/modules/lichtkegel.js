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

    // De vier lichtlijnen blokkeren: ze zijn de grens van het hele verhaal,
    // dus er mag geen label overheen vallen.
    [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(function (hoek) {
      labels.blokkeerSchuin({
        x1: yAs, y1: xAs,
        x2: schaal.naarX(tGrens * hoek[0]), y2: schaal.naarY(tGrens * hoek[1]),
        dikte: 13,
      });
    });

    // Assen
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(-BEREIK), y1: xAs, x2: schaal.naarX(BEREIK), y2: xAs,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: schaal.naarY(-tGrens), x2: yAs, y2: schaal.naarY(tGrens),
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.voegToe({
      tekst: 'x', x: schaal.naarX(BEREIK) - 4, y: xAs - 16,
      grootte: 17, kleur: 'var(--perron)', anker: 'end', gewicht: 650, prioriteit: 95,
    });
    labels.voegToe({
      tekst: 'ct', x: yAs + 15, y: schaal.naarY(tGrens) + 17,
      grootte: 17, kleur: 'var(--perron)', gewicht: 650, prioriteit: 95,
      // Boven dit label is geen ruimte meer, dus opzij of omlaag uitwijken
      verschuif: [[0, 0], [-52, 0], [0, 20], [-52, 20]],
    });

    // Verdeling op beide assen. Eén stapgrootte voor x én ct, want ze staan
    // in dezelfde eenheid — zo blijft af te lezen dat licht onder 45° loopt.
    const tik = F.netteStap(BEREIK / 6);
    for (let w = tik; w <= BEREIK - 0.05; w += tik) {
      [1, -1].forEach(function (kant) {
        const xx = w * kant;
        svg.appendChild(T.el('line', {
          x1: schaal.naarX(xx), y1: xAs - 6, x2: schaal.naarX(xx), y2: xAs + 6,
          stroke: 'var(--perron)', 'stroke-width': 1.6,
        }));
        labels.voegToe({
          tekst: F.nl(xx, 1), x: schaal.naarX(xx), y: xAs + 27,
          grootte: 14, kleur: 'var(--tekst-zacht)', anker: 'middle', prioriteit: 25,
          // Alleen omlaag uitwijken: onder zijn eigen streepje blijven staan
          verschuif: [[0, 0], [0, 17], [0, 34]],
        });
      });
    }
    for (let w = tik; w <= tGrens - 0.05; w += tik) {
      [1, -1].forEach(function (kant) {
        const tt = w * kant;
        svg.appendChild(T.el('line', {
          x1: yAs - 6, y1: schaal.naarY(tt), x2: yAs + 6, y2: schaal.naarY(tt),
          stroke: 'var(--perron)', 'stroke-width': 1.6,
        }));
        labels.voegToe({
          tekst: F.nl(tt, 1), x: yAs - 14, y: schaal.naarY(tt) + 5,
          grootte: 14, kleur: 'var(--tekst-zacht)', anker: 'end', prioriteit: 40,
          // Liever naar links dan omhoog of omlaag: de hoogte hoort bij het getal
          verschuif: [[0, 0], [-26, 0], [-52, 0], [0, -15], [0, 15]],
        });
      });
    }

    // Wereldlijn van de waarnemer
    if (Math.abs(beta) > 0.005) {
      svg.appendChild(T.worldline(schaal, {
        beta: beta, kleur: 'var(--blauw)', dikte: 2.4,
      }));
      labels.voegToe({
        tekst: 'waarnemer', x: schaal.naarX(beta * tGrens) + 10,
        y: schaal.naarY(tGrens) + 22,
        grootte: 14, kleur: 'var(--blauw)', gewicht: 600, prioriteit: 70,
        // Staat al tegen de bovenrand: alleen opzij en omlaag uitwijken
        verschuif: [[0, 0], [0, 20], [-120, 0], [0, 40], [-120, 20]],
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
    // De oorsprong benoemen. Het label ligt in de strook tussen de x-as en de
    // lichtlijn; wijkt het uit naar boven, dan moet het mee naar buiten,
    // anders loopt het tegen die lichtlijn aan.
    labels.voegToe({
      tekst: 'hier en nu', x: yAs + 70, y: xAs - 19,
      grootte: 14, kleur: 'var(--perron)', gewicht: 650, prioriteit: 74,
      verschuif: [[0, 0], [-170, 0], [40, -36], [-210, -36]],
    });

    const px = schaal.naarX(evX), py = schaal.naarY(evT);
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: 16, fill: kleur, opacity: 0.18,
    }));
    svg.appendChild(T.el('circle', {
      cx: px, cy: py, r: 9, fill: kleur,
      stroke: 'var(--kaart)', 'stroke-width': 2.5,
    }));
    labels.blokkeer({ links: px - 20, boven: py - 20, breedte: 40, hoogte: 40 });

    // Het label bij het sleeppunt draagt de coördinaten mee en is daardoor
    // breed. Met de ct-as en de vier lichtlijnen bezet is de ruimte binnen de
    // kegel vaak net te smal voor een vaste plek naast het punt. Daarom
    // rekenen we per hoogte ook uitwijkposities uit die per definitie vrij
    // liggen: strak naast de ct-as, en net buiten de lichtlijn.
    const sleepTekst = 'sleep mij (ct=' + F.nl(evT, 2) + ', x=' + F.nl(evX, 2) + ')';
    const sleepGrootte = 14;
    // Zelfde breedteschatting als de labelplaatser zelf gebruikt
    const sleepBreed = sleepTekst.length * sleepGrootte * 0.58;
    const sleepX = px + 22, sleepY = py + 5;

    // Waar staat de lichtlijn op de hoogte van het label? De bovenrand en de
    // onderrand van het tekstvak geven elk een afstand tot de as; de grootste
    // van de twee is de kant waar de lijn het verst naar buiten ligt. De randen
    // gaan er ruim omheen, want blokkades volgen de schuinte in stukjes.
    function lichtlijnAf(dy) {
      const tBoven = Math.abs(schaal.vanY(sleepY + dy - sleepGrootte * 0.8 - 12));
      const tOnder = Math.abs(schaal.vanY(sleepY + dy + sleepGrootte * 0.25 + 12));
      return Math.max(tBoven, tOnder);
    }
    // Een positie wordt alleen aangeboden als het hele label binnen de viewBox
    // valt. De marge mag het gebruiken — dat is gewoon lege ruimte — maar wat
    // erbuiten valt is net zo onzichtbaar als verborgen.
    const uitwijk = [];
    function bied(dx, dy) {
      const links = sleepX + dx, boven = sleepY + dy - sleepGrootte * 0.8;
      if (links < 6 || links + sleepBreed > BREEDTE - 6) return;
      if (boven < 6 || boven + sleepGrootte > HOOGTE - 6) return;
      uitwijk.push([dx, dy]);
    }
    // Hoe ver staat het tekstvak van het punt af? Nul als het punt erin valt.
    function afstandTotPunt(dx, dy) {
      const links = sleepX + dx, rechts = links + sleepBreed;
      const boven = sleepY + dy - sleepGrootte * 0.8;
      const onder = sleepY + dy + sleepGrootte * 0.25;
      return Math.hypot(Math.max(links - px, 0, px - rechts),
                        Math.max(boven - py, 0, py - onder));
    }
    [0, -26, 28, -52, 54, -78, 80, -104, 106].forEach(function (dy) {
      const buiten = schaal.naarX(lichtlijnAf(dy)) - schaal.naarX(0);
      bied(0, dy);                                     // rechts van het punt
      bied(-sleepBreed - 50, dy);                      // links van het punt
      bied((yAs + 15) - sleepX, dy);                   // naast de ct-as, rechts
      bied((yAs - 15 - sleepBreed) - sleepX, dy);      // naast de ct-as, links
      bied((yAs + buiten + 24) - sleepX, dy);          // net buiten de lichtkegel
      bied((yAs - buiten - 24 - sleepBreed) - sleepX, dy);
    });
    // Van dichtbij naar ver sorteren: de labelplaatser pakt de eerste vrije
    // plek, en dat moet de plek zijn die het dichtst bij het punt ligt.
    uitwijk.sort(function (a, b) {
      return afstandTotPunt(a[0], a[1]) - afstandTotPunt(b[0], b[1]);
    });
    labels.voegToe({
      tekst: sleepTekst, x: sleepX, y: sleepY,
      grootte: sleepGrootte, kleur: kleur, gewicht: 650, prioriteit: 80,
      verschuif: uitwijk,
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
