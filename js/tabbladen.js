// tabbladen.js — verdeelt de zijkolom van een module over tabbladen.
//
// Een module zet zijn panelen gewoon onder elkaar in de zijkolom. Bij de
// zwaarste modules werd dat een kolom van ruim twee schermen hoog, met de
// vragen onderaan en de bediening uit beeld zodra je daarheen schoof. Hier
// worden die panelen op soort gesorteerd en per soort op een eigen tabblad
// gezet. De module merkt daar niets van: hij houdt zijn eigen verwijzingen
// naar de panelen en blijft ze bijwerken, ook als ze niet in beeld staan.
//
// Wat samen in beeld past blijft samen. Tabbladen zijn er om scrollen te
// voorkomen, niet om dingen te verstoppen die er gewoon naast kunnen staan.

const VOLGORDE = ['Bediening', 'Route', 'Getallen', 'Vragen', 'Afleiding', 'Uitleg'];
const TUSSENRUIMTE = 10;   // gelijk aan de gap van de kolom in thema.css
const BALKHOOGTE = 64;     // de tabbalk zelf, met zijn rand en de ruimte eronder

/** Bij welk tabblad hoort dit paneel? Een module kan het zelf zeggen met
 *  data-tab; anders volgt het uit wat erin zit. */
function soortVan(kind) {
  if (kind.dataset && kind.dataset.tab) return kind.dataset.tab;
  if (kind.classList.contains('uitleg') || kind.classList.contains('bron')) return 'Uitleg';
  if (kind.querySelector('.formules, .formule')) {
    const kop = kind.querySelector('h3');
    return kop && /^vragen/i.test(kop.textContent.trim()) ? 'Vragen' : 'Afleiding';
  }
  if (kind.querySelector('input, button, select')) return 'Bediening';
  return 'Getallen';
}

/**
 * Zet de zijkolom van de zojuist getekende module om in tabbladen.
 * voorkeur is de naam van het tabblad dat open moet staan als het bestaat;
 * opKeuze(naam) wordt aangeroepen zodra de gebruiker een ander tabblad kiest.
 */
export function maakTabbladen(doel, voorkeur, opKeuze) {
  const kolom = doel.querySelector('.zijkolom');
  if (!kolom) return null;
  const uitleg = doel.querySelector('.uitleg');

  // Eerst meten, in de oude opstelling: daarna staan de panelen deels verborgen
  const stukken = [];
  if (uitleg) {
    uitleg.open = true;
    stukken.push({ kind: uitleg, soort: 'Uitleg', hoogte: 0 });
  }
  Array.prototype.forEach.call(kolom.children, function (kind) {
    stukken.push({
      kind: kind, soort: soortVan(kind),
      hoogte: kind.getBoundingClientRect().height,
    });
  });

  const hoogteVan = {};
  stukken.forEach(function (s) {
    hoogteVan[s.soort] = (hoogteVan[s.soort] || 0) + s.hoogte + TUSSENRUIMTE;
  });
  const beschikbaar = doel.clientHeight - BALKHOOGTE;

  // Samenvoegen wat samen past. Alles behalve de uitleg op één blad als dat
  // kan; anders in elk geval de getallen bij de bediening, zodat je ze ziet
  // veranderen terwijl je schuift.
  const inhoud = VOLGORDE.filter(function (n) { return n !== 'Uitleg' && hoogteVan[n]; });
  const naarBlad = {};
  inhoud.forEach(function (n) { naarBlad[n] = n; });
  const totaal = inhoud.reduce(function (som, n) { return som + hoogteVan[n]; }, 0);
  if (inhoud.length > 1 && totaal <= beschikbaar) {
    inhoud.forEach(function (n) { naarBlad[n] = inhoud[0]; });
  } else if (hoogteVan.Bediening && hoogteVan.Getallen &&
             hoogteVan.Bediening + hoogteVan.Getallen <= beschikbaar) {
    naarBlad.Getallen = 'Bediening';
  }
  naarBlad.Uitleg = 'Uitleg';

  const namen = VOLGORDE.filter(function (n) {
    return stukken.some(function (s) { return naarBlad[s.soort] === n; });
  });
  if (namen.length < 2) return null;   // niets te verdelen

  // De balk met de tabbladen, en per tabblad een vlak dat zelf kan schuiven
  const balk = document.createElement('div');
  balk.className = 'tabbalk';
  balk.setAttribute('role', 'tablist');
  const vlakken = {}, knoppen = {};
  namen.forEach(function (naam) {
    const knop = document.createElement('button');
    knop.type = 'button';
    knop.textContent = naam;
    knop.setAttribute('role', 'tab');
    balk.appendChild(knop);
    knoppen[naam] = knop;
    const vlak = document.createElement('div');
    vlak.className = 'tabvlak';
    vlak.setAttribute('role', 'tabpanel');
    vlakken[naam] = vlak;
  });
  // Verhuizen in de oorspronkelijke volgorde, zodat samengevoegde panelen
  // onder elkaar staan zoals de module ze bedoelde
  stukken.forEach(function (s) { vlakken[naarBlad[s.soort]].appendChild(s.kind); });
  kolom.classList.add('met-tabs');
  kolom.appendChild(balk);
  namen.forEach(function (naam) { kolom.appendChild(vlakken[naam]); });

  function kies(naam) {
    namen.forEach(function (n) {
      const aan = n === naam;
      vlakken[n].hidden = !aan;
      knoppen[n].classList.toggle('aan', aan);
      knoppen[n].setAttribute('aria-selected', aan ? 'true' : 'false');
    });
  }
  namen.forEach(function (naam) {
    knoppen[naam].addEventListener('click', function () {
      kies(naam);
      if (opKeuze) opKeuze(naam);
    });
  });
  kies(namen.indexOf(voorkeur) >= 0 ? voorkeur : namen[0]);
  return { namen: namen, kies: kies };
}
