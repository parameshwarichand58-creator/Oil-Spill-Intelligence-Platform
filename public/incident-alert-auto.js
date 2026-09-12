/* OCEAN EYE - Auto Alert (v2)
   - Highlights ALL matching scenario cards (Alert section AND Map)
   - Highlights "Last Scenario" text
   - Adds entry to Recent Alerts list
   - Auto-starts voice alert (clicks existing START button)
   - Loops until STOP; resumes on next page gesture
*/
(function(){
  'use strict';
  var lastHandledId = null;
  var VOICE_FLAG_KEY = 'oceaneye.voiceRinging';

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

  function applyGlow(el, conf){
    if (el.classList.contains('oceaneye-scenario-hl')) return;
    el.classList.add('oceaneye-scenario-hl');
    el.style.outline = '2px solid #4a9eff';
    el.style.boxShadow = '0 0 18px rgba(74,158,255,0.55)';
    var existing = el.querySelectorAll('.oceaneye-ai-tag'); for (var z=0; z<existing.length; z++){ existing[z].parentNode.removeChild(existing[z]); } if (!el.querySelector('.oceaneye-ai-tag')){
      var tag = document.createElement('span');
      tag.className = 'oceaneye-ai-tag';
      tag.style.cssText = 'display:block;margin-top:6px;font-family:"Share Tech Mono",monospace;font-size:9px;letter-spacing:0.10em;color:#4a9eff;text-transform:uppercase;';
      tag.textContent = '\u25C9 AI SELECTED \u00B7 ' + (conf || '--') + '%';
      el.appendChild(tag);
    }
  }

  function highlightScenario(key, label, conf){
    clearHighlight();
    if (!label) return 0;

    var needle = label.toLowerCase().trim();
    var hits = [];

    // 1) Explicit selectors (in case cards have known classes)
    var explicit = document.querySelectorAll(
      '[data-scenario], .scenario-card, .scenario-btn, .scenario-option, .threat-card, .threat-btn'
    );
    for (var e=0; e<explicit.length; e++){
      var et = (explicit[e].textContent || '').toLowerCase();
      if (et.indexOf(needle) >= 0) hits.push(explicit[e]);
    }

    // 2) Generic search across whole DOM
    var all = document.querySelectorAll('div, button, li, article, section');
    var generic = [];
    for (var i=0;i<all.length;i++){
      var el = all[i];
      if (el.id && el.id.indexOf('oceaneye') === 0) continue;
      if (el.closest && el.closest('#oceaneyeAlertToast')) continue;
      if (el.closest && el.closest('#oceaneyeRealMapWrap')) continue;
      if (el.closest && el.closest('#oceaneyeReviewCase')) continue;
      var txt = (el.textContent || '').trim();
      if (txt.length === 0 || txt.length > 220) continue;
      if (txt.toLowerCase().indexOf(needle) >= 0) generic.push(el);
    }

    // keep smallest of generics (leaf-level elements only)
    var leaves = generic.filter(function(el){
      return !generic.some(function(o){ return o !== el && el.contains(o); });
    });

    // merge + dedupe
    var merged = [];
    for (var m=0;m<hits.length;m++) if (merged.indexOf(hits[m]) === -1) merged.push(hits[m]);
    for (var n=0;n<leaves.length;n++) if (merged.indexOf(leaves[n]) === -1) merged.push(leaves[n]);

    for (var j=0;j<merged.length;j++) applyGlow(merged[j], conf); console.log('[alert-auto] applied glow to', merged.length, 'elements');
    console.log('[alert-auto] highlighted', merged.length, 'elements for', label);
    return merged.length;
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

  function startVoice(){
    var btn = document.getElementById('voiceAlertStart');
    if (!btn) return false;
    var txt = (btn.textContent || '').toLowerCase();
    if (txt.indexOf('voice alert: on') >= 0) return true;
    try {
      btn.click();
      localStorage.setItem(VOICE_FLAG_KEY, '1');
      console.log('[alert-auto] voice started');
      return true;
    } catch(e){ return false; }
  }

  function resumeVoiceOnGesture(){
    if (localStorage.getItem(VOICE_FLAG_KEY) !== '1') return;
    var btn = document.getElementById('voiceAlertStart');
    if (!btn) return;
    var txt = (btn.textContent || '').toLowerCase();
    if (txt.indexOf('voice alert: on') >= 0) return;
    try { btn.click(); console.log('[alert-auto] voice resumed'); } catch(e){}
  }
  ['click','keydown','touchstart'].forEach(function(evt){
    window.addEventListener(evt, resumeVoiceOnGesture, { passive: true });
  });

  setInterval(function(){
    var btn = document.getElementById('voiceAlertStop');
    if (btn && !btn.__wired){
      btn.__wired = true;
      btn.addEventListener('click', function(){
        localStorage.removeItem(VOICE_FLAG_KEY);
        console.log('[alert-auto] STOP — flag cleared');
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

    if (fresh) setTimeout(startVoice, 500);
    console.log('[alert-auto] handled', inc.id, '->', inc.cause.scenario, 'fresh:', fresh);
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(handleIncident);
    console.log('[alert-auto] subscribed');
  }

  // Re-apply glow whenever user navigates and the highlight is missing
  setInterval(function(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (!inc || !inc.cause || !inc.cause.scenario) return;
    var current = document.querySelector('.oceaneye-scenario-hl');
    if (!current){
      highlightScenario(inc.cause.key || 'collision', inc.cause.scenario, inc.cause.confidence);
    }
    updateLastScenario(inc.cause.scenario);
    addRecentAlert(inc);
  }, 1200);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[alert-auto v2] armed');
})();
