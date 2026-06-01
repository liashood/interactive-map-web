# Interactive Map Project Progress

Last updated: 2026-06-01

## Current Experience

The visitor-facing app is now a presentation-ready DAMAC Lagoons showcase:

- The supplied presentation image is rendered on a tilted Three.js ground plane.
- All 11 traced communities appear as lightweight 3D beacons and boundary lines.
- Selecting a map beacon or sidebar item triggers a cinematic camera flight.
- The glass interface supports community search and townhouse or villa filters.
- Summary cards use the real inventory export: 8,902 catalogued residences in total.
- Shareable URLs support `community`, `type`, and `q` parameters.
- If WebGL cannot be created, the app keeps a functional static masterplan and sidebar.

## Data Sources

- `assets/damac-lagoons-masterplan.png` is the supplied visitor-facing image.
- `assets/master-plan.svg` remains the original detailed vector reference.
- `data/clusters.json` stores the 11 manually traced community boundaries.
- `data/cluster-inventory.json` stores the community inventory summaries.
- `data/units.json` remains reserved for future plot-level polygons.

The app transforms the original SVG trace coordinates into the larger presentation
image coordinate space before positioning boundaries and beacons in the 3D world.

## Dependencies

Pinned local copies are stored in `assets/vendor/`:

- Three.js r128
- OrbitControls for Three.js r128

No API key or runtime CDN request is required.

## Verification

- `node --check app.js`
- JSON parsing for clusters, inventory, and reserved unit data
- Desktop browser render with all 11 sidebar communities
- Deep-link smoke test: `?community=venice&type=Villa&q=ve`
- WebGL software-rendered screenshot for the textured 3D plane and beacons
- Static fallback screenshot with WebGL disabled

## Plot-Level Next Step

The original source assets are not semantic plot plates. To add individual unit
selection later, obtain a clean SVG, DXF, DWG, or selectable PDF with unit IDs and run:

```bash
node tools/import-svg-units.mjs path/to/unit-plate.svg data/units.json
```
