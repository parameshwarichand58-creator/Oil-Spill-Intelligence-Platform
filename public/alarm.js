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
  var ctx=null, timer=null, running=false;
  function getCtx(){
    if(!ctx){try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}
    if(ctx&&ctx.state==="suspended")ctx.resume();
    return ctx;
  }
  function beep(){
    var c=getCtx(); if(!c) return;
    var o=c.createOscillator(), g=c.createGain();
    o.type="square"; o.frequency.value=2400;
    g.gain.value=0; o.connect(g); g.connect(c.destination);
    var n=c.currentTime;
    g.gain.linearRampToValueAtTime(0.28,n+0.006);
    g.gain.setValueAtTime(0.28,n+0.08);
    g.gain.linearRampToValueAtTime(0.001,n+0.10);
    o.start(n); o.stop(n+0.12);
  }
  function startAlarm(){
    if(running)return; running=true; getCtx();
    function cycle(){
      if(!running)return;
      beep();
      setTimeout(function(){ if(running) beep(); },180);
      timer=setTimeout(cycle,600);
    }
    cycle();
    console.log("[alarm] started");
  }
  function stopAlarm(){
    running=false;
    if(timer){clearTimeout(timer);timer=null;}
    console.log("[alarm] stopped");
  }
  function pickVoice(){
    if(!window.speechSynthesis)return null;
    var v=window.speechSynthesis.getVoices();
    if(!v||!v.length)return null;
    var order=["Microsoft Aria Online (Natural)","Microsoft Jenny Online (Natural)","Microsoft Michelle Online (Natural)","Microsoft Ana Online (Natural)","Google US English","Samantha","Karen","Moira","Tessa","Microsoft Zira Desktop"];
    for(var i=0;i<order.length;i++){
      var m=v.find(function(x){return x.name===order[i];});
      if(m)return m;
    }
    return v.find(function(x){return /(aria|jenny|michelle|ana|zira|samantha|karen|female)/i.test(x.name);})||v.find(function(x){return /^en[-_]US/i.test(x.lang);})||v[0];
  }
  function say(text,voice){
    return new Promise(function(res){
      var u=new SpeechSynthesisUtterance(text);
      if(voice){u.voice=voice;u.lang=voice.lang||"en-US";}
      u.rate=1.0; u.pitch=1.0; u.volume=1.0;
      u.onend=res; u.onerror=res;
      window.speechSynthesis.speak(u);
    });
  }
  function freeze(on){
    var b=document.getElementById("roboBody");
    if(!b)return;
    if(on)b.classList.add("steady");else b.classList.remove("steady");
  }
  async function speak(title,reason){
    if(!window.speechSynthesis)return;
    try{window.speechSynthesis.cancel();}catch(e){}
    var voice=pickVoice();
    console.log("[voice]",voice?voice.name:"default");
    freeze(true);
    var lines=["Attention. This is an emergency alert.",title+".",reason,"Please take immediate action."];
    for(var i=0;i<lines.length;i++){
      await say(lines[i],voice);
      await new Promise(function(r){setTimeout(r,350);});
    }
    freeze(false);
  }
  function getKey(){
    var t=((document.getElementById("roboTitle")||{}).textContent||"").toLowerCase();
    if(t.indexOf("natural")>=0)return "natural";
    if(t.indexOf("culprit")>=0||t.indexOf("theft")>=0)return "culprit";
    if(t.indexOf("internal")>=0)return "internal";
    if(t.indexOf("collision")>=0)return "collision";
    if(t.indexOf("fire")>=0)return "fire";
    if(t.indexOf("weather")>=0||t.indexOf("storm")>=0)return "weather";
    return null;
  }
  function hookScene(){
    var s=document.getElementById("roboScene");
    if(!s){setTimeout(hookScene,500);return;}
    if(s.dataset.secHooked)return;
    s.dataset.secHooked="1";
    new MutationObserver(function(){
      var showing=s.classList.contains("show");
      if(showing&&!s.dataset.secActive){
        s.dataset.secActive="1";
        getCtx(); startAlarm();
        setTimeout(function(){
          var k=getKey();
          if(k&&SCEN[k]) speak(SCEN[k].t,SCEN[k].r);
        },700);
      } else if(!showing&&s.dataset.secActive){
        s.dataset.secActive="";
        stopAlarm();
        try{window.speechSynthesis.cancel();}catch(e){}
        freeze(false);
      }
    }).observe(s,{attributes:true,attributeFilter:["class"]});
    console.log("[alarm] scene hooked");
  }
  function hookStop(){
    var b=document.getElementById("roboStop");
    if(!b||b.dataset.secWired)return;
    b.dataset.secWired="1";
    b.addEventListener("click",function(){
      stopAlarm();
      try{window.speechSynthesis.cancel();}catch(e){}
      freeze(false);
    });
  }
  if(window.speechSynthesis){
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged=function(){};
  }
  document.addEventListener("click",function(){getCtx();},{once:true});
  hookScene(); hookStop();
  setInterval(hookScene,2000); setInterval(hookStop,2000);
  console.log("[alarm] armed");
})();
