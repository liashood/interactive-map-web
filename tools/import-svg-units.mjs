import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";

const [sourcePath, outputPath = "data/units.json"] = process.argv.slice(2);

if (!sourcePath) {
  console.error("Usage: node tools/import-svg-units.mjs <unit-plate.svg> [data/units.json]");
  process.exit(1);
}

const svg = await readFile(sourcePath, "utf8");
const unitElements = collectUnitElements(svg);
const units = unitElements
  .map((element) => toUnit(element))
  .filter((unit) => unit.points.length >= 3);

await writeFile(outputPath, `${JSON.stringify(units, null, 2)}\n`, "utf8");

console.log(`Imported ${units.length} unit shapes from ${basename(sourcePath)} into ${outputPath}`);

function collectUnitElements(source) {
  const elements = [];
  const tagPattern = /<(path|polygon|polyline)\b[^>]*>/gi;
  const groupPattern = /<g\b[^>]*>[\s\S]*?<\/g>/gi;

  for (const match of source.matchAll(tagPattern)) {
    const raw = match[0];
    const id = getAttribute(raw, "data-unit") || getAttribute(raw, "data-unit-id") || getAttribute(raw, "id");
    const unitId = cleanUnitId(id);

    if (!unitId) {
      continue;
    }

    elements.push({
      tag: match[1].toLowerCase(),
      raw,
      unitId,
      cluster: getAttribute(raw, "data-cluster") || "",
      status: normalizeStatus(getAttribute(raw, "data-status")),
    });
  }

  for (const match of source.matchAll(groupPattern)) {
    const rawGroup = match[0];
    const unitId = cleanUnitId(getAttribute(rawGroup, "data-unit"))
      || cleanUnitId(getAttribute(rawGroup, "data-unit-id"))
      || cleanUnitId(getAttribute(rawGroup, "id"))
      || cleanUnitId(rawGroup.match(/<title>([^<]+)<\/title>/i)?.[1]);

    if (!unitId || elements.some((element) => element.unitId === unitId)) {
      continue;
    }

    const shape = rawGroup.match(/<(path|polygon|polyline)\b[^>]*>/i);
    if (!shape) {
      continue;
    }

    elements.push({
      tag: shape[1].toLowerCase(),
      raw: shape[0],
      unitId,
      cluster: getAttribute(rawGroup, "data-cluster") || "",
      status: normalizeStatus(getAttribute(rawGroup, "data-status")),
    });
  }

  return elements;
}

function toUnit(element) {
  const points = element.tag === "path"
    ? pointsFromPath(getAttribute(element.raw, "d") || "")
    : pointsFromList(getAttribute(element.raw, "points") || "");

  return {
    id: element.unitId,
    unitId: element.unitId,
    cluster: element.cluster,
    status: element.status,
    bedrooms: "",
    size: "",
    points,
  };
}

function getAttribute(tag, name) {
  const pattern = new RegExp(`\\b${name}=["']([^"']+)["']`, "i");
  return tag.match(pattern)?.[1] || "";
}

function cleanUnitId(value) {
  const text = String(value || "").trim();
  const match = text.match(/[A-Z]{1,4}\s*-?\s*\d{2,5}[A-Z]?/i);
  return match ? match[0].replace(/\s+/g, "").toUpperCase() : "";
}

function normalizeStatus(value) {
  if (value === "sale" || value === "rent") {
    return value;
  }

  return "none";
}

function pointsFromList(value) {
  return value
    .trim()
    .split(/\s+/)
    .map((pair) => pair.split(",").map(Number))
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    .map(([x, y]) => ({ x: round(x), y: round(y) }));
}

function pointsFromPath(value) {
  const tokens = value.match(/[MLHVZmlhvz]|-?\d+(?:\.\d+)?/g) || [];
  const points = [];
  let index = 0;
  let command = "";
  let current = { x: 0, y: 0 };

  while (index < tokens.length) {
    if (isCommand(tokens[index])) {
      command = tokens[index++];
    }

    if (command === "M" || command === "L") {
      const x = Number(tokens[index++]);
      const y = Number(tokens[index++]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        current = { x, y };
        points.push({ x: round(x), y: round(y) });
      }
      continue;
    }

    if (command === "m" || command === "l") {
      const x = current.x + Number(tokens[index++]);
      const y = current.y + Number(tokens[index++]);
      if (Number.isFinite(x) && Number.isFinite(y)) {
        current = { x, y };
        points.push({ x: round(x), y: round(y) });
      }
      continue;
    }

    if (command === "H") {
      const x = Number(tokens[index++]);
      if (Number.isFinite(x)) {
        current = { ...current, x };
        points.push({ x: round(x), y: round(current.y) });
      }
      continue;
    }

    if (command === "h") {
      const x = current.x + Number(tokens[index++]);
      if (Number.isFinite(x)) {
        current = { ...current, x };
        points.push({ x: round(x), y: round(current.y) });
      }
      continue;
    }

    if (command === "V") {
      const y = Number(tokens[index++]);
      if (Number.isFinite(y)) {
        current = { ...current, y };
        points.push({ x: round(current.x), y: round(y) });
      }
      continue;
    }

    if (command === "v") {
      const y = current.y + Number(tokens[index++]);
      if (Number.isFinite(y)) {
        current = { ...current, y };
        points.push({ x: round(current.x), y: round(y) });
      }
      continue;
    }

    index += 1;
  }

  return dedupeClosingPoint(points);
}

function isCommand(token) {
  return /^[MLHVZmlhvz]$/.test(token);
}

function dedupeClosingPoint(points) {
  if (points.length < 2) {
    return points;
  }

  const first = points[0];
  const last = points[points.length - 1];
  if (first.x === last.x && first.y === last.y) {
    return points.slice(0, -1);
  }

  return points;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
