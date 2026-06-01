# Floor Plate Notes

The app needs two separate layers:

- `assets/master-plan.svg` is the visual base map.
- `data/units.json` is the clickable unit layer rendered on top of the base map.

The current `assets/master-plan.svg` is not a semantic unit plate. It has thousands of raw vector paths, no text nodes, no polygon units, and no unit IDs. It is useful as a visual reference, but it cannot reliably become a unit database by itself.

## Best Source To Request

Ask DAMAC, the broker portal, or the community sales team for one of these:

- A unit/plot master plan as SVG, DXF, DWG, or PDF with selectable unit shapes.
- A plot plan where each villa/townhouse shape has a unit number.
- An inventory export that includes unit number, cluster, status, bedrooms, size, and plot coordinates.

Public web checks so far:

- DAMAC project pages expose normal floor-plan PDFs such as `nice-fp-en.pdf`, which are house layout plans, not a community-wide unit plate.
- Public broker pages expose master-plan preview images, but the ones checked are raster images and do not include machine-readable unit shapes.

If you receive a clean SVG where unit shapes have IDs such as `BL465`, run:

```powershell
node tools/import-svg-units.mjs path\to\unit-plate.svg data\units.json
```

Then reload the app. The units will appear as clickable overlays.
