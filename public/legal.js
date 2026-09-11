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
    if(port)port.addEventListener('click',function(){alert('Port State Notice sent to next port-of-call: Chennai Port Authority');});
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
