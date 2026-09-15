/* OCEAN EYE — Food Safety Voice
   Injects START / STOP buttons under the RECOMMENDED ACTION text.
   Speaks ONLY the hardcoded 3 sentences. Never reads the DOM.
*/
(function(){
  'use strict';

  var TEXT = 'IMMEDIATE CLOSURE of all downstream fishing zones. Public health advisory to coastal communities. Deploy seafood testing teams within 12 hours.';
  var loopTimer = null;
  var voiceEnabled = false;

  function speakOnce(){
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(TEXT);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch(e){}
  }

  function start(){
    voiceEnabled = true;
    speakOnce();
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = setInterval(function(){
      if (!voiceEnabled){ clearInterval(loopTimer); loopTimer = null; return; }
      speakOnce();
    }, 9000);
  }

  function stop(){
    voiceEnabled = false;
    if (loopTimer){ clearInterval(loopTimer); loopTimer = null; }
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(e){}
  }

  function inject(){
    // Find the RECOMMENDED ACTION label
    var all = document.querySelectorAll('div, span, p');
    var label = null;
    for (var i=0;i<all.length;i++){
      var t = (all[i].textContent || '').trim().toUpperCase();
      if (t === 'RECOMMENDED ACTION'){ label = all[i]; break; }
    }
    if (!label) return;

    if (document.getElementById('oeFsaStart')) return;

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-top:8px;';

    var startBtn = document.createElement('button');
    startBtn.id = 'oeFsaStart';
    startBtn.textContent = '▶ START VOICE ALERT';
    startBtn.style.cssText = 'padding:6px 14px;background:linear-gradient(135deg,#22d37f,#059669);color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:"Share Tech Mono",monospace;font-size:11px;letter-spacing:0.1em;font-weight:700;';
    startBtn.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); start(); };

    var stopBtn = document.createElement('button');
    stopBtn.id = 'oeFsaStop';
    stopBtn.textContent = '⏹ STOP';
    stopBtn.style.cssText = 'padding:6px 14px;background:linear-gradient(135deg,#5c7286,#2d3a48);color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:"Share Tech Mono",monospace;font-size:11px;letter-spacing:0.1em;font-weight:700;';
    stopBtn.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); stop(); };

    row.appendChild(startBtn);
    row.appendChild(stopBtn);

    // insert right after the label
    if (label.parentNode){
      label.parentNode.insertBefore(row, label.nextSibling);
    }
  }

  function boot(){
    inject();
    setInterval(inject, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('[food-safety] armed — speaks only the recommended action text');
})();
