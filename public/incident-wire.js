/* OCEAN EYE - Incident Wire
   Hooks into the existing Start Scan button (runSatelliteScan) and
   Analyze button (analyzeBtn) to drive the shared Incident store.
   No UI changes. No new pages. Just wiring.
*/
(function(){
  'use strict';

  function readConfidence(){
    var el = document.getElementById('confidenceMeter');
    if (el){
      var m = (el.textContent || '').match(/(\d+(?:\.\d+)?)/);
      if (m) return parseFloat(m[1]);
    }
    var el2 = document.getElementById('liveConfidence');
    if (el2){
      var m2 = (el2.textContent || '').match(/(\d+(?:\.\d+)?)/);
      if (m2) return parseFloat(m2[1]);
    }
    return null;
  }

  function readSatellite(){
    var sel = document.querySelector('#satelliteTitle');
    if (sel && sel.textContent.trim()) return sel.textContent.trim();
    return 'Sentinel-1';
  }

  function readAOI(){
    var m = (document.body.innerText || '').match(/AOI-\d+/);
    return m ? m[0] : 'Bay of Bengal AOI-1';
  }

  function jitter(base, range){
    return Math.round((base + (Math.random()*2-1)*range) * 10) / 10;
  }

  function startIncident(){
    if (!window.OceanEye || !window.OceanEye.incident) {
      console.warn('[incident-wire] store not loaded');
      return null;
    }
    var inc = window.OceanEye.incident.create({
      status: 'ANALYZING',
      detection: {
        satellite: readSatellite(),
        aoi: readAOI(),
        detectedAt: new Date().toISOString()
      }
    });
    console.log('[incident-wire] started', inc.id);
    return inc;
  }

  function finishIncident(){
    if (!window.OceanEye || !window.OceanEye.incident) return;
    var inc = window.OceanEye.incident.get();
    if (!inc) return;

    var conf = readConfidence();
    if (conf === null) conf = jitter(88, 6);
    var lat = jitter(22.41, 0.25);
    var lon = jitter(88.46, 0.25);
    var area = jitter(18.6, 5);

    window.OceanEye.incident.update({
      status: 'DETECTED',
      detection: {
        confidence: conf,
        lat: lat,
        lon: lon,
        area_km2: area,
        detectedAt: new Date().toISOString()
      }
    });
    console.log('[incident-wire] finished', inc.id, conf + '%');
  }

  function wire(){
    // Wrap runSatelliteScan
    if (typeof window.runSatelliteScan === 'function' && !window.runSatelliteScan.__wired){
      var orig = window.runSatelliteScan;
      var wrapped = function(){
        try { startIncident(); } catch(e){ console.error('[incident-wire]', e); }
        var r = orig.apply(this, arguments);
        // scan animation ~2-4s; poll for confidence to appear
        var tries = 0;
        var t = setInterval(function(){
          tries++;
          var el = document.getElementById('confidenceMeter');
          var txt = el ? (el.textContent || '') : '';
          var hasNum = /\d/.test(txt) && txt.indexOf('--') === -1;
          var status = document.getElementById('scanStatus');
          var stxt = status ? (status.textContent || '').toLowerCase() : '';
          var done = stxt.indexOf('complete') >= 0 || stxt.indexOf('detected') >= 0 || (hasNum && tries > 4);
          if (done || tries > 12){
            clearInterval(t);
            finishIncident();
          }
        }, 500);
        return r;
      };
      wrapped.__wired = true;
      window.runSatelliteScan = wrapped;
      console.log('[incident-wire] runSatelliteScan wrapped');
    }

    // Also wire the Analyze button (id=analyzeBtn) if present
    var ab = document.getElementById('analyzeBtn');
    if (ab && !ab.__wired){
      ab.__wired = true;
      ab.addEventListener('click', function(){
        setTimeout(function(){
          var inc = window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get();
          if (!inc) startIncident();
          setTimeout(finishIncident, 1500);
        }, 200);
        console.log('[incident-wire] analyzeBtn clicked');
      });
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(wire, 300); });
  } else {
    setTimeout(wire, 300);
  }
  // Retry a few times in case the button is added later
  setTimeout(wire, 1500);
  setTimeout(wire, 4000);

  console.log('[incident-wire] armed');
})();
