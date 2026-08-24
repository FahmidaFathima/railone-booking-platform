"use client";

import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, Text, Line } from "@react-three/drei";
import * as THREE from "three";
import { STATE_BORDERS } from "./indiaStateBorders";

// ---------------------------------------------------------------------------
// CITY COORDINATES (derived from real lat/lng, normalized to shape space)
// ---------------------------------------------------------------------------

const CITY_COORDS: Record<string, [number, number]> = {
  Mumbai: [-3.5, -1.2],
  Delhi: [-2, 2.1],
  Bangalore: [-1.87, -3.32],
  Chennai: [-0.94, -3.28],
  Kolkata: [1.86, 0.01],
  Hyderabad: [-1.57, -1.79],
  Pune: [-3.17, -1.4],
  Ahmedabad: [-3.61, 0.16],
  Jaipur: [-2.5, 1.51],
  Lucknow: [-0.71, 1.49],
  Chandigarh: [-2.15, 2.83],
  Goa: [-3.18, -2.51],
  Kochi: [-2.33, -4.37],
  Bhopal: [-1.94, 0.25],
  Patna: [0.74, 1.06],
};

// ---------------------------------------------------------------------------
// GLOBE (State 1) — textured rotating Earth with continent silhouettes
// Uses a procedurally generated canvas texture for stylized land/ocean
// ---------------------------------------------------------------------------

function StylizedGlobe({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Generate a stylized Earth texture procedurally
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Ocean base — deep indigo
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, 512, 256);

    // Draw simplified continent shapes as warm landmasses
    ctx.fillStyle = "#92703a";
    ctx.globalAlpha = 0.7;

    // Africa
    ctx.beginPath();
    ctx.ellipse(270, 140, 22, 45, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Europe
    ctx.beginPath();
    ctx.ellipse(265, 80, 20, 15, 0.2, 0, Math.PI * 2);
    ctx.fill();
    // Asia (large landmass including India)
    ctx.beginPath();
    ctx.ellipse(340, 90, 55, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    // India sub-triangle
    ctx.beginPath();
    ctx.moveTo(320, 115);
    ctx.lineTo(335, 150);
    ctx.lineTo(310, 150);
    ctx.closePath();
    ctx.fill();
    // North America
    ctx.beginPath();
    ctx.ellipse(130, 85, 35, 28, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // South America
    ctx.beginPath();
    ctx.ellipse(155, 165, 15, 35, 0.15, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(400, 175, 18, 12, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Antarctica band
    ctx.fillStyle = "#475569";
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 235, 512, 21);

    ctx.globalAlpha = 1.0;

    // Subtle grid lines (latitude)
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.25;
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    // Longitude
    for (let x = 0; x < 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);

  useFrame((_, delta) => {
    if (meshRef.current && !reducedMotion) {
      meshRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <group>
      {/* Main textured globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.5, 48, 48]} />
        <meshStandardMaterial
          map={texture}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>
      {/* Atmosphere glow rim */}
      <mesh>
        <sphereGeometry args={[2.58, 48, 48]} />
        <meshBasicMaterial color="#1e3a5f" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// INDIA MAP (State 3) — real geographic outline with city markers
// 151 points derived from Natural Earth/OSM India boundary (public domain)
// ---------------------------------------------------------------------------

// Real India outline coordinates (normalized from GeoJSON lng/lat to local space)
const INDIA_OUTLINE: [number, number][] = [[-1.76,4.49],[-0.93,4.5],[-1.32,3.69],[-1.31,3.45],[-1.59,3.46],[-1.44,3.14],[-1.3,3.02],[-0.97,2.85],[-0.68,2.65],[-0.93,2.35],[-0.11,1.79],[-0.06,1.72],[0.43,1.7],[0.62,1.55],[0.8,1.46],[1.1,1.41],[1.65,1.34],[1.79,1.49],[1.73,1.59],[1.78,1.77],[1.91,1.9],[2,1.74],[2.04,1.57],[3.13,1.6],[3.12,1.71],[3,1.81],[4.28,2.28],[4.79,1.65],[4,0.72],[3.59,0.22],[3.24,0.21],[3.23,0.81],[2.3,1.26],[2.28,1.19],[2.18,1.21],[2.14,1.24],[2.12,1.3],[2.06,1.34],[2.09,1.29],[2.01,1.3],[1.95,1.35],[1.85,1.36],[1.89,1.33],[1.87,1.3],[1.78,1.19],[1.89,1.07],[2.03,0.98],[1.98,0.92],[1.74,0.74],[2.07,0.22],[2.07,0.1],[2.06,-0.12],[1.9,-0.17],[1.78,-0.12],[1.67,-0.29],[1.33,-0.48],[1.21,-0.84],[0.98,-0.95],[0.62,-1.19],[0.5,-1.34],[0.26,-1.53],[0.1,-1.68],[-0.14,-1.82],[-0.26,-2.02],[-0.24,-2.07],[-0.45,-2.16],[-0.57,-2.16],[-0.64,-2.24],[-0.73,-2.32],[-0.86,-2.32],[-0.97,-2.45],[-1.01,-2.68],[-0.98,-2.79],[-1.1,-3.69],[-1.51,-4.64],[-1.97,-5],[-2.22,-4.73],[-2.26,-4.66],[-2.29,-4.43],[-2.39,-4.21],[-2.52,-3.86],[-2.6,-3.75],[-2.64,-3.71],[-2.69,-3.65],[-2.77,-3.5],[-2.88,-3.1],[-2.92,-2.98],[-3.04,-2.71],[-3.12,-2.61],[-3.17,-2.48],[-3.14,-2.44],[-3.21,-2.42],[-3.28,-2.29],[-3.34,-2.13],[-3.36,-1.93],[-3.39,-1.83],[-3.43,-1.64],[-3.48,-1.5],[-3.44,-1.47],[-3.5,-1.43],[-3.49,-1.37],[-3.45,-1.33],[-3.45,-1.13],[-3.55,-1.09],[-3.56,-0.97],[-3.56,-0.87],[-3.5,-0.68],[-3.52,-0.6],[-3.54,-0.51],[-3.58,-0.46],[-3.59,-0.42],[-3.57,-0.36],[-3.55,-0.32],[-3.59,-0.21],[-3.61,-0.12],[-3.71,-0.12],[-3.72,-0.16],[-3.73,-0.22],[-3.79,-0.45],[-3.89,-0.52],[-3.98,-0.54],[-4.04,-0.58],[-4.19,-0.62],[-4.32,-0.61],[-4.52,-0.44],[-4.76,-0.22],[-4.79,-0.05],[-4.69,-0.09],[-4.62,-0.07],[-4.56,-0.04],[-4.49,0],[-4.41,0.04],[-4.37,0.08],[-4.31,0.17],[-4.19,0.2],[-3.98,0.22],[-4.01,0.24],[-4.06,0.25],[-4.05,0.34],[-4.11,0.48],[-4.09,0.54],[-4.15,0.59],[-4.24,0.58],[-4.19,0.89],[-3.83,1.92],[-2.92,2.96],[-3.26,3.77],[-3.53,4.78],[-3.06,4.97],[-2.7,5],[-1.82,4.49]];

function IndiaMap({
  source,
  destination,
  reducedMotion,
}: {
  source: string;
  destination: string;
  reducedMotion: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.04;
    }
  });

  // Build THREE.Shape from the real outline data
  const indiaShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(INDIA_OUTLINE[0][0], INDIA_OUTLINE[0][1]);
    for (let i = 1; i < INDIA_OUTLINE.length; i++) {
      shape.lineTo(INDIA_OUTLINE[i][0], INDIA_OUTLINE[i][1]);
    }
    shape.closePath();
    return shape;
  }, []);

  const indiaGeometry = useMemo(() => {
    const extrudeSettings = { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 };
    return new THREE.ExtrudeGeometry(indiaShape, extrudeSettings);
  }, [indiaShape]);

  const edgeGeometry = useMemo(() => {
    return new THREE.EdgesGeometry(indiaGeometry, 15);
  }, [indiaGeometry]);

  const srcCoords = CITY_COORDS[source];
  const dstCoords = CITY_COORDS[destination];

  return (
    <group ref={groupRef}>
      {/* India landmass — solid */}
      <mesh geometry={indiaGeometry}>
        <meshStandardMaterial
          color="#1e293b"
          emissive="#1e3a5f"
          emissiveIntensity={0.15}
          metalness={0.2}
          roughness={0.8}
        />
      </mesh>
      {/* Glowing edge outline for definition */}
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color="#64748b" transparent opacity={0.6} />
      </lineSegments>
      {/* Subtle inner glow on front face */}
      <mesh geometry={indiaGeometry} position={[0, 0, 0.01]}>
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.03} />
      </mesh>

      {/* Internal state border lines */}
      <StateBorders />

      {/* City markers and route */}
      {srcCoords && (
        <CityMarker position={[srcCoords[0], srcCoords[1], 0.2]} name={source} isSource />
      )}
      {dstCoords && (
        <CityMarker position={[dstCoords[0], dstCoords[1], 0.2]} name={destination} isSource={false} />
      )}

      {/* Animated route line */}
      {srcCoords && dstCoords && (
        <AnimatedRoute
          from={[srcCoords[0], srcCoords[1], 0.3]}
          to={[dstCoords[0], dstCoords[1], 0.3]}
          reducedMotion={reducedMotion}
        />
      )}
    </group>
  );
}

/** Renders internal state/UT border lines from real boundary data */
function StateBorders() {
  const lineGeometries = useMemo(() => {
    return STATE_BORDERS.map((polyline) => {
      const points = polyline.map(([x, y]) => new THREE.Vector3(x, y, 0.05));
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return geo;
    });
  }, []);

  return (
    <group>
      {lineGeometries.map((geo, i) => (
        <line key={i}>
          <bufferGeometry attach="geometry" {...geo} />
          <lineBasicMaterial attach="material" color="#334155" transparent opacity={0.35} />
        </line>
      ))}
    </group>
  );
}

function CityMarker({ position, name, isSource }: { position: [number, number, number]; name: string; isSource: boolean }) {
  const markerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (markerRef.current) {
      markerRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.15);
    }
  });

  return (
    <group position={position}>
      {/* Glow ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.35, 16]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Core dot */}
      <mesh ref={markerRef}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color={isSource ? "#f59e0b" : "#fbbf24"}
          emissive={isSource ? "#f59e0b" : "#fbbf24"}
          emissiveIntensity={2}
        />
      </mesh>
      {/* Point light */}
      <pointLight color="#f59e0b" intensity={1} distance={2} />
      {/* Label */}
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.3}
        color="#f8fafc"
        anchorX="center"
        anchorY="bottom"
        font={undefined}
      >
        {name}
      </Text>
    </group>
  );
}

// ---------------------------------------------------------------------------
// ANIMATED ROUTE LINE — glowing arc with traveling pulse
// ---------------------------------------------------------------------------

function AnimatedRoute({
  from,
  to,
  reducedMotion,
}: {
  from: [number, number, number];
  to: [number, number, number];
  reducedMotion: boolean;
}) {
  const pulseRef = useRef<THREE.Mesh>(null);

  // Create a curved arc between the two points
  const curve = useMemo(() => {
    const mid: [number, number, number] = [
      (from[0] + to[0]) / 2,
      (from[1] + to[1]) / 2,
      Math.max(from[2], to[2]) + 1.5, // Arc height
    ];
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(...from),
      new THREE.Vector3(...mid),
      new THREE.Vector3(...to)
    );
  }, [from, to]);

  const points = useMemo(() => curve.getPoints(40), [curve]);

  useFrame((state) => {
    if (!pulseRef.current || reducedMotion) return;
    const t = (state.clock.elapsedTime * 0.4) % 1;
    const point = curve.getPointAt(t);
    pulseRef.current.position.copy(point);
  });

  return (
    <group>
      {/* Static arc line */}
      <Line
        points={points}
        color="#f59e0b"
        lineWidth={2}
        transparent
        opacity={0.6}
      />
      {/* Traveling pulse */}
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={4} />
      </mesh>
      <pointLight ref={pulseRef as unknown as React.Ref<THREE.PointLight>} color="#f59e0b" intensity={2} distance={2} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// CAMERA CONTROLLER — handles the zoom transition
// ---------------------------------------------------------------------------

function CameraController({
  showIndia,
  reducedMotion,
}: {
  showIndia: boolean;
  reducedMotion: boolean;
}) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 0, 8));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (showIndia) {
      // India shape is centered at (0,0), bounding box ~10 wide x 10 tall.
      // With FOV=50, to fit 10 units of height: z = (5 / tan(25°)) ≈ 10.7, add padding → z=12
      targetPos.current.set(0, 0, 12);
      targetLook.current.set(0, 0, 0);
    } else {
      targetPos.current.set(0, 0, 8);
      targetLook.current.set(0, 0, 0);
    }
  }, [showIndia]);

  useFrame((_, delta) => {
    const speed = reducedMotion ? 1 : 0.03;
    const lerpFactor = 1 - Math.pow(1 - speed, delta * 60);

    camera.position.lerp(targetPos.current, lerpFactor);
    camera.lookAt(targetLook.current);
  });

  return null;
}

// ---------------------------------------------------------------------------
// SCENE
// ---------------------------------------------------------------------------

function RouteScene({
  source,
  destination,
  reducedMotion,
}: {
  source: string;
  destination: string;
  reducedMotion: boolean;
}) {
  const showIndia = !!(source && destination && CITY_COORDS[source] && CITY_COORDS[destination]);

  return (
    <>
      <CameraController showIndia={showIndia} reducedMotion={reducedMotion} />

      {/* Ambient fill — moderate so the globe texture is always visible */}
      <ambientLight intensity={0.5} color="#94a3b8" />
      {/* Front-facing key light so the globe hemisphere facing camera is well-lit */}
      <directionalLight position={[2, 2, 6]} intensity={0.9} color="#f8fafc" />
      {/* Warm accent from the side for color warmth on landmasses */}
      <directionalLight position={[5, 1, 2]} intensity={0.5} color="#f59e0b" />
      {/* Cool fill from opposite side for depth */}
      <directionalLight position={[-4, 1, -3]} intensity={0.2} color="#6366f1" />

      <Stars radius={30} depth={30} count={500} factor={2} fade speed={reducedMotion ? 0 : 0.3} />

      {!showIndia && <StylizedGlobe reducedMotion={reducedMotion} />}
      {showIndia && (
        <IndiaMap source={source} destination={destination} reducedMotion={reducedMotion} />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// LOADING FALLBACK
// ---------------------------------------------------------------------------

function GlobeLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900/30 rounded-xl">
      <div className="flex flex-col items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
        <p className="text-slate-500 text-xs">Loading route preview...</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------

interface RouteGlobeProps {
  source: string;
  destination: string;
}

export default function RouteGlobe({ source, destination }: RouteGlobeProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    // Check reduced motion
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);

    // Check WebGL
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setWebglAvailable(false);
    } catch {
      setWebglAvailable(false);
    }

    return () => mq.removeEventListener("change", handler);
  }, []);

  // Graceful fallback if WebGL not available
  if (!webglAvailable) return null;

  return (
    <div className="w-full h-full min-h-[20rem] rounded-xl overflow-hidden border border-slate-800/50 bg-[#0B1120]">
      <Suspense fallback={<GlobeLoading />}>
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, failIfMajorPerformanceCaveat: true }}
          onError={() => setWebglAvailable(false)}
        >
          <RouteScene source={source} destination={destination} reducedMotion={reducedMotion} />
        </Canvas>
      </Suspense>
    </div>
  );
}
