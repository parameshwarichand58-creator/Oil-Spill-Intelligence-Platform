/* OCEAN EYE - Data Provenance Badges
   Adds small colored badges (LIVE / MODEL / SIM / PREDICTED / ARCHIVED)
   to key metrics on the dashboard so judges can see what is real.
*/
(function(){
  'use strict';

  var STYLES = {
    LIVE:      { color: '#00d4aa', label: '\u25CF LIVE',      title: 'Real external API or feed' },
    MODEL:     { color: '#4a9eff', label: '\u25C6 MODEL',     title: 'Output from our AI/algorithm' },
    SIM:       { color: '#ffb142', label: '\u25C7 SIM',       title: 'Simulated for demonstration' },
    PREDICTED: { color: '#ff7f50', label: '\u25CB PREDICTED', title: 'Drift / risk model output' },
    ARCHIVED:  { color: '#5cc9f5', label: '\u25A3 ARCHIVED',  title: 'Historical replay' }
  };

  function makeBadge(kind){
    var s = STYLES[kind] || STYLES.SIM;
    var b = document.createElement('span');
    b.className = 'oceaneye-prov';
    b.setAttribute('data-kind', kind);
    b.title = s.title;
    b.textContent = s.label;
    b.style.cssText = [
      'display:inline-block','margin-left:6px','padding:1px 6px',
      'font-family:"Share Tech Mono",monospace','font-size:9px',
      'letter-spacing:0.08em','border-radius:2px',
      'border:1px solid ' + s.color + '55',
      'color:' + s.color,'background:' + s.color + '12',
      'vertical-align:middle','white-space:nowrap'
    ].join(';');
    return b;
  }

  function alreadyBadged(el){
    if (!el) return true;
    if (el.nextElementSibling && el.nextElementSibling.classList && el.nextElementSibling.classList.contains('oceaneye-prov')) return true;
    if (el.querySelector && el.querySelector('.oceaneye-prov')) return true;
    if (el.previousElementSibling && el.previousElementSibling.classList && el.previousElementSibling.classList.contains('oceaneye-prov')) return true;
    return false;
  }

  function badge(el, kind){
    if (!el || alreadyBadged(el)) return;
    el.appendChild(document.createTextNode(' '));
    el.appendChild(makeBadge(kind));
  }

  // Match a node whose trimmed text equals or contains one of the needles
  function findLabel(needles){
    var all = document.querySelectorAll('div, span, p, h1, h2, h3, h4, label, td, th');
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.closest && el.closest('#oceaneyeRealMapWrap')) continue;
      if (el.id && el.id.indexOf('oceaneye') === 0) continue;
      if (el.querySelector && el.querySelector('.oceaneye-prov')) continue;
      var t = (el.textContent || '').trim().toLowerCase();
      if (!t || t.length > 90) continue;
      for (var j=0;j<needles.length;j++){
        if (t === needles[j] || t.indexOf(needles[j]) === 0){
          return el;
        }
      }
    }
    return null;
  }

  // Label -> provenance mapping
  var MAP = [
    { needles: ['wave height','sea surface temp','wave direction','wave period'], kind: 'LIVE' },
    { needles: ['live weather','wind','humidity'],                              kind: 'LIVE' },
    { needles: ['nasa gibs','modis','aisstream','ai: active'],                  kind: 'LIVE' },
    { needles: ['oil density','spread rate'],                                   kind: 'MODEL' },
    { needles: ['ai confidence','detection confidence'],                        kind: 'MODEL' },
    { needles: ['confidence'],                                                  kind: 'MODEL' },
    { needles: ['predicted drift','drift trajectory','now','+6h','+12h','+24h'],kind: 'PREDICTED' },
    { needles: ['predicted'],                                                   kind: 'PREDICTED' },
    { needles: ['success','uptime'],                                            kind: 'SIM' },
    { needles: ['coverage','aoi coverage'],                                     kind: 'SIM' },
    { needles: ['average response','response time','mttr','mttd'],              kind: 'SIM' },
    { needles: ['ships','vessels'],                                             kind: 'SIM' },
    { needles: ['alerts'],                                                      kind: 'SIM' },
    { needles: ['risk'],                                                        kind: 'MODEL' },
    { needles: ['scenario'],                                                    kind: 'MODEL' },
    { needles: ['attribution'],                                                 kind: 'MODEL' },
    { needles: ['archived','replay'],                                           kind: 'ARCHIVED' }
  ];

  function apply(){
    for (var i=0;i<MAP.length;i++){
      var entry = MAP[i];
      var el = findLabel(entry.needles);
      if (el) badge(el, entry.kind);
    }
  }

  function loop(){
    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(loop, 500); });
  else setTimeout(loop, 500);

  // re-apply when sections are (re)rendered
  setInterval(loop, 2500);

  console.log('[provenance] armed');
})();
