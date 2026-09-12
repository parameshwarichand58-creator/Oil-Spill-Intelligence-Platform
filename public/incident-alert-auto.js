/* OCEAN EYE - Alert Auto (v6)
   On Alert section: auto-click the detected scenario card so its own
   existing sound plays, then repeat the click every ~9s to loop.
   STOP panel clears the loop. No custom voice message.
*/
(function(){
  'use strict';
  var LOOP_MS = 9000;
  var ROBOT_KEY = 'oceaneye.scenarioLoopRunning';
  var lastHandledId = null;
  var loopTimer = null;

  // ---- helpers ----
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

  // ---- find the scenario card (clickable) ----
  function findScenarioCard(scenarioName){
    if (!scenarioName) return null;
    var needle = scenarioName.toLowerCase().trim();
    var all = document.querySelectorAll('div,button,article,section,li');
    var cands = [];
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.id && el.id.indexOf('oceaneye') === 0) continue;
      if (el.closest && (el.closest('#oceaneyeRobotPanel') || el.closest('#oceaneyeSatBanner'))) continue;
      if (!visible(el)) continue;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 300) continue;
      if (t.toLowerCase().indexOf(needle) < 0) continue;
      cands.push(el);
    }
    if (!cands.length) return null;

    // Prefer an element that has its own click handler
    var clickable = cands.filter(function(el){
      return el.onclick || el.getAttribute('role') === 'button' || el.tagName === 'BUTTON' ||
             (el.style && el.style.cursor === 'pointer');
    });

    // Leaves only (no other candidate nested inside)
    function leaves(arr){
      return arr.filter(function(el){
        return !arr.some(function(o){ return o !== el && el.contains(o); });
      });
    }

    var useArr = clickable.length ? leaves(clickable) : leaves(cands);
    // pick biggest leaf — likely the scenario card
    var best = null;
    for (var j=0;j<useArr.length;j++){
      if (!best || useArr[j].textContent.length > best.textContent.length) best = useArr[j];
    }

    // If the leaf is a text-only element, walk up to find a clickable ancestor
    if (best && !(best.onclick || best.tagName === 'BUTTON' || best.getAttribute('role') === 'button')){
      var p = best;
      for (var k=0;k<5 && p;k++){
        if (p.onclick || p.tagName === 'BUTTON' || p.getAttribute('role') === 'button'){
          best = p;
          break;
        }
        p = p.parentElement;
      }
    }
    return best;
  }

  // ---- highlight ----
  function clearHL(){
    var all = document.querySelectorAll('.oceaneye-scenario-hl');
    for (var i=0;i<all.length;i++){
      all[i].classList.remove('oceaneye-scenario-hl');
      all[i].style.outline = '';
      all[i].style.outlineOffset = '';
      all[i].style.boxShadow = '';
      all[i].style.borderColor = '';
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

  // ---- STOP panel ----
    function buildStopPanel(scenario){
    var old = document.getElementById('oceaneyeRobotPanel');
    if (old) old.parentNode.removeChild(old);

    var box = document.createElement('div');
    box.id = 'oceaneyeRobotPanel';
    box.style.cssText = [
      'position:fixed','bottom:12px','right:12px','z-index:9999',
      'display:flex','align-items:center','gap:10px',
      'padding:10px 14px','background:rgba(6,20,32,0.95)',
      'border:1px solid rgba(255,71,87,0.6)','border-radius:4px',
      'font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#ff4757','letter-spacing:0.10em',
      'box-shadow:0 0 16px rgba(255,71,87,0.35)'
    ].join(';');

    var label = document.createElement('div');
    label.innerHTML = '\uD83D\uDD14 <b>RINGING</b> \u00B7 ' + (scenario || '').toUpperCase();
    label.style.cssText = 'flex:1;';

    var stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.textContent = '\u23F9 STOP';
    stopBtn.style.cssText = 'padding:8px 16px;background:rgba(255,71,87,0.18);border:1px solid #ff4757;color:#ff4757;border-radius:3px;cursor:pointer;font-family:inherit;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:bold;';
    stopBtn.onclick = function(){
      stopLoop();
      if (box.parentNode) box.parentNode.removeChild(box);
    };

    box.appendChild(label);
    box.appendChild(stopBtn);
    document.body.appendChild(box);
  }

  function removeStopPanel(){
    var p = document.getElementById('oceaneyeRobotPanel');
    if (p) p.parentNode.removeChild(p);
  }

  // ---- loop ----
  function clickCard(card){
    if (!card) return;
    try {
      card.click();
      // also fire pointer/mouse events for handlers bound via addEventListener
      var opts = { bubbles: true, cancelable: true, view: window };
      card.dispatchEvent(new MouseEvent('mousedown', opts));
      card.dispatchEvent(new MouseEvent('mouseup', opts));
    } catch(e){ console.warn('[alert-loop] click failed', e); }
  }

  function startLoop(card, scenario){
    stopLoop();
    clickCard(card);
    loopTimer = setInterval(function(){
      var c = card.isConnected ? card : findScenarioCard(scenario);
      if (c) clickCard(c);
    }, LOOP_MS);
    localStorage.setItem(ROBOT_KEY, '1');
    buildStopPanel(scenario);
    console.log('[alert-loop] started for', scenario);
  }

  function stopLoop(){
    if (loopTimer){ clearInterval(loopTimer); loopTimer = null; }
    if (window.oceaneyeVoice && window.oceaneyeVoice.stopAll) window.oceaneyeVoice.stopAll();
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

  // ---- update Last Scenario text ----
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

  // ---- bump Total Alerts number ----
  function bumpTotalAlerts(){
    var all = document.querySelectorAll('div,span,h1,h2,h3,h4');
    for (var i=0;i<all.length;i++){
      var t = (all[i].textContent || '').trim().toUpperCase();
      if (t === 'TOTAL ALERTS'){
        var sib = all[i].nextElementSibling;
        if (sib){
          var n = parseInt(sib.textContent, 10);
          if (isNaN(n) || n < 1) sib.textContent = '1';
        }
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
      if (localStorage.getItem(ROBOT_KEY) === '1'){ stopLoop(); removeStopPanel(); }
      clearHL();
      return;
    }

    // On Alert section
    if (!inc || inc.status !== 'DETECTED' || !inc.cause || !inc.cause.scenario){
      clearHL();
      return;
    }

    setLastScenario(inc.cause.scenario);
    bumpTotalAlerts();

    // Glow the scenario card
    var card = findScenarioCard(inc.cause.scenario);
    if (card) glow(card, inc.cause.confidence, inc.cause.scenario);

    // Auto-click the card and loop — once per incident
    if (inc.id !== lastHandledId && card){
      lastHandledId = inc.id;
      setTimeout(function(){
        if (onAlert() && card.isConnected){
          startLoop(card, inc.cause.scenario);
        }
      }, 400);
    } else if (localStorage.getItem(ROBOT_KEY) === '1' && !document.getElementById('oceaneyeRobotPanel')){
      buildStopPanel(inc.cause.scenario);
    }
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(){ setTimeout(tick, 100); });
    console.log('[alert-auto v6] subscribed');
  }

  setInterval(tick, 1500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[alert-auto v6] armed');
})();
