/* OCEAN EYE - Incident Badge
   Small floating badge (top-right) that shows the current incident state.
   Acts as a live indicator that the incident store is loaded and working.
*/
(function(){
  'use strict';

  function build(){
    if (document.getElementById('oceaneyeIncidentBadge')) return;
    var el = document.createElement('div');
    el.id = 'oceaneyeIncidentBadge';
    el.style.cssText = [
      'position:fixed','top:12px','right:12px','z-index:9999',
      'padding:8px 12px','background:rgba(6,20,32,0.92)',
      'border:1px solid rgba(0,212,170,0.55)','color:#00d4aa',
      'border-radius:4px','font-family:"Share Tech Mono",monospace',
      'font-size:11px','letter-spacing:0.08em','text-transform:uppercase',
      'box-shadow:0 0 12px rgba(0,212,170,0.15)','pointer-events:none',
      'user-select:none','max-width:340px','line-height:1.4'
    ].join(';');
    el.innerHTML = '<span style="opacity:0.6">INCIDENT</span> —';
    document.body.appendChild(el);
  }

  function render(inc){
    var el = document.getElementById('oceaneyeIncidentBadge');
    if (!el){ build(); el = document.getElementById('oceaneyeIncidentBadge'); }
    if (!el) return;
    if (!inc){
      el.style.borderColor = 'rgba(92,114,134,0.5)';
      el.style.color = '#5c7286';
      el.innerHTML = '<span style="opacity:0.7">INCIDENT</span> — none';
      return;
    }
    var conf = inc.detection && inc.detection.confidence;
    var confTxt = (conf === null || conf === undefined || conf === '') ? '' : ' \u00b7 ' + conf + '%';
    var st = inc.status || '—';
    if (st === 'DETECTED'){ el.style.color = '#ff4757'; el.style.borderColor = 'rgba(255,71,87,0.65)'; }
    else if (st === 'ANALYZING'){ el.style.color = '#ffb142'; el.style.borderColor = 'rgba(255,177,66,0.65)'; }
    else { el.style.color = '#00d4aa'; el.style.borderColor = 'rgba(0,212,170,0.55)'; }
    el.innerHTML = '<span style="opacity:0.6">INCIDENT</span> ' + inc.id +
                   ' <span style="opacity:0.6">\u00b7</span> ' + st + confTxt;
  }

  function init(){
    build();
    if (window.OceanEye && window.OceanEye.incident){
      window.OceanEye.incident.subscribe(render);
      render(window.OceanEye.incident.get());
      console.log('[incident-badge] active');
    } else {
      var el = document.getElementById('oceaneyeIncidentBadge');
      if (el){
        el.style.borderColor = 'rgba(255,71,87,0.65)';
        el.style.color = '#ff4757';
        el.innerHTML = 'INCIDENT STORE NOT LOADED';
      }
      console.warn('[incident-badge] /incident.js not loaded before this script');
    }
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
