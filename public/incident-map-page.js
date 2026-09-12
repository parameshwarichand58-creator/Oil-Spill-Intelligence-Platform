/* OCEAN EYE - Big Real Map (Map section only) */
(function(){
  'use strict';
  var bigMap = null, bigLayers = null, shipLayer = null, lastDrawnId = null;

  var CANDIDATES = [
    { name: 'MT SAGAR',     tag: 'IMO 9521234', dlat:  0.030, dlon: -0.050, dist: 3.2,  corr: 87, when: 'High',   route: 'High',   color: '#ff4757' },
    { name: 'MV BAY STAR',  tag: 'IMO 9478901', dlat: -0.040, dlon:  0.020, dist: 8.7,  corr: 61, when: 'Medium', route: 'Medium', color: '#ffb142' },
    { name: 'FV MEENAKSHI', tag: 'MMSI 419001', dlat:  0.060, dlon:  0.080, dist: 24.1, corr: 22, when: 'Low',    route: 'Low',    color: '#5cc9f5' }
  ];

  function hideSmall(){
    var s = document.getElementById('oceaneyeIncidentMap');
    if (s) s.style.display = 'none';
    var d = document.getElementById('oceaneyeDebug');
    if (d) d.style.display = 'none';
  }

  function isVisible(el){
    // CSS may hide the old map (display:none), so check dimensions OR tag as hidden
    if (!el) return false;
    if (el.offsetParent === null) return true; // hidden by CSS -> still valid target
    var r = el.getBoundingClientRect();
    return r.width > 100 && r.height > 100;
  }

  function inMapSection(el){
    var cur = el;
    for (var i=0; i<10 && cur; i++){
      var heads = cur.querySelectorAll ? cur.querySelectorAll('h1, h2, h3') : [];
      for (var j=0; j<heads.length; j++){
        var t = (heads[j].textContent || '').toLowerCase();
        if (/\bmap\b/.test(t) || t.indexOf('maritime') >= 0) return true;
      }
      cur = cur.parentElement;
    }
    return false;
  }

  function findVisibleMap(){
    var all = document.querySelectorAll('.leaflet-container');
    for (var i=0; i<all.length; i++){
      var c = all[i];
      if (c.closest('#oceaneyeIncidentMap')) continue;
      if (c.closest('#oceaneyeRealMapWrap')) continue;
      if (c.id === 'oceaneyeRealMapBody') continue;
      if (!isVisible(c)) continue;
      if (!inMapSection(c)) continue;
      return c;
    }
    return null;
  }

  function destroyWrap(){
    var wrap = document.getElementById('oceaneyeRealMapWrap');
    if (!wrap) return;
    var orig = wrap.__origMapContainer;
    if (orig) orig.style.display = '';
    if (bigMap){ try { bigMap.remove(); } catch(e){} bigMap = null; }
    bigLayers = null; shipLayer = null;
    if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    var panel = document.getElementById('oceaneyeAttrPanel');
    if (panel) panel.parentNode.removeChild(panel);
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

  function buildAttributionPanel(inc){
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
    var html = '<div style="color:#00d4aa;letter-spacing:0.10em;text-transform:uppercase;margin-bottom:6px;">VESSEL ATTRIBUTION — '+(inc.id||'-')+'</div>';
    CANDIDATES.forEach(function(c){
      var bar = '';
      for (var i=0;i<10;i++){ bar += (i < Math.round(c.corr/10) ? '\u2588' : '\u2591'); }
      html += '<div style="margin-bottom:6px;padding-bottom:6px;border-bottom:1px dashed rgba(92,114,134,0.35);">'
            +   '<div style="color:'+c.color+';font-weight:bold;">'+(c.corr>=80?'\u2605 ':'')+c.name+(c.corr>=80?' — PROBABLE':'')+'</div>'
            +   '<div style="opacity:0.7;">'+c.tag+'</div>'
            +   '<div>Dist '+c.dist+' km · Time '+c.when+' · Route '+c.route+'</div>'
            +   '<div style="color:'+c.color+';">'+bar+' '+c.corr+'%</div>'
            + '</div>';
    });
    html += '<div style="opacity:0.6;font-size:9px;margin-top:4px;">Candidate ranking only — not a legal verdict.</div>';
    panel.innerHTML = html;
    var wrap = document.getElementById('oceaneyeRealMapWrap');
    if (wrap) wrap.appendChild(panel);
  }

  function drawIncident(inc){
    if (!bigMap || !bigLayers) return;
    var det = inc.detection || {};
    if (det.lat === null || det.lat === undefined) return;
    bigLayers.clearLayers(); shipLayer.clearLayers();
    var panel = document.getElementById('oceaneyeAttrPanel');
    if (panel) panel.parentNode.removeChild(panel);
    var lat = det.lat, lon = det.lon;

    bigLayers.addLayer(window.L.circleMarker([lat, lon], {
      radius: 10, color: '#ff4757', weight: 3,
      fillColor: '#ff4757', fillOpacity: 0.75
    }).bindPopup('<b>OIL SPILL DETECTED</b><br>Incident: '+(inc.id||'-')+'<br>Confidence: '+(det.confidence||'-')+'%<br>Area: '+(det.area_km2||'-')+' km2<br>'+lat.toFixed(4)+', '+lon.toFixed(4)));

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

    CANDIDATES.forEach(function(c){
      var slat = lat + c.dlat, slon = lon + c.dlon;
      var m = window.L.marker([slat, slon], {
        icon: shipIcon(c.color, c.corr >= 80),
        zIndexOffset: c.corr >= 80 ? 1000 : 0
      });
      m.bindPopup('<div style="font-family:Share Tech Mono,monospace;font-size:12px;">'+
        '<b style="color:'+c.color+';">'+c.name+'</b><br>'+
        '<span style="opacity:0.7;">'+c.tag+'</span><br>'+
        'Distance: <b>'+c.dist+' km</b><br>Time: <b>'+c.when+'</b><br>Route: <b>'+c.route+'</b><br>'+
        'Attribution: <b style="color:'+c.color+';">'+c.corr+'%</b>'+
        (c.corr>=80 ? '<br><span style="color:#ff4757;">PROBABLE SOURCE</span>' : '')+'</div>');
      shipLayer.addLayer(window.L.polyline([[slat, slon], [lat, lon]], { color: c.color, weight: 1, dashArray: '3,5', opacity: 0.65 }));
      shipLayer.addLayer(m);
    });

    try { bigMap.setView([lat, lon], 10); } catch(e){}
    setTimeout(function(){ try { bigMap.invalidateSize(); bigMap.setView([lat, lon], 10); } catch(e){} }, 300);
    buildAttributionPanel(inc);
  }

  function installOn(orig){
    if (!window.L) return;
    var w = orig.clientWidth || orig.offsetWidth || 0;
    var h = orig.clientHeight || orig.offsetHeight || 0;
    if (w < 300) w = 1000;
    if (h < 300) h = 600;

    var wrap = document.createElement('div');
    wrap.id = 'oceaneyeRealMapWrap';
    wrap.style.cssText = 'position:relative;width:100%;height:100%;min-height:500px;overflow:visible;';
    wrap.__origMapContainer = orig;

    var box = document.createElement('div');
    box.id = 'oceaneyeRealMapBody';
    box.style.cssText = 'width:100%;height:100%;';
    wrap.appendChild(box);

    orig.style.display = 'none'; orig.setAttribute('data-oceaneye-hidden','1');
    orig.parentNode.insertBefore(wrap, orig.nextSibling);

    bigMap = window.L.map(box, { zoomControl: true, attributionControl: false });
    window.oceaneyeBigMap = bigMap;
    bigMap.setView([22.41, 88.46], 7);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18, subdomains: 'abc'
    }).addTo(bigMap);

    bigLayers = window.L.layerGroup().addTo(bigMap);
    shipLayer = window.L.layerGroup().addTo(bigMap);

    var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
    if (inc && inc.status === 'DETECTED') drawIncident(inc);

    setTimeout(function(){ try { bigMap.invalidateSize(); } catch(e){} }, 300);
    console.log('[incident-map-page] installed on Map section');
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(function(inc){
      if (!inc){
        if (bigLayers) bigLayers.clearLayers();
        if (shipLayer) shipLayer.clearLayers();
        var p = document.getElementById('oceaneyeAttrPanel');
        if (p) p.parentNode.removeChild(p);
        return;
      }
      if (inc.status === 'DETECTED' && inc.id !== lastDrawnId){
        lastDrawnId = inc.id;
        setTimeout(function(){ drawIncident(inc); }, 300);
      }
      if (inc.status === 'DETECTED') drawIncident(inc);
    });
  }

  function tick(){
    hideSmall();
    var visible = findVisibleMap();
    var wrap = document.getElementById('oceaneyeRealMapWrap');

    if (wrap && wrap.offsetParent !== null) return;
    if (!visible) return;
    if (wrap) destroyWrap();
    installOn(visible);
  }

  function init(){
    hideSmall();
    subscribe();
    setInterval(tick, 1200);
    setTimeout(tick, 500);
    setTimeout(tick, 2000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  console.log('[incident-map-page] armed');
})();
