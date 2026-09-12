/* OCEAN EYE - Map Controls
   Adds toolbar with Zoom In / Zoom Out / Reset / Fullscreen + scale bar
   to the big real map. Hides leftover controls from the old simulated map.
*/
(function(){
  'use strict';
  var toolbarBuilt = false;

  function hideOldControls(){
    // hide zoom controls that are NOT inside our real map
    var all = document.querySelectorAll('.leaflet-control-zoom');
    for (var i=0; i<all.length; i++){
      var el = all[i];
      if (!el.closest('#oceaneyeRealMapBody')) {
        el.style.display = 'none';
      }
    }
  }

  function findBigMap(){
    if (window.oceaneyeBigMap) return window.oceaneyeBigMap;
    return null;
  }

  function buildToolbar(){
    if (toolbarBuilt) return;
    var wrap = document.getElementById('oceaneyeRealMapWrap');
    if (!wrap) return;
    if (document.getElementById('oceaneyeMapToolbar')) { toolbarBuilt = true; return; }

    var bar = document.createElement('div');
    bar.id = 'oceaneyeMapToolbar';
    bar.style.cssText = [
      'position:absolute','left:12px','bottom:12px','z-index:1100',
      'display:flex','gap:6px',
      'font-family:"Share Tech Mono",monospace'
    ].join(';');

    function mkBtn(label, title){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.title = title;
      b.style.cssText = [
        'padding:6px 10px','background:rgba(6,20,32,0.92)',
        'border:1px solid rgba(0,212,170,0.55)','color:#00d4aa',
        'border-radius:3px','font-size:11px','letter-spacing:0.08em',
        'text-transform:uppercase','cursor:pointer','min-width:36px',
        'font-family:inherit'
      ].join(';');
      return b;
    }

    var bIn  = mkBtn('+',   'Zoom in');
    var bOut = mkBtn('−',   'Zoom out');
    var bRes = mkBtn('RST', 'Reset view to spill');
    var bFit = mkBtn('FIT', 'Fit spill + ships');
    var bFul = mkBtn('FULL','Fullscreen');

    function doOnMap(fn){
      var m = findBigMap();
      if (!m) return;
      try { fn(m); } catch(e){ console.warn('[map-controls]', e); }
    }

    bIn.onclick  = function(){ doOnMap(function(m){ m.zoomIn(); }); };
    bOut.onclick = function(){ doOnMap(function(m){ m.zoomOut(); }); };
    bRes.onclick = function(){
      doOnMap(function(m){
        var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
        if (inc && inc.detection && inc.detection.lat !== null){
          m.setView([inc.detection.lat, inc.detection.lon], 10);
        }
      });
    };
    bFit.onclick = function(){
      doOnMap(function(m){
        var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
        if (!inc || inc.detection.lat === null) return;
        var lat = inc.detection.lat, lon = inc.detection.lon;
        var pts = [[lat, lon]];
        // include all ship offsets used by map-page
        var offs = [[0.030,-0.050],[-0.040,0.020],[0.060,0.080]];
        for (var i=0;i<offs.length;i++) pts.push([lat+offs[i][0], lon+offs[i][1]]);
        try { m.fitBounds(pts, { padding: [40, 40] }); } catch(e){}
      });
    };
    bFul.onclick = function(){
      var wrap = document.getElementById('oceaneyeRealMapWrap');
      if (!wrap) return;
      if (document.fullscreenElement){
        document.exitFullscreen();
      } else {
        if (wrap.requestFullscreen) wrap.requestFullscreen();
        else if (wrap.webkitRequestFullscreen) wrap.webkitRequestFullscreen();
      }
    };

    bar.appendChild(bIn); bar.appendChild(bOut);
    bar.appendChild(bRes); bar.appendChild(bFit); bar.appendChild(bFul);
    wrap.appendChild(bar);

    // fullscreen resize fix
    document.addEventListener('fullscreenchange', function(){
      var m = findBigMap();
      if (m) setTimeout(function(){ try { m.invalidateSize(); } catch(e){} }, 200);
    });

    toolbarBuilt = true;
    console.log('[map-controls] toolbar built');
  }

  function attachScale(){
    var m = findBigMap();
    if (!m || m.__scaleAttached) return;
    if (window.L && window.L.control && window.L.control.scale){
      try { window.L.control.scale({ imperial: false, metric: true }).addTo(m); m.__scaleAttached = true; } catch(e){}
    }
  }

  function loop(){
    hideOldControls();
    buildToolbar();
    attachScale();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
  setInterval(loop, 1500);
  console.log('[map-controls] armed');
})();
