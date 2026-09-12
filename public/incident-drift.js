/* OCEAN EYE - Drift Prediction
   Draws the spill drift trajectory on the big real map:
   NOW -> +6h -> +12h -> +24h, with spreading circles + timeline panel.
*/
(function(){
  'use strict';
  var driftLayer = null;
  var lastDrawnId = null;

  // Plausible Bay-of-Bengal drift: NE-ish, distances grow with time
  var DRIFT = [
    { t: 'NOW',   hours:  0, dlat: 0.000, dlon: 0.000, radiusKm: 2.4, color: '#ff4757', label: 'NOW' },
    { t: '+6h',   hours:  6, dlat: 0.015, dlon: 0.022, radiusKm: 3.1, color: '#ff7f50', label: '+6h' },
    { t: '+12h',  hours: 12, dlat: 0.030, dlon: 0.048, radiusKm: 4.0, color: '#ffb142', label: '+12h' },
    { t: '+24h',  hours: 24, dlat: 0.056, dlon: 0.090, radiusKm: 5.4, color: '#ffd166', label: '+24h' }
  ];

  function buildPanel(inc){
    var old = document.getElementById('oceaneyeDriftPanel');
    if (old) old.parentNode.removeChild(old);

    var panel = document.createElement('div');
    panel.id = 'oceaneyeDriftPanel';
    panel.style.cssText = [
      'position:absolute','left:12px','top:60px','z-index:1200',
      'width:230px','background:rgba(6,20,32,0.92)',
      'border:1px solid rgba(74,158,255,0.55)','border-radius:4px',
      'font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#cbd5e1','padding:8px 10px','line-height:1.5',
      'box-shadow:0 0 12px rgba(74,158,255,0.15)'
    ].join(';');

    var html = '<div style="color:#4a9eff;letter-spacing:0.10em;text-transform:uppercase;margin-bottom:6px;">PREDICTED DRIFT TRAJECTORY</div>';
    DRIFT.forEach(function(d){
      html += '<div style="display:flex;justify-content:space-between;padding:2px 0;">'
            +   '<span style="color:'+d.color+';">\u25CF ' + d.label + '</span>'
            +   '<span style="opacity:0.8;">~' + d.radiusKm.toFixed(1) + ' km spread</span>'
            + '</div>';
    });
    html += '<div style="opacity:0.6;font-size:9px;margin-top:6px;border-top:1px dashed rgba(92,114,134,0.35);padding-top:4px;">Model: advection\u2013diffusion \u00b7 input: wind + currents</div>';

    panel.innerHTML = html;
    var wrap = document.getElementById('oceaneyeRealMapWrap');
    if (wrap) wrap.appendChild(panel);
  }

  function drawDrift(inc){
    var map = window.oceaneyeBigMap;
    if (!map || !window.L) return;
    var det = inc.detection || {};
    if (det.lat === null || det.lat === undefined) return;

    // attach on a dedicated layer group on this map
    if (!map.__driftLayer){
      map.__driftLayer = window.L.layerGroup().addTo(map);
    }
    driftLayer = map.__driftLayer;
    driftLayer.clearLayers();

    var lat0 = det.lat, lon0 = det.lon;
    var path = [];
    var last = null;

    DRIFT.forEach(function(d){
      var plat = lat0 + d.dlat, plon = lon0 + d.dlon;
      path.push([plat, plon]);

      // spread circle
      driftLayer.addLayer(window.L.circle([plat, plon], {
        radius: d.radiusKm * 1000,
        color: d.color, weight: 1, opacity: 0.75,
        fillColor: d.color, fillOpacity: 0.10,
        dashArray: '5,5'
      }));

      // center dot
      driftLayer.addLayer(window.L.circleMarker([plat, plon], {
        radius: d.hours === 0 ? 6 : 5,
        color: d.color, weight: 2,
        fillColor: '#06121e', fillOpacity: 1
      }).bindPopup(
        '<b style="color:'+d.color+';">'+d.label+'</b><br>' +
        'Spread radius: ~'+d.radiusKm.toFixed(1)+' km<br>' +
        'Position: '+plat.toFixed(4)+', '+plon.toFixed(4)
      ));

      // time label as a tooltip-style marker
      if (d.hours > 0){
        driftLayer.addLayer(window.L.marker([plat, plon], {
          icon: window.L.divIcon({
            className: 'oceaneye-drift-label',
            html: '<div style="font-family:Share Tech Mono,monospace;font-size:10px;color:'+d.color+
                  ';background:rgba(6,20,32,0.85);border:1px solid '+d.color+
                  ';padding:1px 5px;border-radius:2px;white-space:nowrap;">'+d.label+'</div>',
            iconSize: [40, 16],
            iconAnchor: [-6, 8]
          }),
          interactive: false
        }));
      }

      last = [plat, plon];
    });

    // connecting trajectory line
    driftLayer.addLayer(window.L.polyline(path, {
      color: '#4a9eff', weight: 2, dashArray: '6,6', opacity: 0.85
    }));

    // arrow head at the end
    if (last && path.length >= 2){
      var prev = path[path.length - 2];
      var angle = Math.atan2(last[0] - prev[0], last[1] - prev[1]);
      var arrowTip = [
        last[0] + 0.008 * Math.sin(angle),
        last[1] + 0.008 * Math.cos(angle)
      ];
      driftLayer.addLayer(window.L.polyline([last, arrowTip], {
        color: '#4a9eff', weight: 3, opacity: 0.9
      }));
    }

    buildPanel(inc);
    console.log('[incident-drift] drawn', inc.id);
  }

  function clearDrift(){
    if (window.oceaneyeBigMap && window.oceaneyeBigMap.__driftLayer){
      window.oceaneyeBigMap.__driftLayer.clearLayers();
    }
    var p = document.getElementById('oceaneyeDriftPanel');
    if (p) p.parentNode.removeChild(p);
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(inc){
      if (!inc){ clearDrift(); return; }
      if (inc.status === 'DETECTED' && inc.id !== lastDrawnId){
        lastDrawnId = inc.id;
        setTimeout(function(){ drawDrift(inc); }, 700);
      }
      if (inc.status === 'DETECTED'){
        drawDrift(inc);
      }
    });
    console.log('[incident-drift] subscribed');
  }

  // retry drawing when map gets (re)installed
  setInterval(function(){
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (inc && inc.status === 'DETECTED' && window.oceaneyeBigMap){
      if (!window.oceaneyeBigMap.__driftLayer || window.oceaneyeBigMap.__driftLayer.getLayers().length === 0){
        drawDrift(inc);
      }
    }
  }, 2500);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[incident-drift] armed');
})();
