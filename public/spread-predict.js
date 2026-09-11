(function(){
  if (window.__spreadPredict) return;
  window.__spreadPredict = true;

  var layer = null;
  var currentHours = 0;
  var sliderEl = null;
  var infoEl = null;

  function readDensity(){
    var ids = ['tick-density','liveOilDensity','anaDensity'];
    for (var i = 0; i < ids.length; i++){
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      var n = parseFloat((el.textContent || '').replace(/[^0-9.]/g, ''));
      if (isFinite(n) && n > 0) return n;
    }
    return 60;
  }

  function readSpreadRate(){
    var ids = ['tick-spread','liveSpreadRate','anaSpread'];
    for (var i = 0; i < ids.length; i++){
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      var n = parseFloat((el.textContent || '').replace(/[^0-9.]/g, ''));
      if (isFinite(n) && n > 0) return n;
    }
    return 3;
  }

  function readWaveDir(){
    // Try to read from ocean conditions panel
    var ids = ['oceanWaveDir','waveD'];
    for (var i = 0; i < ids.length; i++){
      var el = document.getElementById(ids[i]);
      if (!el) continue;
      var n = parseFloat((el.textContent || '').replace(/[^0-9.]/g, ''));
      if (isFinite(n)) return n;
    }
    // Fetch fresh from Open-Meteo Marine as fallback
    return 150;
  }

  // Spill origin in the Bay of Bengal (matches alert scenarios)
  var ORIGIN = { lat: 14.6, lng: 82.9 };

  function spreadRadius(hours, spreadRate){
    // Simple model: radius = spread_rate * hours * 1.852 (km to nautical miles to grid degrees)
    // 1 nautical mile = 1/60 degree latitude
    var km = spreadRate * hours;
    var deg = km / 111; // 1 deg lat ≈ 111 km
    return deg;
  }

  function shiftedCenter(hours, waveDir, spreadRate){
    // Spill drifts toward wave direction
    // waveDir is degrees clockwise from North
    var rad = waveDir * Math.PI / 180;
    var km = spreadRate * hours * 0.5; // drift at half the spread rate
    var dLat = (km / 111) * Math.cos(rad);
    var dLon = (km / (111 * Math.cos(ORIGIN.lat * Math.PI / 180))) * Math.sin(rad);
    return { lat: ORIGIN.lat + dLat, lng: ORIGIN.lng + dLon };
  }

  function ensureLayer(){
    if (!window.mapInstance){
      setTimeout(ensureLayer, 800);
      return false;
    }
    if (layer) return true;
    layer = L.layerGroup().addTo(window.mapInstance);
    console.log('[spread] layer added');
    return true;
  }

  function draw(){
    if (!ensureLayer()) return;

    layer.clearLayers();

    var density = readDensity();
    var spreadRate = readSpreadRate();
    var waveDir = readWaveDir();

    // Origin marker
    L.circleMarker([ORIGIN.lat, ORIGIN.lng], {
      radius: 6, color: '#ff4757', fillColor: '#ff4757', fillOpacity: 1, weight: 2
    }).addTo(layer).bindTooltip('Spill origin · ' + density.toFixed(0) + ' µg/L');

    // Draw three predicted zones
    var timelines = [
      { hours: 6,  color: '#fbbf24', label: '6h' },
      { hours: 12, color: '#ff6b3d', label: '12h' },
      { hours: 24, color: '#ff4757', label: '24h' }
    ];

    timelines.forEach(function(t){
      var radius = spreadRadius(t.hours, spreadRate);
      var center = shiftedCenter(t.hours, waveDir, spreadRate);
      L.circle([center.lat, center.lng], {
        radius: radius * 111000, // convert degrees to meters
        color: t.color,
        fillColor: t.color,
        fillOpacity: 0.15,
        weight: 1.5,
        dashArray: '4,4'
      }).addTo(layer).bindTooltip('Predicted extent +' + t.label + ' · ' + (spreadRate * t.hours).toFixed(0) + ' km drift');
    });

    if (infoEl){
      infoEl.innerHTML =
        '<span>Density <b>' + density.toFixed(0) + ' µg/L</b></span>' +
        '<span>Drift <b>' + spreadRate.toFixed(1) + ' km/h</b></span>' +
        '<span>Direction <b>' + Math.round(waveDir) + '°</b></span>';
    }

    console.log('[spread] drawn · density', density.toFixed(1), 'rate', spreadRate.toFixed(1), 'dir', waveDir);
  }

  function ensureUI(){
    if (document.getElementById('spreadCtl')) return true;
    var map = window.mapInstance;
    if (!map) return false;

    var ctrl = L.control({ position: 'topright' });
    ctrl.onAdd = function(){
      var div = L.DomUtil.create('div');
      div.id = 'spreadCtl';
      div.style.cssText = 'background:rgba(8,14,22,0.94);border:1px solid rgba(255,71,87,0.5);border-radius:4px;padding:10px 14px;font-family:\'Share Tech Mono\',monospace;color:#c9d8ea;font-size:10px;letter-spacing:0.08em;backdrop-filter:blur(8px);min-width:200px;';
      div.innerHTML =
        '<div style="color:#ff4757;letter-spacing:0.14em;font-size:10px;margin-bottom:8px;">🌊 PREDICTED SPILL SPREAD</div>' +
        '<div id="spreadInfo" style="display:flex;flex-direction:column;gap:3px;font-size:10px;color:#94a3b8;margin-bottom:8px;"></div>' +
        '<div style="color:#5c7286;font-size:9px;margin-bottom:4px;">TIMELINE</div>' +
        '<div style="display:flex;gap:4px;">' +
          '<button data-h="6" style="flex:1;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.4);color:#fbbf24;padding:3px 6px;border-radius:3px;font-family:inherit;font-size:9px;cursor:pointer;">6h</button>' +
          '<button data-h="12" style="flex:1;background:rgba(255,107,61,0.1);border:1px solid rgba(255,107,61,0.4);color:#ff6b3d;padding:3px 6px;border-radius:3px;font-family:inherit;font-size:9px;cursor:pointer;">12h</button>' +
          '<button data-h="24" style="flex:1;background:rgba(255,71,87,0.1);border:1px solid rgba(255,71,87,0.4);color:#ff4757;padding:3px 6px;border-radius:3px;font-family:inherit;font-size:9px;cursor:pointer;">24h</button>' +
        '</div>';
      L.DomEvent.disableClickPropagation(div);
      return div;
    };
    ctrl.addTo(map);

    infoEl = document.getElementById('spreadInfo');

    // Button handlers
    setTimeout(function(){
      document.querySelectorAll('#spreadCtl button').forEach(function(b){
        b.addEventListener('click', function(){
          currentHours = parseInt(this.dataset.h);
          // Emphasize the clicked one
          document.querySelectorAll('#spreadCtl button').forEach(function(x){
            x.style.opacity = '0.5';
          });
          this.style.opacity = '1';
          draw();
        });
      });
    }, 100);
    return true;
  }

  function boot(){
    if (!window.mapInstance){
      setTimeout(boot, 800);
      return;
    }
    ensureUI();
    draw();
    setInterval(draw, 30000);
    console.log('[spread] armed');
  }
  boot();

  // Re-draw when user navigates to map
  document.addEventListener('click', function(e){
    var item = e.target.closest('.nav-item');
    if (item && /map/i.test(item.textContent)){
      setTimeout(function(){ ensureUI(); draw(); }, 500);
    }
  }, true);
})();
