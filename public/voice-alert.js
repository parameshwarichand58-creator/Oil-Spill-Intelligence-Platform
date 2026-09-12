/* OCEAN EYE - Voice Alert (original behavior)
   - START button in Food Safety panel -> speaks recommended action, loops
   - STOP button -> silences
   - Nothing auto-triggers
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

  function readActionText(){
    try {
      var all = document.querySelectorAll('div, section, article, p');
      for (var i=0;i<all.length;i++){
        var el = all[i];
        var t = (el.textContent || '').trim();
        if (t.length < 30 || t.length > 800) continue;
        if (t.toUpperCase().indexOf('RECOMMENDED ACTION') >= 0){
          var s = t.replace(/RECOMMENDED ACTION/i, '').trim();
          if (s.length > 20) return s;
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

  function start(){
    voiceEnabled = true;
    var msg = readActionText() || ALERT_TEXT;
    speakOnce(msg);
    if (loopTimer) clearInterval(loopTimer);
    loopTimer = setInterval(function(){
      if (!voiceEnabled){ clearInterval(loopTimer); loopTimer = null; return; }
      speakOnce(msg);
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

  console.log('[voice] armed — manual START/STOP only');
})();
