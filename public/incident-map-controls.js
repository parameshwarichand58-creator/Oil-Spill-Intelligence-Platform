/* OCEAN EYE - Map Controls (toolbar at top-left) */
(function(){
  'use strict';

  function hideOldControls(){
    var all = document.querySelectorAll('.leaflet-control-zoom');
    for (var i=0; i<all.length; i++){
      all[i].style.display = 'none'; // hide ALL default zoom controls
    }
  }

  function mkBtn(label, title){
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.title = title;
    b.style.cssText = [
      'padding:6px 10px','background:rgba(6,20,32,0.95)',
      'border:1px solid rgba(0,212,170,0.55)','color:#00d4aa',
      'border-radius:3px','font-size:11px','letter-spacing:0.08em',
      'text-transform:uppercase','cursor:pointer','min-width:36px',
      'font-family:"Share Tech Mono",monospace'
    ].join(';');
    return b;
  }

  function buildToolbar(){
    var wrap = document.getElementById('oceaneyeRealMapWrap');
    if (!wrap) return;
    if (document.getElementById('oceaneyeMapToolbar')) return;

    var bar = document.createElement('div');
    bar.id = 'oceaneyeMapToolbar';
    bar.style.cssText = 'position:absolute;left:12px;top:12px;z-index:1500;display:flex;gap:6px;flex-wrap:wrap;';

    var bIn  = mkBtn('+',   'Zoom in');
    var bOut = mkBtn('\u2212','Zoom out');
    var bRes = mkBtn('RST', 'Reset view to spill');
    var bFit = mkBtn('FIT', 'Fit spill + ships');
    var bFul = mkBtn('FULL','Fullscreen');

    function m(){ return window.oceaneyeBigMap; }

    bIn.onclick  = function(){ var x=m(); if(x) x.zoomIn(); };
    bOut.onclick = function(){ var x=m(); if(x) x.zoomOut(); };
    bRes.onclick = function(){
      var x=m(); if(!x) return;
      var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
      if (inc && inc.detection && inc.detection.lat !== null) x.setView([inc.detection.lat, inc.detection.lon], 10);
    };
    bFit.onclick = function(){
      var x=m(); if(!x) return;
      var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
      if (!inc || inc.detection.lat === null) return;
      var lat=inc.detection.lat, lon=inc.detection.lon;
      var pts=[[lat,lon],[lat+0.030,lon-0.050],[lat-0.040,lon+0.020],[lat+0.060,lon+0.080],[lat+0.056,lon+0.090]];
      try { x.fitBounds(pts, { padding: [40,40] }); } catch(e){}
    };
    bFul.onclick = function(){
      var w = document.getElementById('oceaneyeRealMapWrap');
      if (!w) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else if (w.requestFullscreen) w.requestFullscreen();
      else if (w.webkitRequestFullscreen) w.webkitRequestFullscreen();
    };

    bar.appendChild(bIn); bar.appendChild(bOut);
    bar.appendChild(bRes); bar.appendChild(bFit); bar.appendChild(bFul);
    wrap.appendChild(bar);

    document.addEventListener('fullscreenchange', function(){
      var x=m(); if (x) setTimeout(function(){ try { x.invalidateSize(); } catch(e){} }, 200);
    });
    console.log('[map-controls] toolbar built at top-left');
  }

  function attachScale(){
    var x = window.oceaneyeBigMap;
    if (!x || x.__scaleAttached) return;
    if (window.L && window.L.control && window.L.control.scale){
      try { window.L.control.scale({ imperial: false, metric: true, position: 'bottomright' }).addTo(x); x.__scaleAttached = true; } catch(e){}
    }
  }

  function loop(){
    hideOldControls();
    buildToolbar();
    attachScale();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loop);
  else loop();
  setInterval(loop, 1200);
  console.log('[map-controls] armed');
})();
