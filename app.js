const frame = document.getElementById("map-frame");
const surface = document.getElementById("map-surface");
const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const resetButton = document.getElementById("reset-view");
const detailsBody = document.getElementById("details-body");
const clusterTooltip = document.getElementById("cluster-tooltip");
const masterPlan = document.getElementById("master-plan");

const overlay = document.getElementById("cluster-layer");
const clusterOutlineLayer = document.getElementById("cluster-outline-layer");
const unitLayer = document.getElementById("unit-layer");

const state = {
  scale: 1,
  x: 0,
  y: 0,
  minScale: 1,
  maxScale: 12,
  isDragging: false,
  dragMoved: false,
  lastDragEndedAt: 0,
  clusters: [],
  units: [],
  selectedUnitId: null,
  selectedClusterId: null,
  startX: 0,
  startY: 0,
  startOffsetX: 0,
  startOffsetY: 0,
};

const clusterDefinitions = [
  { id: "portofino", name: "Portofino", color: "#a78bfa" },
  { id: "venice", name: "Venice", color: "#f97316" },
  { id: "morocco", name: "Morocco", color: "#fb7185" },
  { id: "santorini", name: "Santorini", color: "#06b6d4" },
  { id: "marbella", name: "Marbella", color: "#eab308" },
  { id: "montecarlo", name: "Montecarlo", color: "#14b8a6" },
  { id: "malta", name: "Malta", color: "#ef4444" },
  { id: "nice", name: "Nice", color: "#38bdf8" },
  { id: "costa-brava", name: "Costa Brava", color: "#22c55e" },
  { id: "mykonos", name: "Mykonos", color: "#ec4899" },
  { id: "ibiza", name: "Ibiza", color: "#84cc16" },
];

function clampPan() {
  const frameRect = frame.getBoundingClientRect();
  const baseWidth = masterPlan.clientWidth;
  const baseHeight = masterPlan.clientHeight;

  if (!baseWidth || !baseHeight) {
    state.x = 0;
    state.y = 0;
    return;
  }

  const scaledWidth = baseWidth * state.scale;
  const scaledHeight = baseHeight * state.scale;
  const maxOffsetX = Math.max(0, (scaledWidth - frameRect.width) / 2);
  const maxOffsetY = Math.max(0, (scaledHeight - frameRect.height) / 2);

  state.x = Math.min(maxOffsetX, Math.max(-maxOffsetX, state.x));
  state.y = Math.min(maxOffsetY, Math.max(-maxOffsetY, state.y));
}

function applyTransform() {
  clampPan();
  surface.style.transform = `translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px)) scale(${state.scale})`;
}

function zoomBy(factor) {
  state.scale = Math.min(state.maxScale, Math.max(state.minScale, state.scale * factor));
  applyTransform();
}

function resetView() {
  state.scale = 1;
  state.x = 0;
  state.y = 0;
  applyTransform();
}

function dragStart(clientX, clientY) {
  state.isDragging = true;
  state.dragMoved = false;
  state.startX = clientX;
  state.startY = clientY;
  state.startOffsetX = state.x;
  state.startOffsetY = state.y;
  surface.classList.add("is-dragging");
}

function dragMove(clientX, clientY) {
  if (!state.isDragging) return;

  state.x = state.startOffsetX + (clientX - state.startX);
  state.y = state.startOffsetY + (clientY - state.startY);
  state.dragMoved =
    Math.abs(clientX - state.startX) > 4 ||
    Math.abs(clientY - state.startY) > 4;

  applyTransform();
}

function dragEnd() {
  if (state.dragMoved) {
    state.lastDragEndedAt = Date.now();
  }

  state.isDragging = false;
  surface.classList.remove("is-dragging");
}

function pathFromPoints(points) {
  if (!Array.isArray(points) || !points.length) return "";

  const [firstPoint, ...remainingPoints] = points;
  const lines = remainingPoints.map((point) => `L ${point.x} ${point.y}`).join(" ");

  return `M ${firstPoint.x} ${firstPoint.y} ${lines} Z`;
}

function hexToRgba(hex, opacity) {
  const normalized = hex.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
}

function getStatusLabel(status) {
  if (status === "sale") return "For sale";
  if (status === "rent") return "For rent";
  return "No information";
}

function escapeHtml(value) {
  const replacements = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };

  return String(value ?? "").replace(/[&<>"']/g, (character) => replacements[character]);
}

function getClusterDefinitionByName(name) {
  return clusterDefinitions.find((cluster) => cluster.name === name);
}

function getClusterDefinitionById(id) {
  return clusterDefinitions.find((cluster) => cluster.id === id);
}

function isValidPoint(point) {
  return point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y));
}

function hasValidUnitShape(unit) {
  return (
    unit &&
    typeof unit.id === "string" &&
    typeof unit.unitId === "string" &&
    Array.isArray(unit.points) &&
    unit.points.length >= 3
  );
}

function normalizeClusters(clusters) {
  return clusters
    .map((cluster) => {
      const definition =
        getClusterDefinitionById(cluster.id) ||
        getClusterDefinitionByName(cluster.name);

      if (!definition) return null;

      return {
        id: definition.id,
        name: definition.name,
        color: definition.color,
        points: Array.isArray(cluster.points)
          ? cluster.points.filter(isValidPoint).map((point) => ({
              x: Math.round(Number(point.x) * 100) / 100,
              y: Math.round(Number(point.y) * 100) / 100,
            }))
          : [],
      };
    })
    .filter((cluster) => cluster && cluster.points.length >= 3);
}

async function loadClusters() {
  try {
    const response = await fetch("./data/clusters.json", { cache: "no-store" });

    if (!response.ok) {
      state.clusters = [];
      return;
    }

    const clusters = await response.json();
    state.clusters = Array.isArray(clusters) ? normalizeClusters(clusters) : [];
  } catch {
    state.clusters = [];
  }
}

async function loadUnits() {
  try {
    const response = await fetch("./data/units.json", { cache: "no-store" });

    if (!response.ok) {
      state.units = [];
      return;
    }

    const units = await response.json();
    state.units = Array.isArray(units) ? units.filter(hasValidUnitShape) : [];
  } catch {
    state.units = [];
  }
}

function renderDetails(unit) {
  if (!unit) {
    detailsBody.innerHTML = '<p class="details-empty">No unit selected yet.</p>';
    return;
  }

  const safeCluster = escapeHtml(unit.cluster);
  const safeUnitId = escapeHtml(unit.unitId);
  const safeStatus = escapeHtml(getStatusLabel(unit.status));
  const safeBedrooms = escapeHtml(unit.bedrooms || "-");
  const safeSize = escapeHtml(unit.size || "-");

  detailsBody.innerHTML = `
    <p class="details-kicker">${safeCluster}</p>
    <h3 class="details-title">${safeUnitId}</h3>
    <div class="details-list">
      <div class="details-row">
        <span class="details-label">Status</span>
        <span class="details-value">${safeStatus}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Bedrooms</span>
        <span class="details-value">${safeBedrooms}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Size</span>
        <span class="details-value">${safeSize}</span>
      </div>
    </div>
  `;
}

function renderClusterDetails(cluster) {
  const unitsInCluster = state.units.filter((unit) => unit.cluster === cluster.name);
  const saleCount = unitsInCluster.filter((unit) => unit.status === "sale").length;
  const rentCount = unitsInCluster.filter((unit) => unit.status === "rent").length;

  detailsBody.innerHTML = `
    <p class="details-kicker">Cluster</p>
    <h3 class="details-title">${escapeHtml(cluster.name)}</h3>
    <div class="details-list">
      <div class="details-row">
        <span class="details-label">Available units</span>
        <span class="details-value">${escapeHtml(unitsInCluster.length)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">For sale</span>
        <span class="details-value">${escapeHtml(saleCount)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">For rent</span>
        <span class="details-value">${escapeHtml(rentCount)}</span>
      </div>
    </div>
  `;
}

function showClusterTooltip(cluster, event) {
  clusterTooltip.textContent = cluster.name;
  clusterTooltip.setAttribute("aria-hidden", "false");
  clusterTooltip.classList.add("is-visible");
  moveClusterTooltip(event);
}

function moveClusterTooltip(event) {
  const frameRect = frame.getBoundingClientRect();
  const tooltipRect = clusterTooltip.getBoundingClientRect();

  const left = Math.min(
    frameRect.width - tooltipRect.width - 12,
    Math.max(12, event.clientX - frameRect.left + 14)
  );

  const top = Math.min(
    frameRect.height - tooltipRect.height - 12,
    Math.max(12, event.clientY - frameRect.top + 14)
  );

  clusterTooltip.style.left = `${left}px`;
  clusterTooltip.style.top = `${top}px`;
}

function hideClusterTooltip() {
  clusterTooltip.classList.remove("is-visible");
  clusterTooltip.setAttribute("aria-hidden", "true");
}

function handleClusterPointerMove(event) {
  const clusterId = event.target.closest(".cluster-outline")?.dataset.clusterId;
  const cluster = state.clusters.find((entry) => entry.id === clusterId);

  if (!cluster) {
    hideClusterTooltip();
    return;
  }

  showClusterTooltip(cluster, event);
}

function renderClusterOutlines() {
  clusterOutlineLayer.innerHTML = "";

  state.clusters.forEach((cluster) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const isSelected = cluster.id === state.selectedClusterId;

    path.setAttribute("class", `cluster-outline${isSelected ? " is-selected" : ""}`);
    path.setAttribute("d", pathFromPoints(cluster.points));
    path.setAttribute("tabindex", "0");
    path.setAttribute("role", "button");
    path.setAttribute("aria-label", cluster.name);
    path.dataset.clusterId = cluster.id;
    path.style.setProperty("--cluster-color", cluster.color);
    path.style.setProperty("--cluster-fill", hexToRgba(cluster.color, 0.035));
    path.style.setProperty("--cluster-fill-active", hexToRgba(cluster.color, 0.14));

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = cluster.name;
    path.appendChild(title);

    path.addEventListener("mouseenter", (event) => {
      showClusterTooltip(cluster, event);
    });

    path.addEventListener("mousemove", (event) => {
      moveClusterTooltip(event);
    });

    path.addEventListener("pointermove", (event) => {
      showClusterTooltip(cluster, event);
    });

    path.addEventListener("mouseleave", hideClusterTooltip);

    path.addEventListener("click", (event) => {
      event.stopPropagation();

      if (Date.now() - state.lastDragEndedAt < 120) return;

      selectCluster(cluster.id);
    });

    path.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectCluster(cluster.id);
      }
    });

    clusterOutlineLayer.appendChild(path);
  });
}

function renderUnits() {
  unitLayer.innerHTML = "";

  state.units.forEach((unit) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    polygon.setAttribute("points", unit.points.map((point) => `${point.x},${point.y}`).join(" "));
    polygon.setAttribute(
      "class",
      `unit-polygon status-${unit.status}${unit.id === state.selectedUnitId ? " is-selected" : ""}`
    );
    polygon.dataset.unitId = unit.id;

    polygon.addEventListener("click", (event) => {
      event.stopPropagation();

      if (Date.now() - state.lastDragEndedAt < 120) return;

      selectUnit(unit.id);
    });

    group.appendChild(polygon);

    const centerX = unit.points.reduce((sum, point) => sum + point.x, 0) / unit.points.length;
    const centerY = unit.points.reduce((sum, point) => sum + point.y, 0) / unit.points.length;

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "unit-label");
    label.setAttribute("x", centerX);
    label.setAttribute("y", centerY);
    label.textContent = unit.unitId;

    group.appendChild(label);
    unitLayer.appendChild(group);
  });
}

function selectUnit(id) {
  state.selectedUnitId = id;
  state.selectedClusterId = null;

  const unit = state.units.find((entry) => entry.id === id) || null;

  renderDetails(unit);
  renderClusterOutlines();
  renderUnits();
}

function selectCluster(id) {
  const cluster = state.clusters.find((entry) => entry.id === id);

  if (!cluster) return;

  state.selectedClusterId = id;
  state.selectedUnitId = null;

  renderClusterOutlines();
  renderUnits();
  renderClusterDetails(cluster);
}

frame.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.12 : 0.9);
  },
  { passive: false }
);

frame.addEventListener("mousedown", (event) => {
  dragStart(event.clientX, event.clientY);
});

window.addEventListener("mousemove", (event) => {
  dragMove(event.clientX, event.clientY);
});

window.addEventListener("mouseup", dragEnd);
window.addEventListener("mouseleave", dragEnd);

frame.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      dragStart(touch.clientX, touch.clientY);
    }
  },
  { passive: true }
);

frame.addEventListener(
  "touchmove",
  (event) => {
    if (event.touches.length === 1 && state.isDragging) {
      const touch = event.touches[0];
      dragMove(touch.clientX, touch.clientY);
    }
  },
  { passive: true }
);

frame.addEventListener("touchend", dragEnd);

zoomInButton.addEventListener("click", () => zoomBy(1.18));
zoomOutButton.addEventListener("click", () => zoomBy(0.84));
resetButton.addEventListener("click", resetView);

overlay.addEventListener("mousemove", handleClusterPointerMove);
overlay.addEventListener("pointermove", handleClusterPointerMove);
overlay.addEventListener("mouseleave", hideClusterTooltip);

window.addEventListener("resize", applyTransform);

if (masterPlan.complete) {
  applyTransform();
} else {
  masterPlan.addEventListener("load", applyTransform);
}

async function initialize() {
  await loadClusters();
  await loadUnits();

  renderClusterOutlines();
  renderUnits();
  renderDetails(null);
  applyTransform();
}

initialize();