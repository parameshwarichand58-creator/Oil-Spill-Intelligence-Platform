/* OCEAN EYE - Auto Alert: scenario highlight + auto-voice ring
   - Auto-highlights the AI-inferred scenario on the Alert page
   - Auto-starts the voice alert (clicks the existing START button)
   - Voice loops until STOP is clicked (handled by voice-alert.js)
   - If you navigate to another page, the first click resumes the ring
   - Manual scenario buttons stay clickable (untouched)
*/
(function(){
  'use strict';
  var lastHandledId = null;
  var VOICE_FLAG_KEY = 'oceaneye.voiceRinging';

  function findScenarioCard(key){
    var rx = {
      collision: /collision/i,
      theft:     /theft|culprit/i,
      seepage:   /natural seepage/i,
      weather:   /weather|storm/i,
      internal:  /internal failure/i,
      fire:      /fire|explosion/i
    }[key] || /./;
    var all = document.querySelectorAll('div, button, li, article');
    var best = null;
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.id && el.id.indexOf('oceaneye') === 0) continue;
      if (el.closest && el.closest('#oceaneyeAlertToast')) continue;
      var t = (el.textContent || '').trim();
      if (!t || t.length > 220) continue;
      if (rx.test(t)){
        if (!best || t.length < (best.textContent||'').length) best = el;
      }
    }
    return best;
  }

  function clearHighlight(){
    var all = document.querySelectorAll('.oceaneye-scenario-hl');
    for (var i=0;i<all.length;i++){
      all[i].classList.remove('oceaneye-scenario-hl');
      all[i].style.outline = '';
      all[i].style.boxShadow = '';
      var tag = all[i].querySelector('.oceaneye-ai-tag');
      if (tag && tag.parentNode) tag.parentNode.removeChild(tag);
    }
  }

  function highlightScenario(key, label, conf){
    clearHighlight();
    var card = findScenarioCard(key);
    if (!card) return false;
    card.classList.add('oceaneye-scenario-hl');
    card.style.outline = '2px solid #4a9eff';
    card.style.boxShadow = '0 0 18px rgba(74,158,255,0.55)';
    if (card.style.borderColor !== undefined) card.style.borderColor = '#4a9eff';
    var tag = document.createElement('div');
    tag.className = 'oceaneye-ai-tag';
    tag.style.cssText = 'margin-top:6px;font-family:"Share Tech Mono",monospace;font-size:9px;letter-spacing:0.10em;color:#4a9eff;text-transform:uppercase;';
    tag.textContent = '\u25C9 AI SELECTED \u00b7 ' + (conf || '--') + '%';
    card.appendChild(tag);
    return true;
  }

  function updateLastScenario(label){
    var all = document.querySelectorAll('div, span, h1, h2, h3, h4, p');
    for (var i=0;i<all.length;i++){
      var t = (all[i].textContent || '').trim().toUpperCase();
      if (t === 'LAST SCENARIO'){
        var p = all[i].parentElement;
        if (!p) continue;
        var val = p.querySelector('[data-oceaneye-last-scenario]');
        if (!val){
          var sib = all[i].nextElementSibling;
          if (sib) val = sib;
        }
        if (val){
          val.setAttribute('data-oceaneye-last-scenario','1');
          val.textContent = (label || '').toUpperCase();
        }
        return;
      }
    }
  }

  function addRecentAlert(inc){
    // try common containers first
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
    if (!list){
      // last resort: the alert page container
      list = document.querySelector('.alert-list, .alerts-list');
    }
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

  function startVoice(){
    var btn = document.getElementById('voiceAlertStart');
    if (!btn) return false;
    var txt = (btn.textContent || '').toLowerCase();
    if (txt.indexOf('voice alert: on') >= 0) return true;   // already on
    try {
      btn.click();
      localStorage.setItem(VOICE_FLAG_KEY, '1');
      console.log('[alert-auto] voice started');
      return true;
    } catch(e){ return false; }
  }

  // if user clicked anywhere on a new page and the ring was supposed to be active,
  // resume it (needed because browsers require a user gesture per page)
  function resumeVoiceOnGesture(){
    if (localStorage.getItem(VOICE_FLAG_KEY) !== '1') return;
    var btn = document.getElementById('voiceAlertStart');
    if (!btn) return;
    var txt = (btn.textContent || '').toLowerCase();
    if (txt.indexOf('voice alert: on') >= 0) return;
    try { btn.click(); console.log('[alert-auto] voice resumed after gesture'); } catch(e){}
  }
  ['click','keydown','touchstart'].forEach(function(evt){
    window.addEventListener(evt, resumeVoiceOnGesture, { once: false, passive: true });
  });

  // watch STOP — clear the "ringing" flag when user stops
  setInterval(function(){
    var btn = document.getElementById('voiceAlertStop');
    if (btn && !btn.__wired){
      btn.__wired = true;
      btn.addEventListener('click', function(){
        localStorage.removeItem(VOICE_FLAG_KEY);
        console.log('[alert-auto] STOP clicked — flag cleared');
      });
    }
  }, 1500);

  function handleIncident(inc){
    if (!inc || inc.status !== 'DETECTED') return;
    if (!inc.cause || !inc.cause.scenario) return;
    var fresh = (Date.now() - new Date(inc.createdAt || 0).getTime()) < 20000;

    highlightScenario(inc.cause.key || 'collision', inc.cause.scenario, inc.cause.confidence);
    updateLastScenario(inc.cause.scenario);
    addRecentAlert(inc);

    if (inc.id === lastHandledId) return;
    lastHandledId = inc.id;

    if (fresh){
      // small delay so Alert page / scenario buttons are visible if user is there
      setTimeout(startVoice, 500);
    }
    console.log('[alert-auto] handled', inc.id, '->', inc.cause.scenario, 'fresh:', fresh);
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(handleIncident);
    console.log('[alert-auto] subscribed');
  }

  // periodic: reapply highlight if user navigates to Alert page later
  setInterval(function(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (!inc || !inc.cause) return;
    if (!document.querySelector('.oceaneye-scenario-hl')){
      highlightScenario(inc.cause.key || 'collision', inc.cause.scenario, inc.cause.confidence);
    }
    updateLastScenario(inc.cause.scenario);
    addRecentAlert(inc);
  }, 2500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[alert-auto] armed');
})();
