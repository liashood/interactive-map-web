# Interactive Community Map

Static web app for browsing DAMAC Lagoons communities on top of the master plan SVG.

## What It Does

- Shows the master plan map from `assets/master-plan.svg`
- Draws mapped community cluster boundaries from `data/clusters.json`
- Shows the cluster name on hover
- Opens cluster details when a boundary is clicked
- Keeps `data/units.json` ready for future sale/rent unit data

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static file server.

Example:

```bash
npx serve .
```

## Deploy On GitHub Pages

1. Create a new GitHub repository.
2. Push this project to the repository.
3. In GitHub, open **Settings > Pages**.
4. Set **Source** to **Deploy from a branch**.
5. Select the `main` branch and `/ (root)`.
6. Save, then wait for GitHub to publish the site.

The published app will load from `index.html`.

