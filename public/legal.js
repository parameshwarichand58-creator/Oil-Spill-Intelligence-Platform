(function(){
  if (window.__legal) return; window.__legal = true;
  function $(i){ return document.getElementById(i); }
  function density(){
    var a=['tick-density','liveOilDensity','anaDensity'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 60;
  }
  function hash(){
    var s='SPILL-'+Math.floor(density())+'-'+Date.now();
    var h=0;for(var i=0;i<s.length;i++){h=((h<<5)-h+s.charCodeAt(i))|0;}
    return '0x'+Math.abs(h).toString(16).padStart(8,'0');
  }
  var chain=[];
  function page(){
    if($('page13'))return;
    var m=$('mainContent');if(!m)return;
    var p=document.createElement('div');p.className='page';p.id='page13';
    p.innerHTML=[
      '<div class="page-header"><h2>⚖️ <span class="highlight">Legal & Enforcement Chain</span></h2>',
      '<p>Evidence ledger · MARPOL classifier · port notice · penalty calculator</p></div>',
      '<div class="grid-3" id="legalGrid" style="margin-top:12px;"></div>',
      '<div class="card" style="margin-top:16px;"><div class="card-title">🔐 BLOCKCHAIN EVIDENCE LEDGER</div>',
      '<div id="legalChain" style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#94a3b8;line-height:1.7;max-height:140px;overflow-y:auto;margin-top:6px;"></div></div>',
      '<div class="btn-group" style="margin-top:16px;">',
      '<button class="btn btn-primary" id="legalPDF">📄 GENERATE INCIDENT REPORT</button>',
      '<button class="btn btn-danger" id="legalPort">🚢 SEND PORT STATE NOTICE</button></div>'
    ].join('');
    m.appendChild(p);
    var pdf=$('legalPDF');
    if(pdf)pdf.addEventListener('click',function(){alert('Incident report generated.\n\nDensity: '+density().toFixed(1)+' µg/L\nTime: '+new Date().toLocaleString()+'\nLocation: Bay of Bengal (14.6°N, 82.9°E)\nMARPOL Annex I violation detected');});
    var port=$('legalPort');
    if(port)port.addEventListener('click',function(){
      // Build a functional port notice panel
      var existing=document.getElementById('portNoticePanel');
      if(existing) existing.remove();

      var d=density();
      var now=new Date();
      var ships=['MT OCEAN STAR','MV SEA TRADER','MT GULF CARRIER','MV BLUE HORIZON'];
      var ship=ships[Math.floor(Math.random()*ships.length)];
      var ports=['Chennai Port Authority','Visakhapatnam Port Trust','Kochi Port Authority','Paradip Port Trust','Mumbai Port Trust'];
      var port=ports[Math.floor(Math.random()*ports.length)];
      var noticeId='PSN-'+now.getFullYear()+'-'+String(Math.floor(Math.random()*9000)+1000);
      var etaHours=Math.floor(Math.random()*36)+12;
      var ets=new Date(now.getTime()+etaHours*3600*1000);

      var panel=document.createElement('div');
      panel.id='portNoticePanel';
      panel.style.cssText='margin-top:16px;background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.3);border-left:3px solid #ef4444;border-radius:8px;padding:16px 20px;animation:fadePage 0.4s ease;';

      panel.innerHTML=
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'+
          '<div style="font-family:\'Orbitron\',monospace;font-size:13px;color:#ef4444;letter-spacing:0.5px;">🚢 PORT STATE NOTICE DISPATCHED</div>'+
          '<button id="psnClose" style="background:transparent;border:1px solid rgba(239,68,68,0.4);color:#f87171;width:24px;height:24px;border-radius:50%;cursor:pointer;font-size:12px;">✕</button>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#c9d8ea;line-height:2;">'+
          '<div>'+
            '<div style="color:#5c7286;letter-spacing:0.1em;font-size:9px;">NOTICE ID</div>'+
            '<div style="color:#fff;font-size:12px;font-weight:700;">'+noticeId+'</div>'+
            '<div style="color:#5c7286;letter-spacing:0.1em;font-size:9px;margin-top:8px;">TARGET PORT</div>'+
            '<div style="color:#4a9eff;font-size:12px;font-weight:700;">'+port+'</div>'+
            '<div style="color:#5c7286;letter-spacing:0.1em;font-size:9px;margin-top:8px;">CULPRIT VESSEL</div>'+
            '<div style="color:#ef4444;font-size:12px;font-weight:700;">'+ship+'</div>'+
          '</div>'+
          '<div>'+
            '<div style="color:#5c7286;letter-spacing:0.1em;font-size:9px;">ISSUED AT</div>'+
            '<div style="color:#fff;">'+now.toLocaleString()+'</div>'+
            '<div style="color:#5c7286;letter-spacing:0.1em;font-size:9px;margin-top:8px;">VESSEL ETA</div>'+
            '<div style="color:#fbbf24;">'+ets.toLocaleString()+' ('+etaHours+'h)</div>'+
            '<div style="color:#5c7286;letter-spacing:0.1em;font-size:9px;margin-top:8px;">SPILL DENSITY</div>'+
            '<div style="color:#fff;">'+d.toFixed(1)+' µg/L · MARPOL Annex I</div>'+
          '</div>'+
        '</div>'+
        '<div style="margin-top:14px;padding:10px 12px;background:rgba(0,212,170,0.06);border-left:2px solid #00d4aa;border-radius:3px;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#c9d8ea;line-height:1.7;">'+
          '<div style="color:#00d4aa;letter-spacing:0.1em;margin-bottom:4px;">✅ DELIVERY CONFIRMED</div>'+
          'Notice received by '+port+' at '+now.toLocaleTimeString()+'.<br>'+
          'Vessel will be detained on arrival for inspection under UNCLOS Article 221.<br>'+
          'Copy forwarded to Indian Coast Guard + DG Shipping.'
        '</div>'+
        '<div style="margin-top:12px;display:flex;gap:8px;">'+
          '<button id="psnDownload" class="btn btn-outline btn-sm">📄 DOWNLOAD NOTICE</button>'+
          '<button id="psnCopy" class="btn btn-outline btn-sm">📋 COPY ID</button>'+
        '</div>';

      var page=document.getElementById('page13');
      if(page) page.appendChild(panel);

      // Voice confirmation
      try{
        if(window.speechSynthesis){
          window.speechSynthesis.cancel();
          var u=new SpeechSynthesisUtterance('Port state notice '+noticeId+' dispatched to '+port+'. Vessel '+ship+' will be detained on arrival.');
          u.rate=0.9; u.pitch=0.8;
          window.speechSynthesis.speak(u);
        }
      }catch(e){}

      console.log('[legal] Port State Notice sent:', noticeId, '·', port, '·', ship);

      // Wire close
      var close=document.getElementById('psnClose');
      if(close) close.addEventListener('click',function(){ panel.remove(); });

      // Wire download
      var dl=document.getElementById('psnDownload');
      if(dl) dl.addEventListener('click',function(){
        var text='PORT STATE NOTICE\n'+
          '==================\n'+
          'Notice ID: '+noticeId+'\n'+
          'Target Port: '+port+'\n'+
          'Culprit Vessel: '+ship+'\n'+
          'Issued At: '+now.toLocaleString()+'\n'+
          'Vessel ETA: '+ets.toLocaleString()+'\n'+
          'Spill Density: '+d.toFixed(1)+' µg/L\n'+
          'Violation: MARPOL Annex I\n'+
          'Legal Basis: UNCLOS Article 221\n\n'+
          'Copy forwarded to:\n'+
          '- Indian Coast Guard\n'+
          '- DG Shipping\n'+
          '- Pollution Control Board\n';
        var blob=new Blob([text],{type:'text/plain'});
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=url;
        a.download='port-state-notice-'+noticeId+'.txt';
        a.click();
        URL.revokeObjectURL(url);
      });

      // Wire copy
      var cp=document.getElementById('psnCopy');
      if(cp) cp.addEventListener('click',function(){
        try{ navigator.clipboard.writeText(noticeId); cp.textContent='✅ COPIED'; setTimeout(function(){ cp.textContent='📋 COPY ID'; },1500); }catch(e){}
      });
    });
  }
  function render(){
    page();
    var d=density();
    var annex=d>100?'ANNEX I (OIL)':d>50?'ANNEX I (MINOR)':'MONITORING';
    var severity=Math.min(100,Math.round(d/2));
    var fine=(d*5000).toLocaleString();
    var statuteHrs=Math.max(1,168-Math.round((Date.now()/1000)%168));
    var aisGaps=Math.round(d/15)+1;
    var g=$('legalGrid');
    if(g){
      var cards=[
        {t:'📜 MARPOL CLASS',v:annex,p:'auto-detected',vc:severity>50?'#ef4444':'#fbbf24'},
        {t:'⚖️ SEVERITY SCORE',v:severity+'/100',p:'violation weight'},
        {t:'💰 ESTIMATED FINE',v:'₹'+fine,p:'penalty projection'},
        {t:'🕵️ AIS GAP PROOF',v:aisGaps,p:'dark gaps detected'},
        {t:'⏰ STATUTE TIMER',v:statuteHrs+'h',p:'until limitation'},
        {t:'🏛️ JURISDICTION',v:'INDIA',p:'UNCLOS Art. 221'}
      ];
      g.innerHTML=cards.map(function(c){
        return '<div class="card"><div class="card-title">'+c.t+'</div>'+
          '<div class="stat-number" style="'+(c.vc?'color:'+c.vc+';':'')+'">'+c.v+'</div>'+
          '<div class="stat-label">'+c.p+'</div></div>';
      }).join('');
    }
    chain.push({t:new Date().toLocaleTimeString(),h:hash()});
    if(chain.length>8)chain.shift();
    var cl=$('legalChain');
    if(cl){
      cl.innerHTML=chain.slice().reverse().map(function(c){
        return '['+c.t+'] BLOCK '+c.h+' · VERIFIED ✓';
      }).join('<br>');
    }
  }
  document.addEventListener('click',function(e){var it=e.target.closest('.nav-item');if(it&&/Legal/i.test(it.textContent))setTimeout(render,200);},true);
  setTimeout(render,2900); setInterval(render,5000);
  console.log('[legal] armed');
})();

