/* OCEAN EYE - Voice Alert
   START button in Food Safety panel -> speaks ONLY the recommended action text.
   STOP silences. Nothing auto-triggers.
*/
(function(){
  'use strict';

  var voiceEnabled = false;
  var ALERT_TEXT = 'IMMEDIATE CLOSURE of all downstream fishing zones. Public health advisory to coastal communities. Deploy seafood testing teams within 12 hours.';
  var loopTimer = null;

  function speakOnce(text){
    try {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch(e){}
  }

  function start(){
    voiceEnabled = true;
    // Always speak ONLY the hardcoded recommended-action text. Never read the DOM.
    speakOnce(ALERT_TEXT);
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = setInterval(function(){
      if (!voiceEnabled){ clearInterval(loopTimer); loopTimer = null; return; }
      speakOnce(ALERT_TEXT);
    }, 9000);
  }

  function stop(){
    voiceEnabled = false;
    if (loopTimer){ clearInterval(loopTimer); loopTimer = null; }
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(e){}
  }

  window.oceaneyeVoice = {
    speakOnce: speakOnce,
    startLoop: function(msg){ speakOnce(msg); },
    stopAll: stop,
    start: start,
    stop: stop,
    isOn: function(){ return voiceEnabled; }
  };

  console.log('[voice] armed — speaks only the recommended action text');
})();
