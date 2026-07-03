const storageKey = "geogrub.mvp.plan";

const marketCenters = {
  "austin": [30.2672, -97.7431],
  "austin, tx": [30.2672, -97.7431],
  "seattle": [47.6062, -122.3321],
  "seattle, wa": [47.6062, -122.3321],
  "atlanta": [33.749, -84.388],
  "atlanta, ga": [33.749, -84.388],
  "new york": [40.7128, -74.006],
  "new york city": [40.7128, -74.006],
  "los angeles": [34.0522, -118.2437],
  "la": [34.0522, -118.2437],
  "seoul": [37.5665, 126.978],
  "seoul, korea": [37.5665, 126.978]
};

const seedPlan = {
  name: "Weekend taco route",
  market: "Austin, TX",
  vendor: "tacos",
  daypart: "lunch",
  weatherTolerance: 6,
  locations: [
    {
      id: crypto.randomUUID(),
      name: "Mueller market lawn",
      cue: "Family weekend demand, nearby parks, low direct competition before noon.",
      event: 86,
      access: 82,
      weather: 81,
      competition: 72,
      permit: 74,
      lat: 30.2983,
      lng: -97.7045
    },
    {
      id: crypto.randomUUID(),
      name: "Rainey Street edge",
      cue: "Live music spillover, hotel foot traffic, strong late-evening appetite.",
      event: 92,
      access: 78,
      weather: 72,
      competition: 64,
      permit: 54,
      lat: 30.2587,
      lng: -97.7381
    },
    {
      id: crypto.randomUUID(),
      name: "UT west campus",
      cue: "Dense student audience, walkable blocks, strong study-break behavior.",
      event: 74,
      access: 88,
      weather: 69,
      competition: 58,
      permit: 62,
      lat: 30.2849,
      lng: -97.7419
    }
  ]
};

const vendorModifiers = {
  tacos: { label: "Street tacos", event: 1.05, access: 1, weather: 0.95, competition: 0.92, permit: 1 },
  coffee: { label: "Mobile coffee", event: 0.9, access: 1.08, weather: 1.03, competition: 0.98, permit: 1 },
  dessert: { label: "Dessert cart", event: 1.08, access: 0.96, weather: 1, competition: 0.95, permit: 1 },
  retail: { label: "Maker goods", event: 1, access: 0.92, weather: 0.94, competition: 1.08, permit: 1.04 }
};

const daypartModifiers = {
  lunch: { label: "Lunch rush", event: 0.92, access: 1.08, weather: 1, competition: 1, permit: 1, times: ["11:00a", "12:15p", "1:30p"] },
  evening: { label: "Evening event", event: 1.1, access: 0.98, weather: 0.96, competition: 0.98, permit: 1, times: ["5:00p", "6:45p", "8:15p"] },
  weekend: { label: "Weekend market", event: 1.06, access: 1, weather: 1.02, competition: 1, permit: 1.02, times: ["9:30a", "12:00p", "3:00p"] }
};

let plan = normalizePlan(loadPlan());
let rebalanceOffset = 0;
let selectedLocationId = null;
let draftPoint = null;
let map = null;
let markerLayer = null;
let draftMarker = null;
let locationMarkers = new Map();

const els = {
  navPills: document.querySelectorAll(".nav-pill"),
  views: document.querySelectorAll(".view"),
  planName: document.querySelector("#planName"),
  marketName: document.querySelector("#marketName"),
  vendor: document.querySelector("#vendor"),
  daypart: document.querySelector("#daypart"),
  weatherTolerance: document.querySelector("#weatherTolerance"),
  weatherValue: document.querySelector("#weatherValue"),
  savePlanBtn: document.querySelector("#savePlanBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  rebalanceBtn: document.querySelector("#rebalanceBtn"),
  mapTitle: document.querySelector("#mapTitle"),
  avgScore: document.querySelector("#avgScore"),
  mapCanvas: document.querySelector("#mapCanvas"),
  mapStatus: document.querySelector("#mapStatus"),
  zoomInBtn: document.querySelector("#zoomInBtn"),
  zoomOutBtn: document.querySelector("#zoomOutBtn"),
  centerMapBtn: document.querySelector("#centerMapBtn"),
  locations: document.querySelector("#locations"),
  candidateCount: document.querySelector("#candidateCount"),
  candidateForm: document.querySelector("#candidateForm"),
  candidateName: document.querySelector("#candidateName"),
  candidateCue: document.querySelector("#candidateCue"),
  coordinateReadout: document.querySelector("#coordinateReadout"),
  clearDraftBtn: document.querySelector("#clearDraftBtn"),
  eventScore: document.querySelector("#eventScore"),
  accessScore: document.querySelector("#accessScore"),
  weatherScore: document.querySelector("#weatherScore"),
  competitionScore: document.querySelector("#competitionScore"),
  permitScore: document.querySelector("#permitScore"),
  routeTitle: document.querySelector("#routeTitle"),
  schedule: document.querySelector("#schedule"),
  copyRouteBtn: document.querySelector("#copyRouteBtn"),
  reportTitle: document.querySelector("#reportTitle"),
  reportOutput: document.querySelector("#reportOutput"),
  downloadReportBtn: document.querySelector("#downloadReportBtn")
};

function loadPlan() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved?.locations?.length ? saved : structuredClone(seedPlan);
  } catch {
    return structuredClone(seedPlan);
  }
}

function normalizePlan(rawPlan) {
  const fallbackCenter = getMarketCenter(rawPlan.market || seedPlan.market);
  return {
    ...rawPlan,
    locations: rawPlan.locations.map((location, index) => {
      if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) return location;
      const offset = (index + 1) * 0.012;
      return {
        ...location,
        lat: fallbackCenter[0] + offset,
        lng: fallbackCenter[1] - offset
      };
    })
  };
}

function savePlan() {
  localStorage.setItem(storageKey, JSON.stringify(plan));
}

function getMarketCenter(market) {
  const key = String(market || "").trim().toLowerCase();
  return marketCenters[key] || marketCenters.austin;
}

function syncPlanFromInputs() {
  const previousMarket = plan.market;
  plan.name = els.planName.value.trim() || "Untitled GeoGrub plan";
  plan.market = els.marketName.value.trim() || "Custom market";
  plan.vendor = els.vendor.value;
  plan.daypart = els.daypart.value;
  plan.weatherTolerance = Number(els.weatherTolerance.value);

  if (map && previousMarket !== plan.market && marketCenters[plan.market.toLowerCase()]) {
    map.setView(getMarketCenter(plan.market), 13);
  }
}

function hydrateInputs() {
  els.planName.value = plan.name;
  els.marketName.value = plan.market;
  els.vendor.value = plan.vendor;
  els.daypart.value = plan.daypart;
  els.weatherTolerance.value = plan.weatherTolerance;
  els.weatherValue.textContent = plan.weatherTolerance;
}

function clampScore(value) {
  return Math.max(0, Math.min(99, Math.round(value)));
}

function formatLatLng(point) {
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

function scoreLocation(location) {
  const vendor = vendorModifiers[plan.vendor];
  const daypart = daypartModifiers[plan.daypart];
  const weatherWeight = 0.1 + plan.weatherTolerance / 50;
  const raw =
    location.event * 0.31 * vendor.event * daypart.event +
    location.access * 0.2 * vendor.access * daypart.access +
    location.weather * weatherWeight * vendor.weather * daypart.weather +
    (100 - location.competition) * 0.15 * vendor.competition * daypart.competition +
    location.permit * 0.16 * vendor.permit * daypart.permit +
    rebalanceOffset;

  return clampScore(raw);
}

function scoreDrivers(location) {
  const risks = [];
  const strengths = [];
  if (location.event >= 80) strengths.push("strong event demand");
  if (location.access >= 80) strengths.push("easy access");
  if (location.weather >= 75) strengths.push("weather-resilient setup");
  if (location.permit < 60) risks.push("permit follow-up needed");
  if (location.competition > 72) risks.push("high competition");
  if (location.weather < 62) risks.push("weather exposure");
  return { strengths, risks };
}

function rankedLocations() {
  return plan.locations
    .map((location) => ({ ...location, score: scoreLocation(location), drivers: scoreDrivers(location) }))
    .sort((a, b) => b.score - a.score);
}

function riskLabel(location) {
  if (location.permit < 60) return "permit check";
  if (location.competition > 72) return "crowded field";
  if (location.weather < 62) return "weather watch";
  return "clean fit";
}

function recommendation(location, index) {
  const times = daypartModifiers[plan.daypart].times;
  const time = times[index] || times[times.length - 1];
  const lead = location.score >= 78 ? "Prioritize" : location.score >= 68 ? "Test" : "Back up";
  return {
    time,
    text: `${lead} ${location.name}. ${location.cue} Watch ${riskLabel(location)} before committing inventory.`
  };
}

function initMap() {
  if (!window.L) {
    els.mapCanvas.innerHTML = '<div class="map-fallback">Map tiles could not load. Check your network connection and reload.</div>';
    els.mapStatus.textContent = "Map provider unavailable.";
    return;
  }

  map = L.map("mapCanvas", {
    zoomControl: false,
    scrollWheelZoom: true
  }).setView(getMarketCenter(plan.market), 13);

  L.control.zoom({ position: "bottomleft" }).addTo(map);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  markerLayer = L.layerGroup().addTo(map);
  map.on("click", (event) => setDraftPoint(event.latlng));
}

function fitMapToLocations() {
  if (!map || !plan.locations.length) return;
  const bounds = L.latLngBounds(plan.locations.map((location) => [location.lat, location.lng]));
  map.fitBounds(bounds.pad(0.22), { maxZoom: 14 });
}

function markerHtml(location, index) {
  return `
    <button class="real-map-marker ${location.id === selectedLocationId ? "selected" : ""}" type="button">
      <span>${index + 1}</span>
      <strong>${location.score}</strong>
    </button>
  `;
}

function renderMap(ranked) {
  if (!map || !markerLayer) return;
  markerLayer.clearLayers();
  locationMarkers = new Map();

  ranked.forEach((location, index) => {
    const marker = L.marker([location.lat, location.lng], {
      icon: L.divIcon({
        className: "geogrub-marker-wrap",
        html: markerHtml(location, index),
        iconSize: [52, 52],
        iconAnchor: [26, 46],
        popupAnchor: [0, -44]
      })
    });

    marker.bindPopup(`
      <strong>${escapeHtml(location.name)}</strong>
      <p>${escapeHtml(location.cue)}</p>
      <small>Fit ${location.score}/99 · ${formatLatLng(location)}</small>
    `);
    marker.on("click", () => focusLocation(location.id));
    marker.addTo(markerLayer);
    locationMarkers.set(location.id, marker);
  });

  renderDraftMarker();
}

function setDraftPoint(latlng) {
  draftPoint = { lat: latlng.lat, lng: latlng.lng };
  els.coordinateReadout.textContent = `Map point: ${formatLatLng(draftPoint)}`;
  els.mapStatus.textContent = `Next candidate will be placed at ${formatLatLng(draftPoint)}.`;
  renderDraftMarker();
}

function renderDraftMarker() {
  if (!map) return;
  if (draftMarker) {
    draftMarker.remove();
    draftMarker = null;
  }
  if (!draftPoint) {
    els.coordinateReadout.textContent = "Map point: auto";
    return;
  }
  draftMarker = L.marker([draftPoint.lat, draftPoint.lng], {
    icon: L.divIcon({
      className: "draft-marker-wrap",
      html: '<span class="draft-real-marker"></span>',
      iconSize: [30, 42],
      iconAnchor: [15, 36]
    })
  }).addTo(map);
}

function renderLocations(ranked) {
  els.locations.innerHTML = ranked
    .map(
      (location, index) => `
        <article class="location-card ${location.id === selectedLocationId ? "selected" : ""}">
          <span class="rank">${index + 1}</span>
          <div>
            <h3>${escapeHtml(location.name)}</h3>
            <p>${escapeHtml(location.cue)}</p>
            <div class="driver-row">
              <span>Event ${location.event}</span>
              <span>Access ${location.access}</span>
              <span>Weather ${location.weather}</span>
              <span>Comp ${location.competition}</span>
              <span>Permit ${location.permit}</span>
              <span>${formatLatLng(location)}</span>
            </div>
          </div>
          <div class="metric-stack">
            <span class="fit-score">${location.score}</span>
            <span class="risk">${riskLabel(location)}</span>
            <button type="button" data-focus="${location.id}">Map</button>
            <button type="button" data-remove="${location.id}">Remove</button>
          </div>
        </article>
      `
    )
    .join("");
}

function renderRoute(ranked) {
  els.routeTitle.textContent = `${plan.name} schedule`;
  els.schedule.innerHTML = ranked
    .map((location, index) => {
      const rec = recommendation(location, index);
      return `
        <li>
          <span class="time">${rec.time}</span>
          <span class="stop">
            <strong>${escapeHtml(location.name)}</strong>
            <span>${escapeHtml(rec.text)}</span>
          </span>
        </li>
      `;
    })
    .join("");
}

function buildReport(ranked) {
  const best = ranked[0];
  const avg = ranked.length
    ? Math.round(ranked.reduce((total, location) => total + location.score, 0) / ranked.length)
    : 0;

  return `# GeoGrub Plan: ${plan.name}

Market: ${plan.market}
Vendor: ${vendorModifiers[plan.vendor].label}
Selling window: ${daypartModifiers[plan.daypart].label}
Average fit score: ${avg}

## Recommendation

${best ? `Start with ${best.name} (${best.score}/99). ${best.cue}` : "Add at least one candidate location to generate a recommendation."}

## Ranked Locations

${ranked
  .map((location, index) => {
    const rec = recommendation(location, index);
    const strengths = location.drivers.strengths.join(", ") || "balanced fundamentals";
    const risks = location.drivers.risks.join(", ") || "no major red flags";
    return `${index + 1}. ${location.name} - ${location.score}/99
   - Coordinates: ${formatLatLng(location)}
   - Best time: ${rec.time}
   - Strengths: ${strengths}
   - Risks: ${risks}
   - Action: ${rec.text}`;
  })
  .join("\n\n")}

## Scoring Model

GeoGrub weights event demand, access, weather fit, competition pressure, and permit readiness. Competition is inverted, so lower competition improves the score. Vendor type, selling window, and weather tolerance adjust the final fit score.
`;
}

function renderReport(ranked) {
  els.reportTitle.textContent = `${plan.name} report`;
  els.reportOutput.value = buildReport(ranked);
}

function render() {
  syncPlanFromInputs();
  els.weatherValue.textContent = plan.weatherTolerance;
  const ranked = rankedLocations();
  const avg = ranked.length
    ? Math.round(ranked.reduce((total, location) => total + location.score, 0) / ranked.length)
    : 0;

  els.mapTitle.textContent = `${plan.market} pop-up plan`;
  els.avgScore.textContent = avg;
  els.candidateCount.textContent = `${plan.locations.length} stop${plan.locations.length === 1 ? "" : "s"}`;
  renderMap(ranked);
  renderLocations(ranked);
  renderRoute(ranked);
  renderReport(ranked);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function addCandidate(event) {
  event.preventDefault();
  const marketCenter = getMarketCenter(plan.market);
  const fallbackCenter = map ? map.getCenter() : { lat: marketCenter[0], lng: marketCenter[1] };
  const point = draftPoint || { lat: fallbackCenter.lat, lng: fallbackCenter.lng };
  plan.locations.push({
    id: crypto.randomUUID(),
    name: els.candidateName.value.trim(),
    cue: els.candidateCue.value.trim(),
    event: Number(els.eventScore.value),
    access: Number(els.accessScore.value),
    weather: Number(els.weatherScore.value),
    competition: Number(els.competitionScore.value),
    permit: Number(els.permitScore.value),
    lat: point.lat,
    lng: point.lng
  });
  draftPoint = null;
  els.candidateForm.reset();
  savePlan();
  render();
}

function focusLocation(locationId) {
  const location = plan.locations.find((item) => item.id === locationId);
  if (!location || !map) return;
  selectedLocationId = locationId;
  map.setView([location.lat, location.lng], Math.max(map.getZoom(), 15));
  els.mapStatus.textContent = `Focused ${location.name} at ${formatLatLng(location)}.`;
  render();
  locationMarkers.get(locationId)?.openPopup();
}

function centerMap() {
  selectedLocationId = null;
  if (plan.locations.length) {
    fitMapToLocations();
  } else if (map) {
    map.setView(getMarketCenter(plan.market), 13);
  }
  els.mapStatus.textContent = "Map centered. Click a real location to place the next candidate.";
  render();
}

function switchView(view) {
  els.navPills.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  els.views.forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === view));
  if (view === "plan" && map) {
    setTimeout(() => map.invalidateSize(), 0);
  }
}

function downloadReport() {
  const blob = new Blob([els.reportOutput.value], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${plan.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "geogrub-plan"}.md`;
  link.click();
  URL.revokeObjectURL(url);
}

hydrateInputs();
initMap();
render();
fitMapToLocations();

[els.planName, els.vendor, els.daypart, els.weatherTolerance].forEach((field) => {
  field.addEventListener("input", render);
  field.addEventListener("change", render);
});

els.marketName.addEventListener("change", () => {
  render();
  if (map) map.setView(getMarketCenter(plan.market), 13);
});
els.marketName.addEventListener("input", render);

els.candidateForm.addEventListener("submit", addCandidate);
els.savePlanBtn.addEventListener("click", () => {
  syncPlanFromInputs();
  savePlan();
  els.savePlanBtn.textContent = "Saved";
  setTimeout(() => {
    els.savePlanBtn.textContent = "Save plan";
  }, 1200);
});

els.resetBtn.addEventListener("click", () => {
  plan = normalizePlan(structuredClone(seedPlan));
  rebalanceOffset = 0;
  selectedLocationId = null;
  draftPoint = null;
  localStorage.removeItem(storageKey);
  hydrateInputs();
  render();
  fitMapToLocations();
});

els.rebalanceBtn.addEventListener("click", () => {
  rebalanceOffset = rebalanceOffset === 0 ? -4 : rebalanceOffset === -4 ? 5 : 0;
  render();
});

els.locations.addEventListener("click", (event) => {
  const focusButton = event.target.closest("[data-focus]");
  if (focusButton) {
    focusLocation(focusButton.dataset.focus);
    return;
  }
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  plan.locations = plan.locations.filter((location) => location.id !== button.dataset.remove);
  if (selectedLocationId === button.dataset.remove) selectedLocationId = null;
  savePlan();
  render();
});

els.zoomInBtn.addEventListener("click", () => map?.zoomIn());
els.zoomOutBtn.addEventListener("click", () => map?.zoomOut());
els.centerMapBtn.addEventListener("click", centerMap);
els.clearDraftBtn.addEventListener("click", () => {
  draftPoint = null;
  els.mapStatus.textContent = "Draft point cleared. Click the real map to place the next candidate.";
  renderDraftMarker();
});

els.navPills.forEach((button) => {
  button.addEventListener("click", () => switchView(button.dataset.view));
});

els.copyRouteBtn.addEventListener("click", async () => {
  const route = rankedLocations()
    .map((location, index) => {
      const rec = recommendation(location, index);
      return `${rec.time} - ${location.name}: ${rec.text}`;
    })
    .join("\n");
  await navigator.clipboard.writeText(route);
  els.copyRouteBtn.textContent = "Copied";
  setTimeout(() => {
    els.copyRouteBtn.textContent = "Copy route";
  }, 1200);
});

els.downloadReportBtn.addEventListener("click", downloadReport);
