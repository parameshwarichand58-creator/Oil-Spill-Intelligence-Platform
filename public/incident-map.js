/* OCEAN EYE - Incident Map
   Listens to the incident store and draws the spill on the existing
   maritime map. No new map. Just hooks into the one already on the page.
*/
(function(){
  'use strict';

  var layerGroup = null;
  var lastIncidentId = null;

  function findMap(){
    // Try common global map objects
    if (window.map && typeof window.map.addLayer === 'function') return window.map;
    if (window.mymap && typeof window.mymap.addLayer === 'function') return window.mymap;
    if (window.leafletMap && typeof window.leafletMap.addLayer === 'function') return window.leafletMap;
    if (window.L && window.L.Map && window.L.Map.prototype){
      // search all L.Map instances via DOM
      var el = document.querySelector('.leaflet-container');
      if (el && el._leaflet_id && window.L._maps && window.L._maps[el._leaflet_id]) {
        return window.L._maps[el._leaflet_id];
      }
    }
    return null;
  }

  function draw(inc){
    if (!inc) return;
    var det = inc.detection || {};
    if (det.lat === null || det.lat === undefined) return;

    var map = findMap();
    if (!map) { return; }

    // init layer group once
    if (!layerGroup){
      layerGroup = (window.L && window.L.layerGroup) ? window.L.layerGroup().addTo(map) : null;
    }
    if (!layerGroup){
      // fallback: use feature group
      layerGroup = new window.L.FeatureGroup().addTo(map);
    }

    // rebuild every time — one incident at a time
    layerGroup.clearLayers();

    var lat = det.lat, lon = det.lon;

    // spill marker
    var marker = window.L.circleMarker([lat, lon], {
      radius: 7,
      color: '#ff4757',
      weight: 2,
      fillColor: '#ff4757',
      fillOpacity: 0.7
    });
    marker.bindPopup(
      '<b>OIL SPILL DETECTED</b><br>' +
      'Incident: ' + (inc.id || '—') + '<br>' +
      'Confidence: ' + (det.confidence || '—') + '%<br>' +
      'Area: ' + (det.area_km2 || '—') + ' km²<br>' +
      'Lat/Lon: ' + lat.toFixed(4) + ', ' + lon.toFixed(4)
    );
    layerGroup.addLayer(marker);

    // spill area circle (radius in meters — area_km2 → m)
    var areaM2 = (det.area_km2 || 10) * 1e6;
    var radius = Math.sqrt(areaM2 / Math.PI);
    var circle = window.L.circle([lat, lon], {
      radius: radius,
      color: '#ff4757',
      weight: 1,
      fillColor: '#ff4757',
      fillOpacity: 0.18,
      dashArray: '4,4'
    });
    layerGroup.addLayer(circle);

    // probable origin (smaller yellow dot slightly offset)
    var origin = window.L.circleMarker([lat + 0.02, lon - 0.02], {
      radius: 4,
      color: '#ffb142',
      weight: 1,
      fillColor: '#ffb142',
      fillOpacity: 0.9
    });
    origin.bindPopup('<b>Probable origin</b>');
    layerGroup.addLayer(origin);

    // predicted drift arrow
    var drift = window.L.polyline(
      [[lat, lon], [lat + 0.05, lon + 0.05]],
      { color: '#4a9eff', weight: 2, dashArray: '6,6', opacity: 0.85 }
    );
    layerGroup.addLayer(drift);

    // pan to incident
    try { map.setView([lat, lon], 8); } catch(e){}

    console.log('[incident-map] drawn', inc.id, lat, lon);
  }

  function clearMap(){
    if (layerGroup) layerGroup.clearLayers();
    console.log('[incident-map] cleared');
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident){
      return setTimeout(subscribe, 500);
    }
    window.OceanEye.incident.subscribe(function(inc){
      if (!inc){ clearMap(); return; }
      if (inc.status === 'DETECTED' && inc.id !== lastIncidentId){
        lastIncidentId = inc.id;
        // wait a tick for any DOM/map to settle
        setTimeout(function(){ draw(inc); }, 300);
      }
      if (inc.status === 'DETECTED' && inc.detection && inc.detection.lat){
        draw(inc);
      }
    });
    console.log('[incident-map] subscribed');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', subscribe);
  } else {
    subscribe();
  }
  console.log('[incident-map] armed');
})();
