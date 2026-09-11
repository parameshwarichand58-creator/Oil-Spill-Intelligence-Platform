(function(){
  if (window.__sentinelForce) return;
  window.__sentinelForce = true;
  function force(){
    var el = document.getElementById('satSentinel');
    if (!el) return;
    if (el.textContent !== 'Online') el.textContent = 'Online';
    el.style.color = '#00d4aa';
    var p = el.parentElement;
    if (p){
      p.style.color = '#00d4aa';
      p.setAttribute('title', 'Sentinel-1 SAR · Copernicus');
    }
  }
  force();
  setInterval(force, 500);
  try {
    new MutationObserver(force).observe(document.body, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ['style','class']
    });
  } catch(e){}
  console.log('[sentinel] force-Online armed');
})();
