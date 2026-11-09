import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Globe,
  Crosshair,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  Filter,
  Eye,
  Sparkles,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  CelestialPoint,
  TechnosignatureHotspot,
  buildCelestialHeatmapDataset,
  formatRaSexagesimal,
  formatDecSexagesimal,
  equatorialToGalactic,
  TECHNOSIGNATURE_HOTSPOTS,
} from '../../engine/anomalyHeatmapEngine';
import { CatalogTarget, CatalogAnomaly } from '../../data/astronomicalCatalog';
import { soundFX } from '../ui/AudioFeedback';

export interface D3AnomalyHeatmapProps {
  selectedTargetId?: string;
  onSelectTarget?: (target: CatalogTarget) => void;
  onSelectAnomaly?: (anomaly: CatalogAnomaly) => void;
  onSelectTargetById?: (targetId: string) => void;
  className?: string;
}

type ProjectionType = 'EQUAL_EARTH' | 'EQUIRECTANGULAR';
type ColorRampType = 'PLASMA' | 'INFERNO' | 'VIRIDIS';
type CategoryFilter = 'ALL' | 'DYSON_SPHERE' | 'RADIO_TECHNOSIGNATURE' | 'GRAVITATIONAL_MICROLENSING' | 'EXTREME_TRANSIT';

export default function D3AnomalyHeatmap({
  selectedTargetId,
  onSelectTarget,
  onSelectAnomaly,
  onSelectTargetById,
  className = '',
}: D3AnomalyHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Component States
  const [projectionType, setProjectionType] = useState<ProjectionType>('EQUAL_EARTH');
  const [colorRamp, setColorRamp] = useState<ColorRampType>('PLASMA');
  const [minConfidence, setMinConfidence] = useState<number>(0);
  const [bandwidth, setBandwidth] = useState<number>(24);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('ALL');
  const [showCatalogStars, setShowCatalogStars] = useState<boolean>(true);
  const [showDensityContours, setShowDensityContours] = useState<boolean>(true);
  const [showHotspotLabels, setShowHotspotLabels] = useState<boolean>(true);
  const [showGraticule, setShowGraticule] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<TechnosignatureHotspot | null>(null);

  // Hover Tooltip & Crosshair state
  const [hoveredPoint, setHoveredPoint] = useState<CelestialPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [mouseSkyCoords, setMouseSkyCoords] = useState<{ ra: number; dec: number } | null>(null);

  // Full Celestial Dataset
  const rawDataset = useMemo(() => buildCelestialHeatmapDataset(), []);

  // Filtered dataset for D3 density calculation
  const filteredPoints = useMemo(() => {
    return rawDataset.filter((p) => {
      if (p.isAnomaly && p.confidencePct < minConfidence) return false;
      if (activeCategory !== 'ALL' && p.category !== activeCategory && p.isAnomaly) return false;
      return true;
    });
  }, [rawDataset, minConfidence, activeCategory]);

  // Color Interpolator selection
  const colorInterpolator = useMemo(() => {
    switch (colorRamp) {
      case 'INFERNO':
        return d3.interpolateInferno;
      case 'VIRIDIS':
        return d3.interpolateViridis;
      case 'PLASMA':
      default:
        return d3.interpolatePlasma;
    }
  }, [colorRamp]);

  // Main D3 Rendering Effect
  useEffect(() => {
    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    // Clear previous SVG contents
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Create defs for glow filters and gradients
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'techno-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Configure Projection
    // Astronomical convention: RA runs from East to West or inverted longitude [-180, 180]
    let projection: d3.GeoProjection;
    if (projectionType === 'EQUAL_EARTH') {
      projection = d3
        .geoEqualEarth()
        .scale(width / (2 * Math.PI) * 0.92)
        .translate([width / 2, height / 2]);
    } else {
      projection = d3
        .geoEquirectangular()
        .scale(width / (2 * Math.PI) * 0.88)
        .translate([width / 2, height / 2]);
    }

    const geoPath = d3.geoPath(projection);

    // Zoom container
    const gRoot = svg.append('g').attr('class', 'zoomable-container');

    // Setup d3.zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.8, 12])
      .on('zoom', (event) => {
        gRoot.attr('transform', event.transform.toString());
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // 1. Celestial Sphere Background Outline & Fill
    const backgroundLayer = gRoot.append('g').attr('class', 'background-layer');

    if (projectionType === 'EQUAL_EARTH') {
      backgroundLayer
        .append('path')
        .datum({ type: 'Sphere' } as any)
        .attr('d', geoPath)
        .attr('fill', '#04020a')
        .attr('stroke', '#4c1d95')
        .attr('stroke-width', 1.5)
        .attr('opacity', 0.85);
    } else {
      backgroundLayer
        .append('rect')
        .attr('x', width * 0.05)
        .attr('y', height * 0.08)
        .attr('width', width * 0.9)
        .attr('height', height * 0.84)
        .attr('fill', '#04020a')
        .attr('stroke', '#4c1d95')
        .attr('stroke-width', 1.2)
        .attr('rx', 8)
        .attr('opacity', 0.85);
    }

    // 2. Graticule Lines (30° intervals)
    if (showGraticule) {
      const graticule = d3.geoGraticule().step([30, 30]);
      const graticuleLayer = gRoot.append('g').attr('class', 'graticule-layer');

      graticuleLayer
        .append('path')
        .datum(graticule)
        .attr('d', geoPath)
        .attr('fill', 'none')
        .attr('stroke', '#3b0764')
        .attr('stroke-width', 0.7)
        .attr('stroke-opacity', 0.5)
        .attr('stroke-dasharray', '3,3');

      // Celestial Equator (Dec = 0)
      const equator = d3.geoCircle().center([0, 90]).radius(90)();
      graticuleLayer
        .append('path')
        .datum(equator)
        .attr('d', geoPath)
        .attr('fill', 'none')
        .attr('stroke', '#06b6d4')
        .attr('stroke-width', 1.0)
        .attr('stroke-opacity', 0.45);
    }

    // 3. Galactic Plane Curve (Milky Way Equator)
    const galacticPlanePoints: [number, number][] = [];
    for (let l = 0; l <= 360; l += 4) {
      // Inverse Galactic to Equatorial for b = 0
      const lRad = (l - 32.93192) * (Math.PI / 180);
      const decGRad = 27.12825 * (Math.PI / 180);
      const raGRad = 192.85948 * (Math.PI / 180);

      const sinDec = Math.cos(decGRad) * Math.sin(lRad);
      const decRad = Math.asin(sinDec);
      const cosDec = Math.cos(decRad);

      const y = Math.cos(lRad);
      const x = -Math.sin(decGRad) * Math.sin(lRad);
      let raRad = Math.atan2(y, x) + raGRad;
      let raDeg = (raRad * (180 / Math.PI)) % 360;
      if (raDeg < 0) raDeg += 360;

      // Project RA into [-180, 180] for D3 projection
      const lon = raDeg > 180 ? raDeg - 360 : raDeg;
      galacticPlanePoints.push([lon, decRad * (180 / Math.PI)]);
    }

    const galacticLineString = {
      type: 'LineString',
      coordinates: galacticPlanePoints,
    };

    gRoot
      .append('path')
      .datum(galacticLineString as any)
      .attr('d', geoPath)
      .attr('fill', 'none')
      .attr('stroke', '#c084fc')
      .attr('stroke-width', 1.2)
      .attr('stroke-opacity', 0.4)
      .attr('stroke-dasharray', '5,4');

    // 4. D3 Heat Density Contours (Kernel Density Estimation)
    if (showDensityContours) {
      const contourLayer = gRoot.append('g').attr('class', 'contour-layer');

      // Map RA/Dec into 2D projected space [x, y]
      interface ProjectedDataPoint {
        x: number;
        y: number;
        weight: number;
        point: CelestialPoint;
      }

      const projectedPoints: ProjectedDataPoint[] = [];
      filteredPoints.forEach((p) => {
        const lon = p.ra > 180 ? p.ra - 360 : p.ra;
        const coords = projection([lon, p.dec]);
        if (coords && !isNaN(coords[0]) && !isNaN(coords[1])) {
          projectedPoints.push({
            x: coords[0],
            y: coords[1],
            weight: p.technoWeight,
            point: p,
          });
        }
      });

      if (projectedPoints.length > 5) {
        const densityData = d3
          .contourDensity<ProjectedDataPoint>()
          .x((d) => d.x)
          .y((d) => d.y)
          .weight((d) => d.weight)
          .size([width, height])
          .bandwidth(bandwidth)
          .thresholds(18)(projectedPoints);

        const maxDensity = d3.max(densityData, (d) => d.value) || 1;
        const densityScale = d3.scalePow().exponent(0.65).domain([0, maxDensity]).range([0, 1]);

        contourLayer
          .selectAll('path.contour')
          .data(densityData)
          .enter()
          .append('path')
          .attr('class', 'contour')
          .attr('d', d3.geoPath())
          .attr('fill', (d) => colorInterpolator(densityScale(d.value)))
          .attr('fill-opacity', (d) => {
            const normalized = densityScale(d.value);
            return 0.12 + normalized * 0.72;
          })
          .attr('stroke', (d) => colorInterpolator(Math.min(1.0, densityScale(d.value) + 0.15)))
          .attr('stroke-width', (d) => (densityScale(d.value) > 0.6 ? 1.0 : 0.4))
          .attr('stroke-opacity', (d) => 0.3 + densityScale(d.value) * 0.65)
          .style('mix-blend-mode', 'screen');
      }
    }

    // 5. Star Catalog Nodes & Background Survey Stars
    if (showCatalogStars) {
      const starsLayer = gRoot.append('g').attr('class', 'stars-layer');

      const starPoints = filteredPoints.filter((p) => !p.isAnomaly);
      starsLayer
        .selectAll('circle.star')
        .data(starPoints)
        .enter()
        .append('circle')
        .attr('class', 'star')
        .attr('cx', (d) => {
          const lon = d.ra > 180 ? d.ra - 360 : d.ra;
          return projection([lon, d.dec])?.[0] ?? -100;
        })
        .attr('cy', (d) => {
          const lon = d.ra > 180 ? d.ra - 360 : d.ra;
          return projection([lon, d.dec])?.[1] ?? -100;
        })
        .attr('r', (d) => Math.max(1.0, 3.2 - d.vMag * 0.18))
        .attr('fill', (d) => {
          if (d.spectralClass.startsWith('O') || d.spectralClass.startsWith('B')) return '#38bdf8';
          if (d.spectralClass.startsWith('A')) return '#e2e8f0';
          if (d.spectralClass.startsWith('F') || d.spectralClass.startsWith('G')) return '#fde047';
          if (d.spectralClass.startsWith('K')) return '#fb923c';
          return '#f87171';
        })
        .attr('opacity', 0.7)
        .on('mouseenter', (event, d) => {
          setHoveredPoint(d);
          const rect = container.getBoundingClientRect();
          setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
        })
        .on('mouseleave', () => setHoveredPoint(null));
    }

    // 6. Technosignature Anomaly Pins & Beacon Target Reticles
    const anomalyPoints = filteredPoints.filter((p) => p.isAnomaly);
    const anomaliesLayer = gRoot.append('g').attr('class', 'anomalies-layer');

    // Concentric Pulsing Reticle for High-Confidence Anomalies
    const anomalyGroups = anomaliesLayer
      .selectAll('g.anomaly-marker')
      .data(anomalyPoints)
      .enter()
      .append('g')
      .attr('class', 'anomaly-marker cursor-pointer')
      .attr('transform', (d) => {
        const lon = d.ra > 180 ? d.ra - 360 : d.ra;
        const coords = projection([lon, d.dec]) ?? [-100, -100];
        return `translate(${coords[0]}, ${coords[1]})`;
      })
      .on('mouseenter', (event, d) => {
        soundFX.triggerTick();
        setHoveredPoint(d);
        const rect = container.getBoundingClientRect();
        setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
      })
      .on('mouseleave', () => setHoveredPoint(null))
      .on('click', (_, d) => {
        soundFX.triggerPingSweep();
        if (d.targetRef && onSelectTarget) {
          onSelectTarget(d.targetRef);
        } else if (onSelectTargetById) {
          onSelectTargetById(d.id);
        }
        if (d.anomalyRef && onSelectAnomaly) {
          onSelectAnomaly(d.anomalyRef);
        }
      });

    // Outer Warning Halo
    anomalyGroups
      .append('circle')
      .attr('r', (d) => (d.confidencePct > 80 ? 11 : 7))
      .attr('fill', (d) => (d.confidencePct > 85 ? 'rgba(244, 63, 94, 0.18)' : 'rgba(168, 85, 247, 0.18)'))
      .attr('stroke', (d) => (d.confidencePct > 85 ? '#f43f5e' : '#c084fc'))
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', (d) => (d.confidencePct > 85 ? '2,2' : 'none'))
      .attr('filter', 'url(#techno-glow)');

    // Core Solid Node
    anomalyGroups
      .append('circle')
      .attr('r', (d) => (d.confidencePct > 85 ? 4.5 : 3.0))
      .attr('fill', (d) => (d.confidencePct > 85 ? '#f43f5e' : '#fbbf24'))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1.0);

    // Selected Target Active Reticle
    if (selectedTargetId) {
      const selectedPt = anomalyPoints.find((p) => p.id === selectedTargetId || p.targetRef?.id === selectedTargetId);
      if (selectedPt) {
        const lon = selectedPt.ra > 180 ? selectedPt.ra - 360 : selectedPt.ra;
        const coords = projection([lon, selectedPt.dec]);
        if (coords) {
          const selectedG = gRoot.append('g').attr('transform', `translate(${coords[0]}, ${coords[1]})`);
          selectedG
            .append('circle')
            .attr('r', 16)
            .attr('fill', 'none')
            .attr('stroke', '#22d3ee')
            .attr('stroke-width', 1.8)
            .attr('stroke-dasharray', '4,3')
            .attr('filter', 'url(#techno-glow)');
        }
      }
    }

    // 7. Technosignature Hotspot Callout Badges
    if (showHotspotLabels) {
      const labelLayer = gRoot.append('g').attr('class', 'hotspot-labels-layer');

      TECHNOSIGNATURE_HOTSPOTS.forEach((hotspot) => {
        const lon = hotspot.ra > 180 ? hotspot.ra - 360 : hotspot.ra;
        const coords = projection([lon, hotspot.dec]);
        if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return;

        const labelG = labelLayer
          .append('g')
          .attr('transform', `translate(${coords[0]}, ${coords[1]})`)
          .attr('class', 'cursor-pointer')
          .on('click', () => {
            soundFX.triggerPingSweep();
            setSelectedHotspot(hotspot);
            if (onSelectTargetById) onSelectTargetById(hotspot.primaryTargetId);
          });

        // Pointer Line
        labelG
          .append('line')
          .attr('x1', 0)
          .attr('y1', 0)
          .attr('x2', 20)
          .attr('y2', -18)
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 1.0)
          .attr('stroke-opacity', 0.85);

        // Label Background Tag
        const textStr = `${hotspot.name} (${hotspot.peakConfidencePct}%)`;
        const tagWidth = textStr.length * 6.0 + 14;

        labelG
          .append('rect')
          .attr('x', 20)
          .attr('y', -30)
          .attr('width', tagWidth)
          .attr('height', 16)
          .attr('rx', 3)
          .attr('fill', '#070314')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 0.8)
          .attr('stroke-opacity', 0.9);

        labelG
          .append('text')
          .attr('x', 26)
          .attr('y', -18)
          .attr('font-size', '8.5px')
          .attr('font-family', 'ui-monospace, SFMono-Regular, monospace')
          .attr('font-weight', 'bold')
          .attr('fill', '#7dd3fc')
          .text(textStr);
      });
    }

    // Mouse Move Listener for Sky Coordinates calculation
    const handleMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Invert projection to get [lon, lat]
      const inverted = projection.invert?.([mouseX, mouseY]);
      if (inverted && !isNaN(inverted[0]) && !isNaN(inverted[1])) {
        const rawLon = inverted[0];
        const ra = rawLon < 0 ? rawLon + 360 : rawLon;
        const dec = inverted[1];
        setMouseSkyCoords({ ra, dec });
      } else {
        setMouseSkyCoords(null);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [
    filteredPoints,
    projectionType,
    colorRamp,
    bandwidth,
    showCatalogStars,
    showDensityContours,
    showHotspotLabels,
    showGraticule,
    selectedTargetId,
    colorInterpolator,
    onSelectTarget,
    onSelectAnomaly,
    onSelectTargetById,
  ]);

  // Zoom Control Handlers
  const handleZoomIn = () => {
    soundFX.triggerTick();
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.4);
  };

  const handleZoomOut = () => {
    soundFX.triggerTick();
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    soundFX.triggerTick();
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(400).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  };

  // Focus directly onto a Technosignature Hotspot
  const handleFocusHotspot = (hotspot: TechnosignatureHotspot) => {
    soundFX.triggerPingSweep();
    setSelectedHotspot(hotspot);
    if (onSelectTargetById) onSelectTargetById(hotspot.primaryTargetId);

    const container = containerRef.current;
    if (!container || !svgRef.current || !zoomBehaviorRef.current) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    let projection: d3.GeoProjection;
    if (projectionType === 'EQUAL_EARTH') {
      projection = d3.geoEqualEarth().scale(width / (2 * Math.PI) * 0.92).translate([width / 2, height / 2]);
    } else {
      projection = d3.geoEquirectangular().scale(width / (2 * Math.PI) * 0.88).translate([width / 2, height / 2]);
    }

    const lon = hotspot.ra > 180 ? hotspot.ra - 360 : hotspot.ra;
    const coords = projection([lon, hotspot.dec]);
    if (coords) {
      const zoomScale = 3.5;
      const targetTransform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(zoomScale)
        .translate(-coords[0], -coords[1]);

      d3.select(svgRef.current).transition().duration(750).call(zoomBehaviorRef.current.transform, targetTransform);
    }
  };

  return (
    <div className={`relative flex flex-col h-full w-full bg-[#030208] rounded-xl overflow-hidden border border-purple-950/50 shadow-[0_0_35px_rgba(168,85,247,0.1)] select-none ${className}`}>
      {/* Top Header Command Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-950/60 bg-[#070314]/90 px-3.5 py-2 backdrop-blur-xl z-20 font-mono text-xs">
        {/* Left: Module Identity */}
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-cyan-400 shrink-0" />
          <span className="font-extrabold tracking-wider text-purple-200 uppercase text-[11px]">
            D3 Celestial Technosignature Heatmap
          </span>
          <span className="rounded bg-cyan-950/80 px-2 py-0.5 text-[8.5px] font-bold text-cyan-300 border border-cyan-800/50">
            2D GAUSSIAN KDE • ASTROMETRIC PROJECTION
          </span>
        </div>

        {/* Center: Projection & Palette Controls */}
        <div className="flex items-center gap-2">
          {/* Projection Switcher */}
          <div className="flex items-center rounded-lg bg-black/60 p-0.5 border border-purple-950/70 text-[9px]">
            <button
              onClick={() => {
                soundFX.triggerTick();
                setProjectionType('EQUAL_EARTH');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                projectionType === 'EQUAL_EARTH'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              Equal-Earth (Full Sky)
            </button>
            <button
              onClick={() => {
                soundFX.triggerTick();
                setProjectionType('EQUIRECTANGULAR');
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                projectionType === 'EQUIRECTANGULAR'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              Equirectangular (RA/Dec)
            </button>
          </div>

          {/* Color Ramp Switcher */}
          <div className="flex items-center rounded-lg bg-black/60 p-0.5 border border-purple-950/70 text-[9px]">
            {(['PLASMA', 'INFERNO', 'VIRIDIS'] as const).map((ramp) => (
              <button
                key={ramp}
                onClick={() => {
                  soundFX.triggerTick();
                  setColorRamp(ramp);
                }}
                className={`px-2 py-0.5 rounded transition-colors uppercase ${
                  colorRamp === ramp ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-indigo-300'
                }`}
              >
                {ramp}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Zoom & Reset Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1 rounded bg-[#0d071a] border border-purple-900/60 text-purple-300 hover:bg-purple-900/40 transition-colors"
          >
            <ZoomIn size={12} />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1 rounded bg-[#0d071a] border border-purple-900/60 text-purple-300 hover:bg-purple-900/40 transition-colors"
          >
            <ZoomOut size={12} />
          </button>
          <button
            onClick={handleResetZoom}
            title="Reset Zoom & Pan"
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#0d071a] border border-purple-900/60 text-[9px] text-purple-300 hover:bg-purple-900/40 transition-colors"
          >
            <RotateCcw size={10} />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Secondary Filter & Technosignature Hotspot Quick Jump Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-1.5 bg-[#05020c]/90 border-b border-purple-950/40 text-[9.5px] font-mono z-20">
        {/* Hotspot Jump Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full">
          <span className="text-slate-400 shrink-0 font-bold">HOTSPOTS:</span>
          {TECHNOSIGNATURE_HOTSPOTS.map((hotspot) => {
            const isSelected = selectedHotspot?.id === hotspot.id;
            return (
              <button
                key={hotspot.id}
                onClick={() => handleFocusHotspot(hotspot)}
                className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors flex items-center gap-1 ${
                  isSelected
                    ? 'bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-bold'
                    : 'bg-black/40 border border-purple-950/60 text-slate-300 hover:text-cyan-300 hover:border-cyan-800/60'
                }`}
              >
                <span className="text-[10px]">🔥</span>
                <span>{hotspot.name}</span>
                <span className="text-[8px] text-amber-300 font-bold">{hotspot.peakConfidencePct}%</span>
              </button>
            );
          })}
        </div>

        {/* Layer Visibility Toggles */}
        <div className="flex items-center gap-2 text-slate-300">
          <label className="flex items-center gap-1 cursor-pointer hover:text-cyan-300">
            <input
              type="checkbox"
              checked={showDensityContours}
              onChange={(e) => {
                soundFX.triggerTick();
                setShowDensityContours(e.target.checked);
              }}
              className="accent-purple-500 rounded"
            />
            <span>Heat Contours</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer hover:text-cyan-300">
            <input
              type="checkbox"
              checked={showCatalogStars}
              onChange={(e) => {
                soundFX.triggerTick();
                setShowCatalogStars(e.target.checked);
              }}
              className="accent-purple-500 rounded"
            />
            <span>Stars</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer hover:text-cyan-300">
            <input
              type="checkbox"
              checked={showHotspotLabels}
              onChange={(e) => {
                soundFX.triggerTick();
                setShowHotspotLabels(e.target.checked);
              }}
              className="accent-purple-500 rounded"
            />
            <span>Labels</span>
          </label>

          <label className="flex items-center gap-1 cursor-pointer hover:text-cyan-300">
            <input
              type="checkbox"
              checked={showGraticule}
              onChange={(e) => {
                soundFX.triggerTick();
                setShowGraticule(e.target.checked);
              }}
              className="accent-purple-500 rounded"
            />
            <span>Graticule</span>
          </label>
        </div>
      </div>

      {/* Main D3 SVG Canvas Area */}
      <div ref={containerRef} className="relative flex-1 w-full h-full min-h-[420px] bg-[#020106] overflow-hidden">
        <svg ref={svgRef} className="w-full h-full cursor-crosshair select-none" />

        {/* Live Cursor Sky Coordinates Readout (Top-Left HUD) */}
        {mouseSkyCoords && (
          <div className="absolute top-2.5 left-2.5 z-10 pointer-events-none rounded-lg border border-purple-900/60 bg-[#070314]/90 px-2.5 py-1 font-mono text-[9.5px] text-slate-300 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.5)] flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Crosshair size={10} className="text-cyan-400" />
              <span>RA:</span>
              <strong className="text-cyan-300">{formatRaSexagesimal(mouseSkyCoords.ra)}</strong>
              <span className="text-slate-500">({mouseSkyCoords.ra.toFixed(2)}°)</span>
            </div>
            <div className="flex items-center gap-1">
              <span>DEC:</span>
              <strong className="text-purple-300">{formatDecSexagesimal(mouseSkyCoords.dec)}</strong>
              <span className="text-slate-500">({mouseSkyCoords.dec.toFixed(2)}°)</span>
            </div>
          </div>
        )}

        {/* Interactive Hover Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            style={{
              left: `${Math.min(window.innerWidth - 320, tooltipPos.x + 14)}px`,
              top: `${Math.min(window.innerHeight - 240, tooltipPos.y + 14)}px`,
            }}
            className="absolute z-30 pointer-events-none w-72 rounded-xl border border-purple-500/80 bg-[#090416]/95 p-3 font-mono text-xs backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.4)] flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between pb-1 border-b border-purple-950/60">
              <span className="font-bold text-purple-200 truncate">{hoveredPoint.name}</span>
              {hoveredPoint.isAnomaly && (
                <span
                  className={`px-1.5 py-0.2 rounded text-[8px] font-bold ${
                    hoveredPoint.confidencePct > 85
                      ? 'bg-rose-950 text-rose-300 border border-rose-700'
                      : 'bg-amber-950 text-amber-300 border border-amber-700'
                  }`}
                >
                  {hoveredPoint.confidencePct}% CONF
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <div className="rounded bg-black/40 p-1 border border-purple-950/40">
                <span className="text-slate-500">RA: </span>
                <span className="text-cyan-300 font-bold">{formatRaSexagesimal(hoveredPoint.ra)}</span>
              </div>
              <div className="rounded bg-black/40 p-1 border border-purple-950/40">
                <span className="text-slate-500">DEC: </span>
                <span className="text-purple-300 font-bold">{formatDecSexagesimal(hoveredPoint.dec)}</span>
              </div>
              <div className="rounded bg-black/40 p-1 border border-purple-950/40">
                <span className="text-slate-500">GALACTIC: </span>
                <span className="text-slate-300">
                  l:{equatorialToGalactic(hoveredPoint.ra, hoveredPoint.dec).l}° b:
                  {equatorialToGalactic(hoveredPoint.ra, hoveredPoint.dec).b}°
                </span>
              </div>
              <div className="rounded bg-black/40 p-1 border border-purple-950/40">
                <span className="text-slate-500">SPECTRAL: </span>
                <span className="text-amber-300">{hoveredPoint.spectralClass}</span>
              </div>
            </div>

            {hoveredPoint.anomalyTitle && (
              <div className="text-[9.5px] text-amber-200 bg-amber-950/30 rounded p-1.5 border border-amber-800/40">
                {hoveredPoint.anomalyTitle}
              </div>
            )}

            {hoveredPoint.sector && (
              <div className="text-[8.5px] text-slate-400">
                SECTOR / FIELD: <span className="text-slate-200">{hoveredPoint.sector}</span>
              </div>
            )}

            <div className="text-[8px] text-cyan-400 font-bold pt-1 border-t border-purple-950/40 flex items-center justify-between">
              <span>CLICK NODE TO LOCK TELEMETRY</span>
              <ChevronRight size={10} />
            </div>
          </div>
        )}

        {/* Selected Hotspot Detailed Telemetry Fly-Out (Top-Right) */}
        {selectedHotspot && (
          <div className="absolute top-2.5 right-2.5 z-20 w-80 rounded-xl border border-cyan-500/70 bg-[#070314]/95 p-3 font-mono text-xs backdrop-blur-xl shadow-[0_0_25px_rgba(34,211,238,0.25)] flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1 border-b border-cyan-900/50">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles size={12} className="text-amber-400" />
                <span className="font-bold text-cyan-200 truncate">{selectedHotspot.name}</span>
              </div>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="text-slate-500 hover:text-slate-200 text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="text-[9.5px] text-slate-300 leading-relaxed font-sans bg-cyan-950/30 rounded p-2 border border-cyan-900/40">
              {selectedHotspot.description}
            </div>

            <div className="grid grid-cols-2 gap-1 text-[9px]">
              <div className="rounded bg-black/50 p-1 border border-cyan-950/60">
                <span className="text-slate-500">CATEGORY: </span>
                <strong className="text-amber-300">{selectedHotspot.category}</strong>
              </div>
              <div className="rounded bg-black/50 p-1 border border-cyan-950/60">
                <span className="text-slate-500">PEAK CONFIDENCE: </span>
                <strong className="text-rose-400">{selectedHotspot.peakConfidencePct}%</strong>
              </div>
              <div className="rounded bg-black/50 p-1 border border-cyan-950/60">
                <span className="text-slate-500">RA / DEC: </span>
                <strong className="text-cyan-300">
                  {selectedHotspot.ra.toFixed(1)}° / {selectedHotspot.dec.toFixed(1)}°
                </strong>
              </div>
              <div className="rounded bg-black/50 p-1 border border-cyan-950/60">
                <span className="text-slate-500">ANGULAR EXTENT: </span>
                <strong className="text-purple-300">~{selectedHotspot.radiusDeg}° dia</strong>
              </div>
            </div>

            <button
              onClick={() => {
                soundFX.triggerPingSweep();
                if (onSelectTargetById) onSelectTargetById(selectedHotspot.primaryTargetId);
              }}
              className="mt-0.5 py-1 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[9.5px] transition-colors flex items-center justify-center gap-1 shadow-[0_0_12px_rgba(34,211,238,0.4)]"
            >
              <span>Lock Hotspot Target ({selectedHotspot.primaryTargetId})</span>
              <ChevronRight size={10} />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Filter & Telemetry Legend Dock */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 bg-[#060310]/95 border-t border-purple-950/60 font-mono text-[9.5px] z-20">
        {/* Technosignature Category Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full">
          <span className="text-slate-400 font-bold shrink-0">FILTER:</span>
          {(
            [
              { id: 'ALL', label: 'All Catalog' },
              { id: 'DYSON_SPHERE', label: 'Dyson Spheres' },
              { id: 'RADIO_TECHNOSIGNATURE', label: 'Radio Beacons' },
              { id: 'GRAVITATIONAL_MICROLENSING', label: 'Gravitational Lenses' },
              { id: 'EXTREME_TRANSIT', label: 'Extreme Transits' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                soundFX.triggerTick();
                setActiveCategory(cat.id);
              }}
              className={`px-2 py-0.5 rounded whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-black/40 text-slate-400 hover:text-purple-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Heatmap Density Legend */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400">TECHNOSIGNATURE PROBABILITY:</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-[8.5px]">Low</span>
            <div
              className="h-2 w-28 rounded-full border border-purple-900/60"
              style={{
                background:
                  colorRamp === 'INFERNO'
                    ? 'linear-gradient(to right, #000004, #781c6d, #ed6925, #fcffa4)'
                    : colorRamp === 'VIRIDIS'
                    ? 'linear-gradient(to right, #440154, #31688e, #35b779, #fde725)'
                    : 'linear-gradient(to right, #0d0887, #6a00a8, #b12a90, #e16462, #fca636, #f0f921)',
              }}
            />
            <span className="text-amber-400 font-bold text-[8.5px]">Critical</span>
          </div>

          <div className="h-3 w-px bg-purple-950/80 mx-1" />

          {/* Bandwidth / Smoothing Slider */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">SMOOTHING σ:</span>
            <input
              type="range"
              min="10"
              max="45"
              value={bandwidth}
              onChange={(e) => setBandwidth(parseInt(e.target.value, 10))}
              className="w-16 accent-purple-500 h-1 bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-cyan-300 font-bold">{bandwidth}px</span>
          </div>
        </div>
      </div>
    </div>
  );
}
