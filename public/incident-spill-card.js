/* OCEAN EYE - Spill Info Card
   Permanent on-map card showing: spill coordinates, area, confidence.
   No need to click anything — always visible.
*/
(function(){
  'use strict';
  var cardEl = null;

  function build(inc, lat, lon){
    var wrap = document.getElementById('oceaneyeRealMapWrap');
    if (!wrap) return;
    var old = document.getElementById('oceaneyeSpillCard');
    if (old) old.parentNode.removeChild(old);

    var det = inc.detection || {};
    var card = document.createElement('div');
    card.id = 'oceaneyeSpillCard';
    card.style.cssText = [
      'position:absolute','left:12px','top:12px','z-index:1000',
      'background:rgba(6,20,32,0.92)',
      'border:1px solid rgba(255,71,87,0.65)','border-radius:4px',
      'font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#cbd5e1','padding:8px 10px','line-height:1.6',
      'box-shadow:0 0 12px rgba(255,71,87,0.20)','max-width:260px'
    ].join(';');

    card.innerHTML =
      '<div style="color:#ff4757;letter-spacing:0.10em;text-transform:uppercase;margin-bottom:4px;">OIL SPILL DETECTED</div>' +
      '<div>Incident: <b style="color:#fff;">' + (inc.id || '-') + '</b></div>' +
      '<div>Location: <b style="color:#fff;">' + lat.toFixed(4) + '° N, ' + lon.toFixed(4) + '° E</b></div>' +
      '<div>Spill Area: <b style="color:#ff4757;">' + (det.area_km2 || '-') + ' km²</b></div>' +
      '<div>Confidence: <b style="color:#00d4aa;">' + (det.confidence || '-') + '%</b></div>' +
      '<div style="opacity:0.6;font-size:9px;margin-top:4px;">Bay of Bengal · AOI-1</div>';

    wrap.appendChild(card);
    cardEl = card;
  }

  function clear(){
    if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
    cardEl = null;
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(inc){
      if (!inc){ clear(); return; }
      if (inc.status === 'DETECTED' && inc.detection && inc.detection.lat !== null){
        // wait a bit for the map wrap to exist
        var tries = 0;
        var t = setInterval(function(){
          tries++;
          if (document.getElementById('oceaneyeRealMapWrap')){
            clearInterval(t);
            build(inc, inc.detection.lat, inc.detection.lon);
          }
          if (tries > 20) clearInterval(t);
        }, 200);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[incident-spill-card] armed');
})();
