/* OCEAN EYE - Auto Alert (v4)
   Satellite section   -> visual scenario banner, NO voice
   Alert section       -> auto-ring loops "Alert. <Scenario> detected." until STOP
   Other sections      -> silent
*/
(function(){
  'use strict';
  var lastHandledId = null;
  var lastStartAttempt = 0;

  function isOnSatelliteSection(){
    var nodes = document.querySelectorAll('h1,h2,h3,h4');
    for (var i=0;i<nodes.length;i++){
      var el = nodes[i];
      var t = (el.textContent || '').trim();
      if (t === 'Satellite Analysis' || t === 'Satellite Status'){
        if (el.offsetParent !== null) return true;
      }
    }
    return false;
  }

  function isOnAlertSection(){
    var nodes = document.querySelectorAll('h1,h2,h3,h4');
    for (var i=0;i<nodes.length;i++){
      var el = nodes[i];
      var t = (el.textContent || '').trim();
      if (t === 'Alert System' || t === 'Select Scenario'){
        if (el.offsetParent !== null) return true;
      }
    }
    // fallback: scan for any visible element matching
    var all = document.querySelectorAll('div,span,p');
    for (var j=0;j<all.length;j++){
      var e2 = all[j];
      var t2 = (e2.textContent || '').trim();
      if ((t2 === 'Select Scenario' || t2 === 'Alert System') && e2.offsetParent !== null){
        return true;
      }
    }
    return false;
  }

  // --- Satellite banner ---
  function showSatelliteBanner(inc){
    if (!isOnSatelliteSection()) return;
    var old = document.getElementById('oceaneyeSatBanner');
    if (old) old.parentNode.removeChild(old);
    if (!inc || !inc.cause || !inc.cause.scenario) return;

    var b = document.createElement('div');
    b.id = 'oceaneyeSatBanner';
    b.style.cssText = [
      'position:fixed','top:70px','left:50%','transform:translateX(-50%)',
      'z-index:9998','padding:10px 18px',
      'background:rgba(74,158,255,0.15)',
      'border:1px solid #4a9eff','border-radius:4px',
      'font-family:"Share Tech Mono",monospace','font-size:13px',
      'letter-spacing:0.10em','color:#4a9eff','text-transform:uppercase',
      'box-shadow:0 0 18px rgba(74,158,255,0.35)',
      'pointer-events:none'
    ].join(';');
    b.textContent = '\u26A1 Detected: ' + inc.cause.scenario +
                    (inc.cause.confidence ? ' \u00B7 ' + inc.cause.confidence + '%' : '');
    document.body.appendChild(b);
  }

  function clearSatelliteBanner(){
    var old = document.getElementById('oceaneyeSatBanner');
    if (old) old.parentNode.removeChild(old);
  }

  // --- Alert highlight ---
  function clearHighlight(){
    var all = document.querySelectorAll('.oceaneye-scenario-hl');
    for (var i=0;i<all.length;i++){
      all[i].classList.remove('oceaneye-scenario-hl');
      all[i].style.outline = '';
      all[i].style.boxShadow = '';
      var tags = all[i].querySelectorAll('.oceaneye-ai-tag');
      for (var k=0;k<tags.length;k++) if (tags[k].parentNode) tags[k].parentNode.removeChild(tags[k]);
    }
  }

  function applyGlow(el, conf){
    el.classList.add('oceaneye-scenario-hl');
    el.style.outline = '2px solid #4a9eff';
    el.style.boxShadow = '0 0 18px rgba(74,158,255,0.55)';
    var existing = el.querySelectorAll('.oceaneye-ai-tag');
    for (var z=0;z<existing.length;z++) existing[z].parentNode.removeChild(existing[z]);
    var tag = document.createElement('span');
    tag.className = 'oceaneye-ai-tag';
    tag.style.cssText = 'display:block;margin-top:6px;font-family:"Share Tech Mono",monospace;font-size:9px;letter-spacing:0.10em;color:#4a9eff;text-transform:uppercase;';
    tag.textContent = '\u25C9 AI SELECTED \u00B7 ' + (conf || '--') + '%';
    el.appendChild(tag);
  }

  function highlightScenario(label, conf){
    clearHighlight();
    if (!label) return 0;
    var needle = label.toLowerCase().trim();
    var all = document.querySelectorAll('div, button, li, article, section');
    var candidates = [];
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.id && el.id.indexOf('oceaneye') === 0) continue;
      if (el.closest && el.closest('#oceaneyeAlertToast')) continue;
      if (el.closest && el.closest('#oceaneyeRealMapWrap')) continue;
      if (el.closest && el.closest('#oceaneyeReviewCase')) continue;
      var txt = (el.textContent || '').trim();
      if (txt.length === 0 || txt.length > 220) continue;
      if (txt.toLowerCase().indexOf(needle) >= 0) candidates.push(el);
    }
    var leaves = candidates.filter(function(el){
      return !candidates.some(function(o){ return o !== el && el.contains(o); });
    });
    var best = null;
    for (var j=0;j<leaves.length;j++){
      if (!best || leaves[j].textContent.length > best.textContent.length) best = leaves[j];
    }
    if (best) applyGlow(best, conf);
    return best ? 1 : 0;
  }

  // --- Alert auto-ring ---
  function startAlertLoop(inc){
    var now = Date.now();
    if (now - lastStartAttempt < 3000) return;
    lastStartAttempt = now;

    if (!isOnAlertSection()) return;
    if (!inc || !inc.cause || !inc.cause.scenario) return;

    var msg = 'Alert. ' + inc.cause.scenario + ' detected.';
    if (window.oceaneyeVoice && window.oceaneyeVoice.startLoop){
      window.oceaneyeVoice.startLoop(msg);
      // reflect state on the START button
      var btn = document.getElementById('voiceAlertStart');
      if (btn){
        btn.textContent = '\uD83D\uDD0A VOICE ALERT: ON';
        btn.style.background = 'rgba(0,212,170,0.12)';
        btn.style.borderColor = 'rgba(0,212,170,0.55)';
        btn.style.color = '#00d4aa';
      }
      console.log('[alert-auto] loop started:', msg);
    }
  }

  // --- Recent alerts entry ---
  function addRecentAlert(inc){
    var list = document.querySelector('#recentAlertsList, .recent-alerts-list, [data-recent-alerts], #recent-alerts');
    if (!list){
      var heads = document.querySelectorAll('h1,h2,h3,h4');
      for (var i=0;i<heads.length;i++){
        if (/recent alerts/i.test(heads[i].textContent || '')){
          var sec = heads[i].closest('div, section');
          if (sec){ var cand = sec.querySelector('ul, ol, [role="list"]'); if (cand){ list = cand; break; } }
        }
      }
    }
    if (!list) list = document.querySelector('.alert-list, .alerts-list');
    if (!list) return;
    if (list.querySelector('[data-incident="' + inc.id + '"]')) return;

    var li = document.createElement('div');
    li.setAttribute('data-incident', inc.id);
    li.style.cssText = 'padding:8px 10px;margin:6px 0;background:rgba(74,158,255,0.08);border-left:3px solid #4a9eff;border-radius:3px;font-family:"Share Tech Mono",monospace;font-size:11px;color:#cbd5e1;';
    var t = new Date().toLocaleTimeString();
    var label = (inc.cause && inc.cause.scenario) ? inc.cause.scenario.toUpperCase() : 'ANALYZING';
    var icon  = (inc.cause && inc.cause.icon) || '';
    li.innerHTML =
      '<div style="color:#4a9eff;font-weight:bold;">' + t + ' \u00B7 ' + icon + ' ' + label + '</div>' +
      '<div style="opacity:0.75;">Incident ' + inc.id + ' \u00B7 auto-triggered \u00B7 ' +
        ((inc.detection && inc.detection.confidence) || '--') + '% confidence</div>';
    list.insertBefore(li, list.firstChild);
  }

  // --- Dispatch ---
  function handle(inc){
    var onAlert = isOnAlertSection();
    var onSat   = isOnSatelliteSection();

    // Voice panel visibility
    if (window.oceaneyeVoice && window.oceaneyeVoice.showPanel){
      if (onAlert) window.oceaneyeVoice.showPanel();
      else window.oceaneyeVoice.hidePanel();
    }

    // Satellite banner
    if (onSat && inc && inc.status === 'DETECTED'){
      showSatelliteBanner(inc);
    } else {
      clearSatelliteBanner();
    }

    // Alert section: highlight + loop
    if (onAlert && inc && inc.status === 'DETECTED' && inc.cause && inc.cause.scenario){
      highlightScenario(inc.cause.scenario, inc.cause.confidence);
      addRecentAlert(inc);
      if (inc.id !== lastHandledId){
        lastHandledId = inc.id;
        startAlertLoop(inc);
      }
    } else {
      clearHighlight();
    }

    // If user left the alert page, stop the auto-loop
    if (!onAlert){
      if (window.oceaneyeVoice && window.oceaneyeVoice.isOn && window.oceaneyeVoice.isOn()){
        window.oceaneyeVoice.stopAll();
        console.log('[alert-auto] left alert section — stopped loop');
      }
    }
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(handle);
    console.log('[alert-auto v4] subscribed');
  }

  // periodic re-check on section change
  setInterval(function(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (!inc || inc.status !== 'DETECTED') return;
    handle(inc);
  }, 1500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[alert-auto v4] armed — satellite visual only, alert loops scenario');
})();
