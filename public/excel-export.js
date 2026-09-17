/* OCEAN EYE — Excel Export
   Adds an "Export Excel" button next to the existing Export CSV / Export JSON.
   Uses HTML-table-to-.xls trick — Excel opens natively, no library needed.
*/
(function(){
  'use strict';

  var BTN_ID = 'oeExportExcelBtn';

  function getDashboardData(){
    // Grab whatever is on the dashboard — KPIs, tables, cards
    var data = {
      generatedAt: new Date().toISOString(),
      incident: (window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get && window.OceanEye.incident.get()) || {},
      kpis: [],
      ships: []
    };
    try {
      document.querySelectorAll('.stat-number').forEach(function(el, i){
        var label = el.parentNode && el.parentNode.querySelector('.stat-label');
        data.kpis.push({
          metric: label ? label.textContent.trim() : ('KPI ' + (i+1)),
          value: el.textContent.trim()
        });
      });
    } catch(e){}
    return data;
  }

  function buildExcelHtml(d){
    var h = [];
    h.push('<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><style>');
    h.push('td,th{border:1px solid #999;padding:4px 8px;font-family:Arial;font-size:11px;}');
    h.push('th{background:#0a3a5a;color:#fff;font-weight:bold;}');
    h.push('h2{font-family:Arial;font-size:14px;color:#0a3a5a;}');
    h.push('</style></head><body>');

    h.push('<h2>OCEAN EYE — Oil Spill Intelligence Platform</h2>');
    h.push('<p>Generated: ' + d.generatedAt + '</p>');

    if (d.incident && d.incident.id){
      h.push('<h3>Incident</h3><table>');
      h.push('<tr><th>Field</th><th>Value</th></tr>');
      h.push('<tr><td>ID</td><td>' + (d.incident.id || '') + '</td></tr>');
      var det = d.incident.detection || {};
      h.push('<tr><td>Latitude</td><td>' + (det.lat || '') + '</td></tr>');
      h.push('<tr><td>Longitude</td><td>' + (det.lon || '') + '</td></tr>');
      h.push('<tr><td>Area (km²)</td><td>' + (det.area_km2 || '') + '</td></tr>');
      h.push('<tr><td>Confidence (%)</td><td>' + (det.confidence || '') + '</td></tr>');
      h.push('<tr><td>Status</td><td>' + (d.incident.status || '') + '</td></tr>');
      h.push('</table>');
    }

    h.push('<h3>Dashboard KPIs</h3><table>');
    h.push('<tr><th>Metric</th><th>Value</th></tr>');
    d.kpis.forEach(function(k){
      h.push('<tr><td>' + k.metric + '</td><td>' + k.value + '</td></tr>');
    });
    h.push('</table>');

    h.push('</body></html>');
    return h.join('');
  }

  function downloadExcel(){
    var d = getDashboardData();
    var html = buildExcelHtml(d);
    var blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = 'ocean-eye-report-' + ts + '.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
    console.log('[excel-export] downloaded');
  }

  function makeBtn(){
    var b = document.createElement('button');
    b.id = BTN_ID;
    b.textContent = '📊 Export Excel';
    b.style.cssText = 'padding:6px 14px;background:linear-gradient(135deg,#22d37f,#059669);color:#fff;border:none;border-radius:4px;cursor:pointer;font-family:"Share Tech Mono",monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;margin-left:8px;';
    b.onclick = function(ev){ ev.preventDefault(); ev.stopPropagation(); downloadExcel(); };
    return b;
  }

  function findCsvBtn(){
    var all = document.querySelectorAll('button');
    for (var i=0;i<all.length;i++){
      var t = (all[i].textContent || '').toUpperCase();
      if (t.indexOf('EXPORT CSV') >= 0) return all[i];
    }
    return null;
  }

  function mount(){
    if (document.getElementById(BTN_ID)) return;
    var csv = findCsvBtn();
    if (!csv || !csv.parentNode) return;
    var btn = makeBtn();
    csv.parentNode.insertBefore(btn, csv.nextSibling);
    console.log('[excel-export] mounted');
  }

  function boot(){
    mount();
    setInterval(mount, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('[excel-export] armed');
})();
