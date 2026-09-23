/**
 * Tabriz University Campus Routing Engine
 * Dual Dijkstra-based shortest path algorithm over pedestrian and vehicle road networks
 */

import { CAMPUS_ROADS, CAMPUS_BUILDINGS, CAMPUS_GATES, CampusRoad } from "../data/campusGisData";

export interface LatLon {
  lat: number;
  lon: number;
}

export type TurnType = "straight" | "slight_right" | "right" | "slight_left" | "left" | "destination" | "start";

export interface RouteStep {
  text: string;
  distance: number; // meters
  turnType?: TurnType;
  coord?: [number, number];
}

export type RouteMode = "walking" | "driving";

export interface RouteResult {
  path: [number, number][];
  distanceMeters: number;
  durationMinutes: number;
  walkingMinutes?: number;
  drivingMinutes?: number;
  startLabel: string;
  destLabel: string;
  mode: RouteMode;
  caloriesBurned?: number;
  steps: RouteStep[];
}

/**
 * Calculates Haversine distance in meters between two lat/lon coordinates
 */
export function haversineMeters(p1: LatLon, p2: LatLon): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLon = ((p2.lon - p1.lon) * Math.PI) / 180;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface GraphNode {
  id: number;
  lat: number;
  lon: number;
  edges: { to: number; dist: number }[];
}

class CampusGraph {
  nodes: GraphNode[] = [];

  constructor(roads: CampusRoad[]) {
    this.buildGraph(roads);
  }

  private findOrCreateNode(lat: number, lon: number, thresholdMeters = 18): number {
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (haversineMeters({ lat, lon }, { lat: node.lat, lon: node.lon }) < thresholdMeters) {
        return node.id;
      }
    }
    const newNode: GraphNode = {
      id: this.nodes.length,
      lat,
      lon,
      edges: []
    };
    this.nodes.push(newNode);
    return newNode.id;
  }

  private addEdge(fromId: number, toId: number) {
    if (fromId === toId) return;
    const n1 = this.nodes[fromId];
    const n2 = this.nodes[toId];
    const dist = haversineMeters(n1, n2);

    if (!n1.edges.some(e => e.to === toId)) {
      n1.edges.push({ to: toId, dist });
    }
    if (!n2.edges.some(e => e.to === fromId)) {
      n2.edges.push({ to: fromId, dist });
    }
  }

  private buildGraph(roads: CampusRoad[]) {
    roads.forEach(rd => {
      if (!rd.coords || rd.coords.length < 2) return;
      for (let i = 0; i < rd.coords.length - 1; i++) {
        const u = this.findOrCreateNode(rd.coords[i][0], rd.coords[i][1]);
        const v = this.findOrCreateNode(rd.coords[i + 1][0], rd.coords[i + 1][1]);
        this.addEdge(u, v);
      }
    });
  }

  findNearestNode(pt: LatLon): number {
    let bestId = 0;
    let minDist = Infinity;
    for (let i = 0; i < this.nodes.length; i++) {
      const d = haversineMeters(pt, this.nodes[i]);
      if (d < minDist) {
        minDist = d;
        bestId = i;
      }
    }
    return bestId;
  }

  dijkstra(startId: number, endId: number): number[] | null {
    if (this.nodes.length === 0) return null;
    const dist: number[] = new Array(this.nodes.length).fill(Infinity);
    const prev: (number | null)[] = new Array(this.nodes.length).fill(null);
    const visited: boolean[] = new Array(this.nodes.length).fill(false);

    dist[startId] = 0;

    for (let count = 0; count < this.nodes.length; count++) {
      let u = -1;
      let minD = Infinity;

      for (let i = 0; i < this.nodes.length; i++) {
        if (!visited[i] && dist[i] < minD) {
          minD = dist[i];
          u = i;
        }
      }

      if (u === -1 || u === endId) break;
      visited[u] = true;

      for (const edge of this.nodes[u].edges) {
        if (!visited[edge.to]) {
          const alt = dist[u] + edge.dist;
          if (alt < dist[edge.to]) {
            dist[edge.to] = alt;
            prev[edge.to] = u;
          }
        }
      }
    }

    if (dist[endId] === Infinity) return null;

    const path: number[] = [];
    let curr: number | null = endId;
    while (curr !== null) {
      path.push(curr);
      curr = prev[curr];
    }
    return path.reverse();
  }
}

// Lazy Singleton Dual Graph Instances: Pedestrian (All paths) & Vehicle (Drivable roads only)
let _walkingCampusGraph: CampusGraph | null = null;
let _drivingCampusGraph: CampusGraph | null = null;

export function getWalkingCampusGraph(): CampusGraph {
  if (!_walkingCampusGraph) {
    _walkingCampusGraph = new CampusGraph(CAMPUS_ROADS);
  }
  return _walkingCampusGraph;
}

export function getDrivingCampusGraph(): CampusGraph {
  if (!_drivingCampusGraph) {
    _drivingCampusGraph = new CampusGraph(CAMPUS_ROADS.filter(r => r.drivable !== false));
  }
  return _drivingCampusGraph;
}

/**
 * Calculates optimal route (walking or driving) between two arbitrary lat/lon coordinates
 */
export function calculateCampusRoute(
  start: LatLon,
  end: LatLon,
  startLabel = "مبدأ",
  destLabel = "مقصد",
  mode: RouteMode = "walking"
): RouteResult {
  const activeGraph = mode === "driving" ? getDrivingCampusGraph() : getWalkingCampusGraph();

  const startNodeId = activeGraph.findNearestNode(start);
  const endNodeId = activeGraph.findNearestNode(end);

  const nodePath = activeGraph.dijkstra(startNodeId, endNodeId);

  const fullPath: [number, number][] = [[start.lat, start.lon]];
  let totalDistance = 0;

  if (nodePath && nodePath.length > 0) {
    const firstNode = activeGraph.nodes[nodePath[0]];
    totalDistance += haversineMeters(start, firstNode);

    for (let i = 0; i < nodePath.length; i++) {
      const n = activeGraph.nodes[nodePath[i]];
      fullPath.push([n.lat, n.lon]);
      if (i > 0) {
        const prevN = activeGraph.nodes[nodePath[i - 1]];
        totalDistance += haversineMeters(prevN, n);
      }
    }

    const lastNode = activeGraph.nodes[nodePath[nodePath.length - 1]];
    totalDistance += haversineMeters(lastNode, end);
  } else {
    // Direct fall-back line
    totalDistance = haversineMeters(start, end);
  }

  fullPath.push([end.lat, end.lon]);

  const roundedDistance = Math.round(totalDistance);

  // Speeds:
  // Walking: ~75 meters/minute (4.5 km/h)
  // Driving: ~420 meters/minute (25-30 km/h safe campus driving speed limit)
  let durationMinutes: number;
  let caloriesBurned: number | undefined;

  if (mode === "driving") {
    durationMinutes = Math.max(1, Math.ceil(roundedDistance / 420));
  } else {
    durationMinutes = Math.max(1, Math.ceil(roundedDistance / 75));
    caloriesBurned = Math.round((roundedDistance / 100) * 4.2);
  }

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function generateTurnSteps(
  path: [number, number][],
  startLabel: string,
  destLabel: string,
  _mode: RouteMode
): RouteStep[] {
  if (path.length < 2) {
    return [
      { text: `حرکت از ${startLabel}`, distance: 0, turnType: "start", coord: path[0] },
      { text: `رسیدن به ${destLabel}`, distance: 0, turnType: "destination", coord: path[0] }
    ];
  }

  const steps: RouteStep[] = [
    { text: `حرکت از ${startLabel}`, distance: 0, turnType: "start", coord: path[0] }
  ];

  let accumulatedDist = 0;
  let lastBearing: number | null = null;

  for (let i = 0; i < path.length - 1; i++) {
    const p1 = { lat: path[i][0], lon: path[i][1] };
    const p2 = { lat: path[i + 1][0], lon: path[i + 1][1] };
    const segDist = haversineMeters(p1, p2);
    accumulatedDist += segDist;

    const bearing = calculateBearing(p1.lat, p1.lon, p2.lat, p2.lon);

    if (lastBearing !== null) {
      let diff = bearing - lastBearing;
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;

      if (Math.abs(diff) >= 28 && accumulatedDist >= 25) {
        let turnType: TurnType = "straight";
        let instruction = "در امتداد مسیر ادامه دهید";

        if (diff > 60) {
          turnType = "right";
          instruction = "به سمت راست بپیچید";
        } else if (diff > 25) {
          turnType = "slight_right";
          instruction = "متمایل به راست ادامه دهید";
        } else if (diff < -60) {
          turnType = "left";
          instruction = "به سمت چپ بپیچید";
        } else if (diff < -25) {
          turnType = "slight_left";
          instruction = "متمایل به چپ ادامه دهید";
        }

        steps.push({
          text: instruction,
          distance: Math.round(accumulatedDist),
          turnType,
          coord: path[i]
        });
        accumulatedDist = 0;
      }
    }

    lastBearing = bearing;
  }

  steps.push({
    text: `رسیدن به ${destLabel}`,
    distance: Math.round(accumulatedDist),
    turnType: "destination",
    coord: path[path.length - 1]
  });

  return steps;
}

  const steps = generateTurnSteps(fullPath, startLabel, destLabel, mode);

  return {
    path: fullPath,
    distanceMeters: roundedDistance,
    durationMinutes,
    walkingMinutes: mode === "walking" ? durationMinutes : Math.max(1, Math.ceil(roundedDistance / 75)),
    drivingMinutes: mode === "driving" ? durationMinutes : Math.max(1, Math.ceil(roundedDistance / 420)),
    startLabel,
    destLabel,
    mode,
    caloriesBurned,
    steps
  };
}

/**
 * Quick access POIs for routing origins/destinations, filtered by mode
 */
export function getAllNavigationLocations(mode: RouteMode = "walking") {
  const gates = CAMPUS_GATES.filter(g => {
    if (mode === "driving") return g.isVehicleAccessible;
    return true;
  }).map(g => ({
    id: g.id,
    name: g.name,
    type: g.type,
    lat: g.lat,
    lon: g.lon
  }));

  const buildings = CAMPUS_BUILDINGS.map(b => ({
    id: b.id,
    name: b.name,
    type: b.category,
    lat: b.lat,
    lon: b.lon
  }));

  return [...gates, ...buildings];
}

/**
 * Format meters into human-readable Persian distance (kilometers or meters)
 */
export function formatCampusDistance(meters: number): { value: string; unit: string; fullText: string } {
  const m = Math.max(0, Math.round(meters));
  if (m >= 1000) {
    const km = (m / 1000).toFixed(1);
    const faKm = Number(km).toLocaleString("fa-IR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return {
      value: faKm,
      unit: "کیلومتر",
      fullText: `${faKm} کیلومتر`
    };
  }
  const faM = m.toLocaleString("fa-IR");
  return {
    value: faM,
    unit: "متر",
    fullText: `${faM} متر`
  };
}

/**
 * Calculates remaining meters along the path from current position
 */
export function calculateRemainingPathMeters(currentPoint: LatLon, fullPath: [number, number][]): number {
  if (!fullPath || fullPath.length < 2) return 0;

  let minDistanceToSegment = Infinity;
  let closestSegmentIndex = 0;
  let closestPointRatio = 0;

  for (let i = 0; i < fullPath.length - 1; i++) {
    const a = { lat: fullPath[i][0], lon: fullPath[i][1] };
    const b = { lat: fullPath[i + 1][0], lon: fullPath[i + 1][1] };
    const segLen = haversineMeters(a, b);
    if (segLen === 0) continue;

    const dLat = b.lat - a.lat;
    const dLon = b.lon - a.lon;
    let t = ((currentPoint.lat - a.lat) * dLat + (currentPoint.lon - a.lon) * dLon) / (dLat * dLat + dLon * dLon);
    t = Math.max(0, Math.min(1, t));

    const projLat = a.lat + t * dLat;
    const projLon = a.lon + t * dLon;
    const dist = haversineMeters(currentPoint, { lat: projLat, lon: projLon });

    if (dist < minDistanceToSegment) {
      minDistanceToSegment = dist;
      closestSegmentIndex = i;
      closestPointRatio = t;
    }
  }

  const segA = { lat: fullPath[closestSegmentIndex][0], lon: fullPath[closestSegmentIndex][1] };
  const segB = { lat: fullPath[closestSegmentIndex + 1][0], lon: fullPath[closestSegmentIndex + 1][1] };
  const segTotalDist = haversineMeters(segA, segB);
  let remaining = (1 - closestPointRatio) * segTotalDist;

  for (let j = closestSegmentIndex + 1; j < fullPath.length - 1; j++) {
    const p1 = { lat: fullPath[j][0], lon: fullPath[j][1] };
    const p2 = { lat: fullPath[j + 1][0], lon: fullPath[j + 1][1] };
    remaining += haversineMeters(p1, p2);
  }

  return Math.round(remaining);
}

/**
 * Interpolates a coordinate along a polyline path given progress fraction (0.0 to 1.0)
 */
export function interpolatePointAlongPath(fraction: number, fullPath: [number, number][]): [number, number] {
  if (!fullPath || fullPath.length === 0) return [0, 0];
  if (fullPath.length === 1 || fraction <= 0) return fullPath[0];
  if (fraction >= 1) return fullPath[fullPath.length - 1];

  let totalLength = 0;
  const segLengths: number[] = [];
  for (let i = 0; i < fullPath.length - 1; i++) {
    const p1 = { lat: fullPath[i][0], lon: fullPath[i][1] };
    const p2 = { lat: fullPath[i + 1][0], lon: fullPath[i + 1][1] };
    const len = haversineMeters(p1, p2);
    segLengths.push(len);
    totalLength += len;
  }

  if (totalLength === 0) return fullPath[0];

  const targetDist = fraction * totalLength;
  let accumulated = 0;

  for (let i = 0; i < segLengths.length; i++) {
    const segLen = segLengths[i];
    if (accumulated + segLen >= targetDist) {
      const segT = (targetDist - accumulated) / segLen;
      const lat = fullPath[i][0] + segT * (fullPath[i + 1][0] - fullPath[i][0]);
      const lon = fullPath[i][1] + segT * (fullPath[i + 1][1] - fullPath[i][1]);
      return [lat, lon];
    }
    accumulated += segLen;
  }

  return fullPath[fullPath.length - 1];
}

