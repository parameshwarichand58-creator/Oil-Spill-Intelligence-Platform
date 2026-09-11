(function(){
  if (window.__exportHooks) return;
  window.__exportHooks = true;

  function $(i){ return document.getElementById(i); }
  function $$(sel){ return document.querySelectorAll(sel); }

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
      satellites: {
        'NASA MODIS': 'online',
        'ISRO RISAT': 'online',
        'Sentinel-1': 'standby'
      }
    };
  }

  function download(filename, content, mime){
    var blob=new Blob([content],{type:mime});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;a.download=filename;a.click();
    URL.revokeObjectURL(url);
  }

  function toCSV(d){
    var rows=[
      ['Field','Value'],
      ['Timestamp',d.timestamp],
      ['Mission',d.mission],
      ['Region',d.region],
      ['Oil Density (µg/L)',d.oil_density_ugL],
      ['Spread Rate (km/h)',d.spread_rate_kmh],
      ['Risk Level',d.risk_level],
      ['Active Vessels',d.active_vessels],
      ['Spill Area (km²)',d.spill_area_km2],
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
    var orig=btn.textContent;
    btn.textContent=text;
    btn.style.background='linear-gradient(135deg,#00d4aa,#059669)';
    setTimeout(function(){
      btn.textContent=orig;
      btn.style.background='';
    }, 1500);
  }

  function handleCSV(btn){
    var d=buildData();
    var csv=toCSV(d);
    var ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    download('ocean-eye-'+ts+'.csv', csv, 'text/csv;charset=utf-8');
    flash(btn, '✅ EXPORTED');
    if(window.speechSynthesis){
      window.speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance('C S V file exported.');
      u.rate=0.95; u.pitch=0.85;
      window.speechSynthesis.speak(u);
    }
    console.log('[export] CSV downloaded', d);
  }

  function handleJSON(btn){
    var d=buildData();
    var json=JSON.stringify(d,null,2);
    var ts=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
    download('ocean-eye-'+ts+'.json', json, 'application/json');
    flash(btn, '✅ EXPORTED');
    if(window.speechSynthesis){
      window.speechSynthesis.cancel();
      var u=new SpeechSynthesisUtterance('Jason file exported.');
      u.rate=0.95; u.pitch=0.85;
      window.speechSynthesis.speak(u);
    }
    console.log('[export] JSON downloaded', d);
  }

  function findExportButtons(){
    var buttons=document.querySelectorAll('button, .btn, a.btn, [role="button"]');
    var csvBtn=null, jsonBtn=null;
    buttons.forEach(function(b){
      var t=(b.textContent||'').trim();
      if(!csvBtn && /export\s+csv/i.test(t)) csvBtn=b;
      if(!jsonBtn && /export\s+json/i.test(t)) jsonBtn=b;
    });
    return { csv: csvBtn, json: jsonBtn };
  }

  function wire(){
    var found=findExportButtons();
    var ok=0;
    if(found.csv && !found.csv.dataset.exportWired){
      found.csv.dataset.exportWired='1';
      found.csv.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        handleCSV(this);
      });
      ok++;
    }
    if(found.json && !found.json.dataset.exportWired){
      found.json.dataset.exportWired='1';
      found.json.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        handleJSON(this);
      });
      ok++;
    }
    if(ok) console.log('[export] wired', ok, 'button(s)');
    return ok;
  }

  // Wire on load and keep watching (in case buttons render later)
  setTimeout(wire, 500);
  setTimeout(wire, 2000);
  setTimeout(wire, 5000);

  // Also watch for DOM changes (sidebar nav etc.)
  var mo=new MutationObserver(function(){ wire(); });
  mo.observe(document.body, { childList:true, subtree:true });

  console.log('[export] armed — CSV/JSON export hooks');
})();
