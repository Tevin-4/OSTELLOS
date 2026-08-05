import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FEATURES, CUBE_SIZE, STEP, SPLIT_MULT } from './FeatureConfig';
import './HeroCube.css';

/* ─── 2×2×2 grid positions, centered ────────────────────── */
function makePositions() {
  const pos = [];
  for (let x = -1; x <= 1; x += 2)
    for (let y = -1; y <= 1; y += 2)
      for (let z = -1; z <= 1; z += 2)
        pos.push([x * STEP, y * STEP, z * STEP]);
  return pos;
}
const REST = makePositions();
const SPLIT = REST.map((p) => p.map((v) => v * SPLIT_MULT));

/* ─── theme hook (read once, observe changes) ──────────── */
function useTheme() {
  const [isDark, setIsDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => {
      setIsDark(el.getAttribute('data-theme') === 'dark');
    });
    obs.observe(el, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

/* ─── single feature cube ───────────────────────────────── */
function FeatureCube({ index, restPos, splitPos, accent, title, icon, animRef }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [showLabel, setShowLabel] = useState(false);
  const [hovered, setHovered] = useState(false);
  const isDark = useTheme();

  const baseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffffff'),
        metalness: 0.05,
        roughness: 0.32,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        transparent: true,
        opacity: 1,
      }),
    []
  );

  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(accent),
        transparent: true,
        opacity: 0,
        side: THREE.BackSide,
      }),
    [accent]
  );

  useFrame(() => {
    if (!meshRef.current) return;
    const m = meshRef.current;
    const { phase, highlightIndex } = animRef.current;
    const isActive = phase === 'highlight' && highlightIndex === index;
    const isSplit = phase === 'split' || phase === 'highlight' || phase === 'pre-merge';
    const isDimmed = phase === 'highlight' && highlightIndex >= 0 && !isActive;

    let tx, ty, tz;
    if (isActive) {
      tx = splitPos[0]; ty = splitPos[1]; tz = splitPos[2] + 0.4;
    } else if (isSplit) {
      tx = splitPos[0]; ty = splitPos[1]; tz = splitPos[2];
    } else {
      tx = restPos[0]; ty = restPos[1]; tz = restPos[2];
    }

    const lerp = 0.08;
    m.position.x += (tx - m.position.x) * lerp;
    m.position.y += (ty - m.position.y) * lerp;
    m.position.z += (tz - m.position.z) * lerp;

    const ts = isActive ? 1.15 : hovered ? 1.1 : 1;
    m.scale.x += (ts - m.scale.x) * lerp;
    m.scale.y += (ts - m.scale.y) * lerp;
    m.scale.z += (ts - m.scale.z) * lerp;

    const ry = isActive ? 0.18 : 0;
    m.rotation.y += (ry - m.rotation.y) * lerp;

    const baseColor = isDark ? 0xffffff : 0x2ec4b6;
    const emphasized = isActive || hovered;
    const assembled = phase === 'idle' || phase === 'merge' || phase === 'fade' || phase === 'pause';

    if (baseMat.transparent === assembled) {
      baseMat.transparent = !assembled;
    }
    if (assembled && baseMat.opacity < 1) baseMat.opacity = 1;

    if (emphasized) {
      baseMat.color.setHex(baseColor);
      baseMat.emissive.setHex(baseColor);
      baseMat.emissiveIntensity += (0.2 - baseMat.emissiveIntensity) * 0.1;
      baseMat.opacity += (1 - baseMat.opacity) * 0.1;
    } else if (isDimmed) {
      baseMat.color.setHex(baseColor);
      baseMat.emissiveIntensity += (0 - baseMat.emissiveIntensity) * 0.1;
      baseMat.opacity += (0.55 - baseMat.opacity) * 0.1;
    } else {
      baseMat.color.setHex(baseColor);
      baseMat.emissiveIntensity += (0 - baseMat.emissiveIntensity) * 0.1;
      baseMat.opacity += (1 - baseMat.opacity) * 0.1;
    }

    glowMat.opacity += (((isActive || hovered) ? 0.14 : 0) - glowMat.opacity) * 0.1;

    const wantLabel = isActive || hovered;
    if (wantLabel !== showLabel) setShowLabel(wantLabel);
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={restPos}
        material={baseMat}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
      >
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
        {showLabel && (
          <Html position={[CUBE_SIZE * 2.2, CUBE_SIZE * 0.5, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div className="r3f-label">
              <i className={`ph ph-${icon}`}></i>
              <span>{title}</span>
            </div>
          </Html>
        )}
      </mesh>
      <mesh ref={glowRef} position={restPos} material={glowMat} scale={1.18}>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      </mesh>
    </group>
  );
}

/* ─── connecting lines ──────────────────────────────────── */
function ConnectLines({ animRef }) {
  const matRef = useRef();

  const geo = useMemo(() => {
    const pts = [];
    REST.forEach((p) =>
      pts.push(new THREE.Vector3(0, 0, 0), new THREE.Vector3(p[0], p[1], p[2]))
    );
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame(() => {
    if (!matRef.current) return;
    const { phase } = animRef.current;
    const target = phase === 'highlight' || phase === 'split' ? 0.2 : 0;
    matRef.current.opacity += (target - matRef.current.opacity) * 0.08;
  });

  return (
    <line geometry={geo}>
      <lineBasicMaterial ref={matRef} color="#94a3b8" transparent opacity={0} />
    </line>
  );
}

/* ─── wireframe pulse ───────────────────────────────────── */
function WireframePulse({ animRef }) {
  const ref = useRef();
  const totalSize = (STEP * 2 + CUBE_SIZE) * 1.06;

  useFrame(() => {
    if (!ref.current) return;
    const { phase } = animRef.current;
    const show = phase === 'fade' || phase === 'merge';
    const target = show ? 0.35 : 0;
    ref.current.material.opacity += (target - ref.current.material.opacity) * 0.1;
    if (show) {
      const s = 1.02 + Math.sin(Date.now() * 0.008) * 0.01;
      ref.current.scale.setScalar(s);
    } else {
      ref.current.scale.setScalar(1);
    }
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[totalSize, totalSize, totalSize]} />
      <meshBasicMaterial color="#0891B2" wireframe transparent opacity={0} />
    </mesh>
  );
}

/* ─── solid shell cube (covers sub-cubes when assembled) ── */
function SolidShell({ animRef }) {
  const ref = useRef();
  const shellSize = CUBE_SIZE * 2 * 1.02;
  const isDark = useTheme();

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#ffffff'),
        metalness: 0.05,
        roughness: 0.32,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
        transparent: false,
        opacity: 1,
      }),
    []
  );

  useFrame(() => {
    if (!ref.current) return;
    mat.color.setHex(isDark ? 0xffffff : 0x2ec4b6);
  });

  return (
    <mesh ref={ref} material={mat}>
      <boxGeometry args={[shellSize, shellSize, shellSize]} />
    </mesh>
  );
}

/* ─── typewriter text ───────────────────────────────────── */
function TypewriterText({ text, trigger, speed = 60 }) {
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    if (trigger) {
      setDisplayed('');
      indexRef.current = 0;
      setTyping(true);
    } else {
      setTyping(false);
      setDisplayed('');
      indexRef.current = 0;
    }
  }, [trigger]);

  useEffect(() => {
    if (!typing) return;
    if (indexRef.current >= text.length) {
      setTyping(false);
      return;
    }
    const id = setTimeout(() => {
      indexRef.current++;
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);
    return () => clearTimeout(id);
  }, [typing, displayed, text, speed]);

  return <span>{displayed}{typing && <span className="typewriter-cursor">|</span>}</span>;
}

/* ─── animation state machine (refs, not React state) ──── */
function useAnimationMachine() {
  const animRef = useRef({
    phase: 'idle',
    highlightIndex: -1,
    groupY: 0,
    showLeft: true,
    showRight: false,
  });
  const timerRef = useRef(0);
  const stepRef = useRef(0);

  const PHASES = useMemo(() => [
    { name: 'intro',     duration: 2800 },
    { name: 'split',     duration: 900  },
    { name: 'highlight', duration: 750 * FEATURES.length, perCube: 750 },
    { name: 'right',     duration: 2800 },
    { name: 'pre-merge', duration: 400  },
    { name: 'merge',     duration: 900  },
    { name: 'fade',      duration: 800  },
    { name: 'pause',     duration: 1000 },
  ], []);

  useFrame((_, delta) => {
    timerRef.current += delta * 1000;
    const a = animRef.current;
    const phaseDef = PHASES[stepRef.current % PHASES.length];

    if (timerRef.current >= phaseDef.duration) {
      timerRef.current = 0;
      stepRef.current++;
      const next = PHASES[stepRef.current % PHASES.length];

      if (next.name === 'intro') {
        Object.assign(a, { phase: 'idle', highlightIndex: -1, groupY: 0, showLeft: true, showRight: false });
      } else if (next.name === 'split') {
        Object.assign(a, { phase: 'split', groupY: 0.15, showLeft: true, showRight: false });
      } else if (next.name === 'highlight') {
        Object.assign(a, { phase: 'highlight', highlightIndex: 0, showLeft: true, showRight: false });
      } else if (next.name === 'right') {
        Object.assign(a, { phase: 'right', showLeft: true, showRight: true });
      } else if (next.name === 'pre-merge') {
        Object.assign(a, { phase: 'pre-merge', highlightIndex: -1, showLeft: true, showRight: true });
      } else if (next.name === 'merge') {
        Object.assign(a, { phase: 'merge', groupY: 0, showLeft: true, showRight: true });
      } else if (next.name === 'fade') {
        Object.assign(a, { phase: 'fade', showLeft: false, showRight: false });
      } else if (next.name === 'pause') {
        Object.assign(a, { phase: 'pause', showLeft: false, showRight: false });
      }
    }

    if (phaseDef.name === 'highlight') {
      const idx = Math.floor(timerRef.current / phaseDef.perCube);
      if (idx !== a.highlightIndex && idx < FEATURES.length) {
        a.highlightIndex = idx;
      }
    }
  });

  return animRef;
}

/* ─── scene internals ───────────────────────────────────── */
function Scene({ onAnimUpdate }) {
  const groupRef = useRef();
  const { camera } = useThree();
  const animRef = useAnimationMachine();
  const lastShowRef = useRef({ showLeft: true, showRight: false });

  const GROUP_Y_OFFSET = 0.35;

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      camera.position.set(7, 4.5, 7);
      camera.lookAt(0, 0.1, 0);
    } else {
      camera.position.set(5.5, 3.8, 5);
      camera.lookAt(0, 0.15, 0);
    }
  }, [camera]);

  useFrame(({ pointer }) => {
    if (!groupRef.current) return;

    const targetRY = 0.35 + pointer.x * 0.5;
    const targetRX = 0.12 + pointer.y * 0.4;
    groupRef.current.rotation.y += (targetRY - groupRef.current.rotation.y) * 0.12;
    groupRef.current.rotation.x += (targetRX - groupRef.current.rotation.x) * 0.12;

    const targetY = GROUP_Y_OFFSET + animRef.current.groupY;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.06;

    const { showLeft, showRight } = animRef.current;
    if (showLeft !== lastShowRef.current.showLeft || showRight !== lastShowRef.current.showRight) {
      lastShowRef.current = { showLeft, showRight };
      onAnimUpdate?.({ showLeft, showRight });
    }
  });

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <>
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#ffffff', '#3a4a3a', 0.3]} />
      <directionalLight position={[5, 8, 5]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} color="#88ccff" />

      <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.2}>
        <group ref={groupRef}>
          {REST.map((pos, i) => (
            <FeatureCube
              key={i}
              index={i}
              restPos={pos}
              splitPos={SPLIT[i]}
              accent={FEATURES[i].color}
              title={FEATURES[i].title}
              icon={FEATURES[i].icon}
              animRef={animRef}
            />
          ))}
          <ConnectLines animRef={animRef} />
          <WireframePulse animRef={animRef} />
          <SolidShell animRef={animRef} />
        </group>
      </Float>

      {!isMobile && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.5} />
        </EffectComposer>
      )}
    </>
  );
}

/* ─── exported component ────────────────────────────────── */
export default function HeroCube() {
  const [animState, setAnimState] = useState({ showLeft: true, showRight: false });

  return (
    <div className="hero-cube-wrap">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 35, near: 0.1, far: 100 }}
        style={{ background: 'transparent' }}
      >
        <Scene onAnimUpdate={setAnimState} />
      </Canvas>
      <div className="cube-overlay cube-overlay--left">
        <h2 className="cube-headline">
          <TypewriterText text="Explore our platform" trigger={animState.showLeft} speed={55} />
        </h2>
      </div>
      <div className="cube-overlay cube-overlay--right">
        <h2 className="cube-headline">
          <TypewriterText text="Everything in one place" trigger={animState.showRight} speed={55} />
        </h2>
      </div>
    </div>
  );
}
