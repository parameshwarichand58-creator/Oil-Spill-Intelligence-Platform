(function(){
  if (window.__securityAlarm) return;
  window.__securityAlarm = true;

  var SCEN = {
    natural:{t:"Natural Seepage",r:"A natural oil seepage has been detected on the seafloor. No vessel is involved. Environmental monitoring is advised."},
    culprit:{t:"Culprit Theft",r:"Illegal ship to ship oil transfer is in progress. The vessel Cargo Gamma has attempted unauthorized discharge. The coast guard has been notified."},
    internal:{t:"Internal Failure",r:"A mechanical failure has occurred on Cargo Gamma. Bilge water discharge has been detected. The ships integrity may be compromised."},
    collision:{t:"Collision Accident",r:"Two vessels have collided. There is an active oil spill from a damaged hull. Immediate emergency response is required."},
    fire:{t:"Fire Explosion",r:"A fire has been detected on board a tanker. There is a risk of explosion. Full emergency response is now activated."},
    weather:{t:"Weather Storm",r:"A severe storm cell is approaching at forty five knots. Hull stress risk is high. All vessels are advised to alter course immediately."}
  };

  // Kill the old robot voice
  window.startAlert = function(){};
  window.speakRobot = function(){};
  window.robotSpeak = function(){};
  try { window.speechSynthesis.cancel(); } catch(e){}

  var ctx = null;
  var siren = null;

  function getCtx(){
    if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
    if(ctx&&ctx.state==="suspended")ctx.resume();
    return ctx;
  }

  // ============================================
  // HIGH-SECURITY EMERGENCY SIREN
  // Wailing air-raid style — sweeping 600-1100 Hz
  // Two layered oscillators for depth + a pulsing LFO
  // ============================================
  function startSiren(){
    var c = getCtx(); if(!c || siren) return;

    var nodes = [];

    // Master gain — LOUD
    var master = c.createGain();
    master.gain.value = 0.75;
    master.connect(c.destination);
    nodes.push(master);

    // Compressor for punch without distortion
    try {
      var comp = c.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.knee.value = 8;
      comp.ratio.value = 12;
      comp.attack.value = 0.004;
      comp.release.value = 0.14;
      master.disconnect();
      master.connect(comp);
      comp.connect(c.destination);
      nodes.push(comp);
    } catch(e){}

    // ---- Layer 1: main wail (sawtooth, sweeps 700-1050 slowly) ----
    var o1 = c.createOscillator();
    o1.type = "sawtooth";
    o1.frequency.value = 875;
    var lfo1 = c.createOscillator();
    lfo1.type = "sine";
    lfo1.frequency.value = 0.75;    // 0.75 wails per second
    var lfoG1 = c.createGain();
    lfoG1.gain.value = 175;         // sweeps ±175 Hz
    lfo1.connect(lfoG1);
    lfoG1.connect(o1.frequency);
    var g1 = c.createGain(); g1.gain.value = 0.5;
    o1.connect(g1); g1.connect(master);
    o1.start(); lfo1.start();
    nodes.push(o1, lfo1, lfoG1, g1);

    // ---- Layer 2: high accent (triangle, sweeps 1400-1750 quickly) ----
    var o2 = c.createOscillator();
    o2.type = "triangle";
    o2.frequency.value = 1575;
    var lfo2 = c.createOscillator();
    lfo2.type = "sine";
    lfo2.frequency.value = 1.5;    // fast chirp under the main wail
    var lfoG2 = c.createGain();
    lfoG2.gain.value = 150;
    lfo2.connect(lfoG2);
    lfoG2.connect(o2.frequency);
    var g2 = c.createGain(); g2.gain.value = 0.28;
    o2.connect(g2); g2.connect(master);
    o2.start(); lfo2.start();
    nodes.push(o2, lfo2, lfoG2, g2);

    // ---- Layer 3: low rumble for weight ----
    var o3 = c.createOscillator();
    o3.type = "sine";
    o3.frequency.value = 95;
    var g3 = c.createGain(); g3.gain.value = 0.32;
    o3.connect(g3); g3.connect(master);
    o3.start();
    nodes.push(o3, g3);

    // ---- Pulse the master gain — makes the siren sound like it is "breathing" ----
    var pulse = true;
    var pulseTimer = setInterval(function(){
      if(!siren) return;
      var n = c.currentTime;
      master.gain.cancelScheduledValues(n);
      master.gain.linearRampToValueAtTime(pulse ? 0.75 : 0.4, n + 0.25);
      pulse = !pulse;
    }, 380);

    siren = { nodes: nodes, pulseTimer: pulseTimer };
    console.log("[siren] HIGH-SECURITY emergency siren started");
  }

  function stopSiren(){
    if(!siren) return;
    try {
      var c = getCtx();
      var n = c ? c.currentTime : 0;
      siren.nodes.forEach(function(x){
        try {
          if(x.gain){
            x.gain.cancelScheduledValues(n);
            x.gain.linearRampToValueAtTime(0.0001, n + 0.25);
          }
        } catch(e){}
      });
      clearInterval(siren.pulseTimer);
      var nodes = siren.nodes;
      siren = null;
      setTimeout(function(){
        nodes.forEach(function(x){
          try { if(x.stop) x.stop(); } catch(e){}
          try { if(x.disconnect) x.disconnect(); } catch(e){}
        });
      }, 300);
    } catch(e){}
    console.log("[siren] stopped");
  }

  // ============================================
  // HUMAN LADY VOICE (unchanged)
  // ============================================
  function pickLadyVoice(){
    if(!window.speechSynthesis) return null;
    var v = window.speechSynthesis.getVoices();
    if(!v || !v.length) return null;
    var order = [
      "Microsoft Aria Online (Natural)",
      "Microsoft Jenny Online (Natural)",
      "Microsoft Michelle Online (Natural)",
      "Microsoft Ana Online (Natural)",
      "Microsoft Zira Desktop",
      "Microsoft Zira",
      "Google US English",
      "Google UK English Female",
      "Samantha",
      "Karen",
      "Moira",
      "Tessa",
      "Victoria",
      "Allison",
      "Ava"
    ];
    for(var i = 0; i < order.length; i++){
      var m = v.find(function(x){ return x.name === order[i]; });
      if(m) return m;
    }
    var f = v.find(function(x){
      return /(aria|jenny|michelle|ana|zira|samantha|karen|moira|tessa|victoria|allison|ava|female)/i.test(x.name) && /^en/i.test(x.lang);
    });
    if(f) return f;
    return v.find(function(x){ return /^en[-_]US/i.test(x.lang); }) || v[0];
  }

  function say(text, voice){
    return new Promise(function(res){
      var u = new SpeechSynthesisUtterance(text);
      if(voice){ u.voice = voice; u.lang = voice.lang || "en-US"; }
      u.rate = 1.0;
      u.pitch = 1.0;
      u.volume = 1.0;
      u.onend = res;
      u.onerror = res;
      window.speechSynthesis.speak(u);
    });
  }

  function freeze(on){
    var b = document.getElementById("roboBody");
    if(!b) return;
    if(on) b.classList.add("steady");
    else   b.classList.remove("steady");
  }

  async function speak(title, reason){
    if(!window.speechSynthesis) return;
    try{ window.speechSynthesis.cancel(); }catch(e){}
    var voice = pickLadyVoice();
    console.log("[lady] voice:", voice ? voice.name : "default");
    freeze(true);
    var lines = [
      "Attention. This is an emergency alert.",
      title + ".",
      reason,
      "Please take immediate action."
    ];
    for(var i = 0; i < lines.length; i++){
      await say(lines[i], voice);
      await new Promise(function(r){ setTimeout(r, 300); });
    }
    freeze(false);
  }

  function getKey(){
    var t = ((document.getElementById("roboTitle")||{}).textContent||"").toLowerCase();
    if(t.indexOf("natural") >= 0) return "natural";
    if(t.indexOf("culprit") >= 0 || t.indexOf("theft") >= 0) return "culprit";
    if(t.indexOf("internal") >= 0) return "internal";
    if(t.indexOf("collision") >= 0) return "collision";
    if(t.indexOf("fire") >= 0) return "fire";
    if(t.indexOf("weather") >= 0 || t.indexOf("storm") >= 0) return "weather";
    return null;
  }

  function hookScene(){
    var s = document.getElementById("roboScene");
    if(!s){ setTimeout(hookScene, 500); return; }
    if(s.dataset.secHooked) return;
    s.dataset.secHooked = "1";

    new MutationObserver(function(){
      var showing = s.classList.contains("show");
      if(showing && !s.dataset.secActive){
        s.dataset.secActive = "1";
        try{ window.speechSynthesis.cancel(); }catch(e){}
        getCtx();
        startSiren();
        setTimeout(function(){
          var k = getKey();
          if(k && SCEN[k]) speak(SCEN[k].t, SCEN[k].r);
        }, 300);
      } else if(!showing && s.dataset.secActive){
        s.dataset.secActive = "";
        stopSiren();
        try{ window.speechSynthesis.cancel(); }catch(e){}
        freeze(false);
      }
    }).observe(s, { attributes:true, attributeFilter:["class"] });

    console.log("[alarm] scene hooked");
  }

  function hookStop(){
    var b = document.getElementById("roboStop");
    if(!b || b.dataset.secWired) return;
    b.dataset.secWired = "1";
    b.addEventListener("click", function(){
      stopSiren();
      try{ window.speechSynthesis.cancel(); }catch(e){}
      freeze(false);
    });
  }

  if(window.speechSynthesis){
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function(){
      var v = pickLadyVoice();
      console.log("[lady] available:", v ? v.name : "none");
    };
  }

  document.addEventListener("click", function(){ getCtx(); }, { once:true });

  hookScene();
  hookStop();
  setInterval(hookScene, 2000);
  setInterval(hookStop, 2000);

  console.log("[alarm] armed — HIGH-SECURITY siren + lady voice");
})();
