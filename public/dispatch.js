(function(){
  if (window.__dispatch) return;
  window.__dispatch = true;

  // === ASSET REGISTRY (mock fleet based at Indian ports) ===
  var ASSETS = [
    { id:'SK-01', type:'Skimmer Vessel',  port:'Chennai',        lat:13.08, lng:80.27, cap:'50 m³/hr', eta:45,  status:'ready' },
    { id:'SK-02', type:'Skimmer Vessel',  port:'Ennore',         lat:13.24, lng:80.34, cap:'40 m³/hr', eta:70,  status:'ready' },
    { id:'BM-01', type:'Boom (500m)',     port:'Chennai',        lat:13.08, lng:80.27, cap:'500 m',    eta:60,  status:'ready' },
    { id:'BM-02', type:'Boom (300m)',     port:'Puducherry',     lat:11.93, lng:79.83, cap:'300 m',    eta:120, status:'standby' },
    { id:'DS-01', type:'Dispersant Stock',port:'Chennai',        lat:13.08, lng:80.27, cap:'2000 L',   eta:90,  status:'ready' },
    { id:'DS-02', type:'Dispersant Stock',port:'Visakhapatnam',  lat:17.68, lng:83.22, cap:'1500 L',   eta:240, status:'ready' },
    { id:'IB-01', type:'In-situ Burn Kit',port:'Chennai',        lat:13.08, lng:80.27, cap:'1 team',   eta:180, status:'standby' },
    { id:'CG-01', type:'Coast Guard Ship',port:'Chennai',        lat:13.08, lng:80.27, cap:'Ops Command', eta:30, status:'ready' }
  ];

  // === RESPONSE MATRIX (spill size -> required kit) ===
  var MATRIX = [
    { maxKm2: 5,  kit:['BM-01','DS-01'],                       label:'SMALL',    color:'#00d4aa' },
    { maxKm2: 20, kit:['SK-01','BM-01','DS-01','CG-01'],       label:'MEDIUM',   color:'#fbbf24' },
    { maxKm2: 1e9,kit:['SK-01','SK-02','BM-01','BM-02','DS-01','DS-02','IB-01','CG-01'], label:'LARGE', color:'#ef4444' }
  ];

  // === RECIPIENTS ===
  var RECIPIENTS = [
    { name:'Coast Guard',              icon:'⚓', method:'SMS + Email + API' },
    { name:'Port Authority',           icon:'🚢', method:'API' },
    { name:'Pollution Control Board',  icon:'🏛️', method:'Email' },
    { name:'Fishing Cooperative',      icon:'🎣', method:'SMS Broadcast' },
    { name:'Municipal Water Authority',icon:'💧', method:'API' },
    { name:'Wildlife Rescue',          icon:'🐢', method:'Email' },
    { name:'Public Advisory',          icon:'📢', method:'Webhook' }
  ];

  function $(id){ return document.getElementById(id); }

  function readSpillSize(){
    var ids = ['tick-density','liveOilDensity','anaDensity'];
    for (var i = 0; i < ids.length; i++){
      var el = $(ids[i]);
      if (!el) continue;
      var n = parseFloat((el.textContent || '').replace(/[^0-9.]/g,''));
      if (isFinite(n) && n > 0){
        // rough conversion: density µg/L -> approximate km²
        return Math.max(1, Math.round(n / 8));
      }
    }
    return 12; // default demo size
  }

  function readRisk(){
    var el = $('fsRisk');
    if (el && el.textContent) return el.textContent.trim().toUpperCase();
    return 'UNSAFE';
  }

  function matchMatrix(km2){
    for (var i = 0; i < MATRIX.length; i++){
      if (km2 <= MATRIX[i].maxKm2) return MATRIX[i];
    }
    return MATRIX[MATRIX.length - 1];
  }

  function formatAssets(kit){
    return ASSETS.filter(function(a){ return kit.indexOf(a.id) !== -1; });
  }

  function totalEta(assets){
    if (!assets.length) return 0;
    return Math.max.apply(null, assets.map(function(a){ return a.eta; }));
  }

  // === BUILD PAGE 9 ===
  function ensurePage(){
    if ($('page9')) return;
    var main = $('mainContent');
    if (!main) return;
    var p = document.createElement('div');
    p.className = 'page';
    p.id = 'page9';
    p.innerHTML =
      '<div class="page-header">' +
        '<h2>🚒 <span class="highlight">Response Dispatch</span></h2>' +
        '<p>Match spill size to equipment · one-click multi-agency alert</p>' +
      '</div>' +
      '<div class="grid-3" style="margin-bottom:16px;">' +
        '<div class="card">' +
          '<div class="card-title">📏 SPILL SIZE</div>' +
          '<div class="stat-number" id="dpSize">—</div>' +
          '<div class="stat-label">approx km²</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title">⚠️ THREAT LEVEL</div>' +
          '<div class="stat-number" id="dpLevel">—</div>' +
          '<div class="stat-label" id="dpRisk">—</div>' +
        '</div>' +
        '<div class="card">' +
          '<div class="card-title">⏱️ FIRST ARRIVAL ETA</div>' +
          '<div class="stat-number" id="dpEta">—</div>' +
          '<div class="stat-label">minutes</div>' +
        '</div>' +
      '</div>' +
      '<div class="card" style="margin-bottom:16px;">' +
        '<div class="card-title">🧰 REQUIRED CLEANUP KIT</div>' +
        '<div id="dpKit" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;"></div>' +
      '</div>' +
      '<div class="card" style="margin-bottom:16px;">' +
        '<div class="card-title">📣 DISPATCH TO AUTHORITIES</div>' +
        '<div id="dpRecipients" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;"></div>' +
        '<button class="btn btn-danger" id="dpSend" style="width:100%;padding:12px;font-size:13px;">' +
          '🚨 SEND EMERGENCY DISPATCH ALERT' +
        '</button>' +
        '<div id="dpStatus" style="margin-top:10px;font-family:\'Share Tech Mono\',monospace;font-size:10px;color:#64748b;"></div>' +
      '</div>';

    main.appendChild(p);
    console.log('[dispatch] page9 created');
  }

  // === RENDER ===
  function render(){
    ensurePage();

    var km2 = readSpillSize();
    var risk = readRisk();
    var matrix = matchMatrix(km2);
    var assets = formatAssets(matrix.kit);
    var eta = totalEta(assets);

    var sizeEl = $('dpSize');
    if (sizeEl) sizeEl.textContent = km2;

    var levelEl = $('dpLevel');
    if (levelEl){ levelEl.textContent = matrix.label; levelEl.style.background = 'linear-gradient(135deg,' + matrix.color + ', ' + matrix.color + ')'; levelEl.style.webkitBackgroundClip = 'text'; levelEl.style.webkitTextFillColor = 'transparent'; }

    var riskEl = $('dpRisk');
    if (riskEl) riskEl.textContent = 'fsRisk: ' + risk;

    var etaEl = $('dpEta');
    if (etaEl) etaEl.textContent = eta;

    var kitEl = $('dpKit');
    if (kitEl){
      kitEl.innerHTML = assets.map(function(a){
        return '<div style="background:rgba(74,158,255,0.04);border:1px solid rgba(74,158,255,0.12);border-radius:5px;padding:10px;">' +
          '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#4a9eff;letter-spacing:0.1em;">' + a.id + '</div>' +
          '<div style="font-size:12px;color:#e2e8f0;font-weight:600;margin:4px 0;">' + a.type + '</div>' +
          '<div style="font-size:9px;color:#64748b;">' + a.port + ' · ' + a.cap + '</div>' +
          '<div style="font-size:9px;color:#00d4aa;margin-top:4px;">ETA ' + a.eta + ' min · ' + a.status.toUpperCase() + '</div>' +
        '</div>';
      }).join('');
    }

    var recEl = $('dpRecipients');
    if (recEl && !recEl.dataset.built){
      recEl.dataset.built = '1';
      recEl.innerHTML = RECIPIENTS.map(function(r){
        return '<label style="display:flex;align-items:center;gap:6px;padding:8px 10px;background:rgba(255,255,255,0.015);border:1px solid rgba(255,255,255,0.04);border-radius:4px;cursor:pointer;font-size:10px;color:#c9d8ea;">' +
          '<input type="checkbox" class="dpRec" data-name="' + r.name + '" checked style="accent-color:#4a9eff;"> ' +
          r.icon + ' ' + r.name +
        '</label>';
      }).join('');

      var sendBtn = $('dpSend');
      if (sendBtn){
        sendBtn.addEventListener('click', function(){
          var picked = [].slice.call(document.querySelectorAll('.dpRec:checked')).map(function(c){ return c.dataset.name; });
          var status = $('dpStatus');
          if (!picked.length){
            if (status) status.textContent = '⚠ Select at least one recipient.';
            return;
          }
          var log = picked.map(function(n){ return '✓ ' + n + ' dispatched @ ' + new Date().toLocaleTimeString(); }).join('\n');
          if (status){
            status.style.color = '#00d4aa';
            status.innerHTML = '<div style="white-space:pre-line;line-height:1.7;">' + log + '</div>';
          }
          console.log('[dispatch] alert sent to:', picked.join(', '));

          // Hook into voice alert if available
          try {
            if (window.speechSynthesis){
              var u = new SpeechSynthesisUtterance('Emergency dispatch alert sent to ' + picked.length + ' agencies. Cleanup fleet en route.');
              u.rate = 0.9; u.pitch = 0.8;
              window.speechSynthesis.speak(u);
            }
          } catch(e){}
        });
      }
    }

    console.log('[dispatch] rendered · size', km2, 'km² · kit', matrix.label, '· eta', eta);
  }

  // Ensure element exists when user clicks Dispatch nav
  document.addEventListener('click', function(e){
    var item = e.target.closest('.nav-item');
    if (item && /Dispatch/i.test(item.textContent)){
      setTimeout(render, 200);
    }
  }, true);

  // Auto-init on load
  setTimeout(render, 2500);
  setInterval(render, 15000);
  console.log('[dispatch] armed');
})();
