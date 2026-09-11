(function(){
  if (window.__foodSafety) return;
  window.__foodSafety = true;

  // Fishing zones in the Bay of Bengal (lat/lon bounding boxes)
  var FISHING_ZONES = [
    { id:'Zone-1', name:'Chennai Coast',      bbox:[12.5, 80.0, 14.0, 81.0] },
    { id:'Zone-2', name:'Kovalam–Mahabalipuram', bbox:[12.0, 79.8, 13.0, 80.3] },
    { id:'Zone-3', name:'Puducherry Shelf',   bbox:[11.5, 79.5, 12.5, 80.5] },
    { id:'Zone-4', name:'Cuddalore–Nagapattinam', bbox:[10.5, 79.5, 11.5, 80.5] },
    { id:'Zone-5', name:'Rameswaram Strait',  bbox:[9.0, 78.5, 10.5, 79.8] },
    { id:'Zone-6', name:'Visakhapatnam',      bbox:[16.5, 81.5, 18.0, 83.5] }
  ];

  var COMMUNITIES = [
    'Kovalam', 'Mahabalipuram', 'Puducherry', 'Cuddalore',
    'Nagapattinam', 'Rameswaram', 'Mandapam', 'Kanyakumari',
    'Chennai', 'Ennore', 'Visakhapatnam', 'Kakinada'
  ];

  // PAH bioaccumulation is measured against FDA action level of 2 µg/kg
  // Model: fish PAH (µg/kg) = density (µg/L) × 0.08 × hours_exposure
  var FDA_LIMIT = 2.0;
  var EXPOSURE_HOURS = 72; // assume fish exposed for 3 days
  var DECAY_RATE = 0.15;   // dilution + metabolism decay constant

  function $(id){ return document.getElementById(id); }
  function setTxt(id, v){ var e = $(id); if (e) e.textContent = v; }

  function readDensity(){
    var ids = ['tick-density','liveOilDensity','anaDensity'];
    for (var i = 0; i < ids.length; i++){
      var el = $(ids[i]);
      if (!el) continue;
      var n = parseFloat((el.textContent || '').replace(/[^0-9.]/g, ''));
      if (isFinite(n) && n > 0) return n;
    }
    return 60;
  }

  function readWaveDir(){
    var ids = ['oceanWaveDir','waveD'];
    for (var i = 0; i < ids.length; i++){
      var el = $(ids[i]);
      if (!el) continue;
      var n = parseFloat((el.textContent || '').replace(/[^0-9.]/g, ''));
      if (isFinite(n) && n >= 0) return n;
    }
    return 150;
  }

  function computeBioaccumulation(density, hours){
    var pah = density * 0.08 * hours;
    return Math.round(pah * 10) / 10;
  }

  function daysUntilSafe(density){
    if (density <= FDA_LIMIT) return 0;
    return Math.ceil(Math.log(density / FDA_LIMIT) / DECAY_RATE);
  }

  function zonesDownstream(waveDir){
    // Waves coming from waveDir → spill moves TOWARD waveDir (downwind/downcurrent)
    // Zones whose center bearing from (14, 86.5) is within ±60° of waveDir are affected
    var affected = [];
    FISHING_ZONES.forEach(function(z){
      var cy = (z.bbox[0] + z.bbox[2]) / 2;
      var cx = (z.bbox[1] + z.bbox[3]) / 2;
      var dLat = cy - 14, dLon = cx - 86.5;
      var bearing = (Math.atan2(dLon, dLat) * 180 / Math.PI + 360) % 360;
      var delta = Math.abs(((bearing - waveDir + 540) % 360) - 180);
      if (delta <= 60) affected.push(z);
    });
    // If nothing matches, flag the closest zone anyway
    if (!affected.length) affected.push(FISHING_ZONES[0]);
    return affected;
  }

  function ensurePanel(){
    if ($('foodSafetyPanel')) return true;

    // Find page4 (Alert page)
    var p4 = $('page4');
    if (!p4) return false;

    var panel = document.createElement('div');
    panel.id = 'foodSafetyPanel';
    panel.className = 'card';
    panel.style.cssText = 'margin-top:16px;border-left:3px solid #22d37f;';
    panel.innerHTML =
      '<div class="card-title" style="margin-bottom:12px;">🐟 Food Safety Advisory · Ecosystem Protection</div>' +
      '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' +
        '<div>' +
          '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#5c7286;letter-spacing:0.12em;">FISH PAH LEVEL</div>' +
          '<div style="font-family:\'Orbitron\',monospace;font-size:20px;color:#fff;margin-top:5px;" id="fsPah">—<span style="font-size:10px;color:#94a3b8;"> µg/kg</span></div>' +
          '<div style="font-size:9px;color:#64748b;margin-top:3px;">FDA limit: 2.0 µg/kg</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#5c7286;letter-spacing:0.12em;">DAYS UNTIL SAFE</div>' +
          '<div style="font-family:\'Orbitron\',monospace;font-size:20px;color:#fff;margin-top:5px;" id="fsDays">—<span style="font-size:10px;color:#94a3b8;"> days</span></div>' +
          '<div style="font-size:9px;color:#64748b;margin-top:3px;">at current density</div>' +
        '</div>' +
        '<div>' +
          '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#5c7286;letter-spacing:0.12em;">RISK TO CONSUMERS</div>' +
          '<div style="font-family:\'Orbitron\',monospace;font-size:20px;color:#fff;margin-top:5px;" id="fsRisk">—</div>' +
          '<div style="font-size:9px;color:#64748b;margin-top:3px;">if fish consumed now</div>' +
        '</div>' +
      '</div>' +
      '<div style="margin-top:14px;">' +
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#5c7286;letter-spacing:0.12em;margin-bottom:6px;">AFFECTED FISHING ZONES</div>' +
        '<div id="fsZones" style="font-size:11px;color:#c9d8ea;line-height:1.7;">—</div>' +
      '</div>' +
      '<div style="margin-top:14px;">' +
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#5c7286;letter-spacing:0.12em;margin-bottom:6px;">COASTAL COMMUNITIES AT RISK</div>' +
        '<div id="fsCommunities" style="font-size:11px;color:#c9d8ea;line-height:1.7;">—</div>' +
      '</div>' +
      '<div style="margin-top:14px;padding:10px 12px;background:rgba(34,211,127,0.06);border-left:2px solid #22d37f;border-radius:3px;">' +
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#22d37f;letter-spacing:0.1em;margin-bottom:4px;">RECOMMENDED ACTION</div>' +
        '<div id="fsAction" style="font-size:11px;color:#c9d8ea;line-height:1.6;">—</div>' +
      '</div>';

    p4.appendChild(panel);
    console.log('[food-safety] panel injected');
    return true;
  }

  function update(){
    if (!ensurePanel()) return;

    var density = readDensity();
    var waveDir = readWaveDir();

    // Bioaccumulation
    var pah = computeBioaccumulation(density, EXPOSURE_HOURS);
    var days = daysUntilSafe(density);

    // Risk level
    var riskLevel, riskColor, riskAction;
    if (pah < FDA_LIMIT){
      riskLevel = 'SAFE'; riskColor = '#22d37f';
      riskAction = 'No fishing restrictions required. Continue routine monitoring.';
    } else if (pah < FDA_LIMIT * 3){
      riskLevel = 'CAUTION'; riskColor = '#fbbf24';
      riskAction = 'Restrict commercial catch in downstream zones for ' + days + ' days. Issue advisory to local fish markets.';
    } else if (pah < FDA_LIMIT * 10){
      riskLevel = 'UNSAFE'; riskColor = '#ff6b3d';
      riskAction = 'Close fishing in affected zones for ' + days + ' days. Divert catch to alternate districts. Deploy water quality monitoring.';
    } else {
      riskLevel = 'CRITICAL'; riskColor = '#ff4757';
      riskAction = 'IMMEDIATE CLOSURE of all downstream fishing zones. Public health advisory to coastal communities. Deploy seafood testing teams within 12 hours.';
    }

    setTxt('fsPah', pah.toFixed(1) + ' ');
    var pahEl = $('fsPah');
    if (pahEl){
      pahEl.innerHTML = pah.toFixed(1) + '<span style="font-size:10px;color:#94a3b8;"> µg/kg</span>';
      pahEl.style.color = pah >= FDA_LIMIT ? riskColor : '#fff';
    }

    var daysEl = $('fsDays');
    if (daysEl){
      daysEl.innerHTML = days + '<span style="font-size:10px;color:#94a3b8;"> days</span>';
    }

    var riskEl = $('fsRisk');
    if (riskEl){ riskEl.textContent = riskLevel; riskEl.style.color = riskColor; }

    // Affected zones
    var zones = zonesDownstream(waveDir);
    var zonesHtml = zones.map(function(z){
      return '<span style="display:inline-block;padding:3px 10px;background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.4);border-radius:3px;margin-right:6px;margin-bottom:4px;font-size:10px;">' +
        z.id + ' · ' + z.name + '</span>';
    }).join('');
    var zonesEl = $('fsZones');
    if (zonesEl) zonesEl.innerHTML = zonesHtml || 'None';

    // Communities
    var comHtml = COMMUNITIES.slice(0, 6).map(function(c){
      return '<span style="display:inline-block;padding:3px 9px;background:rgba(74,158,255,0.08);border:1px solid rgba(74,158,255,0.3);border-radius:3px;margin-right:6px;margin-bottom:4px;font-size:10px;color:#4a9eff;">' + c + '</span>';
    }).join('');
    var comEl = $('fsCommunities');
    if (comEl) comEl.innerHTML = comHtml;

    var actEl = $('fsAction');
    if (actEl) actEl.textContent = riskAction;

    console.log('[food-safety] density', density.toFixed(1), '· pah', pah.toFixed(1), '· days', days, '· risk', riskLevel);
  }

  // Run every 10 seconds
  setTimeout(update, 1500);
  setInterval(update, 10000);

  console.log('[food-safety] armed');
})();
