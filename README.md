# Invisible Fence

**Urban Animal Intelligence for AnimalHack 2026**

Invisible Fence is a web-based prototype that reveals hidden urban danger zones for stray animals by combining sightings, heat exposure, traffic risk, water access, and movement patterns into a dynamic risk map.

## Core experience

- Cinematic editorial landing page inspired by environmental storytelling rather than a conventional SaaS dashboard
- Interactive 2D animal-risk map
- Optional **3D Spatial Intelligence View** powered by CesiumJS
- H3 hexagonal risk cells over Baghdad
- Time-of-day risk simulation that updates both 2D and 3D views
- Toggleable risk, animal, water, and road layers
- Zone intelligence card with explainable risk factors
- Recommended intervention logic
- Citizen animal-sighting report flow
- Responsive desktop and mobile layout

## Spatial intelligence direction

The 3D mode is inspired by the open-source architecture and visual language of Bilawal Sidhu's **God's Eye View** project, while being independently implemented for animal welfare. The goal is not surveillance: it is to turn public environmental signals into understandable animal-risk zones and actionable interventions.

The active browser prototype currently uses:

- **CesiumJS** — 3D globe / spatial scene
- **H3** — hexagonal spatial indexing and risk cells
- **Turf.js** — geospatial analysis foundation
- **OpenStreetMap** — basemap imagery in 3D mode

The repository also includes a broader installable geospatial stack for the next implementation phase:

- **deck.gl** — high-performance geospatial visualization and heatmaps
- **MapLibre GL JS** — vector 2D maps and custom styles
- **Supercluster** — large-scale sighting clustering
- **GeoTIFF** — raster temperature/environment layers
- **d3-delaunay** — Voronoi/Delaunay spatial analysis
- **PBF** — compact vector-tile data parsing

## Prototype logic

The current hackathon build uses a transparent scoring model to simulate changing risk throughout the day. This keeps the prototype honest and explainable while creating a path toward later ML-based risk prediction once real city and animal-welfare datasets are available.

## Run locally

The core prototype can still be served as static files. For the full development stack:

```bash
npm install
npm run dev
```

## Next implementation steps

1. Make MapLibre the production 2D map while retaining Cesium as the 3D intelligence mode.
2. Add real OpenStreetMap road and urban context.
3. Connect live weather and surface-temperature data.
4. Persist citizen sightings in a backend.
5. Use Turf + H3 to derive distance, exposure, density, and intervention coverage features.
6. Add deck.gl HeatmapLayer / H3HexagonLayer for larger datasets.
7. Add clustering and progressive loading for city-scale sightings.
8. Validate the risk model against animal-welfare data before making real-world operational claims.

## Open-source inspiration and attribution

- **God's Eye View** — https://github.com/bilawalsidhu/gods-eye-view — MIT. Architectural / spatial-intelligence inspiration only; Invisible Fence's animal-risk implementation is original.
- **CesiumJS** — https://github.com/CesiumGS/cesium
- **Turf** — https://github.com/Turfjs/turf
- **H3** — https://github.com/uber/h3-js
- **deck.gl** — https://github.com/visgl/deck.gl
- **MapLibre GL JS** — https://github.com/maplibre/maplibre-gl-js
- **Supercluster** — https://github.com/mapbox/supercluster

Always preserve upstream licenses and attribution when reusing third-party code or datasets.

## Hackathon concept

**See the dangers animals can't.**

Instead of treating stray-animal reports as isolated pins, Invisible Fence converts them into a living model of environmental risk and suggests where intervention can have the greatest welfare impact.
