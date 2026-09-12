/* OCEAN EYE - Shared Incident Store
   Single source of truth for the current incident.
   Every module (Satellite, Map, AIS, Risk, Alerts, Review) reads/writes here.
   Plain JS. No framework. Persists to localStorage.
*/
(function(){
  'use strict';
  var STORAGE_KEY = 'oceaneye.currentIncident';
  var current = null;
  var listeners = [];

  function nowISO(){ return new Date().toISOString(); }
  function genId(){
    var y = new Date().getFullYear();
    var n = String(Math.floor(Math.random()*900)+100);
    return 'OCEAN-' + y + '-' + n;
  }
  function load(){
    try { var raw = localStorage.getItem(STORAGE_KEY); if (raw) current = JSON.parse(raw); }
    catch(e){ current = null; }
    return current;
  }
  function save(){
    try {
      if (current) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      else localStorage.removeItem(STORAGE_KEY);
    } catch(e){}
  }
  function emit(){
    for (var i=0;i<listeners.length;i++){
      try { listeners[i](current); } catch(e){ console.error('[incident] listener', e); }
    }
  }
  function create(seed){
    seed = seed || {};
    current = {
      id: seed.id || genId(),
      status: seed.status || 'ANALYZING',
      createdAt: nowISO(),
      updatedAt: nowISO(),
      detection:   { satellite:null, aoi:null, confidence:null, area_km2:null, lat:null, lon:null, detectedAt:null },
      environment: { wind:null, current:null, waves:null, weather:null },
      drift:       { current:null, h6:null, h12:null, h24:null, origin:null },
      vessels:     [],
      risk:        { score:null, level:null, recommended:null },
      alert:       { triggered:false, at:null },
      review:      { status:'PENDING', reviewer:null, at:null },
      cause:       { scenario:null, confidence:null },
      evidence:    {}
    };
    save(); emit();
    console.log('[incident] created', current.id);
    return current;
  }
  function update(patch){
    if (!current) create();
    if (!patch) return current;
    Object.keys(patch).forEach(function(k){
      var v = patch[k];
      if (v && typeof v === 'object' && !Array.isArray(v) &&
          current[k] && typeof current[k] === 'object' && !Array.isArray(current[k])){
        Object.keys(v).forEach(function(k2){ current[k][k2] = v[k2]; });
      } else {
        current[k] = v;
      }
    });
    current.updatedAt = nowISO();
    save(); emit();
    return current;
  }
  function clear(){ current = null; save(); emit(); }
  function get(){ return current; }
  function subscribe(fn){
    if (typeof fn !== 'function') return function(){};
    listeners.push(fn);
    if (current){ try { fn(current); } catch(e){} }
    return function(){ var i = listeners.indexOf(fn); if (i>=0) listeners.splice(i,1); };
  }

  window.OceanEye = window.OceanEye || {};
  window.OceanEye.incident = {
    create: create, update: update, get: get, clear: clear,
    subscribe: subscribe, load: load, _genId: genId
  };

  load();
  console.log('[incident] store ready');
})();
