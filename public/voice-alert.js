(function(){
  if (window.__voiceAlert) return;
  window.__voiceAlert = true;

  var lastSpokenRisk = null;
  var voiceEnabled = false;   // OFF by default — must click START
  var toggleBtn = null;
  var unlocked = false;

  var ALERT_TEXT = 'Warning. An oil spill has occurred. The fishing areas must be closed immediately. Food safety teams need to be deployed to test the fish P A H levels.';

  function clean(t){
    return (t||'')
      .replace(/µg\/kg/g,'micrograms per kilogram')
      .replace(/µg\/L/g,'micrograms per litre')
      .replace(/IMMEDIATE/g,'Immediate')
      .replace(/CLOSURE/g,'closure')
      .replace(/MARPOL/g,'Mar-pol')
      .replace(/PAH/g,'P A H')
      .replace(/VOC/g,'V O C')
      .replace(/AQI/g,'A Q I')
      .replace(/\s+/g,' ')
      .trim();
  }

  function pickVoice(){
    var voices = window.speechSynthesis.getVoices();
    var preferred = ['Google UK English Male','Microsoft David','Daniel','Google US English','Microsoft Mark'];
    for (var p = 0; p < preferred.length; p++){
      for (var i = 0; i < voices.length; i++){
        if (voices[i].name.indexOf(preferred[p]) !== -1) return voices[i];
      }
    }
    for (var j = 0; j < voices.length; j++){
      if (/^en/i.test(voices[j].lang)) return voices[j];
    }
    return null;
  }

  function speak(text, silent){
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var c = clean(text);
    if (!c) return;
    var u = new SpeechSynthesisUtterance(c);
    u.rate = 0.88;
    u.pitch = 0.75;
    u.volume = silent ? 0 : 1.0;
    var v = pickVoice();
    if (v) u.voice = v;
    // Force LOOPING: when speech ends, replay after 3s if still enabled
    u.onend = function(){
      if (voiceEnabled && window.__alertLoop !== false){
        setTimeout(function(){
          if (voiceEnabled) speak(text);
        }, 3000);
      }
    };
    window.speechSynthesis.speak(u);
    if (!silent) console.log('[voice-alert] spoken ·', c);
  }

  function stopSpeaking(){
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  function readActionText(){
    var el = document.getElementById('fsAction');
    if (!el) return null;
    var t = (el.textContent || '').trim();
    if (!t || t === '—' || t.length < 5) return null;
    return t;
  }

  function unlock(){
    if (unlocked) return;
    unlocked = true;
    try { speak(' ', true); } catch(e){}
    setTimeout(function(){ try { speak(' ', true); } catch(e){} }, 400);
    console.log('[voice-alert] unlocked by user gesture');
  }

  function ensureToggle(){
    if (toggleBtn && document.body.contains(toggleBtn)) return;
    var panel = document.getElementById('foodSafetyPanel');
    if (!panel) return;

    // Container with START + STOP buttons side by side
    var wrap = document.createElement('div');
    wrap.id = 'voiceAlertControls';
    wrap.style.cssText = 'margin-top:12px;display:flex;gap:8px;';

    // START button
    var startBtn = document.createElement('button');
    startBtn.id = 'voiceAlertStart';
    startBtn.type = 'button';
    startBtn.textContent = '▶ START VOICE ALERT';
    startBtn.style.cssText =
      "flex:1;padding:8px 12px;" +
      "background:rgba(255,71,87,0.12);border:1px solid rgba(255,71,87,0.55);" +
      "color:#ff4757;border-radius:3px;cursor:pointer;" +
      "font-family:'Share Tech Mono',monospace;font-size:10px;" +
      "letter-spacing:0.12em;text-transform:uppercase;transition:all 0.2s;";

    // STOP button
    var stopBtn = document.createElement('button');
    stopBtn.id = 'voiceAlertStop';
    stopBtn.type = 'button';
    stopBtn.textContent = '⏹ STOP';
    stopBtn.style.cssText =
      "flex:0 0 90px;padding:8px 12px;" +
      "background:rgba(92,114,134,0.12);border:1px solid rgba(92,114,134,0.4);" +
      "color:#5c7286;border-radius:3px;cursor:pointer;" +
      "font-family:'Share Tech Mono',monospace;font-size:10px;" +
      "letter-spacing:0.12em;text-transform:uppercase;transition:all 0.2s;";

    startBtn.onclick = function(ev){
      ev.stopPropagation();
      unlock();
      voiceEnabled = true;
      var msg = readActionText() || ALERT_TEXT;
      speak(msg);
      startBtn.textContent = '🔊 VOICE ALERT: ON';
      startBtn.style.background = 'rgba(0,212,170,0.12)';
      startBtn.style.borderColor = 'rgba(0,212,170,0.55)';
      startBtn.style.color = '#00d4aa';
      stopBtn.style.background = 'rgba(255,71,87,0.15)';
      stopBtn.style.borderColor = 'rgba(255,71,87,0.55)';
      stopBtn.style.color = '#ff4757';
      console.log('[voice-alert] START clicked — looping enabled');
    };

    stopBtn.onclick = function(ev){
      ev.stopPropagation();
      voiceEnabled = false;
      stopSpeaking();
      startBtn.textContent = '▶ START VOICE ALERT';
      startBtn.style.background = 'rgba(255,71,87,0.12)';
      startBtn.style.borderColor = 'rgba(255,71,87,0.55)';
      startBtn.style.color = '#ff4757';
      stopBtn.style.background = 'rgba(92,114,134,0.12)';
      stopBtn.style.borderColor = 'rgba(92,114,134,0.4)';
      stopBtn.style.color = '#5c7286';
      console.log('[voice-alert] STOP clicked — looping halted');
    };

    wrap.appendChild(startBtn);
    wrap.appendChild(stopBtn);
    panel.appendChild(wrap);

    toggleBtn = startBtn;
    console.log('[voice-alert] START/STOP controls added');
  }

  function check(){
    var riskEl = document.getElementById('fsRisk');
    if (!riskEl) return;
    ensureToggle();
    // NOTE: automatic looping removed — voice only triggers on START button
  }

  if (window.speechSynthesis){
    window.speechSynthesis.onvoiceschanged = function(){};
  }

  // Remove old single toggle button if it exists
  var old = document.getElementById('voiceAlertToggle');
  if (old && old.parentNode) old.parentNode.removeChild(old);

  setInterval(check, 3000);
  console.log('[voice-alert] armed — manual START/STOP only, no auto-loop');
})();
