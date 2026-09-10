// ============================================
// OCEAN EYE - Map Enhancements (Non-Invasive)
// ============================================

// Wait for the map to be ready
function waitForMap(callback, attempts) {
    attempts = attempts || 0;
    if (typeof mapInstance !== 'undefined' && mapInstance) {
        callback();
    } else if (attempts < 20) {
        setTimeout(function() { waitForMap(callback, attempts + 1); }, 500);
    } else {
        console.warn('Map not available for enhancements');
    }
}

waitForMap(function() {

    // 1. Satellite Tile Layer (overlay, not replacing)
    var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; ESRI'
    });
    var streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    });

    var baseMaps = {
        "Street": streetLayer,
        "Satellite": satelliteLayer
    };

    // Add layer control
    L.control.layers(baseMaps).addTo(mapInstance);

    // 2. Heatmap Layer (spill concentration)
    var heatData = [
        [22.41, 88.46, 0.8],
        [22.38, 88.44, 0.5],
        [22.40, 88.42, 0.6],
        [22.35, 88.38, 0.4],
        [22.45, 88.52, 0.3]
    ];
    var heat = L.heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {0.4: 'blue', 0.6: 'yellow', 0.8: 'red'}
    });
    heat.addTo(mapInstance);

    // 3. Fullscreen Control
    if (L.control.fullscreen) {
        L.control.fullscreen({ position: 'topleft' }).addTo(mapInstance);
    } else {
        console.warn('Fullscreen plugin not loaded');
    }

    // 4. Mobile SMS Button in Alert Popup
    var alertPopup = document.getElementById('alertPopup');
    if (alertPopup) {
        var smsDiv = document.createElement('div');
        smsDiv.style.marginTop = '10px';
        smsDiv.innerHTML = '<a href="sms:+919876543210?body=🚨%20Oil%20Spill%20Alert%20-%20Take%20immediate%20action!" class="btn btn-warning" style="display:inline-block;padding:8px 16px;border-radius:5px;text-decoration:none;">📱 Send SMS to Mobile</a>';
        alertPopup.appendChild(smsDiv);
    }

    console.log('✅ Map enhancements applied (satellite, heatmap, fullscreen, SMS button)');
});
