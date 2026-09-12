/* OCEAN EYE - Voice Alert (manual control)
   START button -> speaks RECOMMENDED ACTION once, then silent.
   STOP button  -> cancels everything.
   The auto-loop (scenario) is handled by incident-alert-auto.js.
*/
(function(){
  'use strict';

  var voiceEnabled = false;
  var loopTimer = null;
  var loopMsg = '';

  function readRecommendedAction(){
    try {
      var all = document.querySelectorAll('div, section, article, p');
      for (var i=0;i<all.length;i++){
        var el = all[i];
        var t = (el.textContent || '').trim();
        if (t.length < 30 || t.length > 800) continue;
        if (t.toUpperCase().indexOf('RECOMMENDED ACTION') >= 0){
          return t.replace(/RECOMMENDED ACTION/i, '').trim();
        }
      }
      for (var j=0;j<all.length;j++){
        var t2 = (all[j].textContent || '').trim();
        if (t2.length >= 30 && t2.length <= 800 && t2.toUpperCase().indexOf('IMMEDIATE CLOSURE') >= 0){
          return t2;
        }
      }
    } catch(e){}
    return '';
  }

  function speakOnce(text){
    try {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch(e){}
  }

  // Expose for incident-alert-auto.js
  window.oceaneyeVoice = {
    speakOnce: speakOnce,
    startLoop: function(msg){
      voiceEnabled = true;
      loopMsg = msg || '';
      if (loopTimer) clearInterval(loopTimer);
      var cycle = function(){
        if (!voiceEnabled) return;
        speakOnce(loopMsg);
      };
      cycle();
      loopTimer = setInterval(cycle, 5000);   // repeat every 5 seconds
    },
    stopAll: function(){
      voiceEnabled = false;
      loopMsg = '';
      if (loopTimer){ clearInterval(loopTimer); loopTimer = null; }
      try { window.speechSynthesis.cancel(); } catch(e){}
    },
    isOn: function(){ return voiceEnabled; }
  };

  function buildUI(){
    // find or create a container
    var panel = document.getElementById('voiceAlertPanel');
    if (!panel){
      // create a small floating panel bottom-right
      panel = document.createElement('div');
      panel.id = 'voiceAlertPanel';
      panel.style.cssText = [
        'position:fixed','bottom:12px','right:12px','z-index:9998',
        'display:flex','gap:6px','padding:6px',
        'background:rgba(6,20,32,0.92)',
        'border:1px solid rgba(0,212,170,0.45)','border-radius:4px'
      ].join(';');
      document.body.appendChild(panel);
    }
    if (document.getElementById('voiceAlertStart')) return;

    var startBtn = document.createElement('button');
    startBtn.id = 'voiceAlertStart';
    startBtn.type = 'button';
    startBtn.textContent = '\u25B6 START VOICE ALERT';
    startBtn.style.cssText = [
      'padding:8px 12px','background:rgba(255,71,87,0.12)',
      'border:1px solid rgba(255,71,87,0.55)','color:#ff4757',
      'border-radius:3px','cursor:pointer',
      'font-family:"Share Tech Mono",monospace','font-size:10px',
      'letter-spacing:0.12em','text-transform:uppercase'
    ].join(';');

    var stopBtn = document.createElement('button');
    stopBtn.id = 'voiceAlertStop';
    stopBtn.type = 'button';
    stopBtn.textContent = '\u23F9 STOP';
    stopBtn.style.cssText = [
      'padding:8px 12px','background:rgba(92,114,134,0.12)',
      'border:1px solid rgba(92,114,134,0.4)','color:#5c7286',
      'border-radius:3px','cursor:pointer',
      'font-family:"Share Tech Mono",monospace','font-size:10px',
      'letter-spacing:0.12em','text-transform:uppercase'
    ].join(';');

    startBtn.onclick = function(){
      // STOP the auto-loop first
      if (window.oceaneyeVoice && window.oceaneyeVoice.stopAll) window.oceaneyeVoice.stopAll();
      var msg = readRecommendedAction();
      if (!msg) msg = 'Immediate closure of all downstream fishing zones. Public health advisory to coastal communities. Deploy seafood testing teams within 12 hours.';
      speakOnce(msg);
      startBtn.textContent = '\uD83D\uDD0A VOICE ALERT: ON';
      startBtn.style.background = 'rgba(0,212,170,0.12)';
      startBtn.style.borderColor = 'rgba(0,212,170,0.55)';
      startBtn.style.color = '#00d4aa';
      stopBtn.style.background = 'rgba(255,71,87,0.15)';
      stopBtn.style.borderColor = 'rgba(255,71,87,0.55)';
      stopBtn.style.color = '#ff4757';
      console.log('[voice] spoke recommended action once');
    };

    stopBtn.onclick = function(){
      if (window.oceaneyeVoice && window.oceaneyeVoice.stopAll) window.oceaneyeVoice.stopAll();
      startBtn.textContent = '\u25B6 START VOICE ALERT';
      startBtn.style.background = 'rgba(255,71,87,0.12)';
      startBtn.style.borderColor = 'rgba(255,71,87,0.55)';
      startBtn.style.color = '#ff4757';
      stopBtn.style.background = 'rgba(92,114,134,0.12)';
      stopBtn.style.borderColor = 'rgba(92,114,134,0.4)';
      stopBtn.style.color = '#5c7286';
      console.log('[voice] stopped');
    };

    panel.appendChild(startBtn);
    panel.appendChild(stopBtn);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI);
  else buildUI();
  console.log('[voice] armed — manual control only, no internal loop');
})();
