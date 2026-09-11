(function(){
  if (window.__health) return; window.__health = true;
  function $(i){ return document.getElementById(i); }
  function density(){
    var a=['tick-density','liveOilDensity','anaDensity'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 60;
  }
  function wind(){var e=$('windSpeed')||$('liveWindSpeed');if(e){var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n))return n;}return 12;}

  var DEFAULTS=[
    {name:'Chennai Coast', pop:11000000, vulnerable:2300000, symptoms:38, level:'DANGER'},
    {name:'Puducherry',    pop:1600000,  vulnerable:320000,  symptoms:12, level:'WARN'},
    {name:'Cuddalore',     pop:2600000,  vulnerable:540000,  symptoms:9,  level:'WARN'},
    {name:'Nagapattinam',  pop:1600000,  vulnerable:360000,  symptoms:6,  level:'SAFE'},
    {name:'Rameswaram',    pop:400000,   vulnerable:85000,   symptoms:3,  level:'SAFE'}
  ];

  function load(){try{var s=localStorage.getItem('healthDistricts');if(s)return JSON.parse(s);}catch(e){}return DEFAULTS.slice();}
  function save(d){try{localStorage.setItem('healthDistricts',JSON.stringify(d));}catch(e){}}

  var districts=load();
  var filter='ALL';
  var aqiHist=[];
  var lastScan='—';

  function page(){
    if($('page11'))return;
    var m=$('mainContent');if(!m)return;
    var p=document.createElement('div');p.className='page';p.id='page11';
    p.innerHTML=[
      '<div class="page-header"><h2>🏥 <span class="highlight">Human Health Direct Alerts</span></h2>',
      '<p>Air quality · beach closure · fisher livelihood · hospital pre-alert</p></div>',

      '<div id="healthBanner" style="padding:10px 14px;border-radius:6px;margin-bottom:12px;font-family:\'Share Tech Mono\',monospace;font-size:11px;letter-spacing:0.08em;"></div>',

      '<div class="btn-group" style="margin-bottom:12px;">',
        '<button class="btn btn-primary" id="hCheck">✅ CHECK AQI</button>',
        '<button class="btn btn-success" id="hAdd">➕ ADD DISTRICT</button>',
        '<button class="btn btn-outline" id="hExport">📤 EXPORT CSV</button>',
        '<button class="btn btn-danger" id="hReset">🔄 RESET</button>',
      '</div>',

      '<div class="btn-group" style="margin-bottom:14px;">',
        '<button class="btn btn-outline hF active" data-f="ALL">ALL</button>',
        '<button class="btn btn-outline hF" data-f="DANGER">DANGER</button>',
        '<button class="btn btn-outline hF" data-f="WARN">WARN</button>',
        '<button class="btn btn-outline hF" data-f="SAFE">SAFE</button>',
      '</div>',

      '<div id="hAddForm" style="display:none;background:rgba(0,212,170,0.04);border:1px solid rgba(0,212,170,0.2);border-radius:6px;padding:12px 14px;margin-bottom:14px;">',
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#00d4aa;letter-spacing:0.1em;margin-bottom:8px;">➕ ADD NEW DISTRICT</div>',
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;">',
          '<div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#94a3b8;letter-spacing:0.08em;margin-bottom:4px;">🏙️ DISTRICT NAME</div><input id="hdName" placeholder="e.g. Chennai Coast" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);color:#e2e8f0;padding:8px;border-radius:4px;font-size:11px;"></div>',
          '<div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#94a3b8;letter-spacing:0.08em;margin-bottom:4px;">👥 POPULATION</div><input id="hdPop" type="number" placeholder="e.g. 1000000" value="1000000" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);color:#e2e8f0;padding:8px;border-radius:4px;font-size:11px;"></div>',
          '<div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#94a3b8;letter-spacing:0.08em;margin-bottom:4px;">⚠️ VULNERABLE</div><input id="hdVul" type="number" placeholder="e.g. 200000" value="200000" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);color:#e2e8f0;padding:8px;border-radius:4px;font-size:11px;"></div>',
          '<div><div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#94a3b8;letter-spacing:0.08em;margin-bottom:4px;">🤒 SYMPTOMS</div><input id="hdSym" type="number" placeholder="e.g. 5" value="5" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);color:#e2e8f0;padding:8px;border-radius:4px;font-size:11px;"></div>',
        '</div>',
        '<div class="btn-group" style="margin-top:10px;">',
          '<button class="btn btn-success btn-sm" id="hdSave">SAVE</button>',
          '<button class="btn btn-outline btn-sm" id="hdCancel">CANCEL</button>',
        '</div>',
      '</div>',

      '<div class="grid-3" id="healthGrid" style="margin-top:12px;"></div>',

      '<div class="card" style="margin-top:16px;"><div class="card-title">📊 AQI TREND (last 60s)</div>',
        '<div id="aqiTrend" style="height:70px;display:flex;align-items:flex-end;gap:2px;margin-top:8px;"></div>',
        '<div id="aqiLabel" style="margin-top:8px;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#c9d8ea;"></div>',
      '</div>',

      '<div class="card" style="margin-top:16px;"><div class="card-title">🏖️ BEACH BY BEACH CLOSURE STATUS</div>',
        '<div id="beachList" style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#c9d8ea;line-height:1.9;margin-top:6px;"></div>',
      '</div>'
    ].join('');
    m.appendChild(p);

    $('hCheck').addEventListener('click',function(){
      lastScan=new Date().toLocaleTimeString();
      if(window.speechSynthesis){var u=new SpeechSynthesisUtterance('Health status check complete. A Q I updated.');u.rate=0.9;u.pitch=0.8;window.speechSynthesis.speak(u);}
      render();
    });
    $('hAdd').addEventListener('click',function(){var f=$('hAddForm');f.style.display=f.style.display==='none'?'block':'none';});
    $('hdCancel').addEventListener('click',function(){$('hAddForm').style.display='none';});
    $('hdSave').addEventListener('click',function(){
      var d={
        name:$('hdName').value.trim()||'Custom District',
        pop:parseInt($('hdPop').value)||1000000,
        vulnerable:parseInt($('hdVul').value)||200000,
        symptoms:parseInt($('hdSym').value)||5,
        level:'WARN'
      };
      districts.push(d);save(districts);
      $('hdName').value='';$('hAddForm').style.display='none';
      render();
    });
    $('hExport').addEventListener('click',function(){
      var csv='District,Population,Vulnerable,Symptoms,Risk\n'+
        districts.map(function(d){return [d.name,d.pop,d.vulnerable,d.symptoms,d.level].join(',');}).join('\n');
      var blob=new Blob([csv],{type:'text/csv'});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');a.href=url;a.download='health-'+Date.now()+'.csv';a.click();
      URL.revokeObjectURL(url);
    });
    $('hReset').addEventListener('click',function(){
      if(confirm('Reset all districts to defaults?')){districts=DEFAULTS.slice();save(districts);render();}
    });
    document.querySelectorAll('.hF').forEach(function(b){
      b.addEventListener('click',function(){
        document.querySelectorAll('.hF').forEach(function(x){x.classList.remove('active');});
        b.classList.add('active');
        filter=b.dataset.f;
        render();
      });
    });
  }

  function render(){
    page();
    var d=density(),w=wind();
    var voc=(d*0.15).toFixed(2);
    var aqi=Math.min(500,Math.round(d*3.2));
    var beachKm=Math.round(d/10)+5;
    var days=Math.ceil(Math.log(Math.max(1,d/2))/0.15)||1;
    var fisherLoss=days*5000*200;
    var hospital=Math.round(d*0.6);
    var intakePpb=(d*0.4).toFixed(1);
    var children=Math.round(hospital*0.4);
    var adults=Math.round(hospital*0.5);
    var elderly=Math.round(hospital*0.1);
    var skin=Math.min(10,(d/20)).toFixed(1);
    var hotline=Math.round(d*1.8);

    var level=aqi<100?'GOOD':aqi<200?'MODERATE':aqi<300?'UNHEALTHY':'HAZARDOUS';
    var color=aqi<100?'#00d4aa':aqi<200?'#fbbf24':aqi<300?'#f97316':'#ef4444';

    // Banner
    var banner=$('healthBanner');
    if(banner){
      var bannerMsg, bannerBg;
      if(aqi<100){bannerMsg='✅ Air quality acceptable. Continue routine monitoring.';bannerBg='rgba(0,212,170,0.08)';banner.style.color='#00d4aa';banner.style.borderLeft='3px solid #00d4aa';}
      else if(aqi<200){bannerMsg='⚠️ Moderate risk. Advise vulnerable groups to limit outdoor exposure.';bannerBg='rgba(251,191,36,0.08)';banner.style.color='#fbbf24';banner.style.borderLeft='3px solid #fbbf24';}
      else if(aqi<300){bannerMsg='🚨 Unhealthy. Close beaches. Issue public health advisory.';bannerBg='rgba(249,115,22,0.1)';banner.style.color='#f97316';banner.style.borderLeft='3px solid #f97316';}
      else{bannerMsg='🛑 HAZARDOUS. Immediate evacuation of coastal zones. Deploy medical teams.';bannerBg='rgba(239,68,68,0.12)';banner.style.color='#ef4444';banner.style.borderLeft='3px solid #ef4444';}
      banner.style.background=bannerBg;
      banner.textContent=bannerMsg;
    }

    // Auto-update district levels from live AQI
    districts.forEach(function(dd){
      if(dd.name!=='Custom District'){
        dd.level = aqi>250?'DANGER':aqi>150?'WARN':'SAFE';
        dd.symptoms = Math.round(dd.vulnerable/60000) + Math.round(dd.symptoms*0.3);
      }
    });

    var filtered = filter==='ALL'?districts:districts.filter(function(x){return x.level===filter;});

    var g=$('healthGrid');
    if(g){
      var cards=[
        {t:'☣️ VOC / BENZENE',v:voc,p:'ppm · '+(voc<1?'SAFE':voc<3?'WARN':'DANGER'),vc:voc>3?'#ef4444':voc>1?'#fbbf24':'#00d4aa'},
        {t:'😷 AQI INDEX',v:aqi,p:level,vc:color},
        {t:'💧 WATER INTAKE',v:intakePpb,p:'ppb PAH contamination',vc:intakePpb>30?'#ef4444':'#fbbf24'},
        {t:'🏖️ BEACH CLOSURE',v:beachKm,p:'km of coast affected'},
        {t:'🎣 FISHER LOSS',v:'₹'+(fisherLoss/1000000).toFixed(1)+'M',p:days+' days closure'},
        {t:'🏥 HOSPITAL CASES',v:hospital,p:'respiratory expected',vc:hospital>30?'#ef4444':'#fbbf24'},
        {t:'👶 CHILDREN',v:children,p:'under 12 · high risk'},
        {t:'🧑 ADULTS',v:adults,p:'age 12-60'},
        {t:'👴 ELDERLY',v:elderly,p:'60+ · vulnerable'},
        {t:'🧴 SKIN RISK',v:skin+'/10',p:'cleanup volunteers'},
        {t:'📞 HOTLINE',v:hotline,p:'calls/hour'},
        {t:'👥 VULNERABLE',v:(districts.reduce(function(a,d){return a+d.vulnerable;},0)/1000000).toFixed(1)+'M',p:'across districts'}
      ];
      g.innerHTML=cards.map(function(c){
        return '<div class="card"><div class="card-title">'+c.t+'</div>'+
          '<div class="stat-number" style="'+(c.vc?'color:'+c.vc+';':'')+'">'+c.v+'</div>'+
          '<div class="stat-label">'+c.p+'</div></div>';
      }).join('');
    }

    // AQI trend sparkline
    aqiHist.push(aqi); if(aqiHist.length>20)aqiHist.shift();
    var t=$('aqiTrend');
    if(t){
      var mx=Math.max.apply(null,aqiHist)||1;
      t.innerHTML=aqiHist.map(function(v){
        var h=Math.max(4,Math.round(v/mx*60));
        var col=v<100?'#00d4aa':v<200?'#fbbf24':v<300?'#f97316':'#ef4444';
        return '<div style="flex:1;height:'+h+'px;background:'+col+';border-radius:2px;opacity:0.8;"></div>';
      }).join('');
    }
    var lb=$('aqiLabel');
    if(lb) lb.innerHTML='Live AQI: <b style="color:'+color+';">'+aqi+'</b> ('+level+') · wind '+w+' km/h · VOC '+voc+' ppm · Last scan: '+lastScan;

    // Beach list
    var beaches=['Marina Beach','Elliot\'s Beach','Kovalam Beach','Mahabalipuram Beach','Puducherry Rock Beach','Cuddalore Silver Beach'];
    var bl=$('beachList');
    if(bl){
      bl.innerHTML=beaches.map(function(b,i){
        var st = i<Math.ceil(beachKm/2)?'CLOSED':'MONITOR';
        var col = st==='CLOSED'?'#ef4444':'#fbbf24';
        return '<div style="padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;">'+
          '<span>'+b+'</span><span style="color:'+col+';font-weight:700;">'+st+'</span></div>';
      }).join('');
    }

    // District cards (below grid) — with notify & remove
    var existing=document.getElementById('districtCards');
    if(existing) existing.remove();
    var dg=document.createElement('div');
    dg.id='districtCards';
    dg.className='grid-3';
    dg.style.marginTop='16px';
    dg.innerHTML=filtered.map(function(dd){
      var c=dd.level==='DANGER'?'#ef4444':dd.level==='WARN'?'#fbbf24':'#00d4aa';
      var realIdx=districts.indexOf(dd);
      return '<div class="card" style="position:relative;">'+
        '<button class="hDel" data-idx="'+realIdx+'" style="position:absolute;top:8px;right:8px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#f87171;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:11px;">✕</button>'+
        '<div class="card-title">🏙️ '+dd.name+'</div>'+
        '<div style="font-size:10px;color:#c9d8ea;margin:5px 0;">Pop: '+(dd.pop/1000000).toFixed(1)+'M · Vuln: '+(dd.vulnerable/1000).toFixed(0)+'K</div>'+
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+c+';letter-spacing:0.1em;">LEVEL: '+dd.level+'</div>'+
        '<div style="font-size:9px;color:#64748b;margin-top:6px;">Symptoms reported: '+dd.symptoms+'</div>'+
        '<button class="hNotify" data-idx="'+realIdx+'" style="margin-top:10px;width:100%;background:rgba(74,158,255,0.1);border:1px solid rgba(74,158,255,0.3);color:#4a9eff;padding:6px;border-radius:4px;cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:9px;">🔔 NOTIFY HOSPITAL</button>'+
      '</div>';
    }).join('')||'<div class="card" style="grid-column:1/-1;text-align:center;color:#64748b;">No districts match filter: '+filter+'</div>';

    var main=document.getElementById('page11');
    if(main) main.appendChild(dg);

    document.querySelectorAll('.hDel').forEach(function(b){
      b.addEventListener('click',function(e){
        e.stopPropagation();
        if(confirm('Remove district "'+districts[parseInt(b.dataset.idx)].name+'"?')){
          districts.splice(parseInt(b.dataset.idx),1);save(districts);render();
        }
      });
    });
    document.querySelectorAll('.hNotify').forEach(function(b){
      b.addEventListener('click',function(){
        var dd=districts[parseInt(b.dataset.idx)];
        var msg='Hospital pre-alert sent for '+dd.name+'. Expected '+dd.symptoms+' respiratory cases.';
        if(window.speechSynthesis){var u=new SpeechSynthesisUtterance(msg);u.rate=0.9;u.pitch=0.8;window.speechSynthesis.speak(u);}
      });
    });
  }

  document.addEventListener('click',function(e){var it=e.target.closest('.nav-item');if(it&&/Health/i.test(it.textContent))setTimeout(render,200);},true);
  setTimeout(render,2700); setInterval(render,7000);
  console.log('[health] armed — v2 with districts, banner, beaches, AQI trend');
})();

