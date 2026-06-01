# DAMAC Lagoons Interactive Masterplan

Presentation-ready static website for exploring DAMAC Lagoons communities through a
tilted 3D masterplan, cinematic focus flights, and a glassmorphism property browser.

## Features

- Uses the supplied Lagoons presentation image as a Three.js texture.
- Renders all 11 mapped communities as lightweight 3D beacons and boundary lines.
- Converts the original SVG trace coordinates into positions on the updated image.
- Animates the camera into a selected community from the map or sidebar.
- Filters communities by search query and townhouse or villa inventory.
- Shows live community summaries from `data/cluster-inventory.json`.
- Supports shareable URLs such as `?community=venice&type=Villa&q=ve`.
- Falls back to the full static masterplan and working sidebar if WebGL is unavailable.

## Run Locally

Serve the folder with any static file server:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173`.

## Project Structure

- `index.html`: application shell and glass interface.
- `styles.css`: responsive layout and visual design.
- `app.js`: Three.js scene, coordinate conversion, filters, details, and camera flights.
- `assets/damac-lagoons-masterplan.png`: supplied presentation masterplan used by the 3D plane.
- `assets/vendor/`: pinned local copies of Three.js r128 and OrbitControls.
- `data/clusters.json`: traced cluster boundaries in the original SVG coordinate space.
- `data/cluster-inventory.json`: community inventory summaries.
- `data/units.json`: reserved for future plot-level polygons.

No API keys are required.
