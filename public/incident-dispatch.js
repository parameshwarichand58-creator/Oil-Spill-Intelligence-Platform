/* OCEAN EYE - Response / Dispatch workflow
   When the Review Queue decision = APPROVE, a dispatch entry is created
   and shown on the Dispatch section. Also updates the badge to "RESPONSE DISPATCHED".
*/
(function(){
  'use strict';
  var lastDispatchedId = null;

  function isVisible(el){
    return el && el.offsetParent !== null;
  }

  function isOnDispatchSection(){
    var heads = document.querySelectorAll('h1,h2,h3,h4');
    for (var i=0;i<heads.length;i++){
      var t = (heads[i].textContent || '').trim().toLowerCase();
      if (isVisible(heads[i]) && (t.indexOf('dispatch') >= 0 || t.indexOf('response') >= 0)){
        return true;
      }
    }
    return false;
  }

  function nearestUnit(lat, lon){
    // Simple "nearest coast station" pick based on quadrant — deterministic per incident id
    var units = [
      { name: 'Coast Guard Station — Paradip',  region: 'Odisha',       lat: 20.31, lon: 86.61, eta: '2h 15m' },
      { name: 'Coast Guard Station — Chennai',  region: 'Tamil Nadu',   lat: 13.08, lon: 80.27, eta: '3h 40m' },
      { name: 'Coast Guard Station — Vizag',    region: 'Andhra',       lat: 17.68, lon: 83.21, eta: '4h 05m' },
      { name: 'Coast Guard Station — Kolkata',  region: 'West Bengal',  lat: 22.57, lon: 88.36, eta: '1h 55m' }
    ];
    var best = units[0], bestD = Infinity;
    for (var i=0;i<units.length;i++){
      var d = Math.sqrt(Math.pow(units[i].lat - lat,2) + Math.pow(units[i].lon - lon,2));
      if (d < bestD){ bestD = d; best = units[i]; }
    }
    return best;
  }

  function buildDispatchCard(inc){
    var det = inc.detection || {};
    var resp = inc.response || {};
    var unit = resp.unit || nearestUnit(det.lat||0, det.lon||0);

    var card = document.createElement('div');
    card.id = 'oceaneyeDispatchCard';
    card.setAttribute('data-incident', inc.id);
    card.style.cssText = [
      'margin:10px 0','padding:12px 14px',
      'background:rgba(0,212,170,0.06)',
      'border:1px solid rgba(0,212,170,0.5)',
      'border-left:4px solid #00d4aa','border-radius:4px',
      'font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#cbd5e1','line-height:1.7'
    ].join(';');

    card.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span style="color:#00d4aa;letter-spacing:0.10em;text-transform:uppercase;">\u25C9 RESPONSE DISPATCHED \u2014 ' + inc.id + '</span>' +
        '<span style="opacity:0.7;">' + new Date().toLocaleTimeString() + '</span>' +
      '</div>' +
      '<div><b>Nearest unit:</b> ' + unit.name + ' \u00B7 ' + unit.region + '</div>' +
      '<div><b>Coordinates:</b> ' + (det.lat||0).toFixed(4) + ', ' + (det.lon||0).toFixed(4) +
        ' \u00B7 <b>Area:</b> ' + (det.area_km2||'-') + ' km\u00B2</div>' +
      '<div><b>Cause:</b> ' + ((inc.cause && inc.cause.icon) || '') + ' ' + ((inc.cause && inc.cause.scenario) || 'Analyzing') +
        ' \u00B7 <b>Confidence:</b> ' + (det.confidence||'-') + '%</div>' +
      '<div><b>ETA:</b> ' + unit.eta + ' \u00B7 <b>Status:</b> <span style="color:#ffb142;">EN ROUTE</span></div>' +
      '<div style="margin-top:6px;padding-top:6px;border-top:1px dashed rgba(92,114,134,0.35);">' +
        '<b>Containment plan:</b> Boom deployment + skimmer dispatch \u00B7 Fisheries advisory issued \u00B7 Debris recovery on standby' +
      '</div>' +
      '<div style="display:flex;gap:6px;margin-top:8px;">' +
        '<button class="oeDispBtn" data-act="ACK"   style="flex:1;padding:6px 8px;background:rgba(0,212,170,0.15);border:1px solid #00d4aa;color:#00d4aa;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.08em;">ACKNOWLEDGE</button>' +
        '<button class="oeDispBtn" data-act="CONTAIN" style="flex:1;padding:6px 8px;background:rgba(255,177,66,0.15);border:1px solid #ffb142;color:#ffb142;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.08em;">CONTAINMENT STARTED</button>' +
        '<button class="oeDispBtn" data-act="CLOSE"  style="flex:1;padding:6px 8px;background:rgba(92,114,134,0.15);border:1px solid #5c7286;color:#5c7286;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.08em;">CLOSE INCIDENT</button>' +
      '</div>' +
      '<div class="oeDispStatus" style="margin-top:6px;font-size:10px;opacity:0.85;"></div>';

    var btns = card.querySelectorAll('.oeDispBtn');
    for (var i=0;i<btns.length;i++){
      btns[i].onclick = (function(btn){
        return function(){
          var act = btn.getAttribute('data-act');
          if (window.OceanEye && window.OceanEye.incident){
            window.OceanEye.incident.update({
              response: Object.assign({}, inc.response || {}, {
                status: act, at: new Date().toISOString()
              })
            });
          }
          var st = card.querySelector('.oeDispStatus');
          if (st) st.textContent = 'Status: ' + act + ' \u00B7 ' + new Date().toLocaleTimeString();
          console.log('[dispatch]', act, 'for', inc.id);
        };
      })(btns[i]);
    }

    return card;
  }

  function findDispatchContainer(){
    // Try explicit selectors first
    var cands = ['#dispatchList','#dispatches','.dispatch-list','.response-list','#responseList','[data-dispatch-list]'];
    for (var i=0;i<cands.length;i++){
      var el = document.querySelector(cands[i]);
      if (el && isVisible(el)) return el;
    }
    // Search for a visible heading "Dispatch" or "Response" and use its nearest container
    var heads = document.querySelectorAll('h1,h2,h3,h4');
    for (var j=0;j<heads.length;j++){
      var h = heads[j];
      if (!isVisible(h)) continue;
      var t = (h.textContent || '').toLowerCase();
      if (t.indexOf('dispatch') >= 0 || t.indexOf('response') >= 0){
        var sec = h.closest('section') || h.parentElement;
        if (sec) return sec;
      }
    }
    return null;
  }

  function renderOnDispatch(inc){
    if (!isOnDispatchSection()) return;
    var container = findDispatchContainer();
    if (!container) return;

    // remove old card for this incident id, then re-insert
    var old = document.querySelector('#oceaneyeDispatchCard');
    if (old) old.parentNode.removeChild(old);

    var card = buildDispatchCard(inc);
    container.insertBefore(card, container.firstChild);
    console.log('[dispatch] card rendered for', inc.id);
  }

  function clearOnNonDispatch(){
    if (isOnDispatchSection()) return;
    var card = document.getElementById('oceaneyeDispatchCard');
    if (card) card.parentNode.removeChild(card);
  }

  function updateBadgeForDispatch(inc){
    var badge = document.getElementById('oceaneyeIncidentBadge');
    if (!badge) return;
    if (inc.response && inc.response.dispatched){
      badge.style.borderColor = 'rgba(0,212,170,0.65)';
      badge.style.color = '#00d4aa';
      badge.innerHTML = '<span style="opacity:0.6">INCIDENT</span> ' + inc.id +
                       ' <span style="opacity:0.6">\u00B7</span> RESPONSE DISPATCHED';
    }
  }

  function onReviewApprove(inc){
    if (!inc || !inc.review || inc.review.status !== 'APPROVE') return;
    if (inc.id === lastDispatchedId) return;

    var det = inc.detection || {};
    var unit = nearestUnit(det.lat||0, det.lon||0);
    var resp = {
      dispatched: true,
      unit: unit,
      eta: unit.eta,
      status: 'EN ROUTE',
      at: new Date().toISOString()
    };
    if (window.OceanEye && window.OceanEye.incident){
      window.OceanEye.incident.update({ response: resp });
    }
    lastDispatchedId = inc.id;
    console.log('[dispatch] APPROVE received — dispatched for', inc.id);
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(inc){
      if (!inc){ return; }

      // Detect APPROVE from review
      onReviewApprove(inc);

      // Render whenever we are on the dispatch section
      if (inc.response && inc.response.dispatched){
        renderOnDispatch(inc);
        updateBadgeForDispatch(inc);
      }
      clearOnNonDispatch();
    });
    console.log('[dispatch] subscribed');
  }

  // periodic re-check on section change
  setInterval(function(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (!inc || !inc.response || !inc.response.dispatched) { clearOnNonDispatch(); return; }
    renderOnDispatch(inc);
    clearOnNonDispatch();
  }, 1800);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[dispatch] armed');
})();
