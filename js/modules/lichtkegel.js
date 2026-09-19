// lichtkegel.js — causaliteit in ruimtetijd.
// Sleep een gebeurtenis rond en zie meteen of hij binnen of buiten de
// lichtkegel valt, en wat dat betekent voor oorzaak en gevolg.
//
// De telegraaf maakt van dat "kan niet" een bewijs uit het ongerijmde. Stuur
// een bericht sneller dan het licht naar een punt buiten de kegel, laat een
// bewegend relais daar antwoorden — ook sneller dan het licht, maar dan in
// zíjn kader — en het antwoord staat op je bureau voordat je de vraag hebt
// verstuurd. Niet de snelheid van licht is het probleem, maar de volgorde
// van oorzaak en gevolg.

import * as F from '../fysica.js';
import * as T from '../teken.js';

export const titel = 'Lichtkegel';
export const onderschrift =
  'Welke gebeurtenissen kunnen elkaar be\u00efnvloeden, en welke staan voor altijd los ' +
  'van elkaar? Sleep het punt rond en lees het antwoord af.';

// Maat van het diagramvak op het doelscherm: ongeveer 940 x 935 px.
const BREEDTE = 960;
const HOOGTE = 940;
const MARGE = { boven: 28, onder: 36, links: 52, rechts: 52 };
const BEREIK = 3.0;
// Even veel pixels per eenheid x als per eenheid ct, zodat de lichtlijnen
// precies onder 45° lopen. De ct-grens volgt dus uit het tekenvlak.
const T_GRENS = BEREIK * (HOOGTE - MARGE.boven - MARGE.onder) /
                         (BREEDTE - MARGE.links - MARGE.rechts);

/** Dezelfde breedteschatting als de labelplaatser in teken.js. */
function schatBreedte(tekst, grootte) {
  const hoofdletters = (tekst.match(/[A-Z\u00c0-\u00de]/g) || []).length;
  return (tekst.length + hoofdletters * 0.22) * grootte * 0.58;
}

/**
 * Houdt alleen de uitwijkplekken over die binnen de viewBox vallen, en schuift
 * het label anders alsnog naar binnen. Half buiten beeld is net zo onleesbaar
 * als weggelaten, maar de plaatser telt het wel als geplaatst.
 */
function ladder(spec, plekken) {
  const b = schatBreedte(spec.tekst, spec.grootte);
  function links(dx) {
    let l = spec.x + dx;
    if (spec.anker === 'middle') l -= b / 2;
    else if (spec.anker === 'end') l -= b;
    return l;
  }
  const uit = plekken.filter(function (plek) {
    const y = spec.y + plek[1];
    return links(plek[0]) >= 3 && links(plek[0]) + b <= BREEDTE - 3 &&
           y - spec.grootte * 0.8 >= 3 && y + spec.grootte * 0.25 <= HOOGTE - 3;
  });
  if (uit.length) return uit;
  const l = links(0);
  let dx = 0;
  if (l < 3) dx = 3 - l;
  else if (l + b > BREEDTE - 3) dx = BREEDTE - 3 - b - l;
  const y = Math.max(spec.grootte * 0.8 + 3,
                     Math.min(HOOGTE - 3 - spec.grootte * 0.25, spec.y));
  return [[dx, y - spec.y]];
}

export function render(doel) {
  let evT = 1.6, evX = 0.9;
  let beta = 0.0;          // snelheid van het bekijkende kader
  let sleept = false;
  let toonTelegraaf = false;   // het antwoord dat voor de vraag aankomt

  const uitleg = document.createElement('details');
  uitleg.className = 'uitleg';
  uitleg.open = true;
  uitleg.innerHTML =
    '<summary>Wat de kegel verdeelt</summary>' +
    '<p>De twee schuine lijnen zijn de paden van licht door de oorsprong. ' +
    '<b>Binnen</b> de kegel kan een signaal reizen, dus is oorzaak en gevolg ' +
    'mogelijk. <b>Buiten</b> de kegel niet: daar bestaat altijd een kader waarin ' +
    'de twee gebeurtenissen gelijktijdig zijn, en zelfs \u00e9\u00e9n waarin hun ' +
    'volgorde omdraait.</p>' +
    '<p style="margin-top:7px">Zet <b>Telegraaf</b> aan om te zien waarom dat ' +
    'fataal is. Een bericht buiten de kegel heen, een antwoord dat voor het ' +
    'relais ogenblikkelijk is terug \u2014 en het antwoord ligt er eerder dan de ' +
    'vraag vertrok.</p>';
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

  // Alles wat geen diagram is, staat rechts onder elkaar in de zijkolom
  const zijkolom = document.createElement('div');
  zijkolom.className = 'zijkolom';
  doel.appendChild(zijkolom);

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
    '  <div class="knoppen" style="margin-top:8px">' +
    '    <button class="knop klein" id="lk-telegraaf">Telegraaf</button>' +
    '    <button class="knop klein" id="lk-paradox">Laat het misgaan</button>' +
    '  </div>' +
    '</div>';
  zijkolom.appendChild(paneel);

  const waarden = document.createElement('div');
  waarden.className = 'waarden';
  zijkolom.appendChild(waarden);

  const duiding = document.createElement('div');
  duiding.className = 'paneel';
  zijkolom.appendChild(duiding);

  const bron = document.createElement('div');
  bron.className = 'bron';
  bron.textContent =
    'Het causaliteitsargument volgt Takeuchi, "An Illustrated Guide to Relativity", ' +
    'hoofdstuk 5; het idee om de onmogelijkheid te laten zien met een antwoord dat ' +
    'v\u00f3\u00f3r de vraag aankomt staat bij Epstein, "Relativity Visualized", het ' +
    'hoofdstuk over de kosmische snelheidsgrens \u2014 in eigen woorden weergegeven.';
  zijkolom.appendChild(bron);

  /**
   * Alles wat de telegraaf nodig heeft.
   *
   * De vraag reist van de oorsprong naar de gebeurtenis en legt daarbij
   * evX af in evT, dus met snelheid evX/evT — sneller dan het licht zodra
   * het punt buiten de kegel ligt. Het antwoord gaat terug langs de nu-lijn
   * van het relais: ogenblikkelijk in diens eigen kader. Die lijn heeft in
   * het ruststelsel helling beta, en snijdt x = 0 op evT - beta*evX.
   */
  function telegraaf() {
    const ruimteachtig = F.intervalSoort(evT, evX) === 'ruimteachtig';
    const bruikbaar = ruimteachtig && evT > 1e-6 && Math.abs(evX) > 1e-6;
    const terug = evT - beta * evX;
    return {
      bruikbaar: bruikbaar,
      ruimteachtig: ruimteachtig,
      heenSnelheid: evT > 1e-6 ? Math.abs(evX / evT) : Infinity,
      // Vanaf deze snelheid van het relais gaat het mis. Het teken volgt de
      // kant waar de gebeurtenis ligt: het relais moet dezelfde kant op.
      drempel: Math.abs(evX) > 1e-6 ? evT / evX : Infinity,
      terug: terug,
      terugSnelheid: Math.abs(beta) > 1e-6 ? 1 / Math.abs(beta) : Infinity,
      paradox: bruikbaar && terug < -1e-9,
    };
  }

  /** Een lijn met een pijlpunt op het eind. */
  function pijl(x1, y1, x2, y2, kleur, dikte) {
    const groep = T.el('g');
    const lengte = Math.hypot(x2 - x1, y2 - y1) || 1;
    const ex = (x2 - x1) / lengte, ey = (y2 - y1) / lengte;
    const punt = 14;
    groep.appendChild(T.el('line', {
      x1: x1, y1: y1, x2: x2 - ex * punt * 0.8, y2: y2 - ey * punt * 0.8,
      stroke: kleur, 'stroke-width': dikte, 'stroke-linecap': 'round',
    }));
    const zij = punt * 0.44;
    groep.appendChild(T.el('polygon', {
      points: [
        x2 + ',' + y2,
        (x2 - ex * punt + ey * zij) + ',' + (y2 - ey * punt - ex * zij),
        (x2 - ex * punt - ey * zij) + ',' + (y2 - ey * punt + ex * zij),
      ].join(' '),
      fill: kleur,
    }));
    return groep;
  }

  function maakSchaal() {
    return T.maakSchaal({
      breedte: BREEDTE, hoogte: HOOGTE,
      xBereik: [-BEREIK, BEREIK], yBereik: [-T_GRENS, T_GRENS],
      marge: MARGE,
    });
  }

  function teken() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const schaal = maakSchaal();
    const labels = T.maakLabelPlaatser();
    const xAs = schaal.naarY(0);
    const yAs = schaal.naarX(0);

    labels.blokkeerLijn({ x1: schaal.naarX(-BEREIK), y1: xAs, x2: schaal.naarX(BEREIK), y2: xAs, dikte: 18 });
    labels.blokkeerLijn({ x1: yAs, y1: schaal.naarY(-T_GRENS), x2: yAs, y2: schaal.naarY(T_GRENS), dikte: 18 });

    // Gebieden inkleuren
    const gebieden = [
      { punten: [[0, 0], [T_GRENS, T_GRENS], [-T_GRENS, T_GRENS]], kleur: 'var(--eigentijd)', dek: 0.07 },
      { punten: [[0, 0], [T_GRENS, -T_GRENS], [-T_GRENS, -T_GRENS]], kleur: 'var(--accent)', dek: 0.07 },
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
        x2: schaal.naarX(T_GRENS * hoek[0]), y2: schaal.naarY(T_GRENS * hoek[1]),
        // Dun genoeg om het eerste tikgetal naast de as te laten staan,
        // dik genoeg om tekst op de lijn te voorkomen.
        dikte: 10,
      });
    });

    // Assen
    svg.appendChild(T.el('line', {
      x1: schaal.naarX(-BEREIK), y1: xAs, x2: schaal.naarX(BEREIK), y2: xAs,
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    svg.appendChild(T.el('line', {
      x1: yAs, y1: schaal.naarY(-T_GRENS), x2: yAs, y2: schaal.naarY(T_GRENS),
      stroke: 'var(--perron)', 'stroke-width': 2,
    }));
    labels.voegToe({
      tekst: 'x', x: schaal.naarX(BEREIK) - 4, y: xAs - 16,
      grootte: 17, kleur: 'var(--perron)', anker: 'end', gewicht: 650, prioriteit: 95,
    });
    labels.voegToe({
      tekst: 'ct', x: yAs + 15, y: schaal.naarY(T_GRENS) + 17,
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
    for (let w = tik; w <= T_GRENS - 0.05; w += tik) {
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
      // De wereldlijn verlaat het beeld bovenaan. Bij een hoge snelheid ligt die
      // uitgang vlak bij de rand, dus schuift het label mee naar binnen.
      const naamBreed = 'waarnemer'.length * 14 * 0.58;
      const naamX = Math.min(Math.max(schaal.naarX(beta * T_GRENS) + 10, 8),
                             BREEDTE - 8 - naamBreed);
      // Zijwaarts uitwijken naar de kant waar nog ruimte is
      const naamZij = naamX - 120 >= 8 ? -120 : 120;
      labels.voegToe({
        tekst: 'waarnemer', x: naamX, y: schaal.naarY(T_GRENS) + 22,
        grootte: 14, kleur: 'var(--blauw)', gewicht: 600, prioriteit: 70,
        // Staat al tegen de bovenrand: alleen opzij en omlaag uitwijken
        verschuif: [[0, 0], [0, 20], [naamZij, 0], [0, 40], [naamZij, 20]],
      });
      // Gelijktijdigheidslijn van de waarnemer door de gebeurtenis
      const ev = F.lorentz(evT, evX, beta);
      svg.appendChild(T.nuLijn(schaal, {
        beta: beta, x0: evX, t0: evT,
        kleur: 'var(--blauw)', dikte: 1.4, streep: '7 5',
      }));
      void ev;
    }

    // --- De tachyontelegraaf -------------------------------------------------
    const tg = telegraaf();
    if (toonTelegraaf && tg.bruikbaar) {
      const pEvX = schaal.naarX(evX), pEvY = schaal.naarY(evT);
      // Het antwoord kan buiten het tekenvlak aankomen: met een relais dat de
      // andere kant op gaat schiet de nu-lijn ver boven de bovenrand uit. Dan
      // wordt de pijl bij de rand afgekapt en zegt het label dat erbij.
      const buitenBeeld = tg.terug > T_GRENS || tg.terug < -T_GRENS;
      const terugGetoond = Math.max(-T_GRENS, Math.min(T_GRENS, tg.terug));
      const pTerugY = schaal.naarY(terugGetoond);

      // Een label langs een pijl: loodrecht ernaast, en anders verderop langs
      // de pijl. Recht op de pijl kan niet, want die is zelf geblokkeerd.
      function langsPijl(ax, ay, bx, by, tekst, prioriteit) {
        const lengte = Math.hypot(bx - ax, by - ay) || 1;
        const ex = (bx - ax) / lengte, ey = (by - ay) / lengte;
        const spec = {
          tekst: tekst, x: (ax + bx) / 2, y: (ay + by) / 2 + 5,
          grootte: 14.5, kleur: 'var(--accent)', gewicht: 650,
          prioriteit: prioriteit, anker: 'middle',
        };
        const plekken = [];
        [24, 46, 68, 92, 120, 150].forEach(function (afstand) {
          [1, -1].forEach(function (zijde) {
            [0, 46, -46, 92, -92, 140, -140, 190, -190].forEach(function (langs) {
              plekken.push([-ey * afstand * zijde + ex * langs,
                             ex * afstand * zijde + ey * langs]);
            });
          });
        });
        spec.verschuif = ladder(spec, plekken);
        labels.voegToe(spec);
      }

      // De wereldlijn van het relais door de gebeurtenis
      svg.appendChild(T.worldline(schaal, {
        beta: beta, x0: evX, t0: evT,
        kleur: 'var(--blauw)', dikte: 1.4, streep: '4 5',
      }));

      // Heen: de vraag, sneller dan het licht
      svg.appendChild(pijl(yAs, xAs, pEvX, pEvY, 'var(--accent)', 3.2));
      labels.blokkeerSchuin({ x1: yAs, y1: xAs, x2: pEvX, y2: pEvY, dikte: 10 });

      // Terug: het antwoord, ogenblikkelijk in het kader van het relais
      svg.appendChild(pijl(pEvX, pEvY, yAs, pTerugY, 'var(--accent)', 3.2));
      labels.blokkeerSchuin({ x1: pEvX, y1: pEvY, x2: yAs, y2: pTerugY, dikte: 10 });

      if (tg.paradox) {
        // Het stuk van de ct-as waarop het antwoord de vraag voorloopt
        svg.appendChild(T.el('line', {
          x1: yAs, y1: pTerugY, x2: yAs, y2: xAs,
          stroke: 'var(--accent)', 'stroke-width': 9,
          opacity: 0.3, 'stroke-linecap': 'butt',
        }));
      }

      // Waar het antwoord binnenkomt
      if (buitenBeeld) {
        const naarBoven = tg.terug > 0;
        svg.appendChild(T.el('polygon', {
          points: [
            yAs + ',' + (pTerugY + (naarBoven ? -9 : 9)),
            (yAs - 8) + ',' + (pTerugY + (naarBoven ? 6 : -6)),
            (yAs + 8) + ',' + (pTerugY + (naarBoven ? 6 : -6)),
          ].join(' '),
          fill: 'var(--kaart)', stroke: 'var(--accent)', 'stroke-width': 2.4,
        }));
      } else {
        svg.appendChild(T.el('circle', {
          cx: yAs, cy: pTerugY, r: 8.5,
          fill: tg.paradox ? 'var(--accent)' : 'var(--kaart)',
          stroke: 'var(--accent)', 'stroke-width': 2.6,
        }));
      }
      labels.blokkeer({ links: yAs - 12, boven: pTerugY - 12, breedte: 24, hoogte: 24 });

      langsPijl(yAs, xAs, pEvX, pEvY,
                'vraag \u2192 ' + F.nl(tg.heenSnelheid, 2) + 'c', 88);
      langsPijl(pEvX, pEvY, yAs, pTerugY, 'antwoord terug', 86);

      const terugTekst = buitenBeeld
        ? 'antwoord op ct = ' + F.nl(tg.terug, 2) + ', buiten beeld'
        : (tg.paradox
          ? 'antwoord al binnen op ct = ' + F.nl(tg.terug, 2)
          : 'antwoord binnen op ct = ' + F.nl(tg.terug, 2));
      // Dit label hoort bij een punt op de ct-as, en is breed. In de onderste
      // helft van het vlak kruist de lichtlijn uit het verleden elke brede
      // strook, dus zijn er maar twee soorten plekken die per hoogte echt vrij
      // liggen: strak tegen de ct-as aan (dat lukt hoe dieper hoe beter, want
      // dan staat de lichtlijn verder weg) of juist vóórbij die lichtlijn
      // (dat lukt vlak bij de as, waar de lijn nog dichtbij loopt). Samen
      // dekken ze het hele vlak.
      const terugGrootte = 15;
      const terugBreed = schatBreedte(terugTekst, terugGrootte);
      const terugSpec = {
        tekst: terugTekst, x: yAs, y: pTerugY + 5,
        grootte: terugGrootte, kleur: 'var(--accent)', gewicht: 700,
        prioriteit: 90, anker: 'end',
      };
      const terugPlekken = [];
      // Hoe ver ligt de lichtlijn van de as op de hoogte van dit tekstvak?
      // De randen van het vak geven elk een afstand; de grootste is bindend.
      function lichtAf(dy) {
        const y = pTerugY + 5 + dy;
        const boven = Math.abs(schaal.vanY(y - terugGrootte * 0.8 - 10));
        const onder = Math.abs(schaal.vanY(y + terugGrootte * 0.25 + 10));
        return schaal.naarX(Math.max(boven, onder)) - yAs;
      }
      [0, -24, 24, -48, 48, -74, 74, -100, 100, -130, 130].forEach(function (dy) {
        const af = lichtAf(dy);
        // Naar de kant waar de gebeurtenis niet ligt heeft het label de meeste
        // kans, want daar staat de pijl niet in de weg.
        const kanten = evX > 0 ? [-1, 1] : [1, -1];
        kanten.forEach(function (kant) {
          if (kant < 0) {
            terugPlekken.push([-16, dy]);                      // tegen de as
            terugPlekken.push([-af - 20, dy]);                 // voorbij de lichtlijn
          } else {
            terugPlekken.push([16 + terugBreed, dy]);
            terugPlekken.push([af + 20 + terugBreed, dy]);
          }
        });
      });
      terugSpec.verschuif = ladder(terugSpec, terugPlekken);
      labels.voegToe(terugSpec);
    }

    // Zonelabels
    labels.voegToe({
      tekst: 'TOEKOMST', x: yAs, y: schaal.naarY(T_GRENS * 0.74),
      grootte: 15, kleur: 'var(--eigentijd)', anker: 'middle', gewicht: 650, prioriteit: 62,
      verschuif: [[0, 0], [70, 0], [-70, 0]],
    });
    labels.voegToe({
      tekst: 'VERLEDEN', x: yAs, y: schaal.naarY(-T_GRENS * 0.74),
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
    const hierSpec = {
      tekst: 'hier en nu', x: yAs + 70, y: xAs - 19,
      grootte: 14, kleur: 'var(--perron)', gewicht: 650, prioriteit: 74,
    };
    hierSpec.verschuif = ladder(hierSpec, [
      [0, 0], [-170, 0], [40, -36], [-210, -36],
      [0, 36], [-170, 36], [40, 60], [-210, 60],
      [130, 0], [-280, 0], [130, -36], [-280, -36],
      [0, -68], [-170, -68], [0, 68], [-170, 68],
    ]);
    labels.voegToe(hierSpec);

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
    if (toonTelegraaf && tg.bruikbaar) {
      kaarten.push(['Antwoord komt aan op', F.nl(tg.terug, 2),
                    tg.paradox ? 'var(--accent)' : 'var(--tekst)']);
    }
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
    if (toonTelegraaf) tekst += telegraafTekst(tg);
    duiding.innerHTML = tekst;
  }

  /** Het verhaal bij de telegraaf, met de getallen van dit moment. */
  function telegraafTekst(tg) {
    const kop = '<h3 style="margin-top:14px">De telegraaf</h3>';
    if (!tg.ruimteachtig) {
      return kop + '<p style="margin:0">Binnen de kegel valt er niets te ' +
        'bewijzen: een gewoon signaal haalt het. <b>Sleep het punt naar buiten ' +
        'de kegel</b>, dan is er een bericht nodig dat sneller gaat dan het ' +
        'licht \u2014 en pas dan komt de tegenspraak boven water.</p>';
    }
    if (!tg.bruikbaar) {
      return kop + '<p style="margin:0">De vraag moet nog w\u00e9l de toekomst in ' +
        'vertrekken. Sleep het punt <b>boven</b> de x-as, naar links of naar ' +
        'rechts, dan verstuur je hem vooruit in de tijd.</p>';
    }
    const nodig = tg.drempel;
    const genoeg = (evX > 0 && beta > nodig) || (evX < 0 && beta < nodig);
    const stap1 =
      '<p style="margin:0 0 8px"><b>1.</b> Je verstuurt de vraag op ct = 0 vanaf ' +
      'x = 0 en hij is er op ct = ' + F.nl(evT, 2) + ' bij x = ' + F.nl(evX, 2) +
      '. Dat is snelheid ' + F.nl(tg.heenSnelheid, 2) + 'c \u2014 verboden, maar ' +
      'stel dat het kon.</p>';
    const stap2 =
      '<p style="margin:0 0 8px"><b>2.</b> Daar staat een relais dat met ' +
      F.nl(beta, 2) + 'c meebeweegt. Het stuurt meteen een antwoord, en voor ' +
      'h\u00e9m gaat dat ogenblikkelijk: langs zijn eigen lijn van gelijktijdigheid. ' +
      'Het perron ziet dat antwoord met ' +
      (Number.isFinite(tg.terugSnelheid) ? F.nl(tg.terugSnelheid, 2) + 'c' : 'oneindige snelheid') +
      ' langs komen.</p>';
    if (!genoeg) {
      return kop + stap1 + stap2 +
        '<p style="margin:0"><b>3.</b> Het antwoord komt binnen op ct = ' +
        F.nl(tg.terug, 2) + ', dus keurig n\u00e1 de vraag. Nog niets aan de hand. ' +
        'Zet het relais sneller dan <b>' + F.nl(Math.abs(nodig), 2) + 'c</b> ' +
        (evX > 0 ? 'naar rechts' : 'naar links') + ' \u2014 of druk op ' +
        '<b>Laat het misgaan</b> \u2014 en de volgorde klapt om.</p>';
    }
    return kop + stap1 + stap2 +
      '<p style="margin:0 0 8px"><b>3.</b> Het antwoord komt binnen op ct = ' +
      F.nl(tg.terug, 2) + '. Dat is <b>' + F.nl(-tg.terug, 2) + ' v\u00f3\u00f3r</b> je de ' +
      'vraag verstuurde. Je leest het antwoord, besluit de vraag niet te sturen, ' +
      'en dan is er geen antwoord om te lezen.</p>' +
      '<p style="margin:0">Aan geen van beide stappen mankeert iets \u2014 behalve dat ' +
      'ze sneller gaan dan het licht. De lichtkegel is dus geen praktische ' +
      'bovengrens maar een voorwaarde voor een samenhangend verhaal: buiten de ' +
      'kegel bestaat er geen volgorde waar iedereen het over eens is, en zonder ' +
      'volgorde geen oorzaak en gevolg.</p>';
  }

  // --- Sleep-interactie ---
  function naarCoord(clientX, clientY) {
    const punt = T.naarViewBox(svg, clientX, clientY, BREEDTE, HOOGTE);
    if (!punt) return null;
    const schaal = maakSchaal();
    return { x: schaal.vanX(punt.x), t: schaal.vanY(punt.y) };
  }

  function verplaats(clientX, clientY) {
    const c = naarCoord(clientX, clientY);
    if (!c) return;
    evX = Math.max(-BEREIK * 0.95, Math.min(BEREIK * 0.95, c.x));
    evT = Math.max(-T_GRENS * 0.95, Math.min(T_GRENS * 0.95, c.t));
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
  const telegraafKnop = paneel.querySelector('#lk-telegraaf');
  const paradoxKnop = paneel.querySelector('#lk-paradox');

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
  telegraafKnop.addEventListener('click', function () {
    toonTelegraaf = !toonTelegraaf;
    telegraafKnop.classList.toggle('aan', toonTelegraaf);
    teken();
  });
  // Zet het punt en het relais in een stand waarin het antwoord echt te vroeg
  // aankomt: ruim buiten de kegel, en het relais halverwege de drempel en 0,9c.
  paradoxKnop.addEventListener('click', function () {
    if (!toonTelegraaf) {
      toonTelegraaf = true;
      telegraafKnop.classList.add('aan');
    }
    if (F.intervalSoort(evT, evX) !== 'ruimteachtig' || evT <= 0.05) {
      evT = 0.8; evX = 2.0;
    }
    // Ligt het punt net buiten de kegel, dan zou het relais bijna de
    // lichtsnelheid moeten halen en dat kan de schuif niet. Dan schuift het
    // punt zelf verder naar buiten, tot een drempel die wel haalbaar is.
    if (Math.abs(evT / evX) > 0.6) evT = Math.abs(evX) * 0.5;
    const drempel = evT / evX;
    const doelBeta = Math.min(0.9, Math.max(-0.9,
      drempel + Math.sign(evX || 1) * (0.9 - Math.abs(drempel)) * 0.6));
    beta = Math.round(doelBeta * 100) / 100;
    schuif.value = String(beta);
    betaW.textContent = F.nl(beta, 2) + 'c';
    teken();
  });

  betaW.textContent = '0,00c';
  teken();
}
