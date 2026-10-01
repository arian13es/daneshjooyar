/**
 * ============================================================================
 * Project: دانشجویار دانشگاه تبریز (Tabriz University Student Assistant)
 * Component: CampusMap — سامانه پیشرفته نقشه هوشمند، ناوبری زنده و مکانی دانشگاه تبریز
 * Author: Arian
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  CAMPUS_METADATA,
  CAMPUS_BUILDINGS,
  CAMPUS_GATES,
  CampusBuilding,
  CampusGate
} from "../data/campusGisData";
import {
  calculateCampusRoute,
  RouteResult,
  RouteMode,
  TurnType,
  formatCampusDistance,
  calculateRemainingPathMeters
} from "../utils/campusRouting";
import { ClassItem, StudentProfile } from "../types";
import {
  Search,
  X,
  Crosshair,
  Navigation,
  ExternalLink,
  Phone,
  Globe,
  ChevronRight,
  ArrowRight,
  Footprints,
  Car,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  Flag,
  Flame,
  Clock,
  Play,
  Square,
  LocateFixed,
  Route as RouteIcon,
  Compass,
  MapPin,
  Building2,
  Layers,
  Plus,
  Minus,
  ArrowUpDown,
  ListOrdered
} from "lucide-react";
import { getFacultyTheme } from "../data/facultyThemes";
import { useHardwareBack } from "../utils/backHandler";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

interface CampusMapProps {
  profile?: StudentProfile | null;
  classes?: ClassItem[];
  initialFocusBuildingId?: string | null;
  onClearInitialFocus?: () => void;
  isDarkMode?: boolean;
  onBack?: () => void;
}

interface CategoryMeta {
  icon: string;
  gradient: string;
  borderColor: string;
  badgeBg: string;
  text: string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  faculty: {
    icon: "🎓",
    gradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
    borderColor: "#38bdf8",
    badgeBg: "rgba(2, 132, 199, 0.12)",
    text: "#0284c7"
  },
  research: {
    icon: "📚",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
    borderColor: "#a78bfa",
    badgeBg: "rgba(139, 92, 246, 0.12)",
    text: "#8b5cf6"
  },
  admin: {
    icon: "🏛️",
    gradient: "linear-gradient(135deg, #475569 0%, #1e293b 100%)",
    borderColor: "#94a3b8",
    badgeBg: "rgba(71, 85, 105, 0.12)",
    text: "#475569"
  },
  dining: {
    icon: "🍽️",
    gradient: "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
    borderColor: "#fb923c",
    badgeBg: "rgba(249, 115, 22, 0.12)",
    text: "#f97316"
  },
  dormitory: {
    icon: "🏢",
    gradient: "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
    borderColor: "#f472b6",
    badgeBg: "rgba(236, 72, 153, 0.12)",
    text: "#ec4899"
  },
  sports_culture: {
    icon: "⚽",
    gradient: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
    borderColor: "#34d399",
    badgeBg: "rgba(16, 185, 129, 0.12)",
    text: "#10b981"
  },
  general: {
    icon: "📍",
    gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
    borderColor: "#38bdf8",
    badgeBg: "rgba(14, 165, 233, 0.12)",
    text: "#0ea5e9"
  }
};

const CATEGORY_FILTERS = [
  { id: "all", label: "همه مکان‌ها", icon: "🏛️" },
  { id: "faculty", label: "دانشکده‌ها", icon: "🎓" },
  { id: "gate", label: "درب‌ها", icon: "🚪" },
  { id: "research", label: "پژوهش و کتابخانه", icon: "📚" },
  { id: "dining", label: "سلف و تغذیه", icon: "🍽️" },
  { id: "sports_culture", label: "ورزشی و رفاهی", icon: "⚽" },
];

// Esri World Imagery satellite tiles (free for dev/basic use, no Google ToS issues)
const SATELLITE_TILE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const SATELLITE_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';

function buildBuildingDivIcon(
  bldg: CampusBuilding,
  isSelected: boolean,
  isDimmed: boolean,
  zoom: number,
  selectedCategory: string,
  isDarkMode: boolean = false
) {
  const meta = CATEGORY_META[bldg.category] || CATEGORY_META.general;
  const isPrimary = bldg.category === "faculty" || bldg.id.includes("435044520") || bldg.id.includes("435044525");
  const isCategoryActive = selectedCategory !== "all" && selectedCategory === bldg.category;
  const showFullBadge = isSelected || isCategoryActive || zoom >= 16.8 || (zoom >= 16.2 && isPrimary);

  if (!showFullBadge && !isSelected) {
    const dotSize = 13;
    const opacity = isDimmed ? 0.25 : 0.85;
    const dotBorder = isDarkMode ? "#0f172a" : "#ffffff";
    const dotShadow = isDarkMode ? `0 0 6px ${meta.borderColor}70` : "0 2px 5px rgba(0,0,0,0.25)";

    return L.divIcon({
      className: "",
      html: `
        <div class="modern-map-pin" style="
          width:${dotSize}px;
          height:${dotSize}px;
          display:flex;
          align-items:center;
          justify-content:center;
          opacity:${opacity};
          cursor:pointer;
        ">
          <div style="
            width:9px;
            height:9px;
            border-radius:50%;
            background:${meta.gradient};
            border:1.5px solid ${dotBorder};
            box-shadow:${dotShadow};
          "></div>
        </div>
      `,
      iconSize: [dotSize, dotSize],
      iconAnchor: [dotSize / 2, dotSize / 2],
      popupAnchor: [0, -dotSize / 2],
      tooltipAnchor: [0, -dotSize / 2]
    });
  }

  // Full Rich Badge
  const size = isSelected ? 34 : 26;
  const opacity = isDimmed ? 0.25 : 1;
  const filter = isDimmed ? "grayscale(0.8) opacity(0.3)" : "none";
  const badgeBorder = isSelected ? "#f59e0b" : (isDarkMode ? "#38bdf8" : "#ffffff");
  const badgeShadow = isDarkMode ? "0 4px 14px rgba(0,0,0,0.6)" : "0 3px 8px rgba(0,0,0,0.18)";

  return L.divIcon({
    className: "",
    html: `
      <div class="modern-map-pin ${isSelected ? 'is-selected' : ''}" style="
        width:${size}px;
        height:${size}px;
        position:relative;
        display:flex;
        align-items:center;
        justify-content:center;
        opacity:${opacity};
        filter:${filter};
        cursor:pointer;
      ">
        ${isSelected ? `
          <div class="pin-radar-ring" style="background:rgba(245,158,11,0.3);border:2px solid #f59e0b;"></div>
        ` : ''}
        <div style="
          width:100%;
          height:100%;
          border-radius:${isSelected ? '11px' : '8px'};
          background:${isSelected ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : meta.gradient};
          border:2px solid ${badgeBorder};
          box-shadow:${badgeShadow};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${isSelected ? 15 : 12}px;
          user-select:none;
        ">
          ${meta.icon}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    tooltipAnchor: [0, -size / 2]
  });
}

function buildGateDivIcon(gate: CampusGate, isSelected: boolean, isDimmed: boolean, isDarkMode: boolean = false) {
  const isMetro = gate.type === "metro";
  const isBus = gate.type === "bus";
  const size = isSelected ? 38 : 30;
  const opacity = isDimmed ? 0.3 : 1;
  const filter = isDimmed ? "grayscale(0.75) opacity(0.35)" : "none";
  const gradient = isMetro
    ? "linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)"
    : isBus
    ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)"
    : "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)";
  const radarColor = isMetro ? "139,92,246" : isBus ? "2,132,199" : "239,68,68";
  const radarBorder = isMetro ? "#8b5cf6" : isBus ? "#0284c7" : "#ef4444";
  const iconEmoji = isMetro ? "🚇" : isBus ? "🚌" : "🚪";
  const gateBorder = isDarkMode ? "rgba(255,255,255,0.85)" : "#ffffff";
  const gateShadow = isDarkMode ? "0 4px 14px rgba(0,0,0,0.6)" : "0 3px 10px rgba(0,0,0,0.2)";

  return L.divIcon({
    className: "",
    html: `
      <div class="modern-map-pin ${isSelected ? 'is-selected' : ''}" style="
        width:${size}px;
        height:${size}px;
        position:relative;
        display:flex;
        align-items:center;
        justify-content:center;
        opacity:${opacity};
        filter:${filter};
        cursor:pointer;
      ">
        ${isSelected ? `
          <div class="pin-radar-ring" style="background:rgba(${radarColor},0.3);border:2px solid ${radarBorder};"></div>
        ` : ''}
        <div style="
          width:100%;
          height:100%;
          border-radius:50%;
          background:${gradient};
          border:2px solid ${gateBorder};
          box-shadow:${gateShadow};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:${isSelected ? 16 : 13}px;
          user-select:none;
        ">
          ${iconEmoji}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    tooltipAnchor: [0, -size / 2]
  });
}

export default function CampusMap({
  profile,
  classes = [],
  initialFocusBuildingId,
  onClearInitialFocus,
  isDarkMode = false,
  onBack
}: CampusMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const buildingMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const gateMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const routeLayerGlowRef = useRef<L.Polyline | null>(null);
  const routeLayerCoreRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<string | number | null>(null);

  // UI states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<CampusBuilding | null>(null);
  const [selectedGate, setSelectedGate] = useState<CampusGate | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(CAMPUS_METADATA.zoom);

  // Route Planning & Google Maps Style Controls
  const [isRoutePlannerOpen, setIsRoutePlannerOpen] = useState(false);
  const [plannerOriginKey, setPlannerOriginKey] = useState<string>("user_loc");
  const [plannerDestKey, setPlannerDestKey] = useState<string>("");
  const [plannerSearchQuery, setPlannerSearchQuery] = useState("");
  const [showStepsPreview, setShowStepsPreview] = useState(false);
  const [showOriginPicker, setShowOriginPicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);

  // Routing and Navigation States
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);
  const [routeMode, setRouteMode] = useState<RouteMode>("walking");
  const [selectedOriginId, setSelectedOriginId] = useState<string>("user_loc");
  const [targetBuilding, setTargetBuilding] = useState<CampusBuilding | null>(null);

  // Live Location & Navigation
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number; accuracy?: number } | null>(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [isLiveNavigating, setIsLiveNavigating] = useState(false);
  const [currentNavStepIndex, setCurrentNavStepIndex] = useState(0);
  const [remainingMeters, setRemainingMeters] = useState<number>(0);
  const [mapToast, setMapToast] = useState<string | null>(null);

  const showMapToast = useCallback((msg: string) => {
    setMapToast(msg);
    setTimeout(() => setMapToast(null), 3500);
  }, []);

  // Safety guard: prevent HUD freeze if routeResult is null
  useEffect(() => {
    if (isLiveNavigating && !routeResult) {
      setIsLiveNavigating(false);
    }
  }, [isLiveNavigating, routeResult]);

  // Search Results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    const bldgs = CAMPUS_BUILDINGS.filter(b =>
      b.name.toLowerCase().includes(q) || b.desc.toLowerCase().includes(q)
    ).map(b => ({ ...b, _type: "building" as const }));
    const gates = CAMPUS_GATES.filter(g =>
      g.name.toLowerCase().includes(q)
    ).map(g => ({ ...g, _type: "gate" as const }));
    return [...gates, ...bldgs].slice(0, 8);
  }, [searchQuery]);

  // Planner Destination list
  const plannerDestinations = useMemo(() => {
    if (!plannerSearchQuery.trim()) return CAMPUS_BUILDINGS;
    const q = plannerSearchQuery.trim().toLowerCase();
    return CAMPUS_BUILDINGS.filter(b => b.name.toLowerCase().includes(q) || (b.desc && b.desc.toLowerCase().includes(q)));
  }, [plannerSearchQuery]);

  const handleBack = useCallback(() => {
    if (showStepsPreview) {
      setShowStepsPreview(false);
      return true;
    }
    if (showOriginPicker) {
      setShowOriginPicker(false);
      return true;
    }
    if (showDestPicker) {
      setShowDestPicker(false);
      return true;
    }
    if (isRoutePlannerOpen) {
      setIsRoutePlannerOpen(false);
      return true;
    }
    if (selectedBuilding) {
      setSelectedBuilding(null);
      return true;
    }
    if (selectedGate) {
      setSelectedGate(null);
      return true;
    }
    if (isLiveNavigating || routeResult) {
      handleClearRoute();
      return true;
    }
    return false;
  }, [showStepsPreview, showOriginPicker, showDestPicker, isRoutePlannerOpen, selectedBuilding, selectedGate, isLiveNavigating, routeResult]);

  useHardwareBack(
    handleBack,
    showStepsPreview ||
    showOriginPicker ||
    showDestPicker ||
    isRoutePlannerOpen ||
    !!selectedBuilding ||
    !!selectedGate ||
    isLiveNavigating ||
    !!routeResult
  );

  // 1. Initialize Map Container
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const sw = L.latLng(CAMPUS_METADATA.bounds.sw[0], CAMPUS_METADATA.bounds.sw[1]);
    const ne = L.latLng(CAMPUS_METADATA.bounds.ne[0], CAMPUS_METADATA.bounds.ne[1]);
    const bounds = L.latLngBounds(sw, ne);

    const map = L.map(mapContainerRef.current, {
      center: [CAMPUS_METADATA.center[0], CAMPUS_METADATA.center[1]],
      zoom: CAMPUS_METADATA.zoom,
      minZoom: CAMPUS_METADATA.minZoom,
      maxZoom: CAMPUS_METADATA.maxZoom,
      maxBounds: bounds,
      maxBoundsViscosity: 0.1,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
      inertia: true,
      inertiaDeceleration: 3000
    });
    mapInstanceRef.current = map;
    map.on("zoomend", () => {
      setZoomLevel(map.getZoom());
    });

    // Layer Group for markers
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Render Buildings
    const bMap = new Map<string, L.Marker>();
    CAMPUS_BUILDINGS.forEach(b => {
      const icon = buildBuildingDivIcon(b, false, false, CAMPUS_METADATA.zoom, "all", isDarkMode);
      const marker = L.marker([b.lat, b.lon], { icon, riseOnHover: true });
      const cleanTooltipName = b.name.split("(")[0].trim();
      marker.bindTooltip(cleanTooltipName, {
        direction: "top",
        className: "campus-modern-tooltip",
        offset: [0, -15],
        opacity: 0.98
      });

      marker.on("click", () => {
        setSelectedGate(null);
        setSelectedBuilding(b);
        setTargetBuilding(b);
        map.flyTo([b.lat, b.lon], Math.max(map.getZoom(), 17), { duration: 0.4 });
      });

      marker.addTo(markersGroup);
      bMap.set(b.id, marker);
    });
    buildingMarkersRef.current = bMap;

    // Render Gates
    const gMap = new Map<string, L.Marker>();
    CAMPUS_GATES.forEach(g => {
      const icon = buildGateDivIcon(g, false, false, isDarkMode);
      const marker = L.marker([g.lat, g.lon], { icon, riseOnHover: true });
      const cleanGateName = g.name.split("(")[0].trim();
      marker.bindTooltip(cleanGateName, {
        direction: "top",
        className: "campus-modern-tooltip",
        offset: [0, -15],
        opacity: 0.98
      });

      marker.on("click", () => {
        setSelectedBuilding(null);
        setSelectedGate(g);
        map.flyTo([g.lat, g.lon], Math.max(map.getZoom(), 17), { duration: 0.4 });
      });

      marker.addTo(markersGroup);
      gMap.set(g.id, marker);
    });
    gateMarkersRef.current = gMap;

    // Initial Base Tile Layer — satellite only
    const baseLayer = L.tileLayer(SATELLITE_TILE_URL, {
      maxZoom: 19,
      attribution: SATELLITE_ATTRIBUTION,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 2
    }).addTo(map);
    activeTileLayerRef.current = baseLayer;

    // Force Leaflet to recalculate container bounds after mount & animations
    const invalidate = () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      } catch (e) {
        console.warn("[CampusMap] invalidateSize failed", e);
      }
    };
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 300);
    const t3 = setTimeout(invalidate, 600);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && mapContainerRef.current) {
      let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
      resizeObserver = new ResizeObserver(() => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(invalidate, 100);
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (resizeObserver) resizeObserver.disconnect();
      if (watchIdRef.current !== null) {
        const activeWatchId = watchIdRef.current;
        watchIdRef.current = null;
        if (Capacitor.isNativePlatform()) {
          Geolocation.clearWatch({ id: String(activeWatchId) }).catch(err => {
            console.warn("[CampusMap] Failed to clear native location watch:", err);
          });
        } else if (typeof navigator !== "undefined" && navigator.geolocation) {
          navigator.geolocation.clearWatch(Number(activeWatchId));
        }
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);


  // 3. Category Filter & Theme Icon Adaptation (Quantized zoom tier to prevent redundant rebuilds on pinch/zoom)
  const zoomTier = zoomLevel >= 16.8 ? 2 : zoomLevel >= 16.2 ? 1 : 0;

  useEffect(() => {
    const bMap = buildingMarkersRef.current;
    CAMPUS_BUILDINGS.forEach(b => {
      const marker = bMap.get(b.id);
      if (!marker) return;
      const isSelected = selectedBuilding?.id === b.id;
      const isDimmed = selectedCategory !== "all" && selectedCategory !== b.category && !isSelected;
      marker.setIcon(buildBuildingDivIcon(b, isSelected, isDimmed, zoomLevel, selectedCategory, isDarkMode));
    });

    const gMap = gateMarkersRef.current;
    CAMPUS_GATES.forEach(g => {
      const marker = gMap.get(g.id);
      if (!marker) return;
      const isSelected = selectedGate?.id === g.id;
      const isDimmed = selectedCategory !== "all" && selectedCategory !== "gate" && !isSelected;
      marker.setIcon(buildGateDivIcon(g, isSelected, isDimmed, isDarkMode));
    });
  }, [selectedCategory, selectedBuilding?.id, selectedGate?.id, zoomTier, isDarkMode]);

  // 4. Geolocation Tracking with Native Permission Request
  const isLiveNavigatingRef = useRef(isLiveNavigating);
  isLiveNavigatingRef.current = isLiveNavigating;
  const routeResultRef = useRef(routeResult);
  routeResultRef.current = routeResult;
  const currentNavStepIndexRef = useRef(currentNavStepIndex);
  currentNavStepIndexRef.current = currentNavStepIndex;

  const updateUserPositionOnMap = useCallback((latitude: number, longitude: number, accuracy?: number) => {
    const newLoc = { lat: latitude, lon: longitude, accuracy };
    setUserLocation(newLoc);

    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;

      if (userAccuracyCircleRef.current) {
        userAccuracyCircleRef.current.setLatLng([latitude, longitude]).setRadius(accuracy || 20);
      } else {
        userAccuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: accuracy || 20,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.12,
          weight: 1
        }).addTo(map);
      }

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([latitude, longitude]);
      } else {
        const userIcon = L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:28px;height:28px;display:flex;align-items:center;justify-content:center;">
              <div class="pin-radar-ring" style="background:rgba(59,130,246,0.35);border:2px solid #3b82f6;"></div>
              <div style="width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid #ffffff;box-shadow:0 2px 8px rgba(0,0,0,0.4);position:relative;z-index:2;"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });
        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
      }

      if (isLiveNavigatingRef.current && routeResultRef.current) {
        const activeRoute = routeResultRef.current;
        const rem = calculateRemainingPathMeters(newLoc, activeRoute.path);
        setRemainingMeters(rem);

        const stepIndex = currentNavStepIndexRef.current;
        const currStep = activeRoute.steps[stepIndex];
        if (currStep?.coord) {
          const dToTurn = L.latLng(latitude, longitude).distanceTo(L.latLng(currStep.coord[0], currStep.coord[1]));
          if (dToTurn < 22 && stepIndex < activeRoute.steps.length - 1) {
            setCurrentNavStepIndex(prev => prev + 1);
          }
        }

        map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
      }
    }
    // Navigation state is read via refs so the geolocation watch
    // callback created once at setup never goes stale.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleLiveLocationTracking = useCallback(async () => {
    if (isLiveTracking && watchIdRef.current !== null) {
      if (Capacitor.isNativePlatform()) {
        try {
          await Geolocation.clearWatch({ id: String(watchIdRef.current) });
        } catch {
          /* watch already cleared */
        }
      } else if (navigator.geolocation) {
        navigator.geolocation.clearWatch(Number(watchIdRef.current));
      }
      watchIdRef.current = null;
      setIsLiveTracking(false);
      return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        const permStatus = await Geolocation.checkPermissions();
        if (permStatus.location !== 'granted') {
          const req = await Geolocation.requestPermissions({ permissions: ['location'] });
          if (req.location !== 'granted') {
            showMapToast("دسترسی به مکان داده نشد. لطفاً در تنظیمات گوشی مجوز لوکیشن را فعال کنید.");
            return;
          }
        }

        setIsLiveTracking(true);
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        updateUserPositionOnMap(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([pos.coords.latitude, pos.coords.longitude], 18, { duration: 0.5 });
        }

        const watchId = await Geolocation.watchPosition({ enableHighAccuracy: true }, (position) => {
          if (position) {
            updateUserPositionOnMap(position.coords.latitude, position.coords.longitude, position.coords.accuracy);
          }
        });
        watchIdRef.current = watchId;
      } catch (err) {
        console.warn("Native location error:", err);
        showMapToast("دریافت موقعیت ممکن نشد. لطفاً GPS دستگاه را روشن کنید.");
        setIsLiveTracking(false);
      }
    } else {
      if (!navigator.geolocation) {
        showMapToast("مرورگر شما از موقعیت‌یابی پشتیبانی نمی‌کند.");
        return;
      }

      setIsLiveTracking(true);
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          updateUserPositionOnMap(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        },
        (err) => {
          console.warn("Geolocation watch error:", err);
          showMapToast("دسترسی به مکان داده نشد یا GPS خاموش است.");
          setIsLiveTracking(false);
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
      watchIdRef.current = id;
    }
  }, [isLiveTracking, updateUserPositionOnMap]);

  const handleLocateUser = async () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lon], 18, { duration: 0.5 });
    } else {
      await toggleLiveLocationTracking();
    }
  };

  // 5. External Focus Request
  useEffect(() => {
    if (!initialFocusBuildingId || !mapInstanceRef.current) return;
    const bldg = CAMPUS_BUILDINGS.find(b => b.id === initialFocusBuildingId);
    if (bldg) {
      setSelectedBuilding(bldg);
      setTargetBuilding(bldg);
      mapInstanceRef.current.flyTo([bldg.lat, bldg.lon], 18, { duration: 0.5 });
    }
    onClearInitialFocus?.();
  }, [initialFocusBuildingId, onClearInitialFocus]);

  // 6. Universal Location Resolver
  const resolveLocation = useCallback((id: string): { coord: { lat: number; lon: number }; label: string } | null => {
    if (id === "user_loc") {
      if (userLocation) {
        return { coord: { lat: userLocation.lat, lon: userLocation.lon }, label: "موقعیت من" };
      }
      const defaultGate = CAMPUS_GATES[0];
      if (defaultGate) {
        return { coord: { lat: defaultGate.lat, lon: defaultGate.lon }, label: defaultGate.name.split("(")[0].trim() };
      }
      return null;
    }
    const gate = CAMPUS_GATES.find(g => g.id === id);
    if (gate) {
      return { coord: { lat: gate.lat, lon: gate.lon }, label: gate.name.split("(")[0].trim() };
    }
    const bldg = CAMPUS_BUILDINGS.find(b => b.id === id);
    if (bldg) {
      return { coord: { lat: bldg.lat, lon: bldg.lon }, label: bldg.name };
    }
    return null;
  }, [userLocation]);

  // 7. Route Execution Engine with Adaptive Theme Polyline
  const executeRoute = useCallback((originKey: string, destKey: string, mode: RouteMode): boolean => {
    const originLoc = resolveLocation(originKey);
    const destLoc = resolveLocation(destKey);

    if (!destLoc) {
      showMapToast("لطفاً مقصد معتبری را انتخاب فرمایید.");
      return false;
    }

    if (!originLoc) {
      showMapToast("موقعیت مبدأ مشخص نیست. لطفاً یکی از درب‌ها یا موقعیت مکانی را انتخاب فرمایید.");
      return false;
    }

    try {
      const result = calculateCampusRoute(
        originLoc.coord,
        destLoc.coord,
        originLoc.label,
        destLoc.label,
        mode
      );

      setRouteResult(result);
      setSelectedOriginId(originKey);
      setPlannerOriginKey(originKey);
      setPlannerDestKey(destKey);
      setCurrentNavStepIndex(0);
      setRemainingMeters(result.distanceMeters);

      // Draw Dual-Layer Polyline customized for Light vs Dark
      if (mapInstanceRef.current) {
        const map = mapInstanceRef.current;
        if (routeLayerGlowRef.current) map.removeLayer(routeLayerGlowRef.current);
        if (routeLayerCoreRef.current) map.removeLayer(routeLayerCoreRef.current);

        const glowColor = isDarkMode ? "#f59e0b" : "#38bdf8";
        const coreColor = isDarkMode ? "#fbbf24" : "#1d4ed8";

        const glowPolyline = L.polyline(result.path, {
          color: glowColor,
          weight: 10,
          opacity: isDarkMode ? 0.4 : 0.25,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(map);

        const corePolyline = L.polyline(result.path, {
          color: coreColor,
          weight: 5,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
          dashArray: "8, 8"
        }).addTo(map);

        routeLayerGlowRef.current = glowPolyline;
        routeLayerCoreRef.current = corePolyline;
        map.fitBounds(corePolyline.getBounds(), { padding: [60, 60] });
      }
      return true;
    } catch (err) {
      console.error("Routing error:", err);
      showMapToast("خطا در محاسبه مسیر. لطفاً مجدداً تلاش فرمایید.");
      return false;
    }
  }, [resolveLocation, isDarkMode, showMapToast]);

  const handleClearRoute = () => {
    setRouteResult(null);
    setIsLiveNavigating(false);
    setCurrentNavStepIndex(0);
    setRemainingMeters(0);
    setShowStepsPreview(false);
    setShowOriginPicker(false);
    setShowDestPicker(false);

    if (mapInstanceRef.current) {
      if (routeLayerGlowRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerGlowRef.current);
        routeLayerGlowRef.current = null;
      }
      if (routeLayerCoreRef.current) {
        mapInstanceRef.current.removeLayer(routeLayerCoreRef.current);
        routeLayerCoreRef.current = null;
      }
    }
  };

  const handleSwapOriginDest = () => {
    const oldOrigin = selectedOriginId;
    const oldDest = plannerDestKey;
    if (oldOrigin && oldDest) {
      executeRoute(oldDest, oldOrigin, routeMode);
    }
  };

  const handleSwitchMode = (newMode: RouteMode) => {
    setRouteMode(newMode);
    if (selectedOriginId && plannerDestKey) {
      executeRoute(selectedOriginId, plannerDestKey, newMode);
    }
  };

  const handleStartRoutingToBuilding = (bldg: CampusBuilding) => {
    setSelectedBuilding(null);
    setTargetBuilding(bldg);
    const origin = userLocation ? "user_loc" : (selectedOriginId || CAMPUS_GATES[0].id);
    executeRoute(origin, bldg.id, routeMode);
  };

  const handleAdvanceNavStep = () => {
    if (!routeResult || !routeResult.steps) return;
    const nextIdx = currentNavStepIndex + 1;
    if (nextIdx < routeResult.steps.length) {
      setCurrentNavStepIndex(nextIdx);
      const step = routeResult.steps[nextIdx];
      if (step.coord) {
        const ratio = (nextIdx + 1) / routeResult.steps.length;
        setRemainingMeters(Math.max(0, Math.round((1 - ratio) * routeResult.distanceMeters)));
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([step.coord[0], step.coord[1]], { animate: true, duration: 0.4 });
        }
      }
    }
  };

  const getTurnIcon = (turnType?: TurnType) => {
    switch (turnType) {
      case "right":
      case "slight_right":
        return <CornerUpRight className="w-5 h-5 text-amber-500" />;
      case "left":
      case "slight_left":
        return <CornerUpLeft className="w-5 h-5 text-amber-500" />;
      case "destination":
        return <Flag className="w-5 h-5 text-emerald-500" />;
      default:
        return <ArrowUp className="w-5 h-5 text-sky-500" />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans" dir="rtl">

      {/* Floating Map Toast */}
      {mapToast && (
        <div className="absolute top-16 sm:top-18 pt-[env(safe-area-inset-top,0px)] left-4 right-4 z-[650] max-w-sm mx-auto bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl text-xs font-black text-center border border-white/20">
          {mapToast}
        </div>
      )}

      {/* 1. MINIMAL FLOATING TOP BAR */}
      {!isLiveNavigating && !routeResult && (
        <div className="absolute top-1.5 sm:top-2.5 pt-[env(safe-area-inset-top,0px)] left-3 right-3 z-[500] flex flex-col gap-2 pointer-events-none">
          {/* Main Search Pill */}
          <div className="pointer-events-auto flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-2xl px-3 py-2 shadow-lg shadow-slate-900/5 transition-all">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="h-9 w-9 sm:h-10 sm:w-10 inline-flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors shrink-0 cursor-pointer"
                title="بازگشت"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <Search className="w-4 h-4 text-sky-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="جستجوی مکان، دانشکده، سلف..."
              className="flex-1 bg-transparent text-xs font-bold text-slate-800 dark:text-white outline-none placeholder:text-slate-400 min-w-0"
              dir="rtl"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setIsSearchOpen(false); }} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-0.5">
            {CATEGORY_FILTERS.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[10px] font-black transition-all flex items-center gap-1 shadow-xs  ${
                  selectedCategory === cat.id
                    ? "bg-sky-600 text-white shadow-sky-600/30 scale-105"
                    : "bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl max-h-56 overflow-y-auto">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                    if (item._type === "building") {
                      setSelectedGate(null);
                      setSelectedBuilding(item as CampusBuilding);
                      setTargetBuilding(item as CampusBuilding);
                    } else {
                      setSelectedBuilding(null);
                      setSelectedGate(item as unknown as CampusGate);
                    }
                    mapInstanceRef.current?.flyTo([item.lat, item.lon], 18, { duration: 0.4 });
                  }}
                  className="p-2.5 hover:bg-sky-50 dark:hover:bg-sky-950/30 cursor-pointer flex items-center justify-between border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {item._type === "gate"
                        ? ((item as unknown as CampusGate).type === "metro" ? "🚇" : (item as unknown as CampusGate).type === "bus" ? "🚌" : "🚪")
                        : "🏛️"}
                    </span>
                    <div className="text-xs font-black text-slate-800 dark:text-white">{item.name}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. GOOGLE MAPS STYLE DIRECTION HEADER */}
      {!isLiveNavigating && routeResult && (
        <div className="absolute top-1.5 sm:top-2.5 pt-[env(safe-area-inset-top,0px)] left-3 right-3 z-[500] max-w-lg mx-auto flex flex-col gap-2 pointer-events-auto animate-in slide-in-from-top duration-250">
          <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-3 shadow-2xl flex flex-col gap-2.5">
            {/* Top row: Back button + Origin/Destination inputs + Swap button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearRoute}
                className="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 transition-colors cursor-pointer"
                title="خروج از مسیریابی"
              >
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Connected Dots & Inputs */}
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                {/* Origin field */}
                <div
                  onClick={() => setShowOriginPicker(true)}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 ring-2 ring-blue-500/20" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {routeResult.startLabel}
                  </span>
                </div>

                {/* Destination field */}
                <div
                  onClick={() => setShowDestPicker(true)}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-slate-200/70 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-500/20" />
                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">
                    {routeResult.destLabel}
                  </span>
                </div>
              </div>

              {/* Swap Origin / Destination button */}
              <button
                type="button"
                onClick={handleSwapOriginDest}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 transition-colors cursor-pointer active:rotate-180"
                title="جابجایی مبدأ و مقصد"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs with Real ETAs */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleSwitchMode("walking")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  routeMode === "walking"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>پیاده‌روی</span>
                {routeResult.walkingMinutes !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    routeMode === "walking" ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}>
                    {routeResult.walkingMinutes} دقیقه
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode("driving")}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  routeMode === "driving"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>خودرویی</span>
                {routeResult.drivingMinutes !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    routeMode === "driving" ? "bg-white/25 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}>
                    {routeResult.drivingMinutes} دقیقه
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAP CANVAS */}
      <div ref={mapContainerRef} className="w-full h-full flex-1 z-0 relative min-h-[350px]" dir="ltr" style={{ width: "100%", height: "100%" }} />

      {/* 3. MINIMAL FLOATING ACTION CONTROLS (Elevated above bottom navigation bar) */}
      {!isLiveNavigating && !selectedBuilding && !selectedGate && (
        <div className="absolute right-3.5 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-[400] flex flex-col gap-2">
          {/* Zoom In (+) Button */}
          <button
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 shadow-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="بزرگ‌نمایی"
            aria-label="بزرگ‌نمایی"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Zoom Out (-) Button */}
          <button
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 shadow-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="کوچک‌نمایی"
            aria-label="کوچک‌نمایی"
          >
            <Minus className="w-5 h-5" />
          </button>

          {/* GPS Button */}
          <button
            onClick={handleLocateUser}
            className={`w-11 h-11 rounded-2xl  border shadow-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isLiveTracking
                ? "bg-blue-600 text-white border-blue-500 shadow-blue-600/35 animate-pulse"
                : "bg-white/95 dark:bg-slate-900/95 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
            title={isLiveTracking ? "ردیابی زنده فعال است" : "موقعیت من"}
          >
            <Crosshair className="w-5 h-5" />
          </button>

          {/* Route Navigation Button */}
          <button
            onClick={() => setIsRoutePlannerOpen(true)}
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30 border border-amber-300/30 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="مسیریابی پردیس دانشگاه"
          >
            <RouteIcon className="w-5 h-5" />
          </button>

          {/* Re-center Campus Button */}
          <button
            onClick={() => {
              mapInstanceRef.current?.flyTo([CAMPUS_METADATA.center[0], CAMPUS_METADATA.center[1]], CAMPUS_METADATA.zoom, { duration: 0.5 });
            }}
            className="w-11 h-11 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 text-sky-600 dark:text-sky-400 hover:text-sky-700 shadow-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="نمای کلی پردیس دانشگاه"
          >
            <Building2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* 4. ROUTE PLANNER MODAL */}
      {isRoutePlannerOpen && (
        <div className="fixed inset-0 z-[600] bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">مسیریابی هوشمند دانشگاه</h3>
              </div>
              <button
                onClick={() => setIsRoutePlannerOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Travel Mode Selector */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setRouteMode("walking")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  routeMode === "walking"
                    ? "bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>پیاده‌روی</span>
              </button>
              <button
                onClick={() => setRouteMode("driving")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  routeMode === "driving"
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>خودرویی</span>
              </button>
            </div>

            {/* Origin Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-blue-500" />
                <span>مبدأ حرکت:</span>
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <button
                  onClick={() => setPlannerOriginKey("user_loc")}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                    plannerOriginKey === "user_loc"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <LocateFixed className="w-3 h-3" />
                  <span>موقعیت زنده</span>
                </button>

                {CAMPUS_GATES.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setPlannerOriginKey(g.id)}
                    className={`whitespace-nowrap px-2 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
                      plannerOriginKey === g.id
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span>{g.type === "metro" ? "🚇" : g.type === "bus" ? "🚌" : "🚪"}</span>
                    <span>{g.name.split("(")[0].trim()}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Destination Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Flag className="w-3 h-3 text-emerald-500" />
                <span>مقصد:</span>
              </label>
              <input
                type="text"
                placeholder="فیلتر نام دانشکده، سلف، کتابخانه..."
                value={plannerSearchQuery}
                onChange={e => setPlannerSearchQuery(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none border border-slate-200/80 dark:border-slate-700"
              />
              <div className="max-h-36 overflow-y-auto flex flex-col gap-1 border border-slate-100 dark:border-slate-800 rounded-xl p-1">
                {plannerDestinations.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setPlannerDestKey(b.id)}
                    className={`p-1.5 rounded-lg text-right text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                      plannerDestKey === b.id
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span>{CATEGORY_META[b.category]?.icon || "🏛️"}</span>
                      <span className="truncate">{b.name}</span>
                    </div>
                    {plannerDestKey === b.id && <span className="text-[9px] text-amber-600 font-black shrink-0">انتخاب شد</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  const bldg = CAMPUS_BUILDINGS.find(b => b.id === plannerDestKey);
                  if (bldg) {
                    setSelectedBuilding(bldg);
                    setTargetBuilding(bldg);
                    setSelectedOriginId(plannerOriginKey);
                    executeRoute(plannerOriginKey, bldg.id, routeMode);
                    setIsRoutePlannerOpen(false);
                  }
                }}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <RouteIcon className="w-3.5 h-3.5" />
                <span>مشاهده مسیر</span>
              </button>

              <button
                onClick={() => {
                  const bldg = CAMPUS_BUILDINGS.find(b => b.id === plannerDestKey);
                  if (bldg) {
                    setSelectedBuilding(bldg);
                    setTargetBuilding(bldg);
                    setSelectedOriginId(plannerOriginKey);
                    executeRoute(plannerOriginKey, bldg.id, routeMode);
                    setIsRoutePlannerOpen(false);
                    setIsLiveNavigating(true);
                  }
                }}
                className="py-2.5 px-3.5 bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-3 h-3 fill-white" />
                <span>شروع ناوبری</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. LIVE NAVIGATION HUD */}
      {isLiveNavigating && routeResult && (
        <>
          <div className="absolute top-3 left-3 right-3 z-[500] max-w-lg mx-auto bg-slate-900/95 text-white rounded-2xl p-3.5 shadow-2xl border border-slate-700/80 flex items-center justify-between animate-in slide-in-from-top duration-250">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                {getTurnIcon(routeResult.steps[currentNavStepIndex]?.turnType)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-amber-400">
                  {routeResult.steps[currentNavStepIndex]?.distance ? `${routeResult.steps[currentNavStepIndex].distance} متر بعد` : "گام بعدی"}
                </div>
                <h3 className="text-xs font-black text-white mt-0.5 leading-snug truncate">
                  {routeResult.steps[currentNavStepIndex]?.text || "در امتداد مسیر ادامه دهید"}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 mr-2">
              <button
                onClick={handleAdvanceNavStep}
                className="px-2 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black text-white border border-white/10 flex items-center shrink-0 active:scale-95 transition-all cursor-pointer"
                title="گام بعد"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" />
              </button>

              <button
                onClick={() => setIsLiveNavigating(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
                title="توقف ناوبری"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="absolute bottom-24 sm:bottom-28 left-3 right-3 z-[500] max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-2xl flex flex-col gap-2.5 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCampusDistance(remainingMeters).value}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1.5">
                  {formatCampusDistance(remainingMeters).unit} باقی‌مانده
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{Math.max(1, Math.ceil(remainingMeters / (routeMode === "driving" ? 420 : 75)))} دقیقه</span>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-l from-emerald-500 to-amber-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, (1 - remainingMeters / (routeResult.distanceMeters || 1)) * 100))}%` }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleClearRoute}
                className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>پایان ناوبری</span>
              </button>

              <button
                onClick={() => {
                  const newMode = routeMode === "walking" ? "driving" : "walking";
                  setRouteMode(newMode);
                  if (targetBuilding) {
                    executeRoute(selectedOriginId, targetBuilding.id, newMode);
                  }
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                {routeMode === "walking" ? <Footprints className="w-3.5 h-3.5 text-amber-500" /> : <Car className="w-3.5 h-3.5 text-blue-500" />}
                <span>{routeMode === "walking" ? "پیاده" : "خودرو"}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 6. GOOGLE MAPS STYLE BOTTOM ROUTE CARD */}
      {!isLiveNavigating && routeResult && (
        <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] landscape:bottom-3 landscape:left-3 landscape:right-auto landscape:w-84 left-3 right-3 z-[500] max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom duration-250">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {routeMode === "driving" ? `${routeResult.drivingMinutes} دقیقه` : `${routeResult.walkingMinutes} دقیقه`}
                </span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  ({formatCampusDistance(routeResult.distanceMeters).fullText})
                </span>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5">
                {routeMode === "driving" ? "مسیر دسترسی سواره در معابر دانشگاه" : "مسیر عابر پیاده دانشگاه تبریز"}
                {routeResult.caloriesBurned ? ` • حدود ${routeResult.caloriesBurned} کالری` : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowStepsPreview(!showStepsPreview)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
              <span>مراحل</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLiveNavigating(true)}
              className="flex-1 py-3 bg-gradient-to-l from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>شروع ناوبری زنده</span>
            </button>

            <button
              type="button"
              onClick={handleClearRoute}
              className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black transition-colors cursor-pointer"
            >
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* 7. STEP-BY-STEP PREVIEW DRAWER */}
      {showStepsPreview && routeResult && (
        <div className="fixed inset-0 z-[600] bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 max-h-[65vh] overflow-hidden animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ListOrdered className="w-4 h-4 text-sky-500" />
                <span>مراحل گام‌به‌گام مسیر</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowStepsPreview(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex flex-col gap-2 p-1">
              {routeResult.steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                    {getTurnIcon(step.turnType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{step.text}</p>
                    {step.distance > 0 && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{step.distance} متر</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. ORIGIN PICKER MODAL */}
      {showOriginPicker && (
        <div className="fixed inset-0 z-[600] bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>انتخاب مبدأ حرکت</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOriginPicker(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex flex-col gap-1.5 p-1">
              {/* GPS Option */}
              <button
                type="button"
                onClick={() => {
                  setShowOriginPicker(false);
                  if (plannerDestKey) executeRoute("user_loc", plannerDestKey, routeMode);
                  else setSelectedOriginId("user_loc");
                }}
                className={`p-2.5 rounded-xl text-right text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  selectedOriginId === "user_loc"
                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <LocateFixed className="w-4 h-4 text-blue-500 shrink-0" />
                <span>موقعیت زنده من (GPS)</span>
              </button>

              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-1 pt-2">درب‌های ورودی پردیس:</div>
              {CAMPUS_GATES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setShowOriginPicker(false);
                    if (plannerDestKey) executeRoute(g.id, plannerDestKey, routeMode);
                    else setSelectedOriginId(g.id);
                  }}
                  className={`p-2.5 rounded-xl text-right text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    selectedOriginId === g.id
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{g.type === "metro" ? "🚇" : g.type === "bus" ? "🚌" : "🚪"}</span>
                    <span>{g.name}</span>
                  </div>
                  {selectedOriginId === g.id && <span className="text-[10px] text-amber-600 font-bold">انتخاب‌شده</span>}
                </button>
              ))}

              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-1 pt-2">دانشکده‌ها و ساختمان‌ها:</div>
              {CAMPUS_BUILDINGS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setShowOriginPicker(false);
                    if (plannerDestKey) executeRoute(b.id, plannerDestKey, routeMode);
                    else setSelectedOriginId(b.id);
                  }}
                  className={`p-2 rounded-xl text-right text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    selectedOriginId === b.id
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{CATEGORY_META[b.category]?.icon || "🏛️"}</span>
                    <span className="truncate">{b.name}</span>
                  </div>
                  {selectedOriginId === b.id && <span className="text-[10px] text-amber-600 font-bold shrink-0">انتخاب‌شده</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 9. DESTINATION PICKER MODAL */}
      {showDestPicker && (
        <div className="fixed inset-0 z-[600] bg-black/75 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3 max-h-[70vh] overflow-hidden animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-500" />
                <span>انتخاب مقصد</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDestPicker(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <input
              type="text"
              placeholder="جستجوی نام دانشکده، کتابخانه، سلف..."
              value={plannerSearchQuery}
              onChange={(e) => setPlannerSearchQuery(e.target.value)}
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none border border-slate-200 dark:border-slate-700"
            />

            <div className="overflow-y-auto flex flex-col gap-1.5 p-1">
              {plannerDestinations.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setShowDestPicker(false);
                    const origin = selectedOriginId || (userLocation ? "user_loc" : CAMPUS_GATES[0].id);
                    executeRoute(origin, b.id, routeMode);
                  }}
                  className={`p-2.5 rounded-xl text-right text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    plannerDestKey === b.id
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span>{CATEGORY_META[b.category]?.icon || "🏛️"}</span>
                    <span className="truncate">{b.name}</span>
                  </div>
                  {plannerDestKey === b.id && <span className="text-[10px] text-emerald-600 font-bold shrink-0">مقصد فعلی</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. MINIMAL BUILDING BOTTOM SHEET */}
      {!isLiveNavigating && selectedBuilding && (
        <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] landscape:bottom-3 landscape:top-16 landscape:left-3 landscape:right-auto landscape:w-80 landscape:max-h-[calc(100vh-5rem)] left-3 right-3 z-[450] max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-2.5 max-h-[45vh] overflow-y-auto">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/50 px-2 py-0.5 rounded-md border border-sky-200 dark:border-sky-800">
                {selectedBuilding.cat_label}
              </span>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1 leading-snug truncate">
                {selectedBuilding.name}
              </h3>
            </div>
            <button
              onClick={() => { setSelectedBuilding(null); handleClearRoute(); }}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mr-2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 line-clamp-2">
            {selectedBuilding.desc}
          </p>

          <div className="flex flex-wrap gap-1.5">
            {selectedBuilding.phone && (
              <a
                href={`tel:${selectedBuilding.phone.replace(/[^0-9]/g, "")}`}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-colors"
              >
                <Phone className="w-3 h-3 text-sky-500" />
                <span>{selectedBuilding.phone}</span>
              </a>
            )}
            {selectedBuilding.website && (
              <a
                href={selectedBuilding.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-[10px] font-bold text-sky-600 dark:text-sky-300 hover:bg-sky-100 transition-colors border border-sky-200 dark:border-sky-800"
              >
                <Globe className="w-3 h-3" />
                <span>وب‌سایت</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => handleStartRoutingToBuilding(selectedBuilding)}
              className="w-full py-2.5 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>مسیریابی به این مکان</span>
            </button>
          </div>
        </div>
      )}

      {/* 8. MINIMAL GATE BOTTOM SHEET */}
      {!isLiveNavigating && selectedGate && (
        <div className="absolute bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] landscape:bottom-3 landscape:top-16 landscape:left-3 landscape:right-auto landscape:w-80 landscape:max-h-[calc(100vh-5rem)] left-3 right-3 z-[450] max-w-md mx-auto bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-2.5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedGate.type === "metro" ? "🚇" : selectedGate.type === "bus" ? "🚌" : "🚪"}</span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">{selectedGate.name}</h3>
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                  {selectedGate.type === "metro"
                    ? "ایستگاه مترو دانشگاه"
                    : selectedGate.type === "bus"
                    ? "ایستگاه بی‌آر‌تی دانشگاه"
                    : "درب ورود پردیس"}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setSelectedGate(null); handleClearRoute(); }}
              className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            {selectedGate.desc}
          </p>

          <button
            onClick={() => {
              const gateId = selectedGate.id;
              setSelectedGate(null);
              setPlannerOriginKey(gateId);
              setSelectedOriginId(gateId);
              setShowDestPicker(true);
            }}
            className="w-full py-2.5 bg-gradient-to-l from-amber-500 to-amber-600 text-white text-xs font-black rounded-xl shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>مسیریابی از این مکان</span>
          </button>
        </div>
      )}

    </div>
  );
}
