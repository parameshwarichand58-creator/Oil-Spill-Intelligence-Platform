(function(){
  if (window.__voiceAlert) return;
  window.__voiceAlert = true;

  var lastSpokenRisk = null;
  var voiceEnabled = true;
  var toggleBtn = null;

  var ALERT_TEXT = "Warning. An oil spill has occurred. The fishing areas must be closed immediately. Food safety teams need to be deployed to test the fish P A H levels.";

  function speak(text){
    if (!voiceEnabled) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.rate = 0.88;
    u.pitch = 0.75;
    u.volume = 1.0;
    // Try to pick a deeper/robotic voice
    var voices = window.speechSynthesis.getVoices();
    for (var i = 0; i < voices.length; i++){
      if (/Google UK English Male|Daniel|Microsoft David/i.test(voices[i].name)){
        u.voice = voices[i];
        break;
      }
    }
    window.speechSynthesis.speak(u);
    console.log('[voice-alert] spoken ·', text);
  }

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
    toggleBtn.textContent = '🔊 VOICE ALERT: ON';
    toggleBtn.addEventListener('click', function(){
      voiceEnabled = !voiceEnabled;
      if (!voiceEnabled) window.speechSynthesis.cancel();
      toggleBtn.textContent = voiceEnabled ? '🔊 VOICE ALERT: ON' : '🔇 VOICE ALERT: OFF';
      toggleBtn.style.background = voiceEnabled ? 'rgba(255,71,87,0.12)' : 'rgba(92,114,134,0.12)';
      toggleBtn.style.borderColor = voiceEnabled ? 'rgba(255,71,87,0.55)' : 'rgba(92,114,134,0.4)';
      toggleBtn.style.color = voiceEnabled ? '#ff4757' : '#5c7286';
    });
    panel.appendChild(toggleBtn);
    console.log('[voice-alert] toggle added');
  }

  function check(){
    var riskEl = document.getElementById('fsRisk');
    if (!riskEl) return;
    ensureToggle();

    var risk = (riskEl.textContent || '').trim().toUpperCase();

    // Trigger only when crossing into UNSAFE or CRITICAL from a different state
    if ((risk === 'CRITICAL' || risk === 'UNSAFE') && risk !== lastSpokenRisk){
      if (voiceEnabled) speak(ALERT_TEXT);
      lastSpokenRisk = risk;
      console.log('[voice-alert] triggered ·', risk);
    } else if (risk === 'SAFE' || risk === 'CAUTION'){
      lastSpokenRisk = risk;
    }
  }

  // Voices may load async
  if (window.speechSynthesis){
    window.speechSynthesis.onvoiceschanged = function(){ /* pre-load voices */ };
  }

  setInterval(check, 3000);
  console.log('[voice-alert] armed');
})();
