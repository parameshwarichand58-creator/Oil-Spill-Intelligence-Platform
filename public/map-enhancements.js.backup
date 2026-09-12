// ============================================
// OCEAN EYE - Map Enhancements
// ============================================
(function() {
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
        var satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '&copy; ESRI'
        });
        var streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        });
        var baseMaps = { "Satellite": satelliteLayer, "Street": streetLayer };
        L.control.layers(baseMaps).addTo(mapInstance);
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
        if (L.control.fullscreen) {
            L.control.fullscreen({ position: 'topleft' }).addTo(mapInstance);
        }
        var alertPopup = document.getElementById('alertPopup');
        if (alertPopup) {
            var smsDiv = document.createElement('div');
            smsDiv.style.marginTop = '10px';
            smsDiv.innerHTML = '<a href="sms:+919876543210?body=🚨%20Oil%20Spill%20Alert%20-%20Take%20immediate%20action!" class="btn btn-warning" style="display:inline-block;padding:8px 16px;border-radius:5px;text-decoration:none;">📱 Send SMS to Mobile</a>';
            alertPopup.appendChild(smsDiv);
        }
        console.log('✅ Map enhancements applied');
    });
})();
