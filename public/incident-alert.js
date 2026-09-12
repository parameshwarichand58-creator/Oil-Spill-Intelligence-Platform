/* OCEAN EYE - Auto Alert
   When an incident is DETECTED with confidence >= 85, push an alert
   into the Alert section automatically. Also shows a small red alert toast.
*/
(function(){
  'use strict';
  var lastAlertedId = null;

  function riskLevel(conf){
    if (conf >= 90) return 'CRITICAL';
    if (conf >= 85) return 'HIGH';
    if (conf >= 70) return 'MODERATE';
    return 'LOW';
  }

  function pushToast(inc){
    var old = document.getElementById('oceaneyeAlertToast');
    if (old) old.parentNode.removeChild(old);

    var toast = document.createElement('div');
    toast.id = 'oceaneyeAlertToast';
    toast.style.cssText = [
      'position:fixed','top:70px','right:14px','z-index:99999',
      'width:320px','background:rgba(20,4,8,0.96)',
      'border:1px solid #ff4757','border-left:4px solid #ff4757',
      'border-radius:4px','font-family:"Share Tech Mono",monospace',
      'font-size:11px','color:#ffb1b8','padding:10px 12px',
      'line-height:1.5','box-shadow:0 0 22px rgba(255,71,87,0.35)',
      'animation:oceaneyeAlertSlide 0.35s ease-out'
    ].join(';');

    var det = inc.detection || {};
    toast.innerHTML =
      '<div style="color:#ff4757;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:6px;">\uD83D\uDEA8 OIL SPILL ALERT</div>' +
      '<div><b>' + (inc.id || '-') + '</b> \u00b7 ' + (riskLevel(det.confidence)) + '</div>' +
      '<div>Location: ' + (det.lat || 0).toFixed(3) + ', ' + (det.lon || 0).toFixed(3) + '</div>' +
      '<div>Area: ' + (det.area_km2 || '-') + ' km\u00B2 \u00b7 Confidence: ' + (det.confidence || '-') + '%</div>' +
      '<div>Possible cause: <b>' + ((inc.cause && inc.cause.icon) || '') + ' ' + ((inc.cause && inc.cause.scenario) || 'Analyzing...') + '</b>' + (inc.cause && inc.cause.confidence ? ' \u00b7 ' + inc.cause.confidence + '%' : '') + '</div>' +'<div style="margin-top:6px;opacity:0.7;font-size:10px;">Candidate: MT SAGAR \u00b7 87% attribution</div>' +
      '<div style="margin-top:8px;display:flex;gap:6px;">' +
        '<button id="oeToastGo" style="flex:1;padding:5px 8px;background:rgba(255,71,87,0.15);border:1px solid #ff4757;color:#ff4757;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.08em;">VIEW INCIDENT</button>' +
        '<button id="oeToastX" style="flex:0 0 60px;padding:5px 8px;background:transparent;border:1px solid rgba(92,114,134,0.5);color:#5c7286;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;">CLOSE</button>' +
      '</div>';

    document.body.appendChild(toast);

    document.getElementById('oeToastX').onclick = function(){
      toast.parentNode.removeChild(toast);
    };
    document.getElementById('oeToastGo').onclick = function(){
      // click the Map nav if we can find it
      var navs = document.querySelectorAll('[data-section], a, button');
      for (var i=0;i<navs.length;i++){
        var t = (navs[i].textContent || '').trim().toLowerCase();
        if (t === 'map' || t === '\uD83D\uDDFA\uFE0F map'){
          navs[i].click(); break;
        }
      }
      toast.parentNode.removeChild(toast);
    };

    // fade out after 12s
    setTimeout(function(){
      if (toast.parentNode){
        toast.style.transition = 'opacity 0.6s';
        toast.style.opacity = '0';
        setTimeout(function(){ if (toast.parentNode) toast.parentNode.removeChild(toast); }, 700);
      }
    }, 12000);
  }

  function pushToAlertPage(inc){
    // try to find an existing alert container on the page.
    // Different dashboards use different containers, so we try several selectors.
    var containers = [
      '#alertList', '#alertsList', '.alert-list', '.alerts-list',
      '#alertFeed', '#alertsFeed', '[data-alerts]', '[data-alert-list]'
    ];
    var list = null;
    for (var i=0;i<containers.length;i++){
      var el = document.querySelector(containers[i]);
      if (el){ list = el; break; }
    }
    if (!list) return;

    var det = inc.detection || {};
    var level = riskLevel(det.confidence);
    var item = document.createElement('div');
    item.className = 'oceaneye-auto-alert';
    item.style.cssText = [
      'padding:10px 12px','margin-bottom:8px',
      'background:rgba(255,71,87,0.08)',
      'border-left:3px solid #ff4757','border-radius:3px',
      'font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#cbd5e1','line-height:1.5'
    ].join(';');
    item.innerHTML =
      '<div style="color:#ff4757;font-weight:bold;">\uD83D\uDEA8 ' + level + ' \u2014 OIL SPILL</div>' +
      '<div>' + (inc.id || '-') + ' \u00B7 ' + new Date().toLocaleTimeString() + '</div>' +
      '<div>Lat/Lon: ' + (det.lat||0).toFixed(3) + ', ' + (det.lon||0).toFixed(3) + '</div>' +
      '<div>Area: ' + (det.area_km2||'-') + ' km\u00B2 \u00B7 Confidence: ' + (det.confidence||'-') + '%</div>' +
      '<div style="opacity:0.7;">Candidate: MT SAGAR \u00B7 87% attribution</div>';

    list.insertBefore(item, list.firstChild);
  }

  function handleIncident(inc){
    if (!inc || inc.status !== 'DETECTED') return;
    var det = inc.detection || {};
    if (det.confidence === null || det.confidence === undefined) return;
    if (det.confidence < 85) return;
    if (inc.id === lastAlertedId) return;
    lastAlertedId = inc.id;

    // If alert was already triggered for this incident, DO NOT re-fire the toast.
    if (inc.alert && inc.alert.triggered === true){
      console.log('[incident-alert] already triggered, skipping toast for', inc.id);
      return;
    }

    // Freshness check: only fire the toast for incidents created in the last 15 seconds.
    // Any older incident (loaded from localStorage on a new page) is treated as already shown.
    var ageMs = Date.now() - new Date(inc.createdAt || 0).getTime();
    if (ageMs > 15000){
      console.log('[incident-alert] stale incident (' + Math.round(ageMs/1000) + 's old) — silent, marking triggered');
      if (window.OceanEye && window.OceanEye.incident){
        window.OceanEye.incident.update({
          alert: { triggered: true, at: new Date().toISOString(), level: riskLevel(det.confidence), silent: true }
        });
      }
      return;
    }

    // mark in store FIRST so the flag persists across page navigations
    if (window.OceanEye && window.OceanEye.incident){
      window.OceanEye.incident.update({
        alert: { triggered: true, at: new Date().toISOString(), level: riskLevel(det.confidence) }
      });
    }

    pushToast(inc);
    pushToAlertPage(inc);
    console.log('[incident-alert] fired', inc.id, det.confidence + '%');
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(handleIncident);
    console.log('[incident-alert] subscribed');
  }

  // CSS keyframes for toast
  var style = document.createElement('style');
  style.textContent = '@keyframes oceaneyeAlertSlide { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }';
  document.head.appendChild(style);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  // On page load: if store says alert already triggered, do not show toast
(function(){
  var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
  var old = document.getElementById('oceaneyeAlertToast');
  if (old) old.parentNode.removeChild(old);
  if (inc && inc.alert && inc.alert.triggered === true){
    console.log('[incident-alert] clearOnLoad — previous alert already shown');
  }
})();
  console.log('[incident-alert] armed');
})();
