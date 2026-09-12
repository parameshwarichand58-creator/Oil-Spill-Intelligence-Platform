/* OCEAN EYE - Food Safety Voice Buttons
   Injects START / STOP buttons under the RECOMMENDED ACTION text.
   START says the recommended-action line. STOP silences.
*/
(function(){
  'use strict';

  var TEXT = 'IMMEDIATE CLOSURE of all downstream fishing zones. Public health advisory to coastal communities. Deploy seafood testing teams within 12 hours.';

  function readAction(){
    try {
      var all = document.querySelectorAll('div, section, article, p');
      for (var i=0;i<all.length;i++){
        var t = (all[i].textContent || '').trim();
        if (t.length < 30 || t.length > 800) continue;
        if (t.toUpperCase().indexOf('RECOMMENDED ACTION') >= 0){
          var s = t.replace(/RECOMMENDED ACTION/i, '').trim();
          if (s.length > 20) return s;
        }
      }
    } catch(e){}
    return TEXT;
  }

  function findRecommendedAnchor(){
    var all = document.querySelectorAll('div, section, article, p');
    for (var i=0;i<all.length;i++){
      var el = all[i];
      var t = (el.textContent || '').trim();
      if (t.length < 30 || t.length > 800) continue;
      if (t.toUpperCase().indexOf('RECOMMENDED ACTION') >= 0){
        // return a leaf-ish element
        var kids = el.querySelectorAll('div, p, span');
        return el;
      }
    }
    return null;
  }

  function build(){
    if (document.getElementById('oeFoodSafetyVoice')) return;
    var anchor = findRecommendedAnchor();
    if (!anchor) return;
    if (anchor.offsetParent === null) return;

    var wrap = document.createElement('div');
    wrap.id = 'oeFoodSafetyVoice';
    wrap.style.cssText = 'display:flex;gap:10px;margin-top:12px;justify-content:center;align-items:center;';

    var startBtn = document.createElement('button');
    startBtn.type = 'button';
    startBtn.textContent = '\u25B6 START VOICE ALERT';
    startBtn.style.cssText = "padding:9px 20px;background:rgba(255,71,87,0.12);border:1px solid rgba(255,71,87,0.55);color:#ff4757;border-radius:3px;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;";

    var stopBtn = document.createElement('button');
    stopBtn.type = 'button';
    stopBtn.textContent = '\u23F9 STOP';
    stopBtn.style.cssText = "padding:9px 20px;background:rgba(92,114,134,0.12);border:1px solid rgba(92,114,134,0.4);color:#5c7286;border-radius:3px;cursor:pointer;font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;";

    startBtn.onclick = function(ev){
      ev.stopPropagation();
      var msg = readAction();
      if (window.oceaneyeVoice && window.oceaneyeVoice.startLoop){
        window.oceaneyeVoice.startLoop(msg, 9000);
      }
      startBtn.textContent = '\uD83D\uDD0A VOICE ALERT: ON';
      startBtn.style.background = 'rgba(0,212,170,0.12)';
      startBtn.style.borderColor = 'rgba(0,212,170,0.55)';
      startBtn.style.color = '#00d4aa';
      stopBtn.style.background = 'rgba(255,71,87,0.15)';
      stopBtn.style.borderColor = 'rgba(255,71,87,0.55)';
      stopBtn.style.color = '#ff4757';
      console.log('[food-safety] START — speaking recommended action');
    };

    stopBtn.onclick = function(ev){
      ev.stopPropagation();
      if (window.oceaneyeVoice && window.oceaneyeVoice.stopAll) window.oceaneyeVoice.stopAll();
      startBtn.textContent = '\u25B6 START VOICE ALERT';
      startBtn.style.background = 'rgba(255,71,87,0.12)';
      startBtn.style.borderColor = 'rgba(255,71,87,0.55)';
      startBtn.style.color = '#ff4757';
      stopBtn.style.background = 'rgba(92,114,134,0.12)';
      stopBtn.style.borderColor = 'rgba(92,114,134,0.4)';
      stopBtn.style.color = '#5c7286';
      console.log('[food-safety] STOP');
    };

    wrap.appendChild(startBtn);
    wrap.appendChild(stopBtn);
    anchor.parentNode.insertBefore(wrap, anchor.nextSibling);
    console.log('[food-safety] buttons inserted');
  }

  function loop(){
    build();
    // don't re-insert if already present
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(loop, 400); });
  else setTimeout(loop, 400);
  setInterval(loop, 2000);

  console.log('[food-safety] armed');
})();
