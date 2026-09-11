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

  var ctx = null, timer = null, running = false;
  var masterGain = null;

  function getCtx(){
    if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
    if(ctx&&ctx.state==="suspended")ctx.resume();
    return ctx;
  }

  // Louder, clearer single beep — triangle wave for crisp tone
  function beep(){
    var c = getCtx(); if(!c) return;
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = "triangle";
    o.frequency.value = 2100;
    g.gain.value = 0;
    o.connect(g);
    g.connect(c.destination);
    var n = c.currentTime;
    g.gain.linearRampToValueAtTime(0.55, n + 0.008);
    g.gain.setValueAtTime(0.55, n + 0.10);
    g.gain.linearRampToValueAtTime(0.001, n + 0.13);
    o.start(n);
    o.stop(n + 0.15);
  }

  function startAlarm(){
    if(running) return;
    running = true;
    getCtx();
    function cycle(){
      if(!running) return;
      beep();
      setTimeout(function(){ if(running) beep(); }, 200);
      timer = setTimeout(cycle, 620);
    }
    cycle();
    console.log("[alarm] started — steady security alarm");
  }

  function stopAlarm(){
    running = false;
    if(timer){clearTimeout(timer);timer=null;}
    console.log("[alarm] stopped");
  }

  // Duck volume while voice speaks (via Web Audio), keep it silent if no separate gain
  function duckAlarm(on){
    var c = getCtx(); if(!c) return;
    // We do not modulate the beeps here — the beep envelope handles its own volume.
    // Instead we pause the alarm loop while voice speaks, and resume after.
    if(on){
      if(running){ running = false; if(timer){clearTimeout(timer);timer=null;} }
    } else {
      if(!running) startAlarm();
    }
  }

  // Pick ONLY natural human voices. Never David/Zira Desktop (robotic).
  function pickHumanVoice(){
    if(!window.speechSynthesis) return null;
    var v = window.speechSynthesis.getVoices();
    if(!v || !v.length) return null;

    // Ordered list of high-quality human-sounding voices
    var order = [
      "Microsoft Aria Online (Natural)",
      "Microsoft Jenny Online (Natural)",
      "Microsoft Michelle Online (Natural)",
      "Microsoft Ana Online (Natural)",
      "Microsoft Clara Online (Natural)",
      "Microsoft Emily Online (Natural)",
      "Google US English",
      "Google UK English Female",
      "Samantha",
      "Karen",
      "Moira",
      "Tessa",
      "Victoria"
    ];
    for(var i = 0; i < order.length; i++){
      var m = v.find(function(x){ return x.name === order[i]; });
      if(m) return m;
    }

    // Partial match for any "Natural" or "Online" voice
    var nat = v.find(function(x){ return /natural|online/i.test(x.name) && /en/i.test(x.lang); });
    if(nat) return nat;

    // Google voices only
    var g = v.find(function(x){ return /google/i.test(x.name) && /en/i.test(x.lang); });
    if(g) return g;

    // Any female en voice (name match)
    var f = v.find(function(x){ return /(aria|jenny|michelle|ana|samantha|karen|moira|tessa|ava|female|zira)/i.test(x.name) && /^en/i.test(x.lang); });
    if(f) return f;

    // Last resort: any en-US
    return v.find(function(x){ return /^en[-_]US/i.test(x.lang); }) || null;
  }

  function say(text, voice){
    return new Promise(function(res){
      var u = new SpeechSynthesisUtterance(text);
      if(voice){ u.voice = voice; u.lang = voice.lang || "en-US"; }
      u.rate   = 0.98;   // very slightly slower for clarity
      u.pitch  = 1.0;    // natural human pitch
      u.volume = 1.0;    // full volume
      u.onend  = res;
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

    var voice = pickHumanVoice();
    console.log("[voice] using:", voice ? voice.name + " (" + voice.lang + ")" : "system default");

    if(!voice){
      console.warn("[voice] No human voice available. Install Microsoft Aria/Jenny in Windows Settings.");
    }

    freeze(true);      // robot stands still while speaking

    // Pause the alarm for 250ms so the voice starts clean, then duck loop continues
    var lines = [
      "Attention. This is an emergency alert.",
      title + ".",
      reason,
      "Please take immediate action."
    ];

    for(var i = 0; i < lines.length; i++){
      // Pause alarm while each sentence plays
      duckAlarm(true);
      await say(lines[i], voice);
      // Resume alarm between sentences
      duckAlarm(false);
      await new Promise(function(r){ setTimeout(r, 400); });
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
        getCtx();
        startAlarm();
        setTimeout(function(){
          var k = getKey();
          if(k && SCEN[k]) speak(SCEN[k].t, SCEN[k].r);
        }, 700);
      } else if(!showing && s.dataset.secActive){
        s.dataset.secActive = "";
        stopAlarm();
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
      stopAlarm();
      try{ window.speechSynthesis.cancel(); }catch(e){}
      freeze(false);
    });
  }

  // Preload voices
  if(window.speechSynthesis){
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = function(){
      var v = pickHumanVoice();
      console.log("[voice] available:", v ? v.name : "none");
    };
  }

  // Unlock audio on first user click
  document.addEventListener("click", function(){ getCtx(); }, { once:true });

  hookScene();
  hookStop();
  setInterval(hookScene, 2000);
  setInterval(hookStop, 2000);

  console.log("[alarm] armed — louder alarm + human voice");
})();
