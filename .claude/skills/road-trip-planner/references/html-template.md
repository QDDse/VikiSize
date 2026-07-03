# HTML Guide Template Reference

Read this file before generating any HTML guide. It contains the exact CSS, HTML structure, and Leaflet map code to use.

## Tech Stack

- Font: `Noto Sans SC` from Google Fonts with `font-display: swap` (supports Chinese + English, graceful fallback to system fonts)
- Map: Leaflet.js 1.9.4 from cdnjs + CARTO Voyager tiles (free, no API key)
- Single-file HTML (all CSS inline in `<style>`, JS at bottom)

## Offline & Low-signal Considerations

This HTML will be used while traveling — cell signal may be weak or absent on scenic routes.

1. **Font**: `font-display: swap` ensures the page renders immediately with system fonts, then upgrades when Noto Sans SC loads. Page is fully usable without Google Fonts.
2. **Map fallback**: If Leaflet or tiles fail to load, a `<noscript>` block and JS error handler show a text-based stop list with coordinates. Navigation buttons still work because they open the native Google Maps app.
3. **Nav buttons work offline**: Google Maps coordinate URLs open the native app, which uses pre-downloaded offline maps.
4. **No other external JS**: All logic is vanilla JS — no framework dependencies that could fail to load.

## Complete CSS

```css
:root{
  --bg:#faf9f6;--card:#fff;--text:#1a1a2e;--text2:#5a5a7a;--textL:#8888a4;
  --accent:#2d5be3;--accentL:#e8eeff;--accentD:#1a3da8;
  --green:#0d9a5f;--greenL:#e6f7f0;
  --red:#dc3545;--redL:#fde8ea;
  --gold:#d4920b;--goldL:#fef8e8;
  --border:#e8e8ee;
  --sh:0 1px 3px rgba(0,0,0,.06),0 4px 12px rgba(0,0,0,.04);
  --r:16px
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans SC',-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.75;-webkit-font-smoothing:antialiased;max-width:480px;margin:0 auto}

/* Hero */
.hero{background:linear-gradient(160deg,#1a1a2e,#2d3561 50%,#3a5ba0);padding:52px 24px 36px;position:relative;overflow:hidden}
.hero::after{content:'';position:absolute;top:-50%;right:-30%;width:300px;height:300px;background:radial-gradient(circle,rgba(255,255,255,.06),transparent 70%);border-radius:50%}
.hero-label{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:2px;margin-bottom:12px}
.hero h1{font-size:32px;font-weight:900;color:#fff;line-height:1.2;margin-bottom:8px}
.hero-sub{font-size:15px;color:rgba(255,255,255,.65);margin-bottom:16px}
.hero-badges{display:flex;flex-wrap:wrap;gap:8px}
.badge{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;font-size:12px;font-weight:500}
.badge-date{background:rgba(255,255,255,.12);color:rgba(255,255,255,.85)}
.badge-ref{background:rgba(45,91,227,.3);color:rgba(180,200,255,.9)}
.badge-note{background:rgba(251,191,36,.2);color:rgba(255,220,130,.95)}

/* Map */
.map-wrap{margin:16px;border-radius:var(--r);overflow:hidden;border:1px solid var(--border);box-shadow:var(--sh);background:var(--card)}
#map{height:320px;width:100%}
.pin{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3);border:2px solid #fff}
.pin-b{background:#2d5be3}.pin-g{background:#0d9a5f}.pin-gd{background:#d4920b}
.map-link-bar{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-top:1px solid var(--border)}
.map-link-bar a{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 18px;background:var(--accent);color:#fff;border-radius:10px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 2px 6px rgba(45,91,227,.25)}

/* Section Headers */
.section-header{display:flex;align-items:center;gap:10px;padding:24px 20px 12px}
.section-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
.si-blue{background:var(--accentL)}.si-green{background:var(--greenL)}.si-gold{background:var(--goldL)}
.section-header-text h2{font-size:17px;font-weight:700;color:var(--text);line-height:1.3}
.section-header-text p{font-size:12px;color:var(--textL)}

/* Stop Cards */
.stops{padding:0 16px}
.stop-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:20px;margin-bottom:12px;box-shadow:var(--sh)}
.stop-card.hl{border-color:var(--gold);box-shadow:var(--sh),0 0 0 1px var(--gold)}
.stop-header{display:flex;align-items:flex-start;gap:12px;margin-bottom:12px}
.stop-num{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0}
.sn-b{background:var(--accent)}       /* Blue: regular stops */
.sn-g{background:var(--green)}        /* Green: hotel/rest */
.sn-gd{background:var(--gold)}        /* Gold: highlight/main event */
.sn-o{background:transparent;border:2px dashed var(--textL);color:var(--textL)} /* Optional */
.stop-title{font-size:16px;font-weight:700;line-height:1.35}
.stop-meta{font-size:13px;color:var(--textL);margin-top:2px}
.tag{display:inline-block;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;text-transform:uppercase;letter-spacing:.5px;vertical-align:middle;margin-left:6px;position:relative;top:-1px}
.tag-r{background:var(--greenL);color:var(--green)}  /* Recommended */
.tag-o{background:#f0f0f5;color:var(--textL)}         /* Optional */
.stop-body{font-size:14px;color:var(--text2);line-height:1.75}
.stop-body strong{color:var(--text);font-weight:600}

/* Detail Box */
.dbox{margin-top:12px;padding:14px;background:#f7f8fc;border-radius:12px}
.dbox h4{font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px}
.dbox ul{padding-left:16px;font-size:13px;color:var(--text2)}
.dbox li{margin-bottom:4px}
.dbox li strong{color:var(--text)}

/* Alerts */
.alert{margin-top:12px;padding:12px 14px;border-radius:10px;font-size:13px;line-height:1.6;display:flex;gap:8px}
.alert-i{flex-shrink:0;font-size:16px}
.al-w{background:var(--goldL);color:#8a6914}  /* Warning: costs, tolls */
.al-d{background:var(--redL);color:#a32535}    /* Danger: safety, theft */

/* Nav Button */
.nav-btn{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;padding:12px 18px;background:var(--accent);color:#fff;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;transition:all .15s;box-shadow:0 2px 8px rgba(45,91,227,.25)}
.nav-btn:active{transform:scale(.97);background:var(--accentD)}
.nav-btn svg{width:16px;height:16px;flex-shrink:0}
.alt-link{display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:12px;color:var(--accent);text-decoration:none}

/* Drive Connector */
.drive-conn{display:flex;align-items:center;gap:8px;padding:4px 20px 4px 32px;font-size:12px;color:var(--textL)}
.drive-conn::before{content:'';width:2px;height:18px;background:var(--border);border-radius:1px}

/* Info Section */
.info-section{padding:24px 16px 16px}
.info-section>h2{font-size:17px;font-weight:700;margin-bottom:12px;padding-left:4px}
.info-grid{display:flex;flex-direction:column;gap:10px}
.info-card{background:var(--card);border:1px solid var(--border);border-radius:var(--r);padding:16px;box-shadow:var(--sh)}
.info-card h3{font-size:14px;font-weight:700;margin-bottom:10px}
.info-row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #f3f3f8}
.info-row:last-child{border:none}
.info-row .l{color:var(--text2)}
.info-row .v{color:var(--text);font-weight:600;text-align:right}

/* Map Offline Fallback */
.map-fallback{display:none;padding:20px;font-size:13px;color:var(--text2);line-height:1.8}
.map-fallback h3{font-size:15px;font-weight:700;color:var(--text);margin-bottom:8px}
.map-fallback ol{padding-left:20px}
.map-fallback li{margin-bottom:4px}
.map-offline #map{display:none}
.map-offline .map-fallback{display:block}

/* Footer */
footer{text-align:center;padding:28px 16px 40px;font-size:12px;color:var(--textL)}
footer a{color:var(--accent);text-decoration:none}
```

## Page Structure (HTML skeleton)

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Day N · [Title]</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet" media="print" onload="this.media='all'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700;900&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
<style>/* all CSS above */</style>
</head>
<body>

<!-- 1. Hero -->
<div class="hero">
  <div class="hero-label">CALIFORNIA ROAD TRIP</div>
  <h1>Day N [Title]</h1>
  <div class="hero-sub">[Route summary]</div>
  <div class="hero-badges">
    <span class="badge badge-date">📅 [Date]</span>
    <span class="badge badge-ref">🔑 [Booking ref]</span>
    <span class="badge badge-note">⚠️ [Holiday note if any]</span>
  </div>
</div>

<!-- 2. Leaflet Map (with offline fallback) -->
<div class="map-wrap">
  <div id="map"></div>
  <div class="map-fallback">
    <h3>📍 站点列表（地图离线时显示）</h3>
    <ol>
      <!-- Populate with stop names + coordinates for each stop -->
      <li>[Stop 1 Name] — [LAT, LNG]</li>
      <li>[Stop 2 Name] — [LAT, LNG]</li>
    </ol>
    <p style="margin-top:12px;font-size:12px;color:var(--textL)">地图需要网络连接。导航按钮仍可正常使用（会打开 Google Maps App）。</p>
  </div>
  <div class="map-link-bar">
    <a href="[Google Maps full route URL with coordinates]" target="_blank">
      🗺️ 在 Google Maps 中查看路线导航
    </a>
  </div>
</div>

<!-- 3. Section: repeat per phase -->
<div class="section-header">
  <div class="section-icon si-blue">💻</div>
  <div class="section-header-text">
    <h2>[Phase Title]</h2>
    <p>[Subtitle]</p>
  </div>
</div>
<div class="stops">
  <!-- Stop card -->
  <div class="stop-card"><!-- or .stop-card.hl for highlight -->
    <div class="stop-header">
      <div class="stop-num sn-b">①</div><!-- sn-b/sn-g/sn-gd/sn-o -->
      <div>
        <div class="stop-title">[Name] <span class="tag tag-r">推荐</span></div>
        <div class="stop-meta">🕐 [Time] · [Duration] · [Note]</div>
      </div>
    </div>
    <div class="stop-body">[Description with <strong>bold</strong> for key info]</div>
    <!-- Optional: detail box, alert, nav button -->
    <a class="nav-btn" href="[Google Maps coordinate URL]" target="_blank">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
      [Origin] → [Destination]（[time]）
    </a>
  </div>

  <!-- Drive connector between stops -->
  <div class="drive-conn">🚗 [time] · [route note]</div>
</div>

<!-- 4. Info Section -->
<div class="info-section">
  <h2>📋 实用信息</h2>
  <div class="info-grid">
    <div class="info-card">
      <h3>🌤️ 天气</h3>
      <div class="info-row"><span class="l">温度</span><span class="v">[XX-XX°C]</span></div>
      <div class="info-row"><span class="l">天气</span><span class="v">[☀️ 晴 / 🌧️ 雨]</span></div>
      <div class="info-row"><span class="l">日落</span><span class="v">[X:XX PM]</span></div>
      <div class="info-row"><span class="l">建议</span><span class="v">[穿搭/装备提示]</span></div>
    </div>
    <div class="info-card">
      <h3>💰 费用预估</h3>
      <div class="info-row"><span class="l">[Item]</span><span class="v">[Cost]</span></div>
    </div>
    <!-- More info cards: emergency, etc. -->
  </div>
</div>

<!-- 5. Footer -->
<footer>
  [Trip name] · Day N of N · [Date]<br>
  <a href="[Google Maps full route]" target="_blank">📍 Google Maps 完整路线</a>
</footer>

<!-- 6. Leaflet JS (at bottom of body, with offline fallback) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" onerror="document.querySelector('.map-wrap').classList.add('map-offline')"></script>
<script>
var stops=[
  // c values: "b"=blue regular, "g"=green hotel, "gd"=gold highlight
  {n:"① [Name]", lat:00.0000, lng:-000.0000, c:"b", t:"0:00 PM"},
];
try {
  var map=L.map('map',{zoomControl:false}).setView([center_lat, center_lng], zoom_level);
  L.control.zoom({position:'bottomright'}).addTo(map);
  var tiles=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{
    attribution:'©OpenStreetMap ©CARTO', maxZoom:18
  }).addTo(map);
  // If tiles fail to load after 5s, show fallback
  var tileLoaded=false;
  tiles.on('load',function(){tileLoaded=true});
  setTimeout(function(){if(!tileLoaded)document.querySelector('.map-wrap').classList.add('map-offline')},5000);
  var pts=[];
  stops.forEach(function(s,i){
    var icon=L.divIcon({
      className:'',
      html:'<div class="pin pin-'+s.c+'">'+(i+1)+'</div>',
      iconSize:[28,28], iconAnchor:[14,14]
    });
    L.marker([s.lat,s.lng],{icon:icon}).addTo(map)
      .bindPopup('<b>'+s.n+'</b><br><span style="color:#888">'+s.t+'</span>',{closeButton:false});
    pts.push([s.lat,s.lng]);
  });
  L.polyline(pts,{color:'#2d5be3',weight:2.5,opacity:0.5,dashArray:'8,8'}).addTo(map);
  map.fitBounds(pts,{padding:[30,30]});
} catch(e) {
  document.querySelector('.map-wrap').classList.add('map-offline');
}
</script>
</body>
</html>
```

## Google Maps URL Format

Destination-only format. Never add origin or waypoints — they cause routing errors.

**Driving to parking lot:**
```
https://www.google.com/maps/dir/?api=1&destination=PARKING+LOT+NAME+CITY+STATE&travelmode=driving
```

**Walking from parking to attraction:**
```
https://www.google.com/maps/dir/?api=1&destination=ATTRACTION+NAME+CITY+STATE&travelmode=walking
```

**Full route link (for map footer — overview only, each stop still uses destination-only):**
```
https://www.google.com/maps/dir/PLACE1+CITY/PLACE2+CITY/PLACE3+CITY/...
```

**Rules:**
- Prefer place names over coordinates (coordinates are error-prone)
- Never add `origin=` — user's current location may differ from what you expect
- Never add `waypoints=` — can route through closed/restricted roads
- Every stop gets TWO nav buttons: drive-to-parking + walk-to-attraction

## Pin Color Rules

| Color | CSS Class | Use For |
|-------|-----------|---------|
| Blue `#2d5be3` | `.sn-b`, `.pin-b` | Regular must-visit stops |
| Green `#0d9a5f` | `.sn-g`, `.pin-g` | Hotels, check-in/check-out |
| Gold `#d4920b` | `.sn-gd`, `.pin-gd` | Day's highlight (sunset, main attraction) |
| Dashed outline | `.sn-o` | Optional / skippable stops |
