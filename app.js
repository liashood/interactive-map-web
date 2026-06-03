import {
  findClusterInventory as findInventoryItem,
  getBedroomLabel,
  getPrimaryCategory,
  getTotalResidences,
} from "./src/inventory-service.js";

import {
  getFilteredClusters as filterClusters,
  getSearchSuggestions as buildSearchSuggestions,
} from "./src/search-service.js";

import { renderDetailsContent } from "./src/details-view.js";

const viewer = document.getElementById("viewer");
const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const resetButton = document.getElementById("reset-view");
const detailsCard = document.getElementById("details-card");
const detailsBody = document.getElementById("details-body");
const detailsCloseButton = document.getElementById("details-close");
const communityList = document.getElementById("community-list");
const communityCount = document.getElementById("community-count");
const communityTotal = document.getElementById("community-total");
const residenceTotal = document.getElementById("residence-total");
const communitySearch = document.getElementById("community-search");
const searchSuggestions = document.getElementById("search-suggestions");

const TEXTURE = {
  width: 1448,
  height: 1086,
  planeWidth: 680,
  planeHeight: 538,
  crop: {
    left: 220,
    top: 60,
    right: 1420,
    bottom: 1010,
  },
};

// The supplied presentation image is a larger render of the traced SVG plate.
const PLATE_TRANSFORM = {
  scaleX: 1.78,
  scaleY: 1.91,
  offsetX: 4,
  offsetY: -80,
};

const DEFAULT_VIEW = {
  position: new THREE.Vector3(42, 600, 730),
  target: new THREE.Vector3(42, 0, 8),
};

const state = {
  clusters: [],
  inventory: [],
  selectedClusterId: null,
  hoveredClusterId: null,
  query: "",
  propertyFilter: "all",
  animationFrame: null,
};

const clusterDefinitions = [
  {
    id: "santorini",
    number: 1,
    name: "Santorini",
    color: "#79b9c1",
    description: "A serene island-inspired neighbourhood with a relaxed waterfront rhythm.",
  },
  {
    id: "costa-brava",
    number: 2,
    name: "Costa Brava",
    color: "#70aa69",
    description: "An active Mediterranean community shaped around open spaces and family living.",
  },
  {
    id: "portofino",
    number: 3,
    name: "Portofino",
    color: "#df9636",
    description: "A vibrant villa destination with colourful character and a resort-like setting.",
  },
  {
    id: "nice",
    number: 4,
    name: "Nice",
    color: "#d9c56f",
    description: "A bright, easy-going enclave designed for an elegant coastal lifestyle.",
  },
  {
    id: "venice",
    number: 5,
    name: "Venice",
    color: "#bd6033",
    description: "A distinctive lagoon district where water channels weave through statement homes.",
  },
  {
    id: "malta",
    number: 6,
    name: "Malta",
    color: "#d71b24",
    description: "A family-led neighbourhood with landscaped routes and a lively community spirit.",
  },
  {
    id: "marbella",
    number: 7,
    name: "Marbella",
    color: "#5d9b4f",
    description: "A green Mediterranean-inspired cluster with a calm residential atmosphere.",
  },
  {
    id: "montecarlo",
    number: 8,
    name: "Monte Carlo",
    color: "#71916e",
    description: "A refined enclave balancing contemporary homes with generous landscaped edges.",
  },
  {
    id: "mykonos",
    number: 9,
    name: "Mykonos",
    color: "#6f9078",
    description: "A laid-back island cluster with intimate streets and an airy village feel.",
  },
  {
    id: "ibiza",
    number: 10,
    name: "Ibiza",
    color: "#4ca85c",
    description: "An energetic community inspired by relaxed island living and outdoor connection.",
  },
  {
    id: "morocco",
    number: 11,
    name: "Morocco",
    color: "#a6963c",
    description: "A dramatic lagoon setting with a rich architectural mix and winding waterfront plots.",
  },
];

let renderer;
let scene;
let camera;
let controls;
let raycaster;
let pointer;
let hasWebgl = false;
const interactiveMeshes = [];
const markerById = new Map();
let hoverRing;
let selectedRing;

function initializeScene() {
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.5, 1800);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xe6eee7, 0.15);
    viewer.appendChild(renderer.domElement);
    viewer.classList.add("has-webgl");

    camera.position.copy(DEFAULT_VIEW.position);
    controls.target.copy(DEFAULT_VIEW.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minDistance = 170;
    controls.maxDistance = 1200;
    controls.maxPolarAngle = Math.PI * 0.48;
    controls.minPolarAngle = Math.PI * 0.16;
    controls.update();

    scene.fog = new THREE.Fog(0xe5eee8, 760, 1350);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.84);
    const hemisphereLight = new THREE.HemisphereLight(0xf7fffd, 0xb8c9bd, 0.72);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(-260, 480, 280);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    directionalLight.shadow.camera.left = -460;
    directionalLight.shadow.camera.right = 460;
    directionalLight.shadow.camera.top = 420;
    directionalLight.shadow.camera.bottom = -420;
    scene.add(ambientLight, hemisphereLight, directionalLight);

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(TEXTURE.planeWidth + 12, 6, TEXTURE.planeHeight + 12),
      new THREE.MeshStandardMaterial({
        color: 0xe9e3d6,
        roughness: 0.9,
        metalness: 0,
      })
    );
    slab.position.y = -4;
    slab.receiveShadow = true;
    scene.add(slab);

    const mapTexture = new THREE.TextureLoader().load("./assets/images/damac-lagoons-masterplan.png");
    mapTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    mapTexture.encoding = THREE.sRGBEncoding;
    mapTexture.offset.set(
      TEXTURE.crop.left / TEXTURE.width,
      (TEXTURE.height - TEXTURE.crop.bottom) / TEXTURE.height
    );
    mapTexture.repeat.set(
      (TEXTURE.crop.right - TEXTURE.crop.left) / TEXTURE.width,
      (TEXTURE.crop.bottom - TEXTURE.crop.top) / TEXTURE.height
    );

    const masterplan = new THREE.Mesh(
      new THREE.PlaneGeometry(TEXTURE.planeWidth, TEXTURE.planeHeight),
      new THREE.MeshBasicMaterial({
        map: mapTexture,
        color: 0xffffff,
      })
    );
    masterplan.rotation.x = -Math.PI / 2;
    masterplan.receiveShadow = true;
    scene.add(masterplan);

    hoverRing = createFocusRing(17, 23, 0x62b8be, 0.5);
    selectedRing = createFocusRing(21, 29, 0xffffff, 0.76);
    scene.add(hoverRing, selectedRing);
    return true;
  } catch (error) {
    console.warn("WebGL is unavailable. Showing the static masterplan fallback.", error);
    viewer.classList.add("is-static");
    document.body.classList.add("is-static-map");
    return false;
  }
}

function createFocusRing(innerRadius, outerRadius, color, opacity) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(innerRadius, outerRadius, 72),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  );

  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 2.5;
  ring.visible = false;
  return ring;
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

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Number(value) || 0);
}

function computeCentroid(points) {
  const center = points.reduce(
    (total, point) => ({
      x: total.x + Number(point.x || 0),
      y: total.y + Number(point.y || 0),
    }),
    { x: 0, y: 0 }
  );

  return {
    x: center.x / points.length,
    y: center.y / points.length,
  };
}

function sourcePointToWorld(point, height = 0) {
  const textureX = Number(point.x) * PLATE_TRANSFORM.scaleX + PLATE_TRANSFORM.offsetX;
  const textureY = Number(point.y) * PLATE_TRANSFORM.scaleY + PLATE_TRANSFORM.offsetY;
  const cropWidth = TEXTURE.crop.right - TEXTURE.crop.left;
  const cropHeight = TEXTURE.crop.bottom - TEXTURE.crop.top;

  return new THREE.Vector3(
    ((textureX - TEXTURE.crop.left) / cropWidth - 0.5) * TEXTURE.planeWidth,
    height,
    ((textureY - TEXTURE.crop.top) / cropHeight - 0.5) * TEXTURE.planeHeight
  );
}

function getClusterPosition(cluster, height = 0) {
  return sourcePointToWorld(computeCentroid(cluster.points), height);
}

function createBoundary(cluster) {
  const points = cluster.points.map((point) => sourcePointToWorld(point, 2.1));
  const geometry = new THREE.BufferGeometry().setFromPoints([...points, points[0]]);
  const material = new THREE.LineBasicMaterial({
    color: cluster.color,
    transparent: true,
    opacity: 0.52,
  });

  scene.add(new THREE.Line(geometry, material));
}

function createPinTexture(cluster) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const size = 128;
  canvas.width = size;
  canvas.height = size;

  context.beginPath();
  context.arc(size / 2, size / 2, 46, 0, Math.PI * 2);
  context.fillStyle = cluster.color;
  context.fill();
  context.lineWidth = 8;
  context.strokeStyle = "rgba(255,255,255,0.95)";
  context.stroke();
  context.fillStyle = "#ffffff";
  context.font = "700 48px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(cluster.number, size / 2, size / 2 + 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.encoding = THREE.sRGBEncoding;
  return texture;
}

function createClusterBeacon(cluster) {
  const group = new THREE.Group();
  const position = getClusterPosition(cluster);
  const color = new THREE.Color(cluster.color);
  const baseMaterial = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.36,
    metalness: 0.08,
    transparent: true,
    opacity: 0.88,
  });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(12, 14, 3, 40), baseMaterial);
  base.position.y = 2.4;
  base.castShadow = true;
  group.add(base);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2, 15, 20), baseMaterial);
  mast.position.y = 10.5;
  mast.castShadow = true;
  group.add(mast);

  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(16, 1.3, 10, 64),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.62,
    })
  );
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 3.8;
  group.add(halo);

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createPinTexture(cluster),
      transparent: true,
      depthTest: false,
    })
  );
  sprite.position.y = 26;
  sprite.scale.set(21, 21, 1);
  sprite.renderOrder = 10;
  group.add(sprite);

  const hitArea = new THREE.Mesh(
    new THREE.CylinderGeometry(19, 19, 24, 32),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  hitArea.position.y = 11;
  hitArea.userData.clusterId = cluster.id;
  group.add(hitArea);
  interactiveMeshes.push(hitArea);

  group.position.copy(position);
  group.userData.clusterId = cluster.id;
  markerById.set(cluster.id, group);
  scene.add(group);
}

function createSceneCommunities() {
  if (!hasWebgl) return;

  state.clusters.forEach((cluster) => {
    createBoundary(cluster);
    createClusterBeacon(cluster);
  });
}

function findClusterInventory(clusterName) {
  return findInventoryItem(state.inventory, clusterName);
}




function renderDetails(cluster) {
  if (!cluster) {
    detailsCard.classList.remove("is-active");
    return;
  }

  const inventory = findClusterInventory(cluster.name);

  detailsBody.innerHTML = renderDetailsContent({
    cluster,
    inventory,
    query: state.query,
    formatNumber,
  });

  document.getElementById("details-reset-view").addEventListener("click", resetView);
  detailsCard.classList.add("is-active");
}


function getFilteredClusters() {
  return filterClusters({
    clusters: state.clusters,
    inventoryItems: state.inventory,
    query: state.query,
    propertyFilter: state.propertyFilter,
  });
}

function getSearchSuggestions() {
  return buildSearchSuggestions({
    clusters: state.clusters,
    inventoryItems: state.inventory,
    query: state.query,
  });
}

function renderSearchSuggestions() {
  const suggestions = getSearchSuggestions();

  if (!suggestions.length) {
    searchSuggestions.innerHTML = "";
    searchSuggestions.setAttribute("aria-hidden", "true");
    return;
  }

  searchSuggestions.innerHTML = suggestions
    .map(
      (item) => `
        <button class="search-suggestion" type="button" data-search-value="${escapeHtml(item.value)}" data-cluster-name="${escapeHtml(item.meta)}">
          <span>${escapeHtml(item.label)}</span>
          <small>${escapeHtml(item.meta)}</small>
        </button>
      `
    )
    .join("");

  searchSuggestions.setAttribute("aria-hidden", "false");
}

function renderCommunityList() {
  const clusters = getFilteredClusters();
  communityCount.textContent = `${clusters.length} ${clusters.length === 1 ? "place" : "places"}`;

  if (!clusters.length) {
    communityList.innerHTML = `
      <p class="community-empty">
        No communities match that search. Try another name or property type.
      </p>
    `;
    return;
  }

  communityList.innerHTML = clusters
    .map((cluster) => {
      const inventory = findClusterInventory(cluster.name);
      const isSelected = cluster.id === state.selectedClusterId;

      return `
        <button
          class="community-item${isSelected ? " is-selected" : ""}"
          type="button"
          data-cluster-id="${escapeHtml(cluster.id)}"
          style="--cluster-color: ${escapeHtml(cluster.color)}"
        >
          <span class="community-item-number">${escapeHtml(cluster.number)}</span>
          <span class="community-item-copy">
            <strong>${escapeHtml(cluster.name)}</strong>
            <span>${escapeHtml(getPrimaryCategory(inventory))} &middot; ${escapeHtml(getBedroomLabel(inventory))}</span>
          </span>
          <span class="community-item-total">${escapeHtml(formatNumber(inventory?.totalUnits))}</span>
        </button>
      `;
    })
    .join("");

  communityList.querySelectorAll(".community-item").forEach((button) => {
    button.addEventListener("mouseenter", () => updateHoverState(button.dataset.clusterId));
    button.addEventListener("mouseleave", () => updateHoverState(null));
    button.addEventListener("click", () => selectCluster(button.dataset.clusterId));
  });
}

function syncUrl() {
  const url = new URL(window.location.href);

  if (state.selectedClusterId) {
    url.searchParams.set("community", state.selectedClusterId);
  } else {
    url.searchParams.delete("community");
  }

  if (state.query) {
    url.searchParams.set("q", state.query);
  } else {
    url.searchParams.delete("q");
  }

  if (state.propertyFilter !== "all") {
    url.searchParams.set("type", state.propertyFilter);
  } else {
    url.searchParams.delete("type");
  }

  window.history.replaceState({}, "", url);
}

function cancelCameraFlight() {
  if (state.animationFrame) {
    cancelAnimationFrame(state.animationFrame);
    state.animationFrame = null;
  }
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function animateCameraTo(targetPosition, targetFocus, duration = 2100) {
  if (!hasWebgl) return;

  cancelCameraFlight();
  const startedAt = performance.now();
  const startPosition = camera.position.clone();
  const startTarget = controls.target.clone();

  function step(now) {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = easeInOutCubic(progress);

    camera.position.lerpVectors(startPosition, targetPosition, eased);
    controls.target.lerpVectors(startTarget, targetFocus, eased);
    controls.update();

    if (progress < 1) {
      state.animationFrame = requestAnimationFrame(step);
    } else {
      state.animationFrame = null;
    }
  }

  state.animationFrame = requestAnimationFrame(step);
}

function getFocusCameraPosition(clusterPosition) {
  const horizontalOffset = clusterPosition.x > 40 ? -105 : 105;
  return clusterPosition.clone().add(new THREE.Vector3(horizontalOffset, 205, 205));
}

function updateSelectionRing(clusterId) {
  if (!hasWebgl) return;

  const cluster = state.clusters.find((entry) => entry.id === clusterId);
  if (!cluster) {
    selectedRing.visible = false;
    return;
  }

  selectedRing.position.copy(getClusterPosition(cluster, 3));
  selectedRing.visible = true;
}

function updateHoverState(clusterId) {
  state.hoveredClusterId = clusterId;
  const cluster = state.clusters.find((entry) => entry.id === clusterId);

  if (!cluster) {
    if (hoverRing) hoverRing.visible = false;
    viewer.style.cursor = "grab";
    return;
  }

  if (!hasWebgl) return;

  hoverRing.position.copy(getClusterPosition(cluster, 3));
  hoverRing.visible = true;
  viewer.style.cursor = "pointer";
}

function selectCluster(clusterId) {
  const cluster = state.clusters.find((entry) => entry.id === clusterId);
  if (!cluster) return;

  state.selectedClusterId = clusterId;
  renderDetails(cluster);
  renderCommunityList();
  syncUrl();

  if (hasWebgl) {
    const position = getClusterPosition(cluster, 3);
    updateSelectionRing(clusterId);
    animateCameraTo(getFocusCameraPosition(position), position, 2200);
  }
}

function selectClusterByName(clusterName) {
  const cluster = state.clusters.find(
    (entry) => normalizeName(entry.name) === normalizeName(clusterName)
  );

  if (!cluster) return;

  selectCluster(cluster.id);
}

function clearSelection() {
  state.selectedClusterId = null;
  if (selectedRing) selectedRing.visible = false;
  detailsCard.classList.remove("is-active");
  renderCommunityList();
  syncUrl();
  resetView();
}

function resetView() {
  if (!hasWebgl) return;
  animateCameraTo(DEFAULT_VIEW.position, DEFAULT_VIEW.target, 1200);
}

function onPointerMove(event) {
  const rect = viewer.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster
    .intersectObjects(interactiveMeshes, false)
    .find((entry) => entry.object.userData.clusterId);

  if (hit?.object.userData.clusterId !== state.hoveredClusterId) {
    updateHoverState(hit?.object.userData.clusterId || null);
  }
}

function onPointerClick(event) {
  const rect = viewer.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster
    .intersectObjects(interactiveMeshes, false)
    .find((entry) => entry.object.userData.clusterId);

  if (hit) {
    selectCluster(hit.object.userData.clusterId);
  }
}

function resizeRenderer() {
  if (!hasWebgl) return;

  const width = viewer.clientWidth;
  const height = viewer.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function animate(now) {
  if (!hasWebgl) return;

  requestAnimationFrame(animate);
  const pulse = 1 + Math.sin(now * 0.0028) * 0.06;

  if (selectedRing.visible) {
    selectedRing.scale.setScalar(pulse);
  }

  markerById.forEach((marker) => {
    marker.rotation.y = Math.sin(now * 0.00055 + marker.position.x) * 0.035;
  });

  controls.update();
  renderer.render(scene, camera);
}

async function loadJson(path) {
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function normalizeClusters(clusters) {
  return clusters
    .map((cluster) => {
      const definition =
        clusterDefinitions.find((item) => item.id === cluster.id) ||
        clusterDefinitions.find((item) => normalizeName(item.name) === normalizeName(cluster.name));

      if (!definition || !Array.isArray(cluster.points) || cluster.points.length < 3) return null;
      return { ...cluster, ...definition };
    })
    .filter(Boolean)
    .sort((a, b) => a.number - b.number);
}

function applyInitialView() {
  const params = new URLSearchParams(window.location.search);
  const query = params.get("q") || "";
  const propertyFilter = params.get("type") || "all";
  const clusterId = params.get("community");

  state.query = query;
  communitySearch.value = query;

  if (["all", "Townhouse", "Villa"].includes(propertyFilter)) {
    state.propertyFilter = propertyFilter;
    document.querySelectorAll(".filter-pill").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.propertyFilter === propertyFilter);
    });
  }

  renderCommunityList();

  if (clusterId) {
    selectCluster(clusterId);
  }
}

async function initialize() {
  const [clusters, inventory] = await Promise.all([
    loadJson("./data/clusters.json"),
    loadJson("./data/cluster-inventory.json"),
  ]);

  state.clusters = normalizeClusters(clusters);
  state.inventory = inventory;

  const totalResidences = getTotalResidences(inventory);
  communityTotal.textContent = formatNumber(state.clusters.length);
  residenceTotal.textContent = formatNumber(totalResidences);

  createSceneCommunities();
  applyInitialView();

  if (hasWebgl) {
    resizeRenderer();
    animate(0);
  }
}

hasWebgl = initializeScene();

if (hasWebgl) {
  controls.addEventListener("start", cancelCameraFlight);
  viewer.addEventListener("pointermove", onPointerMove);
  viewer.addEventListener("pointerleave", () => updateHoverState(null));
  viewer.addEventListener("click", onPointerClick);
}

window.addEventListener("resize", resizeRenderer);
zoomInButton.addEventListener("click", () => {
  if (hasWebgl) controls.dollyIn(1.2);
});
zoomOutButton.addEventListener("click", () => {
  if (hasWebgl) controls.dollyOut(1.2);
});
resetButton.addEventListener("click", resetView);
detailsCloseButton.addEventListener("click", clearSelection);

communitySearch.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderCommunityList();
  renderSearchSuggestions();
  syncUrl();
});

searchSuggestions.addEventListener("click", (event) => {
  const button = event.target.closest(".search-suggestion");

  if (!button) return;

  state.query = button.dataset.searchValue;
  communitySearch.value = state.query;

  renderCommunityList();
  renderSearchSuggestions();

  const clusterName = button.dataset.clusterName;

  if (clusterName) {
    selectClusterByName(clusterName);
  } else {
    syncUrl();
  }
});

document.querySelectorAll(".filter-pill").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-pill").forEach((pill) => pill.classList.remove("is-active"));
    button.classList.add("is-active");
    state.propertyFilter = button.dataset.propertyFilter;
    renderCommunityList();
    syncUrl();
  });
});

initialize();
