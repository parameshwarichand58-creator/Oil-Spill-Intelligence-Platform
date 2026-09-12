/* OCEAN EYE - Voice Engine
   Exposes window.oceaneyeVoice with speakOnce / startLoop / stopAll / isPlaying.
   No UI here — buttons live in the sections that need them.
*/
(function(){
  'use strict';
  var loopTimer = null;
  var loopMsg = '';
  var playing = false;

  function _speak(text){
    try {
      if (!window.speechSynthesis || !text) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.pitch = 1.0; u.volume = 1.0;
      window.speechSynthesis.speak(u);
    } catch(e){}
  }

  function speakOnce(text){
    stopAll();
    _speak(text);
    playing = true;
    setTimeout(function(){ playing = false; }, 8000);
  }

  function startLoop(text, everyMs){
    stopAll();
    loopMsg = text || '';
    if (!loopMsg) return;
    playing = true;
    _speak(loopMsg);
    var interval = everyMs || 9000;
    loopTimer = setInterval(function(){
      if (!loopMsg) return;
      _speak(loopMsg);
    }, interval);
  }

  function stopAll(){
    loopMsg = '';
    playing = false;
    if (loopTimer){ clearInterval(loopTimer); loopTimer = null; }
    try { window.speechSynthesis.cancel(); } catch(e){}
  }

  window.oceaneyeVoice = {
    speakOnce: speakOnce,
    startLoop: startLoop,
    stopAll: stopAll,
    isPlaying: function(){ return playing; }
  };

  console.log('[voice] engine ready');
})();
