# Invisible Fence

**Urban Animal Intelligence for AnimalHack 2026**

Invisible Fence is a web-based prototype that reveals hidden urban danger zones for stray animals by combining sightings, heat exposure, traffic risk, water access, and movement patterns into a dynamic risk map.

## Core experience

- Cinematic editorial landing page inspired by environmental storytelling rather than a conventional SaaS dashboard
- Interactive animal-risk map
- Time-of-day risk simulation
- Toggleable risk, animal, water, and road layers
- Zone intelligence card with explainable risk factors
- Recommended intervention logic
- Citizen animal-sighting report flow
- Responsive desktop and mobile layout

## Prototype logic

The current hackathon build uses a transparent scoring model to simulate changing risk throughout the day. This keeps the prototype honest and explainable while creating a path toward later ML-based risk prediction once real city and animal-welfare datasets are available.

## Run locally

Open `index.html` in a browser, or serve the repository with any static file server.

## Next implementation steps

1. Replace the illustrative map with MapLibre or Leaflet.
2. Add OpenStreetMap road and urban context.
3. Connect weather/temperature data.
4. Persist citizen sightings.
5. Build a real risk-scoring API and validation dataset.
6. Add geospatial intervention recommendations.

## Hackathon concept

**See the dangers animals can't.**

Instead of treating stray-animal reports as isolated pins, Invisible Fence converts them into a living model of environmental risk and suggests where intervention can have the greatest welfare impact.
