/* OCEAN EYE - Big Real Map
   Replaces the existing maritime map (with simulated content) by a
   full-size real OpenStreetMap showing only the actual incident.
   Small floating map is hidden via incident-real-map-hide.css.
*/
(function(){
  'use strict';
  var bigMap = null, bigLayers = null, lastDrawnId = null;

  function hideSmall(){
    var s = document.getElementById('oceaneyeIncidentMap');
    if (s) s.style.display = 'none';
  }

  function findOriginal(){
    var all = document.querySelectorAll('.leaflet-container');
    for (var i=0; i<all.length; i++){
      var c = all[i];
      if (c.closest('#oceaneyeIncidentMap')) continue;
      if (c.id === 'oceaneyeRealMapBody') continue;
      return c;
    }
    return null;
  }

  function install(){
    if (document.getElementById('oceaneyeRealMapBody')) return true;
    if (!window.L) return false;
    var orig = findOriginal();
    if (!orig) return false;

    var w = orig.clientWidth || orig.offsetWidth || 0;
    var h = orig.clientHeight || orig.offsetHeight || 0;
    if (w < 300) w = 1000;
    if (h < 300) h = 600;

    var box = document.createElement('div');
    box.id = 'oceaneyeRealMapBody';
    box.style.cssText = 'width:' + w + 'px;height:' + h + 'px;position:relative;';
    orig.style.display = 'none';
    orig.parentNode.insertBefore(box, orig.nextSibling);

    bigMap = window.L.map(box, { zoomControl: true, attributionControl: false })
      .setView([22.41, 88.46], 7);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, subdomains: 'abc'
    }).addTo(bigMap);

    bigLayers = window.L.layerGroup().addTo(bigMap);

    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (inc && inc.status === 'DETECTED') drawIncident(inc);

    setTimeout(function(){ try{ bigMap.invalidateSize(); }catch(e){} }, 400);
    console.log('[incident-map-page] big real map installed');
    return true;
  }

  function drawIncident(inc){
    if (!bigMap || !bigLayers) return;
    var det = inc.detection || {};
    if (det.lat === null || det.lat === undefined) return;
    bigLayers.clearLayers();
    var lat = det.lat, lon = det.lon;

    bigLayers.addLayer(window.L.circleMarker([lat, lon], {
      radius: 10, color: '#ff4757', weight: 3,
      fillColor: '#ff4757', fillOpacity: 0.75
    }).bindPopup(
      '<b>OIL SPILL DETECTED</b><br>Incident: ' + (inc.id || '-') +
      '<br>Confidence: ' + (det.confidence || '-') + '%' +
      '<br>Area: ' + (det.area_km2 || '-') + ' km2' +
      '<br>' + lat.toFixed(4) + ', ' + lon.toFixed(4)
    ).openPopup());

    var areaM2 = (det.area_km2 || 10) * 1e6;
    var radius = Math.sqrt(areaM2 / Math.PI);
    bigLayers.addLayer(window.L.circle([lat, lon], {
      radius: radius, color: '#ff4757', weight: 1,
      fillColor: '#ff4757', fillOpacity: 0.20, dashArray: '4,4'
    }));

    bigLayers.addLayer(window.L.circleMarker([lat + 0.02, lon - 0.02], {
      radius: 5, color: '#ffb142', weight: 1,
      fillColor: '#ffb142', fillOpacity: 0.9
    }).bindPopup('Probable origin'));

    bigLayers.addLayer(window.L.polyline(
      [[lat, lon], [lat + 0.05, lon + 0.05]],
      { color: '#4a9eff', weight: 3, dashArray: '6,6' }
    ));

    try { bigMap.setView([lat, lon], 8); } catch(e){}
    try { bigMap.invalidateSize(); } catch(e){}
    console.log('[incident-map-page] incident drawn', inc.id);
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(inc){
      if (inc && inc.status === 'DETECTED' && inc.id !== lastDrawnId){
        lastDrawnId = inc.id;
        setTimeout(function(){ drawIncident(inc); }, 300);
      }
    });
  }

  function init(){
    hideSmall();
    subscribe();
    setInterval(function(){ hideSmall(); install(); }, 1500);
    setTimeout(install, 600);
    setTimeout(install, 2500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  console.log('[incident-map-page] armed');
})();
