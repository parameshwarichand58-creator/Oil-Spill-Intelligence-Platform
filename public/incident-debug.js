/* OCEAN EYE - Incident Debug Panel
   Visible diagnostic panel on screen. No DevTools needed.
*/
(function(){
  'use strict';

  function build(){
    if (document.getElementById('oceaneyeDebug')) return;
    var el = document.createElement('div');
    el.id = 'oceaneyeDebug';
    el.style.cssText = [
      'position:fixed','bottom:12px','right:12px','z-index:99999',
      'padding:10px 12px','background:rgba(0,0,0,0.85)',
      'border:1px solid #4a9eff','color:#4a9eff',
      'border-radius:4px','font-family:monospace',
      'font-size:11px','line-height:1.6','max-width:420px',
      'white-space:pre-wrap','pointer-events:auto'
    ].join(';');
    el.textContent = 'INCIDENT DEBUG — loading...';
    document.body.appendChild(el);
  }

  function mapFound(){
    if (window.map && typeof window.map.addLayer === 'function') return 'window.map';
    if (window.mymap && typeof window.mymap.addLayer === 'function') return 'window.mymap';
    if (window.leafletMap && typeof window.leafletMap.addLayer === 'function') return 'window.leafletMap';
    var el = document.querySelector('.leaflet-container');
    if (el) return 'leaflet-container exists';
    return 'NONE';
  }

  function refresh(){
    var el = document.getElementById('oceaneyeDebug');
    if (!el) return;
    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    var lines = [];
    lines.push('OceanEye      : ' + (window.OceanEye ? 'loaded' : 'MISSING'));
    lines.push('incident store: ' + (window.OceanEye && window.OceanEye.incident ? 'yes' : 'NO'));
    lines.push('L (leaflet)   : ' + (window.L ? 'v' + (window.L.version || '?') : 'MISSING'));
    lines.push('map instance  : ' + mapFound());
    lines.push('leaflet dots  : ' + document.querySelectorAll('.leaflet-container').length);
    lines.push('---');
    if (inc){
      lines.push('incident id   : ' + inc.id);
      lines.push('status        : ' + inc.status);
      var d = inc.detection || {};
      lines.push('lat/lon       : ' + d.lat + ', ' + d.lon);
      lines.push('confidence    : ' + d.confidence);
      lines.push('area_km2      : ' + d.area_km2);
    } else {
      lines.push('incident      : none');
    }
    el.textContent = lines.join('\n');
  }

  function init(){
    build();
    refresh();
    setInterval(refresh, 1000);
    console.log('[incident-debug] active');
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
