# GeoGrub

GeoGrub is an AI location planner for short-term pop-up shops, food trucks, carts, and market vendors.

Instead of recommending permanent storefronts, GeoGrub helps vendors decide where and when to operate for a specific selling window. It ranks temporary vending spots by event demand, nearby audience fit, weather risk, access, competition, and permit friction, then turns the ranked list into a practical route or weekend schedule.

## Why it is meaningfully different

- It focuses on temporary vending decisions, not permanent retail site selection.
- It recommends daypart-specific routes and pop-up schedules, not storefront locations.
- It uses event timing, weather, access, and permit friction as first-class scoring factors.
- It serves mobile vendors, makers, and food trucks rather than a single restaurant category.
- Its output is operational: where to park, when to show up, and what setup risk to watch.

## Agent model

| Agent | Role |
| --- | --- |
| Event Scout | Finds concerts, games, markets, campus events, and local foot-traffic spikes. |
| Demand Analyst | Scores nearby audiences, complementary businesses, transit, and crowd density. |
| Competition Mapper | Flags similar vendors or restaurants competing for the same demand. |
| Weather & Timing Analyst | Adjusts recommendations based on daypart, forecast, and product sensitivity. |
| Permit/Risk Advisor | Identifies locations with operational restrictions or higher setup friction. |
| Route Planner | Turns ranked opportunities into a realistic short-term operating schedule. |

## Prototype

Open `index.html` in a browser. The prototype runs locally with sample data and does not require API keys.

Future production data sources could include city event calendars, Google Places, weather APIs, transit data, venue calendars, city permit pages, and historical sales imported by the vendor.
