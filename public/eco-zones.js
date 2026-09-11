(function(){
  if (window.__ecoZones) return; window.__ecoZones = true;
  function $(i){ return document.getElementById(i); }
  function density(){
    var a=['tick-density','liveOilDensity','anaDensity'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 60;
  }
  function risk(){var e=$('fsRisk');return e&&e.textContent?e.textContent.trim().toUpperCase():'UNSAFE';}

  var DEFAULTS = [
    {i:'🐢',n:'Turtle Nesting',loc:'Kovalam · Mahabalipuram · Rameswaram',rule:'DISPERSANT BAN',th:'MEDIUM',species:3},
    {i:'🪸',n:'Coral Reefs',loc:'Gulf of Mannar · Andaman shelf',rule:'BURN BAN',th:'MEDIUM',species:12},
    {i:'🌿',n:'Mangroves',loc:'Pichavaram · Bhitarkanika',rule:'BOOMS ONLY',th:'LOW',species:22},
    {i:'🐦',n:'Bird Corridors',loc:'Point Calimere · Chilika',rule:'AERIAL DETERRENT',th:'LOW',species:47},
    {i:'💧',n:'Water Intakes',loc:'Chennai · Puducherry · Vizag',rule:'MUNICIPAL SHUTDOWN',th:'MEDIUM',species:0},
    {i:'🐠',n:'Fish Nurseries',loc:'Bay of Bengal shelf',rule:'FISHING CLOSURE',th:'HIGH',species:31}
  ];

  function load(){
    try{
      var s=localStorage.getItem('ecoZones');
      if(s)return JSON.parse(s);
    }catch(e){}
    return DEFAULTS.slice();
  }
  function save(z){ try{ localStorage.setItem('ecoZones', JSON.stringify(z)); }catch(e){} }

  var zones = load();
  var filter = 'ALL';
  var lastScan = '—';

  function page(){
    if($('page10'))return;
    var m=$('mainContent');if(!m)return;
    var p=document.createElement('div');p.className='page';p.id='page10';
    p.innerHTML=[
      '<div class="page-header"><h2>🌿 <span class="highlight">Ecological Sensitivity Zones</span></h2>',
      '<p>Protected habitats · live threat scoring · response rules per zone</p></div>',

      '<div class="btn-group" style="margin-bottom:12px;">',
        '<button class="btn btn-primary" id="ecoCheck" type="button">✅ CHECK STATUS</button>',
        '<button class="btn btn-success" id="ecoAdd" type="button">➕ ADD ZONE</button>',
        '<button class="btn btn-outline" id="ecoExport" type="button">📤 EXPORT JSON</button>',
        '<button class="btn btn-danger" id="ecoReset" type="button">🔄 RESET ZONES</button>',
      '</div>',

      '<div class="btn-group" style="margin-bottom:14px;" id="ecoFilters">',
        '<button class="btn btn-outline ecoF active" data-f="ALL" type="button">ALL</button>',
        '<button class="btn btn-outline ecoF" data-f="HIGH" type="button">HIGH</button>',
        '<button class="btn btn-outline ecoF" data-f="MEDIUM" type="button">MEDIUM</button>',
        '<button class="btn btn-outline ecoF" data-f="LOW" type="button">LOW</button>',
      '</div>',

      '<div id="ecoAddForm" style="display:none;background:rgba(0,212,170,0.04);border:1px solid rgba(0,212,170,0.2);border-radius:6px;padding:12px 14px;margin-bottom:14px;">',
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#00d4aa;letter-spacing:0.1em;margin-bottom:8px;">➕ ADD NEW ZONE</div>',
        '<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;">',
          '<input id="nzIcon" placeholder="Emoji (🐢)" value="🌊" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);color:#e2e8f0;padding:8px;border-radius:4px;font-size:11px;">',
          '<input id="nzName" placeholder="Zone name" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);color:#e2e8f0;padding:8px;border-radius:4px;font-size:11px;">',
          '<input id="nzLoc" placeholder="Location" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);color:#e2e8f0;padding:8px;border-radius:4px;font-size:11px;">',
          '<select id="nzRule" style="background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);color:#e2e8f0;padding:8px;border-radius:4px;font-size:11px;">',
            '<option>DISPERSANT BAN</option><option>BURN BAN</option><option>BOOMS ONLY</option>',
            '<option>AERIAL DETERRENT</option><option>MUNICIPAL SHUTDOWN</option><option>FISHING CLOSURE</option>',
          '</select>',
        '</div>',
        '<div class="btn-group" style="margin-top:10px;">',
          '<button class="btn btn-success btn-sm" id="nzSave" type="button">SAVE ZONE</button>',
          '<button class="btn btn-outline btn-sm" id="nzCancel" type="button">CANCEL</button>',
        '</div>',
      '</div>',

      '<div class="grid-3" id="ecoGrid" style="margin-top:12px;"></div>',
      '<div class="card" style="margin-top:16px;"><div class="card-title">📊 ZONE THREAT SUMMARY</div>',
      '<div id="ecoSummary" style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#c9d8ea;line-height:1.9;"></div></div>'
    ].join('');
    m.appendChild(p);
    console.log('[eco-zones] page10 created');
  }

  // Idempotent button wiring — runs every render so buttons ALWAYS work
  function ensureButtons(){
    var check=$('ecoCheck');
    if(check && !check.dataset.wired){
      check.dataset.wired='1';
      check.onclick=function(){
        lastScan=new Date().toLocaleTimeString();
        try{
          if(window.speechSynthesis){
            window.speechSynthesis.cancel();
            var u=new SpeechSynthesisUtterance('Ecological zone scan complete.');
            u.rate=0.9; u.pitch=0.8; window.speechSynthesis.speak(u);
          }
        }catch(e){}
        render();
      };
    }

    var add=$('ecoAdd');
    if(add && !add.dataset.wired){
      add.dataset.wired='1';
      add.onclick=function(){
        var f=$('ecoAddForm');
        if(f) f.style.display = f.style.display==='none'?'block':'none';
      };
    }

    var cancel=$('nzCancel');
    if(cancel && !cancel.dataset.wired){
      cancel.dataset.wired='1';
      cancel.onclick=function(){ var f=$('ecoAddForm'); if(f) f.style.display='none'; };
    }

    var saveBtn=$('nzSave');
    if(saveBtn && !saveBtn.dataset.wired){
      saveBtn.dataset.wired='1';
      saveBtn.onclick=function(){
        var n=$('nzName').value.trim() || 'Custom Zone';
        var z={
          i: $('nzIcon').value.trim() || '🌊',
          n: n,
          loc: $('nzLoc').value.trim() || 'Custom location',
          rule: $('nzRule').value,
          th: 'MEDIUM',
          species: 0,
          custom: true
        };
        zones.push(z); save(zones);
        $('nzName').value=''; $('nzLoc').value='';
        var f=$('ecoAddForm'); if(f) f.style.display='none';
        render();
      };
    }

    var exp=$('ecoExport');
    if(exp && !exp.dataset.wired){
      exp.dataset.wired='1';
      exp.onclick=function(){
        var data=JSON.stringify(zones,null,2);
        var blob=new Blob([data],{type:'application/json'});
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=url; a.download='eco-zones-'+Date.now()+'.json';
        document.body.appendChild(a); a.click();
        setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
      };
    }

    var reset=$('ecoReset');
    if(reset && !reset.dataset.wired){
      reset.dataset.wired='1';
      reset.onclick=function(){
        if(confirm('Reset all zones to defaults? This will remove all custom zones.')){
          zones = DEFAULTS.slice();
          save(zones);
          try{ localStorage.removeItem('ecoZones'); localStorage.setItem('ecoZones', JSON.stringify(DEFAULTS)); }catch(e){}
          // Reset filter to ALL so all defaults are visible
          filter='ALL';
          var allBtn=document.querySelector('.ecoF[data-f="ALL"]');
          document.querySelectorAll('.ecoF').forEach(function(x){x.classList.remove('active');});
          if(allBtn) allBtn.classList.add('active');
          render();
          try{
            if(window.speechSynthesis){
              window.speechSynthesis.cancel();
              var u=new SpeechSynthesisUtterance('Zones reset to defaults.');
              u.rate=0.9; u.pitch=0.8; window.speechSynthesis.speak(u);
            }
          }catch(e){}
        }
      };
    }

    document.querySelectorAll('.ecoF').forEach(function(b){
      if(b.dataset.wired) return;
      b.dataset.wired='1';
      b.onclick=function(){
        document.querySelectorAll('.ecoF').forEach(function(x){ x.classList.remove('active'); });
        b.classList.add('active');
        filter = b.dataset.f;
        render();
      };
    });
  }

  function render(){
    page();
    ensureButtons();

    var d=density(), r=risk();
    var dist=Math.max(5,Math.min(150,Math.round(120-(d/2))));

    zones.forEach(function(z){
      if(!z.custom){
        z.th = dist<30?'HIGH':dist<50?'MEDIUM':'LOW';
      }
    });

    var filtered = filter==='ALL' ? zones : zones.filter(function(z){ return z.th===filter; });

    var g=$('ecoGrid');
    if(g){
      g.innerHTML = filtered.map(function(z){
        var c = z.th==='HIGH'?'#ef4444':z.th==='MEDIUM'?'#fbbf24':'#00d4aa';
        var realIdx = zones.indexOf(z);
        return '<div class="card" style="position:relative;">'+
          '<button class="ecoDel" data-idx="'+realIdx+'" title="Remove zone" style="position:absolute;top:8px;right:8px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.4);color:#f87171;width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:11px;line-height:1;">✕</button>'+
          '<div class="card-title">'+z.i+' '+z.n+'</div>'+
          '<div style="font-size:10px;color:#c9d8ea;margin:5px 0;line-height:1.4;">'+z.loc+'</div>'+
          '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+c+';letter-spacing:0.1em;">THREAT: '+z.th+'</div>'+
          '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#4a9eff;margin-top:6px;">RULE: '+z.rule+'</div>'+
          '<div style="font-size:9px;color:#64748b;margin-top:6px;">Distance: '+dist+' km · Species: '+(z.species||0)+'</div>'+
          '<button class="ecoNotify" data-idx="'+realIdx+'" style="margin-top:10px;width:100%;background:rgba(74,158,255,0.1);border:1px solid rgba(74,158,255,0.3);color:#4a9eff;padding:6px;border-radius:4px;cursor:pointer;font-family:\'Share Tech Mono\',monospace;font-size:9px;letter-spacing:0.1em;">🔔 NOTIFY AUTHORITY</button>'+
        '</div>';
      }).join('') || '<div class="card" style="grid-column:1/-1;text-align:center;color:#64748b;">No zones match filter: '+filter+'</div>';
    }

    document.querySelectorAll('.ecoDel').forEach(function(b){
      b.onclick=function(e){
        e.stopPropagation();
        var i=parseInt(b.dataset.idx);
        if(confirm('Remove zone "'+zones[i].n+'"?')){
          zones.splice(i,1); save(zones); render();
        }
      };
    });

    document.querySelectorAll('.ecoNotify').forEach(function(b){
      b.onclick=function(){
        var z=zones[parseInt(b.dataset.idx)];
        var msg='Authority notified for '+z.n+'. Rule: '+z.rule+'.';
        try{
          if(window.speechSynthesis){
            window.speechSynthesis.cancel();
            var u=new SpeechSynthesisUtterance(msg);
            u.rate=0.9; u.pitch=0.8; window.speechSynthesis.speak(u);
          }
        }catch(e){}
      };
    });

    var s=$('ecoSummary');
    if(s){
      var hi=zones.filter(function(z){return z.th==='HIGH';}).length;
      var me=zones.filter(function(z){return z.th==='MEDIUM';}).length;
      var lo=zones.filter(function(z){return z.th==='LOW';}).length;
      s.innerHTML='Density: '+d.toFixed(1)+' µg/L · Risk: '+r+
        '<br>HIGH: '+hi+' · MEDIUM: '+me+' · LOW: '+lo+
        '<br>Total zones: '+zones.length+' · Filter: '+filter+
        '<br>Last scan: '+lastScan;
    }
  }

  document.addEventListener('click',function(e){var it=e.target.closest('.nav-item');if(it&&/Eco-Zones/i.test(it.textContent))setTimeout(render,200);},true);
  setTimeout(render,2600); setInterval(render,8000);
  console.log('[eco-zones] armed — v3 with idempotent button wiring');
})();
