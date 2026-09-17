/* OCEAN EYE — Excel Export (real .xlsx via SheetJS)
   Produces a genuine Excel workbook that opens cleanly in Excel / LibreOffice / Google Sheets.
   No browser warning, no HTML-in-.xls hack.
*/
(function(){
  'use strict';

  var BTN_ID = 'oeExportExcelBtn';
  var SHEETJS_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';

  function loadSheetJS(cb){
    if (window.XLSX) return cb();
    var s = document.createElement('script');
    s.src = SHEETJS_URL;
    s.onload = function(){ cb(); };
    s.onerror = function(){ console.error('[excel-export] SheetJS failed to load'); };
    document.head.appendChild(s);
  }

  function getDashboardData(){
    var d = {
      generatedAt: new Date().toISOString().replace('T',' ').slice(0,19),
      incident: {},
      kpis: []
    };
    try {
      d.incident = (window.OceanEye && window.OceanEye.incident && window.OceanEye.incident.get && window.OceanEye.incident.get()) || {};
    } catch(e){}
    try {
      document.querySelectorAll('.stat-number').forEach(function(el, i){
        var label = el.parentNode && el.parentNode.querySelector('.stat-label');
        d.kpis.push({
          Metric: label ? label.textContent.trim() : ('KPI ' + (i+1)),
          Value: el.textContent.trim()
        });
      });
    } catch(e){}
    return d;
  }

  function buildWorkbook(){
    var d = getDashboardData();
    var wb = XLSX.utils.book_new();

    // Sheet 1 — Overview
    var overview = [
      ['OCEAN EYE — Oil Spill Intelligence Platform'],
      ['Generated', d.generatedAt],
      [],
      ['Incident ID',       (d.incident.id || '')],
      ['Status',            (d.incident.status || '')],
      ['Latitude',          ((d.incident.detection && d.incident.detection.lat) || '')],
      ['Longitude',         ((d.incident.detection && d.incident.detection.lon) || '')],
      ['Area (km²)',        ((d.incident.detection && d.incident.detection.area_km2) || '')],
      ['Confidence (%)',    ((d.incident.detection && d.incident.detection.confidence) || '')]
    ];
    var ws1 = XLSX.utils.aoa_to_sheet(overview);
    ws1['!cols'] = [{ wch: 20 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Overview');

    // Sheet 2 — KPIs
    var kpiRows = [['Metric', 'Value']];
    d.kpis.forEach(function(k){ kpiRows.push([k.Metric, k.Value]); });
    var ws2 = XLSX.utils.aoa_to_sheet(kpiRows);
    ws2['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'KPIs');

    return wb;
  }

  function downloadExcel(){
    loadSheetJS(function(){
      if (!window.XLSX){
        alert('Excel export unavailable — could not load xlsx library. Check your internet connection.');
        return;
      }
      var wb = buildWorkbook();
      var ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      XLSX.writeFile(wb, 'ocean-eye-report-' + ts + '.xlsx');
      console.log('[excel-export] downloaded real .xlsx');
    });
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
  }

  function boot(){
    mount();
    setInterval(mount, 1500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  console.log('[excel-export] armed — real .xlsx export');
})();
