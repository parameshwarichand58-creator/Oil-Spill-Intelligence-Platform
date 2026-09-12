/* OCEAN EYE - Auto Alert (v3)
   Voice rings ONLY on the Alert section.
   Message = scenario announcement + recommended action.
   On any other page: no auto-ring.
*/
(function(){
  'use strict';
  var lastHandledId = null;
  var VOICE_FLAG_KEY = 'oceaneye.voiceRinging';
  var lastStartAttempt = 0;

  function isOnAlertSection(){
    // The Alert section contains "Select Scenario" and the 6 scenario cards.
    var nodes = document.querySelectorAll('h1,h2,h3,h4,div,span,p');
    for (var i=0;i<nodes.length;i++){
      var t = (nodes[i].textContent || '').trim();
      if (t === 'Select Scenario') return true;
      if (t === 'Alert System') return true;
    }
    return false;
  }

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

  function highlightScenario(key, label, conf){
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
    // keep only leaf-most (smallest) elements
    var leaves = candidates.filter(function(el){
      return !candidates.some(function(o){ return o !== el && el.contains(o); });
    });
    // pick the largest one among leaves (so we highlight the whole card)
    var best = null;
    for (var j=0;j<leaves.length;j++){
      if (!best || leaves[j].textContent.length > best.textContent.length) best = leaves[j];
    }
    if (best) applyGlow(best, conf);
    console.log('[alert-auto] highlighted', best ? 1 : 0, 'card for', label);
    return best ? 1 : 0;
  }

  function updateLastScenario(label){
    var all = document.querySelectorAll('div, span, h1, h2, h3, h4, p');
    for (var i=0;i<all.length;i++){
      var t = (all[i].textContent || '').trim().toUpperCase();
      if (t === 'LAST SCENARIO'){
        var p = all[i].parentElement;
        if (!p) continue;
        var val = p.querySelector('[data-oceaneye-last-scenario]');
        if (!val){ var sib = all[i].nextElementSibling; if (sib) val = sib; }
        if (val){ val.setAttribute('data-oceaneye-last-scenario','1'); val.textContent = (label || '').toUpperCase(); }
        return;
      }
    }
  }

  function buildVoiceMessage(inc){
    var parts = [];
    if (inc && inc.cause && inc.cause.scenario){
      parts.push('Alert. ' + inc.cause.scenario + ' detected.');
      if (inc.cause.confidence) parts.push('Confidence ' + inc.cause.confidence + ' percent.');
    }
    // Recommended action text
    var action = '';
    try {
      var all = document.querySelectorAll('div, section, article, p');
      for (var i=0;i<all.length;i++){
        var el = all[i];
        var t = (el.textContent || '').trim();
        if (t.length < 30 || t.length > 800) continue;
        if (t.toUpperCase().indexOf('RECOMMENDED ACTION') >= 0){
          action = t.replace(/RECOMMENDED ACTION/i, '').trim();
          break;
        }
      }
      if (!action){
        for (var j=0;j<all.length;j++){
          var t2 = (all[j].textContent || '').trim();
          if (t2.length >= 30 && t2.length <= 800 && t2.toUpperCase().indexOf('IMMEDIATE CLOSURE') >= 0){
            action = t2; break;
          }
        }
      }
    } catch(e){}
    if (action) parts.push(action);
    return parts.join(' ');
  }

  function speakNow(text){
    try {
      if (!window.speechSynthesis) return false;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
      return true;
    } catch(e){ return false; }
  }

  function startVoiceOnAlert(){
    var now = Date.now();
    if (now - lastStartAttempt < 4000) return;  // debounce
    lastStartAttempt = now;

    if (!isOnAlertSection()){ console.log('[alert-auto] not on alert section — skip'); return; }

    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (!inc || inc.status !== 'DETECTED'){ console.log('[alert-auto] no active incident'); return; }

    var msg = buildVoiceMessage(inc);
    if (!msg){ console.log('[alert-auto] no message'); return; }

    // Press the existing START button first (keeps its loop flag in sync)
    var btn = document.getElementById('voiceAlertStart');
    if (btn && (btn.textContent || '').toLowerCase().indexOf('voice alert: on') === -1){
      try { btn.click(); } catch(e){}
    }
    // Cancel the loop's first utterance and speak our message immediately
    setTimeout(function(){
      speakNow(msg);
      console.log('[alert-auto] spoke:', msg.slice(0, 80) + '...');
    }, 200);
  }

  function addRecentAlert(inc){
    var list = document.querySelector('#recentAlertsList, .recent-alerts-list, [data-recent-alerts], #recent-alerts');
    if (!list){
      var heads = document.querySelectorAll('h1,h2,h3,h4');
      for (var i=0;i<heads.length;i++){
        if (/recent alerts/i.test(heads[i].textContent || '')){
          var sec = heads[i].closest('div, section');
          if (sec){
            var cand = sec.querySelector('ul, ol, [role="list"]');
            if (cand){ list = cand; break; }
          }
        }
      }
    }
    if (!list) list = document.querySelector('.alert-list, .alerts-list');
    if (!list) return false;
    if (list.querySelector('[data-incident="' + inc.id + '"]')) return true;
    var li = document.createElement('div');
    li.setAttribute('data-incident', inc.id);
    li.style.cssText = 'padding:8px 10px;margin:6px 0;background:rgba(74,158,255,0.08);border-left:3px solid #4a9eff;border-radius:3px;font-family:"Share Tech Mono",monospace;font-size:11px;color:#cbd5e1;';
    var t = new Date().toLocaleTimeString();
    var label = (inc.cause && inc.cause.scenario) ? inc.cause.scenario.toUpperCase() : 'ANALYZING';
    var icon  = (inc.cause && inc.cause.icon) || '';
    li.innerHTML =
      '<div style="color:#4a9eff;font-weight:bold;">' + t + ' \u00b7 ' + icon + ' ' + label + '</div>' +
      '<div style="opacity:0.75;">Incident ' + inc.id + ' \u00b7 auto-triggered \u00b7 ' +
        ((inc.detection && inc.detection.confidence) || '--') + '% confidence</div>';
    list.insertBefore(li, list.firstChild);
    return true;
  }

  function handleIncident(inc){
    if (!inc || inc.status !== 'DETECTED') return;
    if (!inc.cause || !inc.cause.scenario) return;

    // Always update visuals (anywhere the elements exist)
    highlightScenario(inc.cause.key || 'collision', inc.cause.scenario, inc.cause.confidence);
    updateLastScenario(inc.cause.scenario);
    addRecentAlert(inc);

    // Voice: only on alert section
    if (inc.id !== lastHandledId){
      lastHandledId = inc.id;
      if (isOnAlertSection()) setTimeout(startVoiceOnAlert, 400);
    }
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(handleIncident);
    console.log('[alert-auto v3] subscribed');
  }

  // Periodic re-apply on section change + auto-ring when entering Alert
  setInterval(function(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (!inc || !inc.cause || !inc.cause.scenario) return;

    highlightScenario(inc.cause.key || 'collision', inc.cause.scenario, inc.cause.confidence);
    updateLastScenario(inc.cause.scenario);
    addRecentAlert(inc);

    if (isOnAlertSection()){
      var btn = document.getElementById('voiceAlertStart');
      var alreadyOn = btn && (btn.textContent || '').toLowerCase().indexOf('voice alert: on') >= 0;
      if (!alreadyOn) startVoiceOnAlert();
    }
  }, 1500);

  // STOP clears flag
  setInterval(function(){
    var btn = document.getElementById('voiceAlertStop');
    if (btn && !btn.__wired){
      btn.__wired = true;
      btn.addEventListener('click', function(){
        localStorage.removeItem(VOICE_FLAG_KEY);
        console.log('[alert-auto] STOP clicked');
      });
    }
  }, 1500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[alert-auto v3] armed — voice only on Alert section');
})();
