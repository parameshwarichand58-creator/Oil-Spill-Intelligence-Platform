(function(){
  if (window.__response) return; window.__response = true;
  function $(i){ return document.getElementById(i); }
  function density(){
    var a=['tick-density','liveOilDensity','anaDensity'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 60;
  }
  var hist=[], startDensity=null;
  function page(){
    if($('page12'))return;
    var m=$('mainContent');if(!m)return;
    var p=document.createElement('div');p.className='page';p.id='page12';
    p.innerHTML=[
      '<div class="page-header"><h2>📡 <span class="highlight">Live Response Tracker</span></h2>',
      '<p>Cleanup progress · burn rate · weather window · fleet position</p></div>',
      '<div class="grid-3" id="respGrid" style="margin-top:12px;"></div>',
      '<div class="card" style="margin-top:16px;"><div class="card-title">📉 SPILL TREND (last 10 ticks)</div>',
      '<div id="respTrend" style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#c9d8ea;line-height:1.8;margin-top:6px;"></div></div>',
      '<div class="card" style="margin-top:16px;"><div class="card-title">📋 DISPATCH LOG</div>',
      '<div id="respLog" style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#94a3b8;line-height:1.8;max-height:140px;overflow-y:auto;"></div></div>'
    ].join('');
    m.appendChild(p);
  }
  function render(){
    page();
    var d=density();
    if(startDensity===null)startDensity=d;
    hist.push(d); if(hist.length>10)hist.shift();
    var trend=hist.length>1?((d-hist[0])/hist[0]*100).toFixed(1):'0.0';
    var tSign=trend<0?'▼':'▲';
    var tColor=trend<0?'#00d4aa':'#ef4444';
    var burnRate=(Math.random()*40+60).toFixed(0);
    var budget=2000, used=Math.round(burnRate*2);
    var window_=d<80?'GREEN':d<150?'AMBER':'RED';
    var wColor=window_==='GREEN'?'#00d4aa':window_==='AMBER'?'#fbbf24':'#ef4444';
    var cleanup=Math.min(95,Math.round((1-d/(startDensity*1.4))*100));
    var fleet=Math.round(d/10)+2;
    var g=$('respGrid');
    if(g){
      var cards=[
        {t:'📉 SPILL TRENDING',v:tSign+Math.abs(trend)+'%',p:trend<0?'shrinking':'growing',vc:tColor},
        {t:'💧 DISPERSANT',v:burnRate,p:'L/hr · '+used+'/'+budget+' L used'},
        {t:'🌊 WEATHER WINDOW',v:window_,p:'cleanup ops',vc:wColor},
        {t:'🧹 CLEANUP %',v:cleanup+'%',p:'recovered vs total'},
        {t:'🚢 FLEET ON SCENE',v:fleet,p:'vessels deployed'},
        {t:'🔄 RE-POLLUTION',v:trend>5?'DETECTED':'CLEAR',p:'post-cleanup monitor',vc:trend>5?'#ef4444':'#00d4aa'}
      ];
      g.innerHTML=cards.map(function(c){
        return '<div class="card"><div class="card-title">'+c.t+'</div>'+
          '<div class="stat-number" style="'+(c.vc?'color:'+c.vc+';':'')+'">'+c.v+'</div>'+
          '<div class="stat-label">'+c.p+'</div></div>';
      }).join('');
    }
    var t=$('respTrend');
    if(t){
      var bars=hist.map(function(v){var h=Math.round(v/Math.max.apply(null,hist)*60);return '<div style="display:inline-block;width:7%;height:'+h+'px;background:linear-gradient(180deg,#4a9eff,#00d4aa);margin:0 1px;vertical-align:bottom;border-radius:2px;"></div>';}).join('');
      t.innerHTML='<div style="height:70px;display:flex;align-items:flex-end;gap:2px;">'+bars+'</div>'+
        'Current: '+d.toFixed(1)+' µg/L · Peak: '+Math.max.apply(null,hist).toFixed(1)+' · Min: '+Math.min.apply(null,hist).toFixed(1);
    }
    var lg=$('respLog');
    if(lg){
      var now=new Date().toLocaleTimeString();
      lg.innerHTML='['+now+'] Fleet deployed · '+fleet+' vessels<br>'+
        '['+now+'] Dispersant applied · '+used+' L<br>'+
        '['+now+'] Cleanup progress · '+cleanup+'%<br>'+
        lg.innerHTML.substring(0,400);
    }
  }
  document.addEventListener('click',function(e){var it=e.target.closest('.nav-item');if(it&&/Response/i.test(it.textContent))setTimeout(render,200);},true);
  setTimeout(render,2800); setInterval(render,6000);
  console.log('[response] armed');
})();
