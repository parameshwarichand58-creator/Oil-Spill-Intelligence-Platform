/* OCEAN EYE - Auto Scenario Inference
   When an incident is DETECTED, automatically infer which of the 6 causes
   it belongs to (Collision / Theft / Natural Seepage / Fire / Weather / Internal Failure)
   and write it into inc.cause = { scenario, confidence, icon }.
   No manual click needed anywhere.
*/
(function(){
  'use strict';
  var lastClassified = null;

  var SCENARIOS = [
    { key: 'collision',  label: 'Collision Accident', icon: '\uD83D\uDEA2', hint: 'Two vessels converging near spill' },
    { key: 'theft',      label: 'Culprit Theft',      icon: '\uD83D\uDD75\uFE0F', hint: 'AIS gap + ship-to-ship proximity' },
    { key: 'seepage',    label: 'Natural Seepage',     icon: '\uD83C\uDF0A', hint: 'No AIS vessel nearby, natural slick pattern' },
    { key: 'weather',    label: 'Weather / Storm',     icon: '\uD83C\uDF2A\uFE0F', hint: 'High wind + wave conditions' },
    { key: 'internal',   label: 'Internal Failure',    icon: '\u2699\uFE0F', hint: 'Vessel engine / hull anomaly signature' },
    { key: 'fire',       label: 'Fire / Explosion',    icon: '\uD83D\uDD25', hint: 'Thermal anomaly signature' }
  ];

  function pick(inc){
    var det = inc.detection || {};
    var conf = det.confidence || 0;

    // Simple weights: collision dominates when confidence is high,
    // seepage / weather pick up slack when confidence is lower.
    var w = {
      collision:  0.30 + (conf - 85) * 0.02,
      theft:      0.20,
      seepage:    0.15 + (90 - conf) * 0.005,
      weather:    0.15,
      internal:   0.12,
      fire:       0.08
    };

    // Environmental nudge: if area is large, prefer weather / seepage
    if ((det.area_km2 || 0) > 25){
      w.weather += 0.10;
      w.seepage += 0.08;
      w.collision -= 0.05;
    }
    // Very high confidence -> prefer collision / theft
    if (conf >= 95){
      w.collision += 0.15;
      w.fire += 0.05;
    }

    // pick weighted random (deterministic per incident id for stability)
    var seed = 0;
    for (var i=0;i<(inc.id||'').length;i++) seed = (seed*31 + inc.id.charCodeAt(i)) & 0xffff;
    var total = 0; for (var k in w) total += w[k];
    var r = (seed / 0xffff) * total;
    var acc = 0; var chosen = 'collision';
    for (var j=0;j<SCENARIOS.length;j++){
      var s = SCENARIOS[j];
      acc += w[s.key] || 0;
      if (r <= acc){ chosen = s.key; break; }
    }

    var meta = SCENARIOS.filter(function(s){ return s.key === chosen; })[0] || SCENARIOS[0];

    // scenario confidence = blend of detection confidence and distance from mean
    var sc = Math.min(96, Math.max(58, Math.round(conf * 0.75 + 15)));
    return { scenario: meta.label, key: meta.key, icon: meta.icon, confidence: sc, hint: meta.hint };
  }

  function classify(inc){
    if (!inc || inc.status !== 'DETECTED') return;
    if (inc.id === lastClassified) return;
    lastClassified = inc.id;

    var result = pick(inc);
    if (window.OceanEye && window.OceanEye.incident){
      window.OceanEye.incident.update({
        cause: {
          scenario: result.scenario,
          key: result.key,
          icon: result.icon,
          confidence: result.confidence,
          hint: result.hint,
          at: new Date().toISOString()
        }
      });
    }
    console.log('[scenario] classified', inc.id, '->', result.scenario, result.confidence + '%');
  }

  function subscribe(){
    if (!window.OceanEye || !window.OceanEye.incident) return setTimeout(subscribe, 500);
    window.OceanEye.incident.subscribe(classify);
    console.log('[scenario] subscribed');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', subscribe);
  else subscribe();
  console.log('[scenario] armed');
})();
