/* OCEAN EYE - Voice Alert (auto-speak + STOP button only)
   - Auto-plays recommended action on Alert section (triggered elsewhere)
   - STOP button silences everything
   - No START button
*/
(function(){
  'use strict';

  function speakOnce(text){
    try {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch(e){}
  }

  function stopAll(){
    try { window.speechSynthesis.cancel(); } catch(e){}
    try { if (window.oceaneyeVoice) window.oceaneyeVoice._playing = false; } catch(e){}
  }

  function buildStopButton(){
    if (document.getElementById('voiceAlertStop')) return;
    var btn = document.createElement('button');
    btn.id = 'voiceAlertStop';
    btn.type = 'button';
    btn.textContent = '\u23F9 STOP';
    btn.style.cssText = [
      'position:fixed','bottom:12px','right:12px','z-index:9999',
      'padding:10px 18px',
      'background:rgba(255,71,87,0.15)',
      'border:1px solid #ff4757','color:#ff4757',
      'border-radius:4px','cursor:pointer',
      'font-family:"Share Tech Mono",monospace','font-size:12px',
      'letter-spacing:0.14em','text-transform:uppercase',
      'box-shadow:0 0 12px rgba(255,71,87,0.35)',
      'display:none'
    ].join(';');
    btn.onclick = function(){
      stopAll();
      hideStop();
      console.log('[voice] STOP pressed');
    };
    document.body.appendChild(btn);
  }

  function showStop(){
    buildStopButton();
    var b = document.getElementById('voiceAlertStop');
    if (b) b.style.display = 'block';
  }

  function hideStop(){
    var b = document.getElementById('voiceAlertStop');
    if (b) b.style.display = 'none';
  }

  window.oceaneyeVoice = {
    speakOnce: speakOnce,
    stopAll: stopAll,
    startLoop: function(msg){ speakOnce(msg); showStop(); },
    isOn: function(){ return true; },
    showPanel: function(){ showStop(); },
    hidePanel: function(){ /* keep STOP visible until clicked; do not auto-hide on section change */ }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildStopButton);
  else buildStopButton();

  console.log('[voice] armed — auto-speak + STOP button only');
})();
