"use client";

import { Suspense, useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// TRAIN – realistic low-poly locomotive with coaches
// ---------------------------------------------------------------------------

function Locomotive() {
  return (
    <group>
      {/* Main engine body – rounded front */}
      <RoundedBox args={[2.8, 0.9, 1.0]} radius={0.15} smoothness={4} position={[0, 0.45, 0]}>
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.15} />
      </RoundedBox>

      {/* Front nose – tapered rounded piece */}
      <mesh position={[1.55, 0.45, 0]}>
        <sphereGeometry args={[0.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Nose bottom plate */}
      <mesh position={[1.55, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.15} />
      </mesh>

      {/* Cab / cabin */}
      <RoundedBox args={[1.1, 0.7, 0.9]} radius={0.08} smoothness={3} position={[-0.7, 1.0, 0]}>
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.25} />
      </RoundedBox>

      {/* Cab windshield – blue-tinted glass */}
      <mesh position={[-0.14, 1.05, 0]}>
        <planeGeometry args={[0.02, 0.4, 1]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.4} metalness={0.3} roughness={0.1} />
      </mesh>
      {/* Side windows */}
      <mesh position={[-0.7, 1.05, 0.46]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.35} metalness={0.3} roughness={0.1} />
      </mesh>
      <mesh position={[-0.7, 1.05, -0.46]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.6, 0.35]} />
        <meshStandardMaterial color="#38bdf8" transparent opacity={0.35} metalness={0.3} roughness={0.1} />
      </mesh>

      {/* Smokestack */}
      <mesh position={[0.6, 1.15, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.5, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Smokestack rim */}
      <mesh position={[0.6, 1.42, 0]}>
        <cylinderGeometry args={[0.11, 0.09, 0.06, 8]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* Boiler band details */}
      {[0.0, 0.35, -0.35].map((x, i) => (
        <mesh key={`band-${i}`} position={[x, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.02, 6, 16]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Headlight – emissive glow */}
      <mesh position={[1.52, 0.6, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color="#fef3c7" emissive="#f59e0b" emissiveIntensity={3} />
      </mesh>
      <pointLight position={[2.0, 0.6, 0]} color="#f59e0b" intensity={5} distance={10} decay={2} />
      {/* Secondary headlight glow */}
      <spotLight
        position={[1.8, 0.6, 0]}
        target-position={[10, 0, 0]}
        color="#fbbf24"
        intensity={3}
        distance={12}
        angle={0.4}
        penumbra={0.6}
      />

      {/* Cowcatcher / front bumper */}
      <mesh position={[1.6, 0.05, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.9]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Undercarriage frame */}
      <mesh position={[0, 0.0, 0]}>
        <boxGeometry args={[3.0, 0.08, 0.7]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Wheels – 3 pairs with axles */}
      {[-0.9, 0.0, 0.9].map((x, i) => (
        <group key={`wheelset-${i}`} position={[x, -0.05, 0]}>
          {/* Left wheel */}
          <mesh position={[0, 0, 0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.05} />
          </mesh>
          {/* Wheel rim */}
          <mesh position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.025, 6, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
          </mesh>
          {/* Right wheel */}
          <mesh position={[0, 0, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.08, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.05} />
          </mesh>
          <mesh position={[0, 0, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.025, 6, 12]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
          </mesh>
          {/* Axle */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1.0, 6]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Coach({ offset, colorA }: { offset: number; colorA: string }) {
  return (
    <group position={[-offset, 0, 0]}>
      {/* Coach body */}
      <RoundedBox args={[2.4, 0.8, 0.9]} radius={0.06} smoothness={3} position={[0, 0.4, 0]}>
        <meshStandardMaterial color={colorA} metalness={0.6} roughness={0.25} />
      </RoundedBox>

      {/* Roof */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[2.3, 0.06, 0.85]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Window row – cutout style (lit from inside) */}
      {[-0.8, -0.4, 0.0, 0.4, 0.8].map((wx, wi) => (
        <group key={wi}>
          <mesh position={[wx, 0.48, 0.46]}>
            <planeGeometry args={[0.22, 0.2]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[wx, 0.48, -0.46]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.22, 0.2]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Undercarriage */}
      <mesh position={[0, 0.0, 0]}>
        <boxGeometry args={[2.3, 0.06, 0.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Wheels – 2 pairs */}
      {[-0.6, 0.6].map((x, i) => (
        <group key={`cw-${i}`} position={[x, -0.05, 0]}>
          <mesh position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// SMOKE PARTICLES – rising from smokestack, direction-aware
// ---------------------------------------------------------------------------

const SMOKE_COUNT = 50;

/**
 * @param direction — 1 means train travels left-to-right (smoke trails left),
 *                   -1 means train travels right-to-left (smoke trails right)
 */
function SmokeParticles({ reducedMotion, direction = 1 }: { reducedMotion: boolean; direction?: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const velocities = useRef<Float32Array>(new Float32Array(SMOKE_COUNT * 3));
  const lifetimes = useRef<Float32Array>(new Float32Array(SMOKE_COUNT));
  const ages = useRef<Float32Array>(new Float32Array(SMOKE_COUNT));

  const positions = useMemo(() => {
    const pos = new Float32Array(SMOKE_COUNT * 3);
    for (let i = 0; i < SMOKE_COUNT; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      lifetimes.current[i] = 1.5 + Math.random() * 1.5;
      ages.current[i] = Math.random() * lifetimes.current[i]; // stagger
      // Backward drift relative to train direction
      velocities.current[i * 3] = -direction * (0.2 + Math.random() * 0.3);
      velocities.current[i * 3 + 1] = 0.8 + Math.random() * 0.5; // upward
      velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }
    return pos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  useFrame((state, delta) => {
    if (!pointsRef.current || reducedMotion) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < SMOKE_COUNT; i++) {
      ages.current[i] += delta;

      if (ages.current[i] >= lifetimes.current[i]) {
        ages.current[i] = 0;
        arr[i * 3] = (Math.random() - 0.5) * 0.05;
        arr[i * 3 + 1] = 0;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
        velocities.current[i * 3] = -direction * (0.15 + Math.random() * 0.25);
        velocities.current[i * 3 + 1] = 0.7 + Math.random() * 0.5;
        velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      } else {
        const sway = Math.sin(state.clock.elapsedTime * 2 + i * 0.5) * 0.1 * delta;
        arr[i * 3] += velocities.current[i * 3] * delta + sway;
        arr[i * 3 + 1] += velocities.current[i * 3 + 1] * delta;
        arr[i * 3 + 2] += velocities.current[i * 3 + 2] * delta;
      }
    }

    posAttr.needsUpdate = true;
  });

  if (reducedMotion) return null;

  return (
    <points ref={pointsRef} position={[0.6, 1.45, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#cbd5e1"
        size={0.15}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ---------------------------------------------------------------------------
// FULL TRAIN ASSEMBLY (locomotive + coaches + smoke) with animation
// Each car is positioned independently along the curve at an arc-length offset
// behind the locomotive, so the whole train bends through curves as one unit.
// ---------------------------------------------------------------------------

// Arc-length spacing: locomotive center is at t, coaches follow behind at fixed
// distances measured in curve-parameter space. We pre-compute the curve length
// to convert world-unit gaps into parameter deltas.

function TrainOnTrack({
  reducedMotion,
  curve,
  speed,
  timeOffset,
  direction,
}: {
  reducedMotion: boolean;
  curve: THREE.CatmullRomCurve3;
  speed: number;
  timeOffset: number;
  direction: 1 | -1;
}) {
  const locoRef = useRef<THREE.Group>(null);
  const coach1Ref = useRef<THREE.Group>(null);
  const coach2Ref = useRef<THREE.Group>(null);
  const coach3Ref = useRef<THREE.Group>(null);

  const WHEEL_CONTACT_OFFSET = 0.25;

  // Convert world-unit gap distances to curve-parameter deltas.
  // Locomotive length ~2.8, coach length ~2.4, coupling gap ~0.3
  // Distance from loco center to coach1 center: (2.8/2) + 0.3 + (2.4/2) = 1.4+0.3+1.2 = 2.9
  // Distance between subsequent coach centers: 2.4 + 0.3 = 2.7
  const curveLength = useMemo(() => curve.getLength(), [curve]);
  const locoToCoach1 = 2.9 / curveLength; // parameter delta for first coach
  const coachSpacing = 2.7 / curveLength; // parameter delta between coaches

  const placeOnCurve = (ref: React.RefObject<THREE.Group | null>, t: number) => {
    if (!ref.current) return;
    // Wrap t into [0,1]
    const wrappedT = ((t % 1) + 1) % 1;
    const point = curve.getPointAt(wrappedT);
    const tangent = curve.getTangentAt(wrappedT);

    ref.current.position.set(point.x, point.y + WHEEL_CONTACT_OFFSET, point.z);

    const heading = Math.atan2(-tangent.z, tangent.x);
    ref.current.rotation.set(0, direction === 1 ? heading : heading + Math.PI, 0);
  };

  useFrame((state) => {
    const s = reducedMotion ? speed * 0.2 : speed;
    const locoT = ((state.clock.elapsedTime + timeOffset) * s) % 1;

    // Locomotive
    placeOnCurve(locoRef, locoT);

    // Coaches trail BEHIND the locomotive along the curve.
    // "Behind" means subtracting parameter delta (earlier on the curve).
    placeOnCurve(coach1Ref, locoT - locoToCoach1);
    placeOnCurve(coach2Ref, locoT - locoToCoach1 - coachSpacing);
    placeOnCurve(coach3Ref, locoT - locoToCoach1 - coachSpacing * 2);
  });

  return (
    <>
      <group ref={locoRef}>
        <Locomotive />
        <SmokeParticles reducedMotion={reducedMotion} direction={direction} />
      </group>
      <group ref={coach1Ref}>
        <CoachBody colorA="#1e3a5f" />
      </group>
      <group ref={coach2Ref}>
        <CoachBody colorA="#1e293b" />
      </group>
      <group ref={coach3Ref}>
        <CoachBody colorA="#1e3a5f" />
      </group>
    </>
  );
}

/** Coach body without the position offset — positioned by parent group */
function CoachBody({ colorA }: { colorA: string }) {
  return (
    <group>
      <RoundedBox args={[2.4, 0.8, 0.9]} radius={0.06} smoothness={3} position={[0, 0.4, 0]}>
        <meshStandardMaterial color={colorA} metalness={0.6} roughness={0.25} />
      </RoundedBox>
      {/* Roof */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[2.3, 0.06, 0.85]} />
        <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Window row */}
      {[-0.8, -0.4, 0.0, 0.4, 0.8].map((wx, wi) => (
        <group key={wi}>
          <mesh position={[wx, 0.48, 0.46]}>
            <planeGeometry args={[0.22, 0.2]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[wx, 0.48, -0.46]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.22, 0.2]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.6} />
          </mesh>
        </group>
      ))}
      {/* Undercarriage */}
      <mesh position={[0, 0.0, 0]}>
        <boxGeometry args={[2.3, 0.06, 0.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Wheels */}
      {[-0.6, 0.6].map((x, i) => (
        <group key={`cw-${i}`} position={[x, -0.05, 0]}>
          <mesh position={[0, 0, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0, 0, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.06, 10]} />
            <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ---------------------------------------------------------------------------
// DUAL TRACKS — two parallel paths offset in Z
// ---------------------------------------------------------------------------

// Track 1: front track (closer to camera)
const TRACK1_POINTS = [
  new THREE.Vector3(-16, -1, 0),
  new THREE.Vector3(-8, -1, -2),
  new THREE.Vector3(0, -1, -3.5),
  new THREE.Vector3(8, -1, -2),
  new THREE.Vector3(16, -1, 0),
];

// Track 2: back track (further from camera, well-separated — ~4.5 units deeper in Z)
const TRACK2_POINTS = [
  new THREE.Vector3(16, -1, -5),
  new THREE.Vector3(8, -1, -7),
  new THREE.Vector3(0, -1, -8.5),
  new THREE.Vector3(-8, -1, -7),
  new THREE.Vector3(-16, -1, -5),
];

function TrackLine({ points }: { points: THREE.Vector3[] }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points);
    const pts = curve.getPoints(80);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [points]);

  return (
    <line>
      <bufferGeometry attach="geometry" {...geometry} />
      <lineBasicMaterial attach="material" color="#64748b" linewidth={1} />
    </line>
  );
}

function DualTracks() {
  return (
    <group>
      <TrackLine points={TRACK1_POINTS} />
      <TrackLine points={TRACK2_POINTS} />
    </group>
  );
}

function DualTrains({ reducedMotion }: { reducedMotion: boolean }) {
  // Curves for each track
  const curve1 = useMemo(() => new THREE.CatmullRomCurve3(TRACK1_POINTS), []);
  const curve2 = useMemo(() => new THREE.CatmullRomCurve3(TRACK2_POINTS), []);

  return (
    <>
      {/* Train A: left-to-right on track 1 */}
      <TrainOnTrack
        reducedMotion={reducedMotion}
        curve={curve1}
        speed={0.04}
        timeOffset={0}
        direction={1}
      />
      {/* Train B: right-to-left on track 2 (staggered timing) */}
      <TrainOnTrack
        reducedMotion={reducedMotion}
        curve={curve2}
        speed={0.035}
        timeOffset={8}
        direction={-1}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// CAMERA RIG — top-down intro then settles to final angle
// ---------------------------------------------------------------------------

const FINAL_CAM_POS = new THREE.Vector3(0, 2.5, 9);
const FINAL_CAM_LOOK = new THREE.Vector3(0, -0.5, -4);
const TOPDOWN_CAM_POS = new THREE.Vector3(0, 18, 2);
const TOPDOWN_CAM_LOOK = new THREE.Vector3(0, -1, -4);

function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const hasAnimated = useRef(false);
  const startTime = useRef(0);
  const HOLD_DURATION = 1.8; // seconds at top-down before moving
  const ANIM_DURATION = 2.5; // seconds for the transition

  useFrame((state) => {
    if (reducedMotion || hasAnimated.current) return;

    if (startTime.current === 0) {
      startTime.current = state.clock.elapsedTime;
    }

    const elapsed = state.clock.elapsedTime - startTime.current;

    if (elapsed < HOLD_DURATION) {
      // Hold top-down
      state.camera.position.copy(TOPDOWN_CAM_POS);
      state.camera.lookAt(TOPDOWN_CAM_LOOK);
    } else if (elapsed < HOLD_DURATION + ANIM_DURATION) {
      // Animate from top-down to final
      const raw = (elapsed - HOLD_DURATION) / ANIM_DURATION; // 0 → 1
      // Expo-out easing: 1 - 2^(-10*t)
      const t = 1 - Math.pow(2, -10 * raw);

      const pos = TOPDOWN_CAM_POS.clone().lerp(FINAL_CAM_POS, t);
      const look = TOPDOWN_CAM_LOOK.clone().lerp(FINAL_CAM_LOOK, t);

      state.camera.position.copy(pos);
      state.camera.lookAt(look);
    } else {
      // Done — lock in final position
      state.camera.position.copy(FINAL_CAM_POS);
      state.camera.lookAt(FINAL_CAM_LOOK);
      hasAnimated.current = true;
    }
  });

  return null;
}

// ---------------------------------------------------------------------------
// MOUNTAINS – displaced geometry with depth layers
// ---------------------------------------------------------------------------

function MountainLayer({
  zOffset,
  color,
  scale,
  segments,
  amplitude,
  seed,
}: {
  zOffset: number;
  color: string;
  scale: number;
  segments: number;
  amplitude: number;
  seed: number;
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(40 * scale, 8 * scale, segments, segments);
    const pos = geo.attributes.position;

    // Simple noise displacement using seeded sin/cos layers
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Multiple octaves of "noise" via sin combinations
      const n1 = Math.sin(x * 0.3 + seed) * Math.cos(y * 0.5 + seed * 0.7) * amplitude;
      const n2 = Math.sin(x * 0.8 + seed * 2.1) * 0.5 * amplitude;
      const n3 = Math.cos(x * 1.5 + y * 0.3 + seed * 0.3) * 0.25 * amplitude;
      // Only push vertices upward from the bottom edge
      const heightFactor = Math.max(0, (y + 4 * scale) / (8 * scale)); // 0 at bottom, 1 at top
      const displacement = (n1 + n2 + n3) * heightFactor;
      pos.setZ(i, displacement);
    }

    geo.computeVertexNormals();
    return geo;
  }, [scale, segments, amplitude, seed]);

  return (
    <mesh
      geometry={geometry}
      position={[0, 1, zOffset]}
      rotation={[0, 0, 0]}
    >
      <meshStandardMaterial
        color={color}
        flatShading
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Mountains() {
  return (
    <group position={[0, -3, -12]}>
      {/* Far layer – haziest, large forms */}
      <MountainLayer zOffset={-12} color="#0f172a" scale={1.8} segments={24} amplitude={3.5} seed={42} />
      {/* Mid layer */}
      <MountainLayer zOffset={-7} color="#1e293b" scale={1.4} segments={20} amplitude={3.0} seed={17} />
      {/* Near layer – most detailed */}
      <MountainLayer zOffset={-3} color="#1e3a5f" scale={1.0} segments={28} amplitude={2.5} seed={7} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// (Track replaced by DualTracks above)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AMBIENT PARTICLES (floating embers)
// ---------------------------------------------------------------------------

function AmbientParticles({ reducedMotion }: { reducedMotion: boolean }) {
  const count = reducedMotion ? 30 : 80;
  const particlesRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 10 - 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!particlesRef.current || reducedMotion) return;
    particlesRef.current.rotation.y = state.clock.elapsedTime * 0.008;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f59e0b" size={0.04} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

// ---------------------------------------------------------------------------
// SCENE COMPOSITION
// ---------------------------------------------------------------------------

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      {/* Camera intro animation */}
      <CameraRig reducedMotion={reducedMotion} />

      {/* Warm sunset directional – low angle for visible highlights on ridges and train */}
      <directionalLight
        position={[8, 4, 3]}
        intensity={1.2}
        color="#f59e0b"
        castShadow={false}
      />
      {/* Ambient fill so nothing goes pure black */}
      <ambientLight intensity={0.25} color="#94a3b8" />
      {/* Cool rim / back light for depth */}
      <directionalLight position={[-6, 3, -8]} intensity={0.3} color="#6366f1" />

      {/* Atmospheric fog – nearer is clear, far is hazy */}
      <fog attach="fog" args={["#0B1120", 8, 35]} />

      <Stars radius={60} depth={50} count={800} factor={3} fade speed={reducedMotion ? 0 : 0.4} />

      <Mountains />
      <DualTracks />
      <DualTrains reducedMotion={reducedMotion} />
      <AmbientParticles reducedMotion={reducedMotion} />

      {/* Ground plane */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0B1120" />
      </mesh>
    </>
  );
}

// ---------------------------------------------------------------------------
// LOADING FALLBACK
// ---------------------------------------------------------------------------

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-[#0B1120] to-[#1E293B]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse" />
        <p className="text-slate-400 text-sm">Loading scene...</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EXPORT
// ---------------------------------------------------------------------------

export default function LoginScene() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Static fallback for reduced motion
  if (reducedMotion) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-[#0B1120] via-[#1e293b] to-[#0B1120] flex items-center justify-center">
        <div className="text-center opacity-60">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
            <div className="w-6 h-2 bg-amber-500 rounded-full" />
          </div>
          <p className="text-slate-500 text-xs">RailOne</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 2.5, 9], fov: 55 }}
          className="w-full h-full"
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false }}
        >
          <Scene reducedMotion={reducedMotion} />
        </Canvas>
      </Suspense>
    </div>
  );
}
