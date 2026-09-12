/* OCEAN EYE - Alert Auto (v7)
   On Alert section:
     - Shows robot avatar pop-up near top
     - Robot voice loops the scenario announcement
     - No bottom-right panel
     - Scenario card still glows (no auto-click)
   Leave Alert section -> everything stops
*/
(function(){
  'use strict';
  var LOOP_MS = 9000;
  var ROBOT_KEY = 'oceaneye.robotLoopRunning';
  var lastHandledId = null;
  var loopTimer = null;

  function visible(el){
    if (!el) return false;
    if (el.offsetParent === null) return false;
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }
  function onAlert(){
    var wanted = ['Select Scenario','Alert System','AI-powered scenario simulation'];
    var all = document.querySelectorAll('div,span,h1,h2,h3,h4,p');
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (!visible(el)) continue;
      var t = (el.textContent || '').trim();
      for (var j=0;j<wanted.length;j++) if (t.indexOf(wanted[j]) >= 0) return true;
    }
    return false;
  }
  function onSatellite(){
    var wanted = ['Satellite Analysis','Satellite Status'];
    var all = document.querySelectorAll('h1,h2,h3,h4');
    for (var i=0;i<all.length;i++){
      if (!visible(all[i])) continue;
      var t = (all[i].textContent || '').trim();
      for (var j=0;j<wanted.length;j++) if (t === wanted[j]) return true;
    }
    return false;
  }

  // ---- highlight scenario card ----
  function clearHL(){
    var all = document.querySelectorAll('.oceaneye-scenario-hl');
    for (var i=0;i<all.length;i++){
      all[i].classList.remove('oceaneye-scenario-hl');
      all[i].style.outline = '';
      all[i].style.outlineOffset = '';
      all[i].style.boxShadow = '';
      var tags = all[i].querySelectorAll('.oceaneye-ai-tag');
      for (var k=0;k<tags.length;k++) tags[k].parentNode.removeChild(tags[k]);
    }
  }
  function glow(card, conf, scenario){
    if (!card) return;
    card.classList.add('oceaneye-scenario-hl');
    card.style.outline = '3px solid #4a9eff';
    card.style.outlineOffset = '2px';
    card.style.boxShadow = '0 0 24px rgba(74,158,255,0.65)';
    card.style.transition = 'all 0.3s';
    var old = card.querySelectorAll('.oceaneye-ai-tag');
    for (var k=0;k<old.length;k++) old[k].parentNode.removeChild(old[k]);
    var tag = document.createElement('div');
    tag.className = 'oceaneye-ai-tag';
    tag.style.cssText = 'margin-top:6px;font-family:"Share Tech Mono",monospace;font-size:10px;letter-spacing:0.10em;color:#4a9eff;text-transform:uppercase;font-weight:bold;';
    tag.textContent = '\u25C9 AI DETECTED \u00B7 ' + scenario + ' \u00B7 ' + (conf||'--') + '%';
    card.appendChild(tag);
  }
  function findScenarioCard(scenarioName){
    if (!scenarioName) return null;
    var needle = scenarioName.toLowerCase().trim();
    var all = document.querySelectorAll('div,button,article,section,li');
    var cands = [];
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.id && el.id.indexOf('oceaneye') === 0) continue;
      if (el.closest && (el.closest('#oceaneyeRobotPanel') || el.closest('#oceaneyeAlertToast') || el.closest('#oceaneyeReviewCase') || el.closest('#oceaneyeRealMapWrap'))) continue;
      if (!visible(el)) continue;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 140) continue;
      if (t.toLowerCase().indexOf(needle) < 0) continue;
      var lower = t.toLowerCase();
      var others = 0;
      ['natural seepage','culprit theft','internal failure','collision accident','fire explosion','weather storm'].forEach(function(s){
        if (s !== needle && lower.indexOf(s) >= 0) others++;
      });
      if (others > 0) continue;
      cands.push(el);
    }
    if (!cands.length) return null;
    var leaves = cands.filter(function(el){ return !cands.some(function(o){ return o !== el && el.contains(o); }); });
    var best = null;
    for (var j=0;j<leaves.length;j++){ if (!best || leaves[j].textContent.length > best.textContent.length) best = leaves[j]; }
    return best;
  }

  // ---- robot avatar pop-up ----
  function showRobot(scenario, conf){
    var old = document.getElementById('oceaneyeRobotAvatar');
    if (old) old.parentNode.removeChild(old);

    var box = document.createElement('div');
    box.id = 'oceaneyeRobotAvatar';
    box.style.cssText = [
      'position:fixed','top:90px','left:50%','transform:translateX(-50%)',
      'z-index:9999','display:flex','align-items:center','gap:14px',
      'padding:16px 22px',
      'background:linear-gradient(135deg,rgba(20,32,48,0.98),rgba(10,18,30,0.98))',
      'border:2px solid rgba(74,158,255,0.8)','border-radius:10px',
      'font-family:"Share Tech Mono",monospace','color:#cbd5e1',
      'box-shadow:0 0 30px rgba(74,158,255,0.5)',
      'min-width:380px','max-width:560px',
      'animation:oceaneyeRobotSlide 0.4s ease-out'
    ].join(';');

    // robot face
    var face = document.createElement('div');
    face.style.cssText = [
      'width:56px','height:56px','border-radius:50%',
      'background:radial-gradient(circle at 40% 35%,#7db6ff,#4a9eff 60%,#1a3a66)',
      'display:flex','align-items:center','justify-content:center',
      'font-size:32px','box-shadow:0 0 20px rgba(74,158,255,0.8)',
      'animation:oceaneyeRobotPulse 1.4s infinite ease-in-out',
      'flex:0 0 56px'
    ].join(';');
    face.textContent = '\uD83E\uDD16';

    var body = document.createElement('div');
    body.style.cssText = 'flex:1;line-height:1.5;';
    body.innerHTML =
      '<div style="color:#4a9eff;letter-spacing:0.14em;font-size:11px;text-transform:uppercase;margin-bottom:4px;">\u25C9 AI ALERT \u00B7 SCENARIO DETECTED</div>' +
      '<div style="color:#fff;font-size:15px;font-weight:bold;letter-spacing:0.06em;">' + (scenario || '').toUpperCase() + '</div>' +
      '<div style="color:#cbd5e1;font-size:12px;opacity:0.85;margin-top:2px;">Confidence: <b style="color:#00d4aa;">' + (conf||'--') + '%</b> \u00B7 Ringing alert\u2026</div>';

    var stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.textContent = '\u23F9 STOP';
    stopBtn.style.cssText = 'padding:10px 16px;background:rgba(255,71,87,0.18);border:1px solid #ff4757;color:#ff4757;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:bold;flex:0 0 auto;';
    stopBtn.onclick = function(){
      stopLoop();
      hideRobot();
    };

    box.appendChild(face);
    box.appendChild(body);
    box.appendChild(stopBtn);
    document.body.appendChild(box);

    // inject animation CSS once
    if (!document.getElementById('oceaneyeRobotAnimStyle')){
      var st = document.createElement('style');
      st.id = 'oceaneyeRobotAnimStyle';
      st.textContent =
        '@keyframes oceaneyeRobotSlide{from{opacity:0;transform:translate(-50%,-20px);}to{opacity:1;transform:translate(-50%,0);}}' +
        '@keyframes oceaneyeRobotPulse{0%,100%{box-shadow:0 0 20px rgba(74,158,255,0.8);}50%{box-shadow:0 0 32px rgba(74,158,255,1);}}';
      document.head.appendChild(st);
    }
    console.log('[robot] avatar shown for', scenario);
  }

  function hideRobot(){
    var el = document.getElementById('oceaneyeRobotAvatar');
    if (el) el.parentNode.removeChild(el);
  }

  // ---- voice loop ----
  function speak(text){
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch(e){}
  }

  function startLoop(scenario, conf){
    stopLoop();
    var msg = 'Alert. ' + scenario + ' detected.';
    if (conf) msg += ' Confidence ' + conf + ' percent.';
    speak(msg);
    loopTimer = setInterval(function(){ speak(msg); }, LOOP_MS);
    localStorage.setItem(ROBOT_KEY, '1');
    console.log('[robot] voice loop started:', msg);
  }

  function stopLoop(){
    if (loopTimer){ clearInterval(loopTimer); loopTimer = null; }
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(e){}
    localStorage.removeItem(ROBOT_KEY);
  }

  // ---- satellite banner ----
  function satBanner(inc){
    var old = document.getElementById('oceaneyeSatBanner');
    if (old) old.parentNode.removeChild(old);
    if (!inc || !inc.cause || !inc.cause.scenario) return;
    var b = document.createElement('div');
    b.id = 'oceaneyeSatBanner';
    b.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);z-index:9998;padding:10px 18px;background:rgba(74,158,255,0.15);border:1px solid #4a9eff;border-radius:4px;font-family:"Share Tech Mono",monospace;font-size:13px;letter-spacing:0.10em;color:#4a9eff;text-transform:uppercase;box-shadow:0 0 18px rgba(74,158,255,0.35);pointer-events:none;';
    b.textContent = '\u26A1 Detected: ' + inc.cause.scenario + (inc.cause.confidence ? ' \u00B7 ' + inc.cause.confidence + '%' : '');
    document.body.appendChild(b);
  }
  function clearSat(){
    var o = document.getElementById('oceaneyeSatBanner');
    if (o) o.parentNode.removeChild(o);
  }

  // ---- Last Scenario text ----
  function setLastScenario(label){
    var all = document.querySelectorAll('div,span,p,h1,h2,h3,h4');
    for (var i=0;i<all.length;i++){
      var t = (all[i].textContent || '').trim().toUpperCase();
      if (t === 'LAST SCENARIO'){
        var sib = all[i].nextElementSibling;
        if (sib) sib.textContent = (label || '—').toUpperCase();
        return;
      }
    }
  }

  // ---- main tick ----
  function tick(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    var isAlert = onAlert();
    var isSat   = onSatellite();

    if (isSat){
      if (inc && inc.status === 'DETECTED') satBanner(inc);
      else clearSat();
    } else {
      clearSat();
    }

    if (!isAlert){
      if (localStorage.getItem(ROBOT_KEY) === '1'){ stopLoop(); hideRobot(); }
      clearHL();
      return;
    }

    if (!inc || inc.status !== 'DETECTED' || !inc.cause || !inc.cause.scenario){
      clearHL();
      return;
    }

    setLastScenario(inc.cause.scenario);
    var card = findScenarioCard(inc.cause.scenario);
    if (card) glow(card, inc.cause.confidence, inc.cause.scenario);

    // auto-show robot + start voice loop once per incident
    if (inc.id !== lastHandledId){
      lastHandledId = inc.id;
      setTimeout(function(){
        if (onAlert()){
          showRobot(inc.cause.scenario, inc.cause.confidence);
          startLoop(inc.cause.scenario, inc.cause.confidence);
        }
      }, 400);
    } else {
      // re-show if removed but loop still active
      if (localStorage.getItem(ROBOT_KEY) === '1' && !document.getElementById('oceaneyeRobotAvatar')){
        showRobot(inc.cause.scenario, inc.cause.confidence);
      }
    }
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(){ setTimeout(tick, 100); });
    console.log('[alert-auto v7] subscribed');
  }

  setInterval(tick, 1500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[alert-auto v7] armed');
})();
