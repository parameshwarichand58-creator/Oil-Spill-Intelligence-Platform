/* OCEAN EYE - Incident Real Map
   A dedicated, real Leaflet map with OpenStreetMap tiles.
   Shows ONLY the current incident (spill marker, circle, origin, drift).
   Floats bottom-left. Appears when an incident is detected. Dismissible.
*/
(function(){
  'use strict';

  var leafletMap = null;
  var layerGroup = null;

  function build(){
    if (document.getElementById('oceaneyeIncidentMap')) return;
    var wrap = document.createElement('div');
    wrap.id = 'oceaneyeIncidentMap';
    wrap.style.cssText = [
      'position:fixed','bottom:12px','left:12px','z-index:9998',
      'width:380px','height:300px',
      'background:#06121e',
      'border:1px solid rgba(0,212,170,0.55)',
      'border-radius:6px','overflow:hidden',
      'box-shadow:0 0 18px rgba(0,212,170,0.20)',
      'display:none'
    ].join(';');

    var head = document.createElement('div');
    head.id = 'oceaneyeIncidentMapHead';
    head.style.cssText = [
      'padding:6px 10px','background:rgba(0,212,170,0.12)',
      'color:#00d4aa','font-family:"Share Tech Mono",monospace',
      'font-size:10px','letter-spacing:0.10em','text-transform:uppercase',
      'display:flex','justify-content:space-between','align-items:center',
      'cursor:default'
    ].join(';');
    head.innerHTML = '<span id="oceaneyeIncidentMapTitle">INCIDENT MAP — none</span>' +
                     '<span id="oceaneyeIncidentMapClose" style="cursor:pointer;opacity:0.65">[x]</span>';

    var body = document.createElement('div');
    body.id = 'oceaneyeIncidentMapBody';
    body.style.cssText = 'width:100%;height:calc(100% - 26px);';

    wrap.appendChild(head);
    wrap.appendChild(body);
    document.body.appendChild(wrap);

    document.getElementById('oceaneyeIncidentMapClose').onclick = function(){
      wrap.style.display = 'none';
    };
  }

  function ensureMap(){
    if (leafletMap) return leafletMap;
    if (!window.L) return null;
    var body = document.getElementById('oceaneyeIncidentMapBody');
    if (!body) return null;

    leafletMap = window.L.map(body, {
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true
    }).setView([22.41, 88.46], 6);

    // REAL OpenStreetMap tiles
    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      subdomains: 'abc'
    }).addTo(leafletMap);

    layerGroup = window.L.layerGroup().addTo(leafletMap);
    setTimeout(function(){ try { leafletMap.invalidateSize(); } catch(e){} }, 250);
    return leafletMap;
  }

  function show(){ var w = document.getElementById('oceaneyeIncidentMap'); if (w) w.style.display = 'block'; }
  function hide(){ var w = document.getElementById('oceaneyeIncidentMap'); if (w) w.style.display = 'none'; }

  function draw(inc){
    var map = ensureMap();
    if (!map) return;
    show();

    var det = inc.detection || {};
    var lat = det.lat, lon = det.lon;
    if (lat === null || lat === undefined) return;

    layerGroup.clearLayers();

    // Spill marker
    var marker = window.L.circleMarker([lat, lon], {
      radius: 8, color: '#ff4757', weight: 2,
      fillColor: '#ff4757', fillOpacity: 0.75
    });
    marker.bindPopup(
      '<b>OIL SPILL DETECTED</b><br>' +
      'Incident: ' + (inc.id || '-') + '<br>' +
      'Confidence: ' + (det.confidence || '-') + '%<br>' +
      'Area: ' + (det.area_km2 || '-') + ' km2<br>' +
      'Lat/Lon: ' + lat.toFixed(4) + ', ' + lon.toFixed(4)
    ).openPopup();
    layerGroup.addLayer(marker);

    // Spill area circle
    var areaM2 = (det.area_km2 || 10) * 1e6;
    var radius = Math.sqrt(areaM2 / Math.PI);
    layerGroup.addLayer(window.L.circle([lat, lon], {
      radius: radius, color: '#ff4757', weight: 1,
      fillColor: '#ff4757', fillOpacity: 0.20,
      dashArray: '4,4'
    }));

    // Probable origin
    var origin = window.L.circleMarker([lat + 0.02, lon - 0.02], {
      radius: 4, color: '#ffb142', weight: 1,
      fillColor: '#ffb142', fillOpacity: 0.9
    });
    origin.bindPopup('<b>Probable origin</b>');
    layerGroup.addLayer(origin);

    // Predicted drift line
    layerGroup.addLayer(window.L.polyline(
      [[lat, lon], [lat + 0.05, lon + 0.05]],
      { color: '#4a9eff', weight: 2, dashArray: '6,6', opacity: 0.85 }
    ));

    try { map.setView([lat, lon], 8); } catch(e){}
    try { map.invalidateSize(); } catch(e){}

    var title = document.getElementById('oceaneyeIncidentMapTitle');
    if (title) title.textContent = 'INCIDENT MAP - ' + (inc.id || '-') +
                                   ' - ' + (det.confidence || '-') + '%';

    console.log('[incident-real-map] drawn', inc.id);
  }

  function clearMap(){
    if (layerGroup) layerGroup.clearLayers();
    hide();
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident){
      return setTimeout(subscribe, 500);
    }
    window.OceanEye.incident.subscribe(function(inc){
      if (!inc){ clearMap(); return; }
      if (inc.status === 'DETECTED' && inc.detection && inc.detection.lat !== null){
        setTimeout(function(){ draw(inc); }, 250);
      }
    });
    console.log('[incident-real-map] subscribed');
  }

  function init(){
    build();
    subscribe();
    var tries = 0;
    var t = setInterval(function(){
      tries++;
      if (window.L || tries > 25){ clearInterval(t); ensureMap(); }
    }, 300);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  console.log('[incident-real-map] armed');
})();
