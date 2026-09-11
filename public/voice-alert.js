(function(){
  if (window.__voiceAlert) return;
  window.__voiceAlert = true;

  var lastSpokenRisk = null;
  var voiceEnabled = true;
  var toggleBtn = null;
  var unlocked = false;

  // Clean text for speech — remove special chars that confuse TTS
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
    window.speechSynthesis.speak(u);
    if (!silent) console.log('[voice-alert] spoken ·', c);
  }

  // Read the RECOMMENDED ACTION text from Food Safety panel
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
  ['click','touchstart','keydown','mousedown'].forEach(function(ev){
    document.addEventListener(ev, unlock, { passive: true });
  });

  function ensureToggle(){
    if (toggleBtn && document.body.contains(toggleBtn)) return;
    var panel = document.getElementById('foodSafetyPanel');
    if (!panel) return;

    toggleBtn = document.createElement('button');
    toggleBtn.id = 'voiceAlertToggle';
    toggleBtn.style.cssText =
      "margin-top:12px;width:100%;padding:8px 12px;" +
      "background:rgba(255,71,87,0.12);border:1px solid rgba(255,71,87,0.55);" +
      "color:#ff4757;border-radius:3px;cursor:pointer;" +
      "font-family:'Share Tech Mono',monospace;font-size:10px;" +
      "letter-spacing:0.12em;text-transform:uppercase;transition:all 0.2s;";
    toggleBtn.textContent = '🔊 VOICE ALERT: ON  (click to test)';

    toggleBtn.addEventListener('click', function(ev){
      ev.stopPropagation();
      unlock();

      // First click: read current RECOMMENDED ACTION text
      if (toggleBtn.dataset.tested !== '1'){
        toggleBtn.dataset.tested = '1';
        var msg = readActionText() || 'Voice alert test. System ready.';
        setTimeout(function(){ speak(msg); }, 250);
        toggleBtn.textContent = '🔊 VOICE ALERT: ON';
        return;
      }

      // Subsequent clicks: toggle on/off
      voiceEnabled = !voiceEnabled;
      if (!voiceEnabled) window.speechSynthesis.cancel();
      toggleBtn.textContent = voiceEnabled ? '🔊 VOICE ALERT: ON' : '🔇 VOICE ALERT: OFF';
      toggleBtn.style.background = voiceEnabled ? 'rgba(255,71,87,0.12)' : 'rgba(92,114,134,0.12)';
      toggleBtn.style.borderColor = voiceEnabled ? 'rgba(255,71,87,0.55)' : 'rgba(92,114,134,0.4)';
      toggleBtn.style.color = voiceEnabled ? '#ff4757' : '#5c7286';
      if (voiceEnabled) speak('Voice alerts enabled');
    });

    panel.appendChild(toggleBtn);
    console.log('[voice-alert] toggle added');
  }

  function check(){
    var riskEl = document.getElementById('fsRisk');
    if (!riskEl) return;
    ensureToggle();

    var risk = (riskEl.textContent || '').trim().toUpperCase();
    var action = readActionText();

    if ((risk === 'CRITICAL' || risk === 'UNSAFE') && risk !== lastSpokenRisk && action){
      if (voiceEnabled && unlocked) speak(action);
      else if (voiceEnabled && !unlocked) console.log('[voice-alert] risk=' + risk + ' — click page once to unlock audio');
      lastSpokenRisk = risk;
    } else if (risk === 'SAFE' || risk === 'CAUTION'){
      lastSpokenRisk = risk;
    }
  }

  if (window.speechSynthesis){
    window.speechSynthesis.onvoiceschanged = function(){};
  }

  setInterval(check, 3000);
  console.log('[voice-alert] armed — speaks RECOMMENDED ACTION text');
})();
