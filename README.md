# GeoGrub

GeoGrub is a lightweight MVP for planning short-term pop-up shop and food truck locations.

The app helps vendors compare possible stops, score operating fit, build a short route, and export a decision report. It is designed to be useful without API keys: a vendor can enter candidate spots from their own research, score the signals they care about, and leave with a practical operating plan.

## MVP scope

- Create a named pop-up or food truck plan.
- Set market, vendor type, selling window, and weather tolerance.
- Add custom candidate locations.
- Place candidates on a real Leaflet/OpenStreetMap map.
- Click map pins or ranked cards to focus a location.
- Zoom with map controls or mouse wheel.
- Pan the map by dragging.
- Score each location across event demand, access, weather fit, competition pressure, and permit readiness.
- Re-rank stops using a transparent scoring model.
- Remove weak candidates.
- Save the plan in local browser storage.
- Generate a route view with suggested selling times.
- Export a Markdown decision report.

## Why this is different from a storefront finder

GeoGrub focuses on short-term vending decisions rather than permanent retail site selection. Its output is operational: where to test, when to arrive, what risks to check, and which location deserves first priority.

## Scoring model

GeoGrub combines:

- Event demand
- Access
- Weather fit
- Competition pressure
- Permit readiness

Competition is inverted, so higher competition reduces the final fit score. Vendor type, selling window, and weather tolerance adjust the weights.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 4177
```

Then visit:

```text
http://127.0.0.1:4177/
```

The map uses Leaflet and OpenStreetMap tiles from public CDNs, so it needs an internet connection when opened.

## Future production integrations

- Google Places, Google Maps, or Mapbox for place discovery and production-grade maps
- Eventbrite, PredictHQ, Ticketmaster, or city calendars for event demand
- Weather API for forecast-aware scoring
- City permit pages or manually curated permit datasets
- CSV import for historical sales and vendor notes
- Backend accounts for saved multi-market plans
