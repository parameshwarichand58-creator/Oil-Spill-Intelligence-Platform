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
  function readRisk(){var e=$('fsRisk');return e&&e.textContent?e.textContent.trim():'UNSAFE';}
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

  function saveFile(filename, content, mime){
    var blob=new Blob([content],{type:mime});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.rel='noopener';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 300);
  }

  function downloadCSV(){
    var d=buildData();
    var csv=toCSV(d);
    var ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    saveFile('ocean-eye-'+ts+'.csv', csv, 'text/csv;charset=utf-8');
    console.log('[export] CSV downloaded', d);
  }
  function downloadJSON(){
    var d=buildData();
    var json=JSON.stringify(d,null,2);
    var ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    saveFile('ocean-eye-'+ts+'.json', json, 'application/json');
    console.log('[export] JSON downloaded', d);
  }

  function isCSV(el){
    var t=(el.textContent||'').toLowerCase();
    return t.indexOf('csv')!==-1 && t.indexOf('export')!==-1;
  }
  function isJSON(el){
    var t=(el.textContent||'').toLowerCase();
    return t.indexOf('json')!==-1 && t.indexOf('export')!==-1;
  }

  // Strip any existing broken handlers, then attach clean ones
  function fixButton(btn, kind){
    // Remove inline onclick so it doesn't fire
    if(btn.hasAttribute('onclick')) btn.removeAttribute('onclick');
    // If it's an <a>, neutralize its href so it doesn't navigate
    if(btn.tagName === 'A'){
      btn.removeAttribute('href');
      btn.setAttribute('href','javascript:void(0)');
      btn.style.textDecoration='none';
    }
    // Prevent default on mousedown too (some handlers attach there)
    if(!btn.dataset.exportClean){
      btn.dataset.exportClean='1';
      btn.addEventListener('mousedown', function(e){ e.preventDefault(); });
      btn.addEventListener('click', function(e){
        e.preventDefault();
        e.stopPropagation();
        if(kind==='csv') downloadCSV();
        else downloadJSON();
      });
    }
  }

  function scan(){
    var count=0;
    document.querySelectorAll('button, a, .btn, [role="button"]').forEach(function(b){
      if(isCSV(b)){ fixButton(b,'csv'); count++; }
      else if(isJSON(b)){ fixButton(b,'json'); count++; }
    });
    if(count) console.log('[export] wired', count, 'button(s)');
  }

  // Scan multiple times in case buttons render late
  setTimeout(scan, 300);
  setTimeout(scan, 1500);
  setTimeout(scan, 4000);
  setTimeout(scan, 8000);

  // Also re-scan on DOM changes
  new MutationObserver(scan).observe(document.body, { childList:true, subtree:true });

  console.log('[export] armed — clean download, no blank page');
})();
