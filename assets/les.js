/* Lesbord — tekent één pagina van een les (les.json) als vel van 1600 × 900.
   Het bord (bord.html) legt dit vel onder de inkt en schaalt het mee.
   Alle bloktypes staan in LESFORMAAT.md. Een onbekend blok wordt als rode melding getoond,
   zodat een fout in de les meteen zichtbaar is. */
var Les = (function(){
'use strict';

var W = 1600, H = 900;
var KL_VUL = '#f08a3c', KL_LEEG = '#ffffff', KL_LIJN = '#173141';

var FASES = {
  lesdoel:     'Lesdoel',
  voorkennis:  'Wat weet je al?',
  instructie:  'Instructie',
  voordoen:    'Ik doe het voor',
  samen:       'Samen oefenen',
  check:       'Check',
  zelfstandig: 'Zelf aan het werk',
  afsluiting:  'Afsluiting'
};

/* ---------- tekst ---------- */
function esc(s){
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function breuk(t, n){ return '<span class="br"><span>' + t + '</span><span>' + n + '</span></span>'; }
/* eenvoudige opmaak: **vet**, ==oranje==, __onderstreept__, [[3/5]] breuk, nieuwe regel = \n */
function opmaak(s){
  return esc(s)
    .replace(/\[\[\s*([^\]\/]+?)\s*\/\s*([^\]]+?)\s*\]\]/g, function(_, t, n){ return breuk(t, n); })
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/==(.+?)==/g, '<span class="hl">$1</span>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\n/g, '<br>');
}
function getal(v, std){ var n = Number(v); return isFinite(n) && n > 0 ? n : std; }
function lijst(v){ return Object.prototype.toString.call(v) === '[object Array]' ? v : []; }
function maat(b){
  var s = [];
  if(b.breedte) s.push('width:' + getal(b.breedte, 100) + 'px;flex:0 0 auto');
  if(b.hoogte) s.push('height:' + getal(b.hoogte, 100) + 'px;flex:0 0 auto');
  return s.length ? ' style="' + s.join(';') + '"' : '';
}
function fout(t){ return '<div class="lfout">' + esc(t) + '</div>'; }

/* ---------- plaatjes (svg) ---------- */
function svg(w, h, binnen){
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' + binnen + '</svg>';
}
function vulling(gekleurd, i){ return gekleurd.indexOf(i) >= 0 ? KL_VUL : KL_LEEG; }
function delenLijst(n, v){
  var uit = [], i;
  for(i = 0; i < n; i++) uit.push(v && isFinite(Number(v[i])) && Number(v[i]) > 0 ? Number(v[i]) : 1);
  return uit;
}
function strook(n, gekleurd, w, h, verh){
  var s = 4, bw = w - s, x = s/2, som = 0, i, uit = '', d = delenLijst(n, verh);
  for(i = 0; i < n; i++) som += d[i];
  for(i = 0; i < n; i++){
    var dw = bw * d[i] / som;
    uit += '<rect x="' + x.toFixed(1) + '" y="' + (s/2) + '" width="' + dw.toFixed(1) + '" height="' + (h - s) +
           '" fill="' + vulling(gekleurd, i) + '" stroke="' + KL_LIJN + '" stroke-width="' + s + '" stroke-linejoin="round"/>';
    x += dw;
  }
  return svg(w, h, uit);
}
function cirkel(n, gekleurd, r, hoeken){
  var s = 4, c = r + s, uit = '', a = -90, i, som = 0, d = delenLijst(n, hoeken);
  for(i = 0; i < n; i++) som += d[i];
  function pt(g){ var rad = g * Math.PI / 180; return (c + r*Math.cos(rad)).toFixed(2) + ' ' + (c + r*Math.sin(rad)).toFixed(2); }
  if(n === 1){
    uit += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="' + vulling(gekleurd, 0) + '"/>';
  } else {
    for(i = 0; i < n; i++){
      var hoek = 360 * d[i] / som, b = a + hoek;
      uit += '<path d="M' + c + ' ' + c + ' L' + pt(a) + ' A' + r + ' ' + r + ' 0 ' + (hoek > 180 ? 1 : 0) + ' 1 ' + pt(b) +
             ' Z" fill="' + vulling(gekleurd, i) + '" stroke="' + KL_LIJN + '" stroke-width="' + s + '" stroke-linejoin="round"/>';
      a = b;
    }
  }
  uit += '<circle cx="' + c + '" cy="' + c + '" r="' + r + '" fill="none" stroke="' + KL_LIJN + '" stroke-width="' + s + '"/>';
  return svg(2*c, 2*c, uit);
}
function rechthoek(rijen, kol, gekleurd, cel){
  var s = 4, uit = '', i = 0, x, y;
  for(y = 0; y < rijen; y++) for(x = 0; x < kol; x++, i++){
    uit += '<rect x="' + (s/2 + x*cel) + '" y="' + (s/2 + y*cel) + '" width="' + cel + '" height="' + cel +
           '" fill="' + vulling(gekleurd, i) + '" stroke="' + KL_LIJN + '" stroke-width="' + s + '"/>';
  }
  return svg(kol*cel + s, rijen*cel + s, uit);
}
function onder(b){ return b.onderschrift ? '<div class="londer">' + opmaak(b.onderschrift) + '</div>' : ''; }
/* gekleurde stukjes: in les.json tel je vanaf 1, hier vanaf 0 */
function nul(v){ return lijst(v).map(function(n){ return Number(n) - 1; }); }

/* getallen vanaf 10 000 met een smalle spatie per drie cijfers: 10 000, 25 300 */
function getalTekst(v){
  var s = String(Math.round(Number(v) * 1000) / 1000);
  return Math.abs(Number(v)) >= 10000 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
}
/* getallenlijn van "van" tot "tot" met een streepje per "stap"; begin, midden en eind zijn langer */
function getallenlijn(b){
  var van = Number(b.van), tot = Number(b.tot);
  if(!isFinite(van) || !isFinite(tot) || tot <= van) throw new Error('"tot" moet groter zijn dan "van"');
  var stap = getal(b.stap, (tot - van) / 10), n = Math.round((tot - van) / stap);
  if(n > 100) throw new Error('te veel streepjes (' + n + ')');
  var pijlen = lijst(b.pijlen), w = getal(b.breedte, 1200), m = 60, lw = w - 2*m;
  var y = pijlen.length ? 150 : 40, h = y + 90, uit = '', i;
  function x(v){ return m + lw * (v - van) / (tot - van); }
  uit += '<line x1="' + m + '" y1="' + y + '" x2="' + (w - m) + '" y2="' + y + '" stroke="' + KL_LIJN + '" stroke-width="4" stroke-linecap="round"/>';
  for(i = 0; i <= n; i++){
    var lang = i === 0 || i === n || (n % 2 === 0 && i === n/2), d = lang ? 26 : 15, tx = x(van + i*stap).toFixed(1);
    uit += '<line x1="' + tx + '" y1="' + (y - d) + '" x2="' + tx + '" y2="' + (y + d) + '" stroke="' + KL_LIJN + '" stroke-width="' + (lang ? 4 : 3) + '"/>';
  }
  var labels = b.labels === 'alle' ? null : (Object.prototype.toString.call(b.labels) === '[object Array]' ? b.labels : [van, tot]);
  if(!labels){ labels = []; for(i = 0; i <= n; i++) labels.push(van + i*stap); }
  labels.forEach(function(v){
    v = Number(v);
    if(!isFinite(v) || v < van || v > tot) return;
    uit += '<text x="' + x(v).toFixed(1) + '" y="' + (y + 66) + '" text-anchor="middle" font-size="32" font-weight="600" fill="' + KL_LIJN + '">' + getalTekst(v) + '</text>';
  });
  pijlen.forEach(function(p){
    var op = Number(p && typeof p === 'object' ? p.op : p);
    if(!isFinite(op) || op < van || op > tot) return;
    var t = p && typeof p === 'object' && p.tekst !== undefined ? String(p.tekst) : getalTekst(op);
    var px = x(op), bw = Math.max(96, t.length * 32 + 48), bx = Math.min(Math.max(px - bw/2, 0), w - bw);
    uit += '<rect x="' + bx.toFixed(1) + '" y="6" width="' + bw + '" height="88" rx="16" fill="' + KL_VUL + '"/>' +
           '<path d="M' + (px - 16).toFixed(1) + ' 92 L' + (px + 16).toFixed(1) + ' 92 L' + px.toFixed(1) + ' ' + (y - 30) + ' Z" fill="' + KL_VUL + '"/>' +
           '<text x="' + (bx + bw/2).toFixed(1) + '" y="70" text-anchor="middle" font-size="56" font-weight="700" fill="#fff">' + esc(t) + '</text>';
  });
  return svg(w, h, uit);
}

/* ---------- bloktypes ---------- */
var context = null;   /* {les, antwoord:boolean} tijdens het tekenen */

var BLOK = {
  doel: function(b){
    return '<div class="ldoel"><p class="lgaan">We gaan</p><h1>' + opmaak(b.tekst || context.les.lesdoel || '') + '</h1></div>';
  },
  succes: function(b){
    var t = b.tekst || context.les.succescriterium || '';
    return '<div class="lsucces"><i>&#10003;</i><div>Het lukt als ik ' + opmaak(t) + '</div></div>';
  },
  tekst: function(b){
    var g = {klein:1, groot:1, kop:1}[b.grootte] ? ' ' + b.grootte : '';
    return '<p class="lt' + g + (b.midden ? ' midden' : '') + '">' + opmaak(b.tekst) + '</p>';
  },
  som: function(b){
    var g = {klein:1, groot:1}[b.grootte] ? ' ' + b.grootte : '';
    return '<p class="lsom' + g + '">' + opmaak(b.tekst) + '</p>';
  },
  label: function(b){
    var s = {goed:'goed', fout:'fout'}[b.soort] || 'neutraal';
    var teken = s === 'goed' ? '&#10003;&nbsp; ' : (s === 'fout' ? '&#10007;&nbsp; ' : '');
    return '<div class="lpil ' + s + '">' + teken + opmaak(b.tekst) + '</div>';
  },
  stappen: function(b){
    var items = lijst(b.stappen).map(function(st, i){
      var inh = typeof st === 'string' ? '<span>' + opmaak(st) + '</span>'
        : '<span>' + (st.kop ? '<strong>' + opmaak(st.kop) + '</strong>' : '') + opmaak(st.tekst || '') +
          (st.klein ? '<small>' + opmaak(st.klein) + '</small>' : '') + '</span>';
      return '<div class="lstap"><b>' + (i + 1) + '</b>' + inh + '</div>';
    }).join('');
    /* stap voor stap (voordoen, samen, check): eerst alleen de nummers, elke tik onthult de volgende stap.
       "tonen" in les.json gaat voor: "alles", "stap" of "dicht" (hele plan achter een kaart) */
    var tonen = {alles:1, stap:1, dicht:1}[b.tonen] ? b.tonen
      : ({voordoen:1, samen:1, check:1}[context.fase] ? 'stap' : 'alles');
    var kop = b.titel || 'Stappenplan';
    if(tonen === 'alles') return '<div class="lstappen"' + maat(b) + '>' + (b.titel ? '<h3>' + opmaak(b.titel) + '</h3>' : '') + items + '</div>';
    context.stappen = true;
    if(tonen === 'stap')
      return '<div class="lstappen stapsgewijs"' + maat(b) + '><h3 class="lstapkop">' + opmaak(kop) + '</h3>' +
             items.replace(/class="lstap"/g, 'class="lstap nog"') + '</div>';
    return '<div class="lstappen kan-dicht dicht"' + maat(b) + '>' +
      '<h3 class="lstapkop">' + opmaak(kop) + '</h3>' + items +
      '<div class="lstapknop"><span>' + opmaak(kop) + '</span><small>tik om te tonen</small></div></div>';
  },
  stippen: function(b){
    var r = getal(b.rijen, 4), k = getal(b.kolommen, 5), uit = '', i, j;
    for(i = 0; i < r; i++) for(j = 0; j < k; j++) uit += '<i' + (b.afwisselen !== false && i % 2 ? ' class="licht"' : '') + '></i>';
    return '<div class="lstippen" style="grid-template-columns:repeat(' + k + ',62px)">' + uit + '</div>';
  },
  familie: function(b){
    var d = lijst(b.delen);
    return '<div class="lfam"><span class="lbol top">' + esc(b.totaal) + '</span><div>' +
           '<span class="lbol">' + esc(d[0]) + '</span><span class="lbol">' + esc(d[1]) + '</span></div></div>';
  },
  breukdelen: function(b){
    return '<div class="lbreukdelen"><span class="groot br"><span class="hl">' + esc(b.teller) + '</span><span>' + esc(b.noemer) + '</span></span>' +
      '<div class="r r1">&larr; <b class="hl">teller</b>: ' + opmaak(b.tellerTekst || 'zoveel stukjes neem je') + '</div>' +
      '<div class="r r2">&larr; breukstreep</div>' +
      '<div class="r r3">&larr; <b>noemer</b>: ' + opmaak(b.noemerTekst || 'in zoveel __gelijke__ stukjes is het geheel verdeeld') + '</div></div>';
  },
  strook: function(b){
    var n = getal(b.delen, 4);
    return '<div class="lbeeld">' + strook(n, nul(b.gekleurd), getal(b.breedte, 600), getal(b.hoogte, 110), b.verhoudingen) + onder(b) + '</div>';
  },
  cirkel: function(b){
    var n = getal(b.delen, 4);
    return '<div class="lbeeld">' + cirkel(n, nul(b.gekleurd), getal(b.straal, 130), b.verhoudingen) + onder(b) + '</div>';
  },
  rechthoek: function(b){
    return '<div class="lbeeld">' + rechthoek(getal(b.rijen, 2), getal(b.kolommen, 3), nul(b.gekleurd), getal(b.vak, 110)) + onder(b) + '</div>';
  },
  getallenlijn: function(b){
    return '<div class="lbeeld">' + getallenlijn(b) + onder(b) + '</div>';
  },
  afbeelding: function(b){
    if(!b.bron || /^[a-z]+:|^\/|\.\./i.test(b.bron)) return fout('afbeelding: "bron" moet een bestandsnaam in de lesmap zijn');
    var h = b.hoogte ? ' style="height:' + getal(b.hoogte, 300) + 'px;flex:0 0 auto"' : '';
    return '<div class="lafb"' + h + '><img src="lessen/' + esc(context.les.id) + '/' + esc(b.bron) + '" alt="' + esc(b.alt || '') + '"></div>';
  },
  schrijfvak: function(b){
    var soort = {lijnen:'lijnen', leeg:'leeg'}[b.lijnen] || 'hokjes';
    return '<div class="lvak ' + soort + (b.breedte || b.hoogte ? ' vast' : '') + '"' + maat(b) + '>' +
           (b.label ? '<span>' + opmaak(b.label) + '</span>' : '') + '</div>';
  },
  breukvak: function(b){
    var lab = b.namen ? ['teller', 'noemer'] : ['breuk', ''];
    return '<div class="lbreukvak">' +
      '<div class="lvak hokjes"><span>' + lab[0] + '</span></div><div class="streep"></div>' +
      '<div class="lvak hokjes">' + (lab[1] ? '<span>' + lab[1] + '</span>' : '') + '</div></div>';
  },
  keuzes: function(b){
    var opties = lijst(b.opties), k = getal(b.kolommen, opties.length <= 3 ? opties.length : 2);
    var uit = opties.map(function(o, i){
      return '<div class="lkeuze' + (o.goed ? ' goed' : '') + '"><b>' + String.fromCharCode(65 + i) + '</b>' +
             '<span class="lktekst">' + opmaak(o.tekst) + '</span>' +
             (o.uitleg ? '<span class="lkuitleg">' + opmaak(o.uitleg) + '</span>' : '') + '</div>';
    }).join('');
    if(opties.some(function(o){ return o.goed || o.uitleg; })) context.antwoord = true;
    return '<div class="lkeuzes" style="grid-template-columns:repeat(' + k + ',1fr)">' + uit + '</div>';
  },
  antwoord: function(b){
    context.antwoord = true;
    var inh = b.tekst ? '<p class="lt">' + opmaak(b.tekst) + '</p>' : '';
    inh += blokken(b.blokken);
    return '<div class="antwoord"><small>Antwoord</small>' + inh + '</div>';
  },
  kolommen: function(b){
    var k = lijst(b.kolommen), br = lijst(b.breedtes);
    return '<div class="lrij">' + k.map(function(inh, i){
      var f = isFinite(Number(br[i])) && Number(br[i]) > 0 ? Number(br[i]) : 1;
      return '<div class="lkol" style="flex:' + f + ' 1 0">' + blokken(inh) + '</div>';
    }).join('') + '</div>';
  },
  naast: function(b){
    return '<div class="lnaast' + (b.vul ? ' vul' : '') + '">' + blokken(b.blokken) + '</div>';
  },
  raster: function(b){
    var k = getal(b.kolommen, 2);
    return '<div class="lraster" style="grid-template-columns:repeat(' + k + ',1fr)">' + blokken(b.blokken) + '</div>';
  },
  html: function(b){ return String(b.html || ''); }
};

function blok(b){
  if(!b || typeof b !== 'object') return fout('leeg blok');
  var f = BLOK[b.type];
  if(!f) return fout('onbekend bloktype: "' + b.type + '"');
  try{ return f(b); }catch(e){ return fout(b.type + ': ' + e.message); }
}
function blokken(l){ return lijst(l).map(blok).join(''); }

/* label van de fase; samen oefenen wordt genummerd als er meer dan één is */
function faseLabel(les, i){
  var p = les.paginas[i];
  if(p.label) return p.label;
  var naam = FASES[p.fase] || '';
  if(p.fase === 'samen'){
    var alle = [], j;
    for(j = 0; j < les.paginas.length; j++) if(les.paginas[j].fase === 'samen' && !les.paginas[j].label) alle.push(j);
    if(alle.length > 1) naam += ' · ' + (alle.indexOf(i) + 1);
  }
  return naam;
}

/* geeft {html, antwoord, notitie} voor pagina i */
function pagina(les, i){
  var p = les.paginas[i];
  context = {les: les, antwoord: false, stappen: false, fase: p.fase};
  var kop = '';
  var label = faseLabel(les, i);
  if(label) kop += '<span class="fase f-' + esc(p.fase) + '">' + esc(label) + '</span>';
  if(p.titel) kop += '<h2>' + opmaak(p.titel) + '</h2>';
  if(p.opdracht) kop += '<p class="lopdracht">' + opmaak(p.opdracht) + '</p>';
  var hoek = les.lesdoelInHoek && p.fase !== 'lesdoel' && les.lesdoel
    ? '<div class="lhoekdoel">' + opmaak(les.lesdoel) + '</div>' : '';
  var html = '<div class="lb">' + hoek + (kop ? '<div class="lkop">' + kop + '</div>' : '') + blokken(p.blokken) + '</div>';
  var uit = {html: html, antwoord: context.antwoord, stappen: context.stappen, notitie: p.notitie ? String(p.notitie) : ''};
  context = null;
  return uit;
}

/* vel schalen en centreren; hokjes en lijnen terugrekenen naar de maat van de schriften */
function schaal(laag, vak, maten){
  var b = laag.firstElementChild;
  if(!b || !b.classList.contains('lb')) return;
  var s = Math.min(vak.width / W, vak.height / H);
  b.style.transform = 'translate(' + ((vak.width - W*s)/2) + 'px,' + ((vak.height - H*s)/2) + 'px) scale(' + s + ')';
  var m = maten, k = m.schaal / s;
  b.style.setProperty('--lhokB', (m.hokB*k) + 'px');
  b.style.setProperty('--lhokH', (m.hokH*k) + 'px');
  b.style.setProperty('--lhokM', (m.hokH*k/2) + 'px');
  b.style.setProperty('--ll1', (m.boven*k) + 'px');
  b.style.setProperty('--ll2', ((m.boven + m.romp)*k) + 'px');
  b.style.setProperty('--ll3', ((m.boven + m.romp + m.onder)*k) + 'px');
  b.style.setProperty('--llp', ((m.boven + m.romp + m.onder + m.wit)*k) + 'px');
  b.style.setProperty('--lpx', (1/s) + 'px');
  laag.classList.toggle('hulp', m.hokStijl === 'hulp');
  laag.classList.toggle('zone', m.hokStijl === 'zone');
  /* past de inhoud niet op het vel? rode rand, en een vlag voor tools/schermafdruk.py */
  var over = b.scrollHeight > H + 2 || b.scrollWidth > W + 2;
  b.classList.toggle('overloop', over);
  return over;
}

/* ---------- stappenplan stap voor stap ---------- */
function plannen(laag){ return laag.querySelectorAll('.lstappen.stapsgewijs, .lstappen.kan-dicht'); }
function binnen(el, x, y){
  var r = el.getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}
/* volgende stap van één plan; true als er iets bij kwam */
function onthul(k){
  if(k.classList.contains('kan-dicht')){
    if(!k.classList.contains('dicht')) return false;
    k.classList.remove('dicht'); return true;
  }
  var nog = k.querySelector('.lstap.nog');
  if(!nog) return false;
  nog.classList.remove('nog'); return true;
}
function sluit(k){
  if(k.classList.contains('kan-dicht')) k.classList.add('dicht');
  var s = k.querySelectorAll('.lstap'), i;
  if(k.classList.contains('stapsgewijs')) for(i = 0; i < s.length; i++) s[i].classList.add('nog');
}
/* tik op het bord: op de kop = weer dicht, ergens anders op het plan = volgende stap. true als het een plan raakte */
function tik(laag, x, y){
  var l = plannen(laag), i;
  for(i = 0; i < l.length; i++){
    var k = l[i], kop = k.querySelector('.lstapkop');
    if(!binnen(k, x, y)) continue;
    var dicht = k.classList.contains('dicht');
    if(!dicht && kop && binnen(kop, x, y)) sluit(k);
    else onthul(k);
    return true;
  }
  return false;
}
/* volgende stap op deze pagina (pijltje, spatie, presenter, toets S); false = alles staat er al */
function volgendeStap(laag){
  var l = plannen(laag), i;
  for(i = 0; i < l.length; i++) if(onthul(l[i])) return true;
  return false;
}
/* toets S: volgende stap, en als alles er staat weer van voren af aan */
function wisselStappen(laag){
  if(volgendeStap(laag)) return;
  var l = plannen(laag), i;
  for(i = 0; i < l.length; i++) sluit(l[i]);
}
function allesTonen(laag){ while(volgendeStap(laag)){} }

return {pagina: pagina, schaal: schaal, tik: tik, volgendeStap: volgendeStap, wisselStappen: wisselStappen,
        allesTonen: allesTonen, FASES: FASES, opmaak: opmaak};
})();
