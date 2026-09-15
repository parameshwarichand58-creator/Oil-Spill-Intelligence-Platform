/* OCEAN EYE — Dispatch Alert */
(function(){
  'use strict';

  var RELAY_DISPATCH = 'https://oil-spill-intelligence-platform.onrender.com/api/dispatch';
  var BTN_ID = 'oeSendDispatchBtn';
  var CHK_ID = 'oeHarvestCaught';
  var LAST_ID = 'oeLastDispatchAt';

  function $id(id){ return document.getElementById(id); }

  function safe(fn, fallback){
    try { var v = fn(); return (v === undefined || v === null) ? fallback : v; }
    catch(e){ return fallback; }
  }

  function getIncident(){
    return safe(function(){
      return window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    }, null) || {};
  }

  function getNearestZone(){
    return safe(function(){
      if (window.OceanEye && window.OceanEye.ecoZones && window.OceanEye.ecoZones.nearest){
        return window.OceanEye.ecoZones.nearest();
      }
      var el = document.querySelector('[data-eco-zone], #ecoZoneName, .eco-zone-name');
      return el ? el.textContent.trim() : null;
    }, null) || 'nearest sensitive zone';
  }

  function getWindDirection(){
    return safe(function(){
      var el = document.querySelector('[data-wind-direction], #windDirection, .wind-direction');
      if (el) return parseFloat(el.textContent) || null;
      var compass = document.querySelector('[data-wind-dir], #windDir');
      return compass ? parseFloat(compass.textContent) || null : null;
    }, null);
  }

  function getWaveHeight(){
    return safe(function(){
      var el = document.querySelector('[data-wave-height], #waveHeight, .wave-height');
      return el ? parseFloat(el.textContent) || null : null;
    }, null);
  }

  function getSeverity(inc){
    var c = (inc.detection && inc.detection.confidence) || 0;
    if (c >= 90) return 'CRITICAL';
    if (c >= 85) return 'HIGH';
    if (c >= 70) return 'MODERATE';
    return 'LOW';
  }

  function buildAlertText(){
    var inc = getIncident();
    var id = inc.id || 'INC-UNKNOWN';
    var det = inc.detection || {};
    var lat = det.lat != null ? det.lat : (inc.lat || 0);
    var lon = det.lon != null ? det.lon : (inc.lon || 0);
    var area = det.area_km2 != null ? det.area_km2 : '-';
    var conf = det.confidence != null ? det.confidence : '-';
    var sev = getSeverity(inc);
    var zone = getNearestZone();
    var wind = getWindDirection();
    var wave = getWaveHeight();
    var caught = $id(CHK_ID) && $id(CHK_ID).checked;
    var exposed = !!(inc.marineLifeExposed || inc.impact || (det.area_km2 && det.area_km2 > 50));

    var L = [];
    L.push('OIL SPILL DISPATCH ALERT - ' + id);
    L.push('Location: ' + Number(lat).toFixed(3) + ', ' + Number(lon).toFixed(3) +
           ' | Area: ' + area + ' km2 | Confidence: ' + conf + '% | Severity: ' + sev);
    L.push('');

    L.push('1) CLEANUP DISPATCH');
    L.push('   Deploy skimmers, booms, and cleanup crews immediately.');
    L.push('   Coordinates: ' + Number(lat).toFixed(3) + ', ' + Number(lon).toFixed(3) + '.');
    L.push('   Access from nearest coast guard station.');
    L.push('   Urgency: ' + sev + ' | Target on-scene: within 2 hours.');
    L.push('   [MODEL] derived from incident severity');
    L.push('');

    L.push('2) MARINE LIFE RESPONSE');
    if (exposed){
      L.push('   IMPACT: Fish / aquatic organisms in ' + zone + ' may already be exposed.');
      L.push('   Notify marine-life rescue teams.');
      L.push('   Recommend safe containment / cleanup AROUND the affected zone.');
      L.push('   Do NOT attempt to physically trap or chase animals.');
      L.push('   Prioritize spawning / nursery habitats.');
      L.push('   Monitor zone post-cleanup.');
      L.push('   Estimated affected area: ' + area + ' km2 | Ecological risk: ' + sev);
      L.push('   [REFERENCE] species list pending data source');
    } else {
      L.push('   PROTECTION: Oil has not yet reached ' + zone + '.');
      L.push('   Recommend booms at the leading edge to keep oil out.');
      L.push('   Prioritize spawning / nursery habitats.');
      L.push('   Monitor zone continuously.');
      L.push('   [MODEL] based on drift and zone proximity');
    }
    L.push('');

    L.push('3) FISHING / SEAFOOD SAFETY');
    L.push('   IMMEDIATE CLOSURE of all downstream fishing zones.');
    L.push('   Public health advisory to coastal communities.');
    L.push('   Deploy seafood testing teams within 12 hours.');
    if (caught){
      L.push('   [WARNING] HARVEST STATUS: Fish already caught from affected zone.');
      L.push('   HOLD from market until testing clears (NOAA guidance).');
    } else {
      L.push('   Harvest status: none reported.');
    }
    L.push('');

    L.push('4) PROTECTION ZONE + BOOM RECOMMENDATION');
    var windTxt = wind != null ? wind + ' deg' : 'current wind direction';
    var waveTxt = wave != null ? wave + ' m' : '-';
    L.push('   Recommended boom line: 3 km offshore of ' + zone + ',');
    L.push('   oriented perpendicular to current wind direction (' + windTxt + ').');
    L.push('   Wave height: ' + waveTxt);
    L.push('   [LIVE] Open-Meteo');
    L.push('');

    L.push('5) HUMAN / CREW MEDICAL RESPONSE');
    L.push('   Medical teams on standby for ship personnel.');
    L.push('   Monitor for oil-fume exposure.');
    L.push('   Transport affected crew to nearest hospital.');
    L.push('   [MODEL] standard response protocol');

    return L.join('\n');
  }

  function showToast(text){
    var old = document.getElementById('oeDispatchToast');
    if (old) old.parentNode.removeChild(old);
    var t = document.createElement('div');
    t.id = 'oeDispatchToast';
    t.style.cssText = [
      'position:fixed','top:60px','left:50%','transform:translateX(-50%)',
      'z-index:99999','max-width:720px','width:92%',
      'background:rgba(10,4,6,0.97)','border:1px solid #ff4757','border-left:4px solid #ff4757',
      'border-radius:6px','font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#ffd7db','padding:14px 16px','line-height:1.5',
      'box-shadow:0 0 32px rgba(255,71,87,0.35)','white-space:pre-wrap',
      'max-height:70vh','overflow-y:auto'
    ].join(';');
    t.textContent = text;
    document.body.appendChild(t);
    var close = document.createElement('button');
    close.textContent = 'CLOSE';
    close.style.cssText = 'margin-top:10px;padding:6px 14px;background:transparent;border:1px solid #ff4757;color:#ff4757;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.1em;';
    close.onclick = function(){ t.parentNode.removeChild(t); };
    t.appendChild(document.createElement('br'));
    t.appendChild(close);
    setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 45000);
  }

  function speakSection3(){
    var msg = 'IMMEDIATE CLOSURE of all downstream fishing zones. Public health advisory to coastal communities. Deploy seafood testing teams within 12 hours.';
    try {
      if (window.oceaneyeVoice && window.oceaneyeVoice.speakOnce){
        window.oceaneyeVoice.speakOnce(msg);
      } else if (window.speechSynthesis){
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(msg);
        u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
        window.speechSynthesis.speak(u);
      }
    } catch(e){}
  }

  function postDispatch(text){
    var inc = getIncident();
    var det = inc.detection || {};
    var payload = {
      incidentId: inc.id || null,
      severity: getSeverity(inc),
      lat: det.lat != null ? det.lat : null,
      lon: det.lon != null ? det.lon : null,
      message: text,
      harvestStatus: ($id(CHK_ID) && $id(CHK_ID).checked) ? 'caught' : 'none'
    };
    return fetch(RELAY_DISPATCH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(r){ return r.ok ? r.json() : null; });
  }

  function renderButton(){
    var targets = ['#page9', '[data-page="dispatch"]', '#dispatchPage'];
    var mount = null;
    for (var i=0;i<targets.length;i++){
      var el = document.querySelector(targets[i]);
      if (el){ mount = el; break; }
    }
    if (!mount) return;
    if ($id(BTN_ID)) return;

    var wrap = document.createElement('div');
    wrap.style.cssText = 'margin:16px 0;padding:14px 16px;background:rgba(255,71,87,0.06);border:1px solid rgba(255,71,87,0.35);border-radius:6px;';

    var title = document.createElement('div');
    title.style.cssText = 'font-family:"Share Tech Mono",monospace;font-size:11px;letter-spacing:0.12em;color:#ff8b96;margin-bottom:10px;';
    title.textContent = 'EMERGENCY DISPATCH - RESPONDER AGENCIES';
    wrap.appendChild(title);

    var btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.textContent = 'SEND ECO-PROTECTION ALERT';
    btn.style.cssText = 'padding:10px 20px;background:linear-gradient(135deg,#ff4757,#c81e2e);color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:"Share Tech Mono",monospace;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;';
    btn.onclick = function(){
      btn.disabled = true;
      btn.textContent = 'SENDING...';
      var text = buildAlertText();
      showToast(text);
      speakSection3();
      postDispatch(text).then(function(res){
        var ts = new Date().toLocaleTimeString();
        var last = $id(LAST_ID);
        if (last) last.textContent = 'Last sent: ' + ts + (res && res.id ? ' | ' + res.id : '');
        btn.disabled = false;
        btn.textContent = 'SEND ECO-PROTECTION ALERT';
        console.log('[dispatch-alert] sent', res);
      }).catch(function(e){
        btn.disabled = false;
        btn.textContent = 'SEND ECO-PROTECTION ALERT';
        console.warn('[dispatch-alert] POST failed:', e.message);
      });
    };
    wrap.appendChild(btn);

    var chkWrap = document.createElement('label');
    chkWrap.style.cssText = 'display:block;margin-top:12px;font-family:"Share Tech Mono",monospace;font-size:11px;color:#cbd5e1;cursor:pointer;';
    var chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = CHK_ID;
    chk.style.cssText = 'margin-right:8px;vertical-align:middle;';
    chkWrap.appendChild(chk);
    chkWrap.appendChild(document.createTextNode('Fish already caught from affected zone (hold from market until tested)'));
    wrap.appendChild(chkWrap);

    var last = document.createElement('div');
    last.id = LAST_ID;
    last.style.cssText = 'margin-top:10px;font-family:"Share Tech Mono",monospace;font-size:10px;color:#5c7286;';
    last.textContent = 'Last sent: -';
    wrap.appendChild(last);

    mount.appendChild(wrap);
  }

  function boot(){
    renderButton();
    setInterval(renderButton, 3000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('[dispatch-alert] armed');
})();
