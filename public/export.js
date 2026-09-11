(function(){
  if (window.__exportHooks) return;
  window.__exportHooks = true;

  function $(i){ return document.getElementById(i); }

  function readDensity(){
    var a=['tick-density','liveOilDensity','anaDensity'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 60;
  }
  function readSpread(){
    var a=['tick-spread','liveSpreadRate','anaSpread'];
    for(var i=0;i<a.length;i++){var e=$(a[i]);if(!e)continue;var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n)&&n>0)return n;}
    return 3;
  }
  function readRisk(){
    var e=$('fsRisk');return e&&e.textContent?e.textContent.trim():'UNSAFE';
  }
  function readShips(){
    var e=$('tick-ships')||$('liveVessels')||$('anaShips');
    if(e){var n=parseFloat((e.textContent||'').replace(/[^0-9.]/g,''));if(isFinite(n))return n;}
    return 8;
  }

  function buildData(){
    var now=new Date();
    return {
      timestamp: now.toISOString(),
      mission: 'OCEAN EYE',
      region: 'Bay of Bengal · Chennai coast',
      oil_density_ugL: parseFloat(readDensity().toFixed(2)),
      spread_rate_kmh: parseFloat(readSpread().toFixed(2)),
      risk_level: readRisk(),
      active_vessels: readShips(),
      spill_area_km2: parseFloat((readDensity()/8).toFixed(2)),
      confidence_pct: 83,
      satellites: { 'NASA MODIS':'online','ISRO RISAT':'online','Sentinel-1':'standby' }
    };
  }

  function download(filename, content, mime){
    try{
      var blob=new Blob([content],{type:mime});
      var url=URL.createObjectURL(blob);
      var a=document.createElement('a');
      a.href=url; a.download=filename;
      a.style.display='none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 200);
    }catch(e){ console.error('[export] download failed', e); }
  }

  function toCSV(d){
    var rows=[
      ['Field','Value'],
      ['Timestamp',d.timestamp],
      ['Mission',d.mission],
      ['Region',d.region],
      ['Oil Density (ug/L)',d.oil_density_ugL],
      ['Spread Rate (km/h)',d.spread_rate_kmh],
      ['Risk Level',d.risk_level],
      ['Active Vessels',d.active_vessels],
      ['Spill Area (km2)',d.spill_area_km2],
      ['Confidence (%)',d.confidence_pct],
      ['NASA MODIS',d.satellites['NASA MODIS']],
      ['ISRO RISAT',d.satellites['ISRO RISAT']],
      ['Sentinel-1',d.satellites['Sentinel-1']]
    ];
    return rows.map(function(r){
      return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(',');
    }).join('\n');
  }

  function flash(btn, text){
    if(!btn) return;
    var orig=btn.innerHTML;
    btn.innerHTML=text;
    btn.style.background='linear-gradient(135deg,#00d4aa,#059669)';
    btn.style.color='#fff';
    setTimeout(function(){ btn.innerHTML=orig; btn.style.background=''; btn.style.color=''; }, 1500);
  }

  function speak(txt){
    try{
      if(window.speechSynthesis){
        window.speechSynthesis.cancel();
        var u=new SpeechSynthesisUtterance(txt);
        u.rate=0.95; u.pitch=0.85;
        window.speechSynthesis.speak(u);
      }
    }catch(e){}
  }

  function handleCSV(btn){
    var d=buildData();
    var csv=toCSV(d);
    var ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    download('ocean-eye-'+ts+'.csv', csv, 'text/csv;charset=utf-8');
    flash(btn, '✅ EXPORTED');
    speak('C S V file exported');
    console.log('[export] CSV downloaded', d);
  }

  function handleJSON(btn){
    var d=buildData();
    var json=JSON.stringify(d,null,2);
    var ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    download('ocean-eye-'+ts+'.json', json, 'application/json');
    flash(btn, '✅ EXPORTED');
    speak('JSON file exported');
    console.log('[export] JSON downloaded', d);
  }

  function identify(el){
    var txt=(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    if(/\bcsv\b/.test(txt) && /export/.test(txt)) return 'csv';
    if(/\bjson\b/.test(txt) && /export/.test(txt)) return 'json';
    if(/export\s*csv/.test(txt)) return 'csv';
    if(/export\s*json/.test(txt)) return 'json';
    return null;
  }

  // Capture-phase override — kills any inline onclick on export buttons
  document.addEventListener('click', function(e){
    var el=e.target.closest('button, a, .btn, [role="button"], div, span');
    if(!el) return;

    // Walk up to find the real clickable that has "export ... csv/json" text
    var node=el;
    var kind=null;
    for(var depth=0; depth<4 && node; depth++){
      kind=identify(node);
      if(kind) break;
      node=node.parentElement;
    }
    if(!kind) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();

    console.log('[export] intercepted click ·', kind, '·', node && node.tagName);
    if(kind==='csv') handleCSV(node);
    else handleJSON(node);
  }, true /* CAPTURE PHASE = fires before inline onclick */);

  // Backup: proactively strip inline onclick attributes from export buttons
  function stripInline(){
    document.querySelectorAll('button, a, .btn').forEach(function(b){
      var kind=identify(b);
      if(kind && b.hasAttribute('onclick')){
        b.removeAttribute('onclick');
        console.log('[export] stripped inline onclick from', kind, 'button');
      }
    });
  }
  setTimeout(stripInline, 400);
  setTimeout(stripInline, 2000);
  setTimeout(stripInline, 5000);

  // Keep watching for late-rendered buttons
  new MutationObserver(stripInline).observe(document.body, { childList:true, subtree:true });

  console.log('[export] armed — capture-phase intercept for CSV/JSON');
})();
