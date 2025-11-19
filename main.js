let cityData = [];
let recentCities = JSON.parse(localStorage.getItem('recentCities') || '[]');

// Status display helper
function setStatus(txt) {
  const s = document.getElementById('status');
  s.textContent = txt;
  s.style.opacity = 1;
  setTimeout(() => (s.style.opacity = 0.7), 2000);
}

/* Handle CSV upload */
document.getElementById('csvFile').addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if (!f) {
    setStatus('No file selected');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const txt = e.target.result;
      const rows = txt.split(/\r?\n/).map((r) => r.trim()).filter((r) => r);
      if (rows.length < 2) {
        setStatus('CSV appears empty');
        return;
      }

      const delimiter = rows[0].includes(';') ? ';' : ',';
      const headers = rows[0].split(delimiter).map((h) => h.trim().toLowerCase());
      const cityI = headers.findIndex((h) => h.includes('city'));
      const countryI = headers.findIndex((h) => h.includes('country'));
      const latI = headers.findIndex((h) => h.includes('lat'));
      const lonI = headers.findIndex((h) => h.includes('lon'));

      if (cityI < 0 || latI < 0 || lonI < 0) {
        setStatus('CSV must include City, Latitude, Longitude columns');
        console.log('Headers found:', headers);
        return;
      }

      cityData = rows
        .slice(1)
        .map((r) => {
          const cols = r.split(delimiter).map((c) => c.trim());
          return {
            City: cols[cityI] || '',
            Country: countryI >= 0 ? cols[countryI] : '',
            Latitude: parseFloat(cols[latI]),
            Longitude: parseFloat(cols[lonI]),
          };
        })
        .filter((c) => c.City && !isNaN(c.Latitude) && !isNaN(c.Longitude));

      if (cityData.length === 0) {
        setStatus('No valid rows in CSV');
        return;
      }

      populateCitySelect(cityData);
      setStatus('✅ Cities loaded: ' + cityData.length);
    } catch (err) {
      setStatus('Error parsing CSV: ' + err.message);
    }
  };
  reader.readAsText(f);
});

/* Populate dropdown */
function populateCitySelect(arr) {
  const sel = document.getElementById('citySelect');
  sel.innerHTML = '<option value="">-- Select a city --</option>';
  arr.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.Latitude + ',' + c.Longitude;
    opt.textContent = c.City + (c.Country ? ', ' + c.Country : '');
    sel.appendChild(opt);
  });
  addRecentCitiesToSelect();
}

/* Add recent cities */
function addRecentCitiesToSelect() {
  const sel = document.getElementById('citySelect');
  if (recentCities.length > 0) {
    const grp = document.createElement('optgroup');
    grp.label = 'Recent Cities';
    recentCities.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = `${r.lat},${r.lon}`;
      opt.textContent = r.name;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  }
}

/* Filter search box */
document.getElementById('searchBox').addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  const sel = document.getElementById('citySelect');
  for (const opt of sel.options) {
    if (!opt.value) continue;
    opt.hidden = !opt.textContent.toLowerCase().includes(term);
  }
});

/* Fetch weather on button click */
document.getElementById('getWeather').addEventListener('click', async () => {
  const sel = document.getElementById('citySelect');
  if (!sel.value) {
    setStatus('Please choose a city');
    return;
  }
  const [lat, lon] = sel.value.split(',').map((s) => s.trim());
  const cityName = sel.options[sel.selectedIndex].text;
  await fetchAndRender(lat, lon, cityName);
  addToRecent(cityName, lat, lon);
});

/* Geolocation feature */
const geoButton = document.createElement('button');
geoButton.textContent = '📍 My Location';
geoButton.title = 'Get forecast for your current location';
geoButton.id = 'geoButton';
geoButton.style.marginLeft = '8px';
document.querySelector('.controls').appendChild(geoButton);

geoButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Geolocation not supported');
    return;
  }
  setStatus('Getting your location…');
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude.toFixed(2);
      const lon = pos.coords.longitude.toFixed(2);
      await fetchAndRender(lat, lon, 'Your Location');
      addToRecent('Your Location', lat, lon);
    },
    (err) => setStatus('Location error: ' + err.message)
  );
});

/* Save recent city */
function addToRecent(name, lat, lon) {
  recentCities = recentCities.filter((r) => r.name !== name);
  recentCities.unshift({ name, lat, lon });
  if (recentCities.length > 5) recentCities.pop();
  localStorage.setItem('recentCities', JSON.stringify(recentCities));
}

/* Fetch weather from API */
async function fetchAndRender(lat, lon, cityName) {
  const container = document.getElementById('forecast');
  container.innerHTML = '<div class="placeholder">🌤️ Loading weather data...</div>';

  const api = `https://www.7timer.info/bin/api.pl?lon=${encodeURIComponent(
    lon
  )}&lat=${encodeURIComponent(lat)}&product=civillight&output=json`;
  setStatus('Fetching forecast for ' + cityName + ' …');
  try {
    const resp = await fetch(api);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    if (!json.dataseries || !Array.isArray(json.dataseries) || json.dataseries.length === 0)
      throw new Error('No dataseries returned');
    renderForecast(json.dataseries, cityName);
    setStatus('7-day forecast for ' + cityName);
  } catch (err) {
    container.innerHTML = '<div class="placeholder">⚠️ Failed to load data.</div>';
    setStatus('Error: ' + err.message);
    console.error(err);
  }
}

/* Helpers */
function formatWeather(code) {
  const map = {
    clear: 'Clear',
    pcloudy: 'Partly Cloudy',
    mcloudy: 'Mostly Cloudy',
    cloudy: 'Cloudy',
    humid: 'Humid',
    ishower: 'Isolated Showers',
    oshower: 'Occasional Showers',
    lightrain: 'Light Rain',
    rain: 'Rain',
    rainsnow: 'Rain & Snow',
    lightsnow: 'Light Snow',
    snow: 'Snow',
    tsrain: 'Thunderstorm & Rain',
    tstorm: 'Thunderstorm',
    fog: 'Fog',
    windy: 'Windy',
  };
  return map[code] || (code || '');
}

function getIconPath(code) {
  if (!code) return 'images/clear.png';
  const allowed = [
    'clear',
    'pcloudy',
    'mcloudy',
    'cloudy',
    'humid',
    'ishower',
    'oshower',
    'lightrain',
    'rain',
    'rainsnow',
    'lightsnow',
    'snow',
    'tsrain',
    'tstorm',
    'fog',
    'windy',
  ];
  return allowed.includes(code) ? `images/${code}.png` : 'images/clear.png';
}

/* Render forecast cards */
function renderForecast(dataseries, cityName) {
  const container = document.getElementById('forecast');
  container.innerHTML = '';
  const byDay = [];
  const seen = new Set();
  for (const entry of dataseries) {
    let dateLabel = entry.date ? entry.date : null;
    if (!dateLabel && typeof entry.timepoint !== 'undefined') {
      const now = new Date();
      const d = new Date(now.getTime() + entry.timepoint * 3600 * 1000);
      dateLabel = d.toISOString().slice(0, 10);
    }
    if (!dateLabel) continue;
    if (!seen.has(dateLabel)) {
      seen.add(dateLabel);
      byDay.push({ label: dateLabel, entry });
    }
    if (byDay.length >= 7) break;
  }

  const display =
    byDay.length >= 7
      ? byDay.slice(0, 7)
      : dataseries.slice(0, 7).map((e, i) => ({ label: null, entry: e }));

  display.forEach((d, i) => {
    const e = d.entry;
    const dt = d.label
      ? new Date(d.label)
      : (() => {
          const n = new Date();
          n.setDate(n.getDate() + i);
          return n;
        })();
    const dateStr = dt.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const icon = getIconPath(e.weather);
    const weatherText = formatWeather(e.weather);
    const tmin =
      e.temp2m && typeof e.temp2m.min !== 'undefined'
        ? e.temp2m.min
        : e.temp2m || '-';
    const tmax =
      e.temp2m && typeof e.temp2m.max !== 'undefined'
        ? e.temp2m.max
        : e.temp2m || '-';
    const wind = e.wind10m_max ?? e.wind10m_avg ?? e.wind ?? '—';

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${dateStr}</h3>
      <img src="${icon}" alt="${weatherText}" onerror="this.src='images/clear.png'">
      <p class="small">${weatherText}</p>
      <p>🌡️ ${tmin}°C — ${tmax}°C</p>
      <p class="small">💨 Wind: ${wind} m/s</p>
    `;
    container.appendChild(card);
  });
}

/* Default cities */
const defaultCities = [
  { City: 'Paris', Country: 'FR', Latitude: 48.8566, Longitude: 2.3522 },
  { City: 'Amsterdam', Country: 'NL', Latitude: 52.3676, Longitude: 4.9041 },
  { City: 'Berlin', Country: 'DE', Latitude: 52.52, Longitude: 13.405 },
];
populateCitySelect(defaultCities);
cityData = defaultCities;
setStatus('Loaded default cities — upload CSV to replace list.');
