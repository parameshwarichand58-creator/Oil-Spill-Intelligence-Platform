(function(){
  if (window.__ecoZones) return; window.__ecoZones = true;
  function $(i){ return document.getElementById(i); }
  function density(){
    var a=['tick-density','liveOilDensity','anaDensity'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 60;
  }
  function risk(){var e=$('fsRisk');return e&&e.textContent?e.textContent.trim().toUpperCase():'UNSAFE';}
  function page(){
    if($('page10'))return;
    var m=$('mainContent');if(!m)return;
    var p=document.createElement('div');p.className='page';p.id='page10';
    p.innerHTML=[
      '<div class="page-header"><h2>🌿 <span class="highlight">Ecological Sensitivity Zones</span></h2>',
      '<p>Protected habitats · live threat scoring · response rules per zone</p></div>',
      '<div class="grid-3" id="ecoGrid" style="margin-top:12px;"></div>',
      '<div class="card" style="margin-top:16px;"><div class="card-title">📊 ZONE THREAT SUMMARY</div>',
      '<div id="ecoSummary" style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#c9d8ea;line-height:1.9;"></div></div>'
    ].join('');
    m.appendChild(p);
  }
  function render(){
    page();
    var d=density(),r=risk();
    var km=Math.max(1,Math.round(d/8));
    var dist=Math.max(5,Math.min(150,Math.round(120-(d/2))));
    var zones=[
      {i:'🐢',n:'Turtle Nesting',loc:'Kovalam · Mahabalipuram · Rameswaram',rule:'DISPERSANT BAN',th:dist<30?'HIGH':'MEDIUM'},
      {i:'🪸',n:'Coral Reefs',loc:'Gulf of Mannar · Andaman shelf',rule:'BURN BAN',th:dist<40?'HIGH':'MEDIUM'},
      {i:'🌿',n:'Mangroves',loc:'Pichavaram · Bhitarkanika',rule:'BOOMS ONLY',th:dist<25?'HIGH':'LOW'},
      {i:'🐦',n:'Bird Corridors',loc:'Point Calimere · Chilika',rule:'AERIAL DETERRENT',th:dist<50?'MEDIUM':'LOW'},
      {i:'💧',n:'Water Intakes',loc:'Chennai · Puducherry · Vizag',rule:'MUNICIPAL SHUTDOWN',th:dist<35?'HIGH':'MEDIUM'},
      {i:'🐠',n:'Fish Nurseries',loc:'Bay of Bengal shelf',rule:'FISHING CLOSURE',th:d>40?'HIGH':'MEDIUM'}
    ];
    var g=$('ecoGrid');
    if(g){g.innerHTML=zones.map(function(z){
      var c=z.th==='HIGH'?'#ef4444':z.th==='MEDIUM'?'#fbbf24':'#00d4aa';
      return '<div class="card"><div class="card-title">'+z.i+' '+z.n+'</div>'+
        '<div style="font-size:10px;color:#c9d8ea;margin:5px 0;line-height:1.4;">'+z.loc+'</div>'+
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+c+';letter-spacing:0.1em;">THREAT: '+z.th+'</div>'+
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#4a9eff;margin-top:6px;">RULE: '+z.rule+'</div>'+
        '<div style="font-size:9px;color:#64748b;margin-top:6px;">Distance: '+dist+' km</div></div>';
    }).join('');}
    var s=$('ecoSummary');
    if(s){
      var hi=zones.filter(function(z){return z.th==='HIGH';}).length;
      var me=zones.filter(function(z){return z.th==='MEDIUM';}).length;
      s.innerHTML='Density: '+d.toFixed(1)+' µg/L · Risk: '+r+
        '<br>HIGH: '+hi+' · MEDIUM: '+me+' · LOW: '+(zones.length-hi-me)+
        '<br>Spill extent: '+km+' km² · Threat radius: '+dist+' km';
    }
  }
  document.addEventListener('click',function(e){var it=e.target.closest('.nav-item');if(it&&/Eco-Zones/i.test(it.textContent))setTimeout(render,200);},true);
  setTimeout(render,2600); setInterval(render,8000);
  console.log('[eco-zones] armed');
})();
