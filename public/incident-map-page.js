/* OCEAN EYE - Big Real Map + Vessel Attribution
   Replaces the maritime map with a real OpenStreetMap.
   After detection: zooms to spill, draws 3 candidate vessels,
   shows ranked attribution panel. Top candidate = probable source.
*/
(function(){
  'use strict';
  var bigMap = null, bigLayers = null, shipLayer = null, lastDrawnId = null;

  // Fixed demo candidates — same every time so screenshots are consistent.
  // Names + offsets chosen to look plausible around Bay of Bengal.
  var CANDIDATES = [
    { name: 'MT SAGAR',     tag: 'IMO 9521234', dlat:  0.030, dlon: -0.050, dist: 3.2,  corr: 87, when: 'High',   route: 'High',   color: '#ff4757', label: 'PROBABLE SOURCE' },
    { name: 'MV BAY STAR',  tag: 'IMO 9478901', dlat: -0.040, dlon:  0.020, dist: 8.7,  corr: 61, when: 'Medium', route: 'Medium', color: '#ffb142', label: 'CANDIDATE' },
    { name: 'FV MEENAKSHI', tag: 'MMSI 419001', dlat:  0.060, dlon:  0.080, dist: 24.1, corr: 22, when: 'Low',    route: 'Low',    color: '#5cc9f5', label: 'CANDIDATE' }
  ];

  function hideSmall(){
    var s = document.getElementById('oceaneyeIncidentMap');
    if (s) s.style.display = 'none';
    var d = document.getElementById('oceaneyeDebug');
    if (d) d.style.display = 'none';
  }

  function findOriginal(){
    var all = document.querySelectorAll('.leaflet-container');
    for (var i=0; i<all.length; i++){
      var c = all[i];
      if (c.closest('#oceaneyeIncidentMap')) continue;
      if (c.closest('#oceaneyeRealMapWrap')) continue;
      if (c.id === 'oceaneyeRealMapBody') continue;
      return c;
    }
    return null;
  }

  function shipIcon(color, probable){
    var size = probable ? 34 : 26;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="'+color+'" stroke="#0a1a26" stroke-width="0.8">'+
      '<path d="M3 15h18l-2 4H5l-2-4z"/>'+
      '<path d="M9 15V8h4l3 4v3z" fill="#0a1a26"/>'+
      '<rect x="10" y="9" width="2" height="2" fill="'+color+'"/>'+
      (probable ? '<circle cx="12" cy="4" r="2" fill="#ff4757"/>' : '')+
    '</svg>';
    return window.L.divIcon({
      className: 'oceaneye-ship-icon',
      html: svg,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }

  function buildAttributionPanel(inc, lat, lon){
    var id = 'oceaneyeAttrPanel';
    var old = document.getElementById(id);
    if (old) old.parentNode.removeChild(old);

    var panel = document.createElement('div');
    panel.id = id;
    panel.style.cssText = [
      'position:absolute','top:12px','right:12px','z-index:1000',
      'width:260px','background:rgba(6,20,32,0.92)',
      'border:1px solid rgba(0,212,170,0.55)','border-radius:4px',
      'font-family:"Share Tech Mono",monospace','font-size:11px',
      'color:#cbd5e1','padding:8px 10px','line-height:1.5',
      'box-shadow:0 0 12px rgba(0,212,170,0.15)'
    ].join(';');

    var html = '<div style="color:#00d4aa;letter-spacing:0.10em;text-transform:uppercase;margin-bottom:6px;">VESSEL ATTRIBUTION — '+ (inc.id||'-') +'</div>';
    CANDIDATES.forEach(function(c){
      var bar = '';
      for (var i=0;i<10;i++){ bar += (i < Math.round(c.corr/10) ? '█' : '░'); }
      html += '<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed rgba(92,114,134,0.35);">'
            +   '<div style="color:'+c.color+';font-weight:bold;">'+(c.corr>=80?'★ ':'')+c.name+(c.corr>=80?' — PROBABLE':'')+'</div>'
            +   '<div style="opacity:0.7;">'+c.tag+'</div>'
            +   '<div>Dist '+c.dist+' km · Time '+c.when+' · Route '+c.route+'</div>'
            +   '<div style="color:'+c.color+';">'+bar+' '+c.corr+'%</div>'
            + '</div>';
    });
    html += '<div style="opacity:0.6;font-size:9px;margin-top:4px;">Candidate ranking only — not a legal verdict.</div>';
    panel.innerHTML = html;

    var wrap = document.getElementById('oceaneyeRealMapWrap');
    if (wrap) wrap.appendChild(panel);
    else document.body.appendChild(panel);
  }

  function clearAttribution(){
    var p = document.getElementById('oceaneyeAttrPanel');
    if (p) p.parentNode.removeChild(p);
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

    var wrap = document.createElement('div');
    wrap.id = 'oceaneyeRealMapWrap';
    wrap.style.cssText = 'position:relative;width:'+w+'px;height:'+h+'px;';

    var box = document.createElement('div');
    box.id = 'oceaneyeRealMapBody';
    box.style.cssText = 'width:100%;height:100%;';
    wrap.appendChild(box);

    orig.style.display = 'none';
    orig.parentNode.insertBefore(wrap, orig.nextSibling);

    bigMap = window.L.map(box, { zoomControl: true, attributionControl: false }); window.oceaneyeBigMap = bigMap;
      .setView([22.41, 88.46], 7);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, subdomains: 'abc'
    }).addTo(bigMap);

    bigLayers = window.L.layerGroup().addTo(bigMap);
    shipLayer = window.L.layerGroup().addTo(bigMap);

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
    shipLayer.clearLayers();
    clearAttribution();

    var lat = det.lat, lon = det.lon;

    // Spill marker
    bigLayers.addLayer(window.L.circleMarker([lat, lon], {
      radius: 10, color: '#ff4757', weight: 3,
      fillColor: '#ff4757', fillOpacity: 0.75
    }).bindPopup(
      '<b>OIL SPILL DETECTED</b><br>Incident: ' + (inc.id || '-') +
      '<br>Confidence: ' + (det.confidence || '-') + '%' +
      '<br>Area: ' + (det.area_km2 || '-') + ' km2' +
      '<br>' + lat.toFixed(4) + ', ' + lon.toFixed(4)
    ));

    // Spill area circle
    var areaM2 = (det.area_km2 || 10) * 1e6;
    var radius = Math.sqrt(areaM2 / Math.PI);
    bigLayers.addLayer(window.L.circle([lat, lon], {
      radius: radius, color: '#ff4757', weight: 1,
      fillColor: '#ff4757', fillOpacity: 0.20, dashArray: '4,4'
    }));

    // Probable origin
    bigLayers.addLayer(window.L.circleMarker([lat + 0.02, lon - 0.02], {
      radius: 5, color: '#ffb142', weight: 1,
      fillColor: '#ffb142', fillOpacity: 0.9
    }).bindPopup('Probable origin'));

    // Drift line
    bigLayers.addLayer(window.L.polyline(
      [[lat, lon], [lat + 0.05, lon + 0.05]],
      { color: '#4a9eff', weight: 3, dashArray: '6,6' }
    ));

    // Candidate ships
    CANDIDATES.forEach(function(c){
      var slat = lat + c.dlat, slon = lon + c.dlon;
      var m = window.L.marker([slat, slon], {
        icon: shipIcon(c.color, c.corr >= 80),
        zIndexOffset: c.corr >= 80 ? 1000 : 0
      });
      var popHtml =
        '<div style="font-family:Share Tech Mono,monospace;font-size:12px;">' +
        '<b style="color:'+c.color+';">'+c.name+'</b><br>' +
        '<span style="opacity:0.7;">'+c.tag+'</span><br>' +
        'Distance from origin: <b>'+c.dist+' km</b><br>' +
        'Time match: <b>'+c.when+'</b><br>' +
        'Route match: <b>'+c.route+'</b><br>' +
        'Attribution score: <b style="color:'+c.color+';">'+c.corr+'%</b>' +
        (c.corr >= 80 ? '<br><span style="color:#ff4757;">PROBABLE SOURCE</span>' : '') +
        '</div>';
      m.bindPopup(popHtml);

      // dashed line from ship to spill
      shipLayer.addLayer(window.L.polyline(
        [[slat, slon], [lat, lon]],
        { color: c.color, weight: 1, dashArray: '3,5', opacity: 0.65 }
      ));
      shipLayer.addLayer(m);
    });

    // Zoom to spill
    try { bigMap.setView([lat, lon], 10); } catch(e){}
    setTimeout(function(){
      try { bigMap.invalidateSize(); bigMap.setView([lat, lon], 10); } catch(e){}
    }, 300);

    // Attribution panel
    buildAttributionPanel(inc, lat, lon);

    console.log('[incident-map-page] incident + ships drawn', inc.id);
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(inc){
      if (!inc){
        if (bigLayers) bigLayers.clearLayers();
        if (shipLayer) shipLayer.clearLayers();
        clearAttribution();
        return;
      }
      if (inc.status === 'DETECTED' && inc.id !== lastDrawnId){
        lastDrawnId = inc.id;
        setTimeout(function(){ drawIncident(inc); }, 300);
      }
      if (inc.status === 'DETECTED'){
        drawIncident(inc);
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
