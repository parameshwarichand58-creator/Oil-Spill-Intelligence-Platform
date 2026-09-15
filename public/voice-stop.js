/* OCEAN EYE — Global Voice STOP
   Adds a STOP button next to every SEND button on the Dispatch page,
   and a STOP button inside every alert toast that appears.
   Kills all speech synthesis. Nothing else changes.
*/
(function(){
  'use strict';

  var STOP_CLASS = 'oeStopVoiceBtn';

  function stopAllVoice(){
    window.speechSynthesis.cancel();
    if (window.oceaneyeVoice && window.oceaneyeVoice.stopAll){
      try { window.oceaneyeVoice.stopAll(); } catch(e){}
    }
    console.log('[voice-stop] all speech cancelled');
  }

  function makeStopButton(){
    var b = document.createElement('button');
    b.textContent = 'STOP VOICE';
    b.className = STOP_CLASS;
    b.style.cssText = 'padding:10px 20px;background:linear-gradient(135deg,#5c7286,#2d3a48);color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:"Share Tech Mono",monospace;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;margin-left:10px;';
    b.onclick = function(ev){
      ev.preventDefault();
      ev.stopPropagation();
      stopAllVoice();
    };
    return b;
  }

  function addStopToPage(){
    var allBtns = document.querySelectorAll('button');
    allBtns.forEach(function(btn){
      var txt = (btn.textContent || '').toUpperCase();
      if (txt.indexOf('SEND EMERGENCY DISPATCH') >= 0 || txt.indexOf('SEND ECO-PROTECTION') >= 0){
        if (btn.parentNode && btn.parentNode.querySelector('.' + STOP_CLASS)) return;
        var stop = makeStopButton();
        btn.parentNode.insertBefore(stop, btn.nextSibling);
      }
    });
  }

  function addStopToToast(){
    var toasts = [
      document.getElementById('oeDispatchToast'),
      document.getElementById('oceaneyeDispatchAlert')
    ];
    toasts.forEach(function(t){
      if (!t) return;
      if (t.querySelector('.' + STOP_CLASS)) return;
      var stop = makeStopButton();
      stop.style.marginTop = '10px';
      stop.style.marginLeft = '10px';
      t.appendChild(stop);
    });
  }

  function loop(){
    try { addStopToPage(); } catch(e){}
    try { addStopToToast(); } catch(e){}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(loop, 500);
      setInterval(loop, 1500);
    });
  } else {
    setTimeout(loop, 500);
    setInterval(loop, 1500);
  }

  console.log('[voice-stop] armed');
})();
