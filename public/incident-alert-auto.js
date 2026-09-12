/* OCEAN EYE - Alert Auto (robot voice loop + STOP + advisory)
   - On Alert section: robot avatar voice auto-loops until STOP
   - Food Safety START/STOP is handled by incident-food-safety-voice.js
   - Sends public health advisory to coastal communities
*/
(function(){
  'use strict';
  var lastRobotId = null;
  var ROBOT_KEY = 'oceaneye.robotLoopRunning';

  function isVisible(el){ return el && el.offsetParent !== null; }

  function isOnAlertSection(){
    var h = document.querySelectorAll('h1,h2,h3,h4');
    for (var i=0;i<h.length;i++){
      var t = (h[i].textContent || '').trim();
      if (!isVisible(h[i])) continue;
      if (t === 'Alert System' || t === 'Select Scenario') return true;
    }
    return false;
  }

  function isOnSatelliteSection(){
    var h = document.querySelectorAll('h1,h2,h3,h4');
    for (var i=0;i<h.length;i++){
      var t = (h[i].textContent || '').trim();
      if (!isVisible(h[i])) continue;
      if (t === 'Satellite Analysis' || t === 'Satellite Status') return true;
    }
    return false;
  }

  // --- highlight scenario card ---
  function clearHighlight(){
    var all = document.querySelectorAll('.oceaneye-scenario-hl');
    for (var i=0;i<all.length;i++){
      all[i].classList.remove('oceaneye-scenario-hl');
      all[i].style.outline = '';
      all[i].style.boxShadow = '';
      var tags = all[i].querySelectorAll('.oceaneye-ai-tag');
      for (var k=0;k<tags.length;k++) tags[k].parentNode.removeChild(tags[k]);
    }
  }
  function highlightScenario(label, conf){
    clearHighlight();
    if (!label) return;
    var needle = label.toLowerCase().trim();
    var all = document.querySelectorAll('div,button,li,article,section');
    var cands = [];
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.id && el.id.indexOf('oceaneye') === 0) continue;
      if (el.closest && (el.closest('#oceaneyeAlertToast') || el.closest('#oceaneyeRealMapWrap') || el.closest('#oceaneyeReviewCase') || el.closest('#oceaneyeRobotPanel'))) continue;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 220) continue;
      if (t.toLowerCase().indexOf(needle) >= 0) cands.push(el);
    }
    var leaves = cands.filter(function(el){ return !cands.some(function(o){ return o !== el && el.contains(o); }); });
    var best = null;
    for (var j=0;j<leaves.length;j++){ if (!best || leaves[j].textContent.length > best.textContent.length) best = leaves[j]; }
    if (!best) return;
    best.classList.add('oceaneye-scenario-hl');
    best.style.outline = '2px solid #4a9eff';
    best.style.boxShadow = '0 0 18px rgba(74,158,255,0.55)';
    var tag = document.createElement('span');
    tag.className = 'oceaneye-ai-tag';
    tag.style.cssText = 'display:block;margin-top:6px;font-family:"Share Tech Mono",monospace;font-size:9px;letter-spacing:0.10em;color:#4a9eff;text-transform:uppercase;';
    tag.textContent = '\u25C9 AI SELECTED \u00B7 ' + (conf || '--') + '%';
    best.appendChild(tag);
  }

  // --- robot voice loop with STOP ---
  function buildRobotPanel(msg){
    var old = document.getElementById('oceaneyeRobotPanel');
    if (old) old.parentNode.removeChild(old);

    var box = document.createElement('div');
    box.id = 'oceaneyeRobotPanel';
    box.style.cssText = [
      'position:fixed','bottom:12px','right:12px','z-index:9999',
      'display:flex','align-items:center','gap:10px',
      'padding:8px 12px',
      'background:rgba(6,20,32,0.95)',
      'border:1px solid rgba(74,158,255,0.55)','border-radius:4px',
      'font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#4a9eff','letter-spacing:0.08em',
      'box-shadow:0 0 14px rgba(74,158,255,0.25)'
    ].join(';');

    var label = document.createElement('div');
    label.innerHTML = '\uD83E\uDD16 <b>ROBOT ALERT</b> \u00B7 RINGING';
    label.style.cssText = 'flex:1;';

    var stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.textContent = '\u23F9 STOP';
    stopBtn.style.cssText = 'padding:6px 12px;background:rgba(255,71,87,0.15);border:1px solid #ff4757;color:#ff4757;border-radius:3px;cursor:pointer;font-family:inherit;font-size:10px;letter-spacing:0.10em;text-transform:uppercase;';
    stopBtn.onclick = function(){
      if (window.oceaneyeVoice) window.oceaneyeVoice.stopAll();
      localStorage.removeItem(ROBOT_KEY);
      if (box.parentNode) box.parentNode.removeChild(box);
      console.log('[robot] stopped');
    };

    box.appendChild(label);
    box.appendChild(stopBtn);
    document.body.appendChild(box);
  }

  function removeRobotPanel(){
    var p = document.getElementById('oceaneyeRobotPanel');
    if (p) p.parentNode.removeChild(p);
  }

  function robotMessage(inc){
    var parts = ['Alert.'];
    if (inc.cause && inc.cause.scenario) parts.push(inc.cause.scenario + ' detected.');
    if (inc.cause && inc.cause.confidence) parts.push('Confidence ' + inc.cause.confidence + ' percent.');
    return parts.join(' ');
  }

  function triggerRobot(inc){
    if (!isOnAlertSection()) return false;
    if (!inc || inc.status !== 'DETECTED') return false;
    if (inc.id === lastRobotId && localStorage.getItem(ROBOT_KEY) === '1') return false;

    var msg = robotMessage(inc);
    if (window.oceaneyeVoice) window.oceaneyeVoice.startLoop(msg, 9000);
    buildRobotPanel(msg);
    localStorage.setItem(ROBOT_KEY, '1');
    lastRobotId = inc.id;
    console.log('[robot] loop started for', inc.id);
    return true;
  }

  function stopRobotIfOffAlert(){
    if (isOnAlertSection()) return;
    if (localStorage.getItem(ROBOT_KEY) === '1'){
      if (window.oceaneyeVoice) window.oceaneyeVoice.stopAll();
      localStorage.removeItem(ROBOT_KEY);
      removeRobotPanel();
    }
  }

  // --- satellite banner ---
  function showSatelliteBanner(inc){
    var old = document.getElementById('oceaneyeSatBanner');
    if (old) old.parentNode.removeChild(old);
    if (!inc || !inc.cause || !inc.cause.scenario) return;
    var b = document.createElement('div');
    b.id = 'oceaneyeSatBanner';
    b.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:9998;padding:10px 18px;background:rgba(74,158,255,0.15);border:1px solid #4a9eff;border-radius:4px;font-family:"Share Tech Mono",monospace;font-size:13px;letter-spacing:0.10em;color:#4a9eff;text-transform:uppercase;box-shadow:0 0 18px rgba(74,158,255,0.35);pointer-events:none;';
    b.textContent = '\u26A1 Detected: ' + inc.cause.scenario + (inc.cause.confidence ? ' \u00B7 ' + inc.cause.confidence + '%' : '');
    document.body.appendChild(b);
  }
  function clearSatelliteBanner(){
    var o = document.getElementById('oceaneyeSatBanner');
    if (o) o.parentNode.removeChild(o);
  }

  // --- advisory to coastal communities ---
  function sendCommunityAdvisory(inc){
    if (!inc || !inc.cause) return;
    if (inc.advisory && inc.advisory.sent) return;
    var communities = ['Kovalam','Mahabalipuram','Puducherry','Cuddalore','Nagapattinam','Rameswaram'];
    var entry = {
      sent: true,
      at: new Date().toISOString(),
      message: 'Public health advisory issued. Coastal fishing communities advised to halt fishing and consumption until further notice.',
      communities: communities,
      source: 'OCEAN EYE · Food Safety Advisory',
      incidentId: inc.id
    };
    if (window.OceanEye && window.OceanEye.incident){
      window.OceanEye.incident.update({ advisory: entry });
    }

    // try to inject into a visible "coastal communities" area
    var anchors = document.querySelectorAll('div,section,article');
    for (var i=0;i<anchors.length;i++){
      var el = anchors[i];
      var t = (el.textContent || '');
      if (el.offsetParent === null) continue;
      if (t.toUpperCase().indexOf('COASTAL COMMUNITIES AT RISK') >= 0 && t.length < 800){
        var note = el.querySelector('.oceaneye-advisory-sent');
        if (!note){
          note = document.createElement('div');
          note.className = 'oceaneye-advisory-sent';
          note.style.cssText = 'margin-top:8px;padding:6px 10px;background:rgba(74,158,255,0.10);border-left:3px solid #4a9eff;border-radius:3px;font-family:"Share Tech Mono",monospace;font-size:10px;color:#4a9eff;letter-spacing:0.06em;';
          note.textContent = '\u25C9 ADVISORY SENT \u00B7 ' + new Date().toLocaleTimeString() + ' \u00B7 ' + communities.join(', ');
          el.appendChild(note);
        }
        break;
      }
    }
    console.log('[advisory] sent to', communities.length, 'communities for', inc.id);
  }

  function handle(inc){
    if (!inc){ return; }

    if (isOnSatelliteSection() && inc.status === 'DETECTED') showSatelliteBanner(inc);
    else clearSatelliteBanner();

    if (isOnAlertSection() && inc.status === 'DETECTED' && inc.cause && inc.cause.scenario){
      highlightScenario(inc.cause.scenario, inc.cause.confidence);
      if (inc.id !== lastRobotId) triggerRobot(inc);
      sendCommunityAdvisory(inc);
    } else {
      clearHighlight();
      stopRobotIfOffAlert();
    }
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(handle);
    console.log('[alert-auto] subscribed');
  }

  setInterval(function(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (inc) handle(inc);
  }, 1800);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[alert-auto] armed');
})();
