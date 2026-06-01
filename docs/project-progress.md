# Interactive Map Project Progress

Last updated: 2026-06-01

## Goal

Build an interactive DAMAC Lagoons-style community map where available units can be viewed by location, cluster, status, and details.

The intended final workflow is:

- Click a cluster to see community-level information.
- Click a mapped unit to see unit number, cluster, sale/rent status, bedrooms, and size.
- Store unit and cluster geometry as JSON overlays on top of the master plan SVG.

## Current App Structure

- `index.html` contains the sidebar, editor controls, map stage, SVG overlay, and tooltip container.
- `styles.css` contains the dark UI, map layout, colored cluster overlays, unit status styling, and responsive behavior.
- `app.js` handles zoom/pan, cluster loading, cluster selection, unit loading, unit selection, local unit editing, export, and clear actions.
- `assets/master-plan.svg` is the visual base map.
- `data/clusters.json` stores the saved clickable cluster boundaries.
- `data/units.json` is currently empty and reserved for future unit polygons.
- `tools/import-svg-units.mjs` can convert a clean SVG unit plate into `data/units.json`.
- `docs/floor-plate-notes.md` records notes about finding or importing a proper unit/plot source.

## What We Changed

1. Checked the initial static app and verified it loaded in the browser.
2. Removed the original manual unit drawing feature from the editor.
3. Kept the unit editor focused on editing existing selected units.
4. Investigated `assets/master-plan.svg`.
5. Found that the master plan is a visual SVG with many raw paths, not a semantic unit plate.
6. Added `data/units.json` as the future clickable unit layer.
7. Added `tools/import-svg-units.mjs` for importing a clean unit SVG when one becomes available.
8. Added a first manual cluster overlay, then removed the guessed outlines after deciding manual tracing was better.
9. Built a temporary Cluster Mapper tool so boundaries could be traced directly on the map.
10. Manually mapped all 11 cluster boundaries.
11. Saved the traced boundaries permanently into `data/clusters.json`.
12. Removed the temporary Cluster Mapper tool from the app.
13. Verified the app reloads with 11 clickable clusters and no console errors.

## Saved Clusters

The following clusters are saved in `data/clusters.json`:

- Portofino
- Venice
- Morocco
- Santorini
- Marbella
- Montecarlo
- Malta
- Nice
- Costa Brava
- Mykonos
- Ibiza

Each cluster has:

- `id`
- `name`
- `color`
- `points`

The app converts those point arrays into SVG paths at runtime.

## Important Decisions

- Cluster boundaries are now sourced from `data/clusters.json`, not hardcoded guessed paths.
- Unit mapping is not solved yet because the current master plan does not contain clean unit IDs or polygons.
- The correct long-term source for units should be a clean SVG, DXF, DWG, or selectable PDF from DAMAC or a broker portal.
- Until a clean source is available, unit polygons can be added manually or generated from a better unit plate.

## Verification Done

- `node --check app.js` passed after the final cleanup.
- `data/clusters.json` parses correctly and contains 11 clusters.
- Browser reload confirmed 11 `.cluster-outline` elements load from the saved file.
- Clicking a cluster, tested with Portofino, shows cluster details.
- The removed Cluster Mapper UI no longer appears.

## Next Steps

1. Get or create a proper unit/plot plate.
2. Convert or trace unit boundaries into `data/units.json`.
3. Add real unit details: unit number, cluster, status, bedrooms, size, price, and optional notes.
4. Add filters for sale/rent/cluster once unit data exists.
5. Consider adding a read-only visitor mode separate from the editing controls.

## Useful Commands

Check JavaScript syntax:

```powershell
node --check app.js
```

Check saved cluster count:

```powershell
node -e "const fs=require('fs'); const c=JSON.parse(fs.readFileSync('data/clusters.json','utf8')); console.log(c.length, c.map(x=>x.name));"
```

Import a clean unit SVG later:

```powershell
node tools\import-svg-units.mjs path\to\unit-plate.svg data\units.json
```
