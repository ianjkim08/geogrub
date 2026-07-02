const cityData = {
  austin: {
    label: "Austin",
    date: "Fri - Sun",
    locations: [
      {
        name: "Rainey Street edge",
        cue: "Live music spillover, hotel foot traffic, strong late-evening appetite.",
        event: 92,
        access: 78,
        weather: 72,
        competition: 64,
        permit: 54,
        x: 34,
        y: 34,
        time: "7:30p",
        action: "Serve a compact menu near bar exits after the first event turnover."
      },
      {
        name: "Mueller market lawn",
        cue: "Family weekend demand, nearby parks, low direct competition before noon.",
        event: 86,
        access: 82,
        weather: 81,
        competition: 72,
        permit: 74,
        x: 72,
        y: 42,
        time: "10:00a",
        action: "Anchor breakfast items and fast cold drinks for market browsing."
      },
      {
        name: "UT west campus",
        cue: "Dense student audience, walkable blocks, strong study-break behavior.",
        event: 74,
        access: 88,
        weather: 69,
        competition: 58,
        permit: 62,
        x: 51,
        y: 70,
        time: "12:15p",
        action: "Prioritize bundles and digital preorders during class-change waves."
      }
    ]
  },
  seattle: {
    label: "Seattle",
    date: "Thu - Sun",
    locations: [
      {
        name: "Capitol Hill station",
        cue: "Transit volume, nightlife, and dense apartment blocks lift evening demand.",
        event: 84,
        access: 94,
        weather: 58,
        competition: 61,
        permit: 66,
        x: 31,
        y: 39,
        time: "6:45p",
        action: "Use a rain-ready awning setup and hot add-ons for commuters."
      },
      {
        name: "Ballard brewery row",
        cue: "Weekend brewery traffic with limited quick dessert and snack options.",
        event: 88,
        access: 72,
        weather: 61,
        competition: 76,
        permit: 70,
        x: 69,
        y: 33,
        time: "4:30p",
        action: "Pair shareable portions with brewery peak windows."
      },
      {
        name: "South Lake Union plaza",
        cue: "Office lunch demand returns strongly on midweek event days.",
        event: 78,
        access: 84,
        weather: 62,
        competition: 65,
        permit: 58,
        x: 54,
        y: 72,
        time: "11:30a",
        action: "Keep throughput high and feature lunch combos under ten minutes."
      }
    ]
  },
  atlanta: {
    label: "Atlanta",
    date: "Fri - Sun",
    locations: [
      {
        name: "BeltLine eastside",
        cue: "Walkers, cyclists, patios, and park traffic produce long dwell windows.",
        event: 91,
        access: 86,
        weather: 78,
        competition: 68,
        permit: 60,
        x: 36,
        y: 35,
        time: "5:00p",
        action: "Target portable items and bright signage visible from the path."
      },
      {
        name: "West Midtown yards",
        cue: "Design retail, breweries, and dinner traffic create strong discovery demand.",
        event: 82,
        access: 74,
        weather: 76,
        competition: 70,
        permit: 72,
        x: 68,
        y: 48,
        time: "6:15p",
        action: "Use premium positioning and limited-time menu drops."
      },
      {
        name: "Grant Park gate",
        cue: "Family outings and zoo traffic create steady daytime snack demand.",
        event: 79,
        access: 80,
        weather: 82,
        competition: 73,
        permit: 67,
        x: 49,
        y: 72,
        time: "1:00p",
        action: "Lead with kid-friendly sizes and shade-aware queue placement."
      }
    ]
  }
};

const vendorModifiers = {
  tacos: { event: 1.05, access: 1, weather: 0.95, competition: 0.92, permit: 1 },
  coffee: { event: 0.9, access: 1.08, weather: 1.03, competition: 0.98, permit: 1 },
  dessert: { event: 1.08, access: 0.96, weather: 1, competition: 0.95, permit: 1 },
  retail: { event: 1, access: 0.92, weather: 0.94, competition: 1.08, permit: 1.04 }
};

const daypartModifiers = {
  lunch: { event: 0.92, access: 1.08, weather: 1, competition: 1, permit: 1 },
  evening: { event: 1.1, access: 0.98, weather: 0.96, competition: 0.98, permit: 1 },
  weekend: { event: 1.06, access: 1, weather: 1.02, competition: 1, permit: 1.02 }
};

const form = document.querySelector("#plannerForm");
const citySelect = document.querySelector("#city");
const vendorSelect = document.querySelector("#vendor");
const daypartSelect = document.querySelector("#daypart");
const weatherSlider = document.querySelector("#weatherTolerance");
const weatherValue = document.querySelector("#weatherValue");
const mapCanvas = document.querySelector("#mapCanvas");
const locationsEl = document.querySelector("#locations");
const scheduleEl = document.querySelector("#schedule");
const mapTitle = document.querySelector("#mapTitle");
const avgScore = document.querySelector("#avgScore");
const scheduleDate = document.querySelector("#scheduleDate");
const shuffleBtn = document.querySelector("#shuffleBtn");

let rebalanceOffset = 0;

function clampScore(value) {
  return Math.max(0, Math.min(99, Math.round(value)));
}

function scoreLocation(location) {
  const vendor = vendorModifiers[vendorSelect.value];
  const daypart = daypartModifiers[daypartSelect.value];
  const weatherTolerance = Number(weatherSlider.value);
  const weatherWeight = 0.1 + weatherTolerance / 50;
  const raw =
    location.event * 0.31 * vendor.event * daypart.event +
    location.access * 0.2 * vendor.access * daypart.access +
    location.weather * weatherWeight * vendor.weather * daypart.weather +
    (100 - location.competition) * 0.15 * vendor.competition * daypart.competition +
    location.permit * 0.16 * vendor.permit * daypart.permit +
    rebalanceOffset;

  return clampScore(raw);
}

function riskLabel(location) {
  if (location.permit < 60) return "permit check";
  if (location.competition > 72) return "crowded field";
  if (location.weather < 62) return "weather watch";
  return "clean fit";
}

function render() {
  const city = cityData[citySelect.value];
  const ranked = city.locations
    .map((location) => ({ ...location, score: scoreLocation(location) }))
    .sort((a, b) => b.score - a.score);

  mapTitle.textContent = `${city.label} pop-up opportunities`;
  scheduleDate.textContent = city.date;
  avgScore.textContent = Math.round(
    ranked.reduce((total, location) => total + location.score, 0) / ranked.length
  );

  mapCanvas.querySelectorAll(".map-pin").forEach((pin) => pin.remove());
  ranked.forEach((location, index) => {
    const pin = document.createElement("article");
    pin.className = "map-pin";
    pin.style.left = `${location.x}%`;
    pin.style.top = `${location.y}%`;
    pin.innerHTML = `
      <strong>${index + 1}. ${location.name}</strong>
      <small>${location.cue}</small>
      <span class="pin-score">${location.score}</span>
    `;
    mapCanvas.appendChild(pin);
  });

  locationsEl.innerHTML = ranked
    .map(
      (location, index) => `
        <article class="location-card">
          <span class="rank">${index + 1}</span>
          <div>
            <h3>${location.name}</h3>
            <p>${location.cue}</p>
          </div>
          <div class="metric-stack">
            <span class="fit-score">${location.score}</span>
            <span class="risk">${riskLabel(location)}</span>
          </div>
        </article>
      `
    )
    .join("");

  scheduleEl.innerHTML = ranked
    .map(
      (location) => `
        <li>
          <span class="time">${location.time}</span>
          <span class="stop">
            <strong>${location.name}</strong>
            <span>${location.action}</span>
          </span>
        </li>
      `
    )
    .join("");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  rebalanceOffset = 0;
  render();
});

weatherSlider.addEventListener("input", () => {
  weatherValue.textContent = weatherSlider.value;
  render();
});

[citySelect, vendorSelect, daypartSelect].forEach((field) => {
  field.addEventListener("change", render);
});

shuffleBtn.addEventListener("click", () => {
  rebalanceOffset = rebalanceOffset === 0 ? -4 : rebalanceOffset === -4 ? 5 : 0;
  render();
});

render();
