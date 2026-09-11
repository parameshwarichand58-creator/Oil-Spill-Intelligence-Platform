(function(){
  if (window.__prevent) return; window.__prevent = true;
  function $(i){ return document.getElementById(i); }
  function density(){
    var a=['tick-density','liveOilDensity','anaDensity'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 60;
  }
  function page(){
    if($('page14'))return;
    var m=$('mainContent');if(!m)return;
    var p=document.createElement('div');p.className='page';p.id='page14';
    p.innerHTML=[
      '<div class="page-header"><h2>🛡️ <span class="highlight">Prevention · Upstream Watch</span></h2>',
      '<p>Dark vessels · bunkering watch · pipelines · high-risk routes · pre-incident score</p></div>',
      '<div class="grid-3" id="prevGrid" style="margin-top:12px;"></div>',
      '<div class="card" style="margin-top:16px;"><div class="card-title">🚨 PRE-INCIDENT RISK GAUGE</div>',
      '<div style="height:16px;background:linear-gradient(90deg,#00d4aa,#fbbf24,#ef4444);border-radius:8px;position:relative;margin-top:8px;">',
      '<div id="prevMarker" style="position:absolute;top:-4px;width:5px;height:24px;background:#fff;border-radius:2px;box-shadow:0 0 12px #fff;left:30%;transition:left 0.6s;"></div></div>',
      '<div id="prevLabel" style="margin-top:10px;font-family:\'Share Tech Mono\',monospace;font-size:11px;color:#c9d8ea;"></div></div>',
      '<div class="card" style="margin-top:16px;"><div class="card-title">📋 WATCHLIST · ACTIVE MONITORING</div>',
      '<div id="prevWatch" style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#94a3b8;line-height:1.9;margin-top:6px;"></div></div>'
    ].join('');
    m.appendChild(p);
  }
  function render(){
    page();
    var d=density();
    var dark=Math.round(d/20)+1;
    var bunker=Math.round(d/35);
    var pipeline=Math.round(d/8);
    var highRisk=Math.round(d/15);
    var score=Math.min(100,Math.round(d*0.9));
    var lvl=score<30?'LOW':score<60?'MODERATE':score<80?'HIGH':'CRITICAL';
    var col=score<30?'#00d4aa':score<60?'#fbbf24':score<80?'#f97316':'#ef4444';
    var g=$('prevGrid');
    if(g){
      var cards=[
        {t:'🕶️ DARK VESSELS',v:dark,p:'AIS gap > 15min',vc:dark>3?'#ef4444':'#fbbf24'},
        {t:'⛽ BUNKERING WATCH',v:bunker,p:'slow/stop in zones'},
        {t:'🛢️ PIPELINE FLAGS',v:pipeline,p:'pressure anomalies'},
        {t:'📍 HIGH-RISK ROUTES',v:highRisk,p:'historical matches'},
        {t:'🚨 PRE-INCIDENT',v:score,p:lvl,vc:col},
        {t:'📡 WATCH TOWERS',v:'4/4',p:'radar online',vc:'#00d4aa'}
      ];
      g.innerHTML=cards.map(function(c){
        return '<div class="card"><div class="card-title">'+c.t+'</div>'+
          '<div class="stat-number" style="'+(c.vc?'color:'+c.vc+';':'')+'">'+c.v+'</div>'+
          '<div class="stat-label">'+c.p+'</div></div>';
      }).join('');
    }
    var mk=$('prevMarker'); if(mk) mk.style.left=Math.min(95,score)+'%';
    var lb=$('prevLabel'); if(lb) lb.innerHTML='Risk score: <b style="color:'+col+';">'+score+'/100 ('+lvl+')</b> · density '+d.toFixed(1)+' µg/L';
    var w=$('prevWatch');
    if(w){
      var ships=['MT OCEAN STAR','MV SEA TRADER','MT GULF CARRIER','MV BLUE HORIZON','MT CHENNAI EXPRESS'];
      w.innerHTML=ships.slice(0,dark+1).map(function(s,i){
        return '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);">'+s+' · <span style="color:#fbbf24;">WATCH</span> · gap '+((i+1)*12)+'min</div>';
      }).join('');
    }
  }
  document.addEventListener('click',function(e){var it=e.target.closest('.nav-item');if(it&&/Prevent/i.test(it.textContent))setTimeout(render,200);},true);
  setTimeout(render,3000); setInterval(render,9000);
  console.log('[prevent] armed');
})();
