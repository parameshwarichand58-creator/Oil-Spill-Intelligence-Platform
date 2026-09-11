(function(){
  if (window.__health) return; window.__health = true;
  function $(i){ return document.getElementById(i); }
  function density(){
    var a=['tick-density','liveOilDensity','anaDensity'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 60;
  }
  function windSpeed(){var e=$('windSpeed')||$('liveWindSpeed');if(e){var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n))return n;}return 12;}
  function page(){
    if($('page11'))return;
    var m=$('mainContent');if(!m)return;
    var p=document.createElement('div');p.className='page';p.id='page11';
    p.innerHTML=[
      '<div class="page-header"><h2>🏥 <span class="highlight">Human Health Direct Alerts</span></h2>',
      '<p>Air quality · beach closure · fisher livelihood · hospital pre-alert</p></div>',
      '<div class="grid-5" id="healthGrid" style="margin-top:12px;"></div>',
      '<div class="card" style="margin-top:16px;"><div class="card-title">📊 AQI TREND (60s window)</div>',
      '<div id="aqiBar" style="height:14px;background:linear-gradient(90deg,#00d4aa,#fbbf24,#ef4444);border-radius:7px;position:relative;margin-top:6px;">',
      '<div id="aqiMarker" style="position:absolute;top:-3px;width:4px;height:20px;background:#fff;border-radius:2px;box-shadow:0 0 8px #fff;left:20%;transition:left 0.6s;"></div></div>',
      '<div id="aqiLabel" style="margin-top:8px;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#c9d8ea;"></div></div>'
    ].join('');
    m.appendChild(p);
  }
  function render(){
    page();
    var d=density(),w=windSpeed();
    var voc=(d*0.15).toFixed(2);
    var aqi=Math.min(500,Math.round(d*3.2));
    var beachKm=Math.round(d/10)+5;
    var days=Math.ceil(Math.log(Math.max(1,d/2))/0.15)||1;
    var fisherLoss=(days*5000*200).toLocaleString();
    var hospital=Math.round(d*0.6);
    var level=aqi<100?'GOOD':aqi<200?'MODERATE':aqi<300?'UNHEALTHY':'HAZARDOUS';
    var color=aqi<100?'#00d4aa':aqi<200?'#fbbf24':aqi<300?'#f97316':'#ef4444';
    var g=$('healthGrid');
    if(g){
      var cards=[
        {t:'☣️ VOC / BENZENE',v:voc,p:'ppm · '+(voc<1?'SAFE':voc<3?'WARN':'DANGER')},
        {t:'🏖️ BEACH CLOSURE',v:beachKm,p:'km of coast affected'},
        {t:'🎣 FISHER LOSS',v:'₹'+fisherLoss,p:days+' days closure'},
        {t:'🏥 HOSPITAL CASES',v:hospital,p:'respiratory expected'},
        {t:'😷 AQI INDEX',v:aqi,p:level,vc:color}
      ];
      g.innerHTML=cards.map(function(c){
        var vc=c.vc?'color:'+c.vc+';':'';
        return '<div class="card"><div class="card-title">'+c.t+'</div>'+
          '<div class="stat-number" style="'+vc+'">'+c.v+'</div>'+
          '<div class="stat-label">'+c.p+'</div></div>';
      }).join('');
    }
    var mk=$('aqiMarker'); if(mk) mk.style.left=Math.min(95,aqi/5)+'%';
    var lb=$('aqiLabel'); if(lb) lb.innerHTML='Live AQI: '+aqi+' ('+level+') · wind '+w+' km/h · VOC '+voc+' ppm';
  }
  document.addEventListener('click',function(e){var it=e.target.closest('.nav-item');if(it&&/Health/i.test(it.textContent))setTimeout(render,200);},true);
  setTimeout(render,2700); setInterval(render,7000);
  console.log('[health] armed');
})();
