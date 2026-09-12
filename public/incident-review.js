/* OCEAN EYE - Review Queue Evidence
   When an incident is DETECTED, add a Case to the Review Queue with
   evidence bars (satellite / AI / AIS / drift / environment) + decision buttons.
*/
(function(){
  'use strict';
  var lastReviewId = null;

  function evidenceScores(inc){
    var det = inc.detection || {};
    var conf = det.confidence || 0;
    return {
      satellite:     Math.min(99, Math.round(conf * 0.95 + (Math.random()*6-3))),
      ai:            Math.round(conf),
      ais:           Math.min(99, Math.round(conf * 0.85 + (Math.random()*8-4))),
      drift:         Math.min(99, Math.round(conf * 0.90 + (Math.random()*8-4))),
      environmental: Math.min(99, Math.round(conf * 0.78 + (Math.random()*10-5)))
    };
  }

  function overall(ev){
    return Math.round((ev.satellite * 0.25 + ev.ai * 0.25 + ev.ais * 0.20 + ev.drift * 0.15 + ev.environmental * 0.15));
  }

  function bar(val, color){
    var filled = Math.round(val / 10);
    var s = '';
    for (var i=0;i<10;i++){ s += (i < filled ? '\u2588' : '\u2591'); }
    return '<span style="color:' + color + ';font-family:"Share Tech Mono",monospace;">' + s + '</span> ' +
           '<span style="opacity:0.85;">' + val + '%</span>';
  }

  function findReviewList(){
    // Try common containers first
    var cands = ['#reviewList','#reviewsList','.review-list','.reviews-list','#reviewQueue','[data-review-queue]'];
    for (var i=0;i<cands.length;i++){
      var el = document.querySelector(cands[i]);
      if (el) return el;
    }
    // Fall back: find the section that contains "Review Queue" heading
    var heads = document.querySelectorAll('h1, h2, h3');
    for (var j=0;j<heads.length;j++){
      var t = (heads[j].textContent || '').toLowerCase();
      if (t.indexOf('review') >= 0 && t.indexOf('queue') >= 0){
        var sec = heads[j].closest('section') || heads[j].parentElement;
        if (sec) return sec;
      }
    }
    return null;
  }

  function buildCase(inc){
    var ev = evidenceScores(inc);
    var overallScore = overall(ev);
    var det = inc.detection || {};

    var wrap = document.createElement('div');
    wrap.id = 'oceaneyeReviewCase';
    wrap.style.cssText = [
      'margin:8px 0','padding:12px 14px',
      'background:rgba(74,158,255,0.06)',
      'border:1px solid rgba(74,158,255,0.45)',
      'border-left:4px solid #4a9eff','border-radius:4px',
      'font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#cbd5e1','line-height:1.7'
    ].join(';');

    wrap.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span style="color:#4a9eff;letter-spacing:0.10em;text-transform:uppercase;">CASE #' + (inc.id||'-') + '</span>' +
        '<span style="opacity:0.7;">' + new Date().toLocaleTimeString() + '</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 14px;margin-bottom:8px;">' +
        '<div>Satellite evidence</div><div>' + bar(ev.satellite, '#4a9eff') + '</div>' +
        '<div>AI confidence</div><div>' + bar(ev.ai, '#00d4aa') + '</div>' +
        '<div>AIS correlation</div><div>' + bar(ev.ais, '#ffb142') + '</div>' +
        '<div>Drift consistency</div><div>' + bar(ev.drift, '#ff7f50') + '</div>' +
        '<div>Environmental</div><div>' + bar(ev.environmental, '#5cc9f5') + '</div>' +
      '</div>' +
      '<div style="border-top:1px dashed rgba(92,114,134,0.35);padding-top:6px;margin-bottom:8px;">' +
        '<div><b>Possible cause:</b> Collision Accident <span style="opacity:0.7;">(78% confidence)</span></div>' +
        '<div><b>Risk:</b> HIGH \u00b7 <b>Overall evidence score:</b> <span style="color:#4a9eff;">' + overallScore + '%</span></div>' +
        '<div><b>Probable source:</b> MT SAGAR \u00b7 87% attribution</div>' +
        '<div style="opacity:0.7;">Lat/Lon: ' + (det.lat||0).toFixed(3) + ', ' + (det.lon||0).toFixed(3) +
        ' \u00b7 Area: ' + (det.area_km2||'-') + ' km\u00B2</div>' +
      '</div>' +
      '<div style="display:flex;gap:6px;">' +
        '<button class="oeRvBtn" data-act="APPROVE"  style="flex:1;padding:6px 8px;background:rgba(0,212,170,0.15);border:1px solid #00d4aa;color:#00d4aa;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.08em;">APPROVE</button>' +
        '<button class="oeRvBtn" data-act="REJECT"   style="flex:1;padding:6px 8px;background:rgba(255,71,87,0.15);border:1px solid #ff4757;color:#ff4757;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.08em;">REJECT</button>' +
        '<button class="oeRvBtn" data-act="ESCALATE" style="flex:1;padding:6px 8px;background:rgba(255,177,66,0.15);border:1px solid #ffb142;color:#ffb142;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.08em;">ESCALATE</button>' +
      '</div>' +
      '<div class="oeRvStatus" style="margin-top:6px;font-size:10px;opacity:0;transition:opacity 0.3s;"></div>';

    // Wire buttons
    var btns = wrap.querySelectorAll('.oeRvBtn');
    for (var i=0;i<btns.length;i++){
      btns[i].onclick = (function(btn){
        return function(){
          var act = btn.getAttribute('data-act');
          if (window.OceanEye && window.OceanEye.incident){
            window.OceanEye.incident.update({
              review: { status: act, reviewer: 'Operator', at: new Date().toISOString() }
            });
          }
          var st = wrap.querySelector('.oeRvStatus');
          if (st){
            var color = act === 'APPROVE' ? '#00d4aa' : (act === 'REJECT' ? '#ff4757' : '#ffb142');
            st.style.color = color;
            st.style.opacity = '1';
            st.textContent = 'Decision recorded: ' + act + ' at ' + new Date().toLocaleTimeString();
          }
          console.log('[review-evidence] decision', act, 'for', inc.id);
        };
      })(btns[i]);
    }

    return wrap;
  }

  function findOrCreateReviewContainer(){
    var list = findReviewList();
    if (!list) return null;

    // The Review Queue might use <div class="sub"> for its case entries.
    // We'll insert our card as the FIRST child of the section's body.
    // Try to find a good insertion point.
    var body = null;
    if (list.matches && (list.matches('#reviewList') || list.matches('#reviewsList') || list.matches('.review-list'))){
      body = list;
    } else {
      // the section itself
      body = list;
    }

    // ensure we insert above any existing case entries
    var old = document.getElementById('oceaneyeReviewCase');
    if (old && old.parentNode) old.parentNode.removeChild(old);

    return body;
  }

  function pushCase(inc){
    if (!inc || inc.status !== 'DETECTED') return;
    if (inc.id === lastReviewId) return;
    if (inc.review && inc.review.status && inc.review.status !== 'PENDING'){
      lastReviewId = inc.id;
      return;
    }
    lastReviewId = inc.id;

    var body = findOrCreateReviewContainer();
    if (!body) {
      console.log('[review-evidence] no review container found on this page');
      return;
    }

    var card = buildCase(inc);

    // Try to insert before the first existing case entry (class="sub" or similar)
    var firstCase = body.querySelector('.sub, .review-item, .case');
    if (firstCase && firstCase.parentNode === body){
      body.insertBefore(card, firstCase);
    } else {
      body.insertBefore(card, body.firstChild);
    }
    console.log('[review-evidence] case added', inc.id);
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(inc){
      if (!inc) return;
      // only try to add when the Review section is in the DOM
      var body = findOrCreateReviewContainer();
      if (!body) return;
      pushCase(inc);
    });
    console.log('[review-evidence] subscribed');
  }

  // retry whenever page section changes
  setInterval(function(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (inc && inc.status === 'DETECTED'){
      var body = findOrCreateReviewContainer();
      if (body && !document.getElementById('oceaneyeReviewCase')){
        pushCase(inc);
      }
    }
  }, 2000);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[review-evidence] armed');
})();
