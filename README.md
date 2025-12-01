#  EuroWeather 7-Day Forecast – Developer Documentation
A client-side weather forecast app that lets users upload European city datasets, search locations, use geolocation, and fetch 7-day forecasts via the 7Timer API—fully built in vanilla JS with optimized parsing, error handling, and UI rendering.

---

## Overview

I built this project as part of a Coursera Guided Project, but I spent additional time understanding the workflow, refining the UI, improving the user experience, and turning it into a clean, modular, developer-friendly web app.

The idea is simple:
**Upload a CSV of European cities → choose a location → fetch a 7-day weather forecast from the 7Timer API.**

Along the way, I learned a lot about client-side CSV parsing, dynamic UI rendering, geolocation, error handling, API quirks, and performance considerations in pure JavaScript applications.

This documentation is meant for developers who want to understand how the app works under the hood or extend it further.

---


### **Live Demo**
  
  <img width="1920" height="1020" alt="Screenshot 2025-11-19 212606" src="https://github.com/user-attachments/assets/10fd1629-b50d-4b02-9c3a-f51d914e3518" />

---

## What You'll Need

This is a front-end-only project, so the technical requirements are minimal.

### Software Requirements

* A modern browser (Chrome, Firefox, Edge, etc.)
* Optional: a basic local server for testing
  (`python -m http.server` recommended)
* Git (to clone the repo)

The app automatically parses the file and populates the city selector.
---
**Features**

- **Smart Search & Auto-Filtering**
A live search bar filters city names instantly.

- **Geolocation Support**
One click → Get a 7-day forecast for **your current location**.

- **Recent Cities Memory**
Your last 5 viewed locations are stored locally and accessible as quick shortcuts.

- **Interactive Forecast Cards**
Each daily forecast displays:
- Weather icon  
- Temperature range  
- Wind speed  
- Short description  
- Day label (Mon, Tue…)  

- **Clean, Modern UI**
---

**Tech Stack**  
- HTML5, CSS3, Vanilla JavaScript  
- 7Timer Weather API  
- LocalStorage for persistence  


---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yvidhya/European-7-Day-Weather-Forecast.git
cd European-7-Day-Weather-Forecast
```

### 2. Run the App

You can open `index.html` directly, but some browsers block `fetch()` when loading from the filesystem.
So I usually run a simple server:

```bash
python -m http.server 8000
```

Then visit:

```
http://localhost:8000
```

---

## How to Use the App

- 1️ Upload a City Dataset (CSV)
Sample CSV :


The app expects columns like:

```
City,Country,Latitude,Longitude
```

It auto-detects whether the file uses commas or semicolons and parses everything into an internal city list.

- 2️ Filter Cities

Type into the search bar and the dropdown filters in real time.

- 3️ Fetch Weather Data

Click **Get Forecast** to display:

* Weather icons
* Min/max temperatures
* Wind speeds
* Human-readable weather descriptions
* Day names with formatted dates

- 4️ Use Geolocation

The **📍 My Location** button fetches your coordinates and displays the forecast for your current position.

- 5️ Recent Cities

The app stores up to 5 recently viewed cities using LocalStorage — a small UX improvement that makes the app feel more polished.

---


## Project Structure

```
/
├── index.html          # Main interface
├── css/
│   └── master.css      # Styling
├── main.js             # All logic and functionality
├── images/             # Weather icons
└── cities.csv          # Sample dataset
```

---

## API Information

The project uses the public **7Timer! Weather API**:

```
https://www.7timer.info/bin/api.pl
```

The API returns:

* weather codes
* temperature ranges
* wind speed
* either a direct date or timepoint (hours from now)

I had to add fallback logic because different endpoints sometimes return different structures.

---

## Key Functions I Explored

This section is inspired by my own digging through the code to understand how everything fits together.

---

### 1. CSV Parsing

**Functionality:**
Detect the delimiter → parse headers → extract city data → discard invalid rows.

**Why it matters:**
User-uploaded CSVs can be messy. This function ensures robustness.

**Notable logic:**

```js
const delimiter = rows[0].includes(';') ? ';' : ',';
```

  **What I learned:**

  * Several CSVs use semicolons due to European locale settings
  * Missing headers needed graceful error messages



### 2. fetchAndRender(lat, lon, cityName)

The main function that retrieves data and updates the UI.

**Responsibilities:**

1. Build API URL
2. Fetch weather JSON
3. Validate structure
4. Call rendering functions
5. Handle loading/error states

**Snippet:**

```js
const resp = await fetch(api);
if (!resp.ok) throw new Error('HTTP ' + resp.status);
```

**Challenges:**

* The API occasionally returns incomplete dataseries
* Needed a good loading placeholder to avoid blank UI spots


### 3. renderForecast(dataseries, cityName)

This function transforms raw weather data into display cards.

**What it handles:**

* Formatting ISO dates into readable text
* Picking icons based on weather codes
* Handling missing temperatures or wind values
* Limiting output to 7 days

**What I found interesting:**
Some entries include `timepoint` instead of a full date, so I built dynamic date estimation.



### 4. Recent Cities (localStorage)

A small feature that makes the app feel more “real world”.

```js
localStorage.setItem('recentCities', JSON.stringify(recentCities));
```

  **What I learned:**
  Persisting UI state improves usability far more than expected.

---

## Issues I Encountered (and Solved)

### 1. Browser Blocking Fetch

Some browsers disallow API fetch when opening HTML files directly.

**Fix:** run a small server (`python -m http.server`).



### 2. Icon Loading Failures

If a weather code had no matching icon, the image broke.

**Fix:**

```html
onerror="this.src='images/clear.png'"
```



### 3. Inconsistent API Fields

Some entries only had `temp2m` without separate `min/max` fields.

**Fix:** Added fallback values.



### 4. CSVs with Encoding Issues

Some CSVs used Windows-1252 encoding.

**My workaround:**
Open in a spreadsheet → export as UTF-8.



## Performance Notes

* Parsing even large CSVs (1,000+ cities) is nearly instant
* Most of the delay (~300ms) comes from the API response
* Rendering DOM cards is lightweight

Overall, the project is extremely efficient.

---

## Improvements I’d Consider Adding

1. Dark mode
2. Map-based city selection using Leaflet
3. Support for multiple weather APIs
4. Local caching of API responses
5. Replacing PNG icons with SVG illustrations
6. A11y improvements for screen-readers

---

## About the Author

**Vidhya Dhari**
GitHub: [https://github.com/yvidhya](https://github.com/yvidhya)
Email: [vidhyay458@gmail.com](mailto:vidhyay458@gmail.com)
