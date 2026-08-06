/* ─── HeroCube.jsx ────────────────────────────── */
import { useRef, useMemo, useState, useEffect, useCallback, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FEATURES, CUBE_SIZE, STEP, SPLIT_MULT } from './FeatureConfig';
import { useTheme } from '../../ThemeProvider.jsx';
import FeatureCube from './FeatureCube';
import './HeroCube.css';

function supportsBloom() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    return !!gl.getExtension('OES_texture_float');
  } catch {
    return false;
  }
}

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

const ANIMATION_CONFIG = {
  drop: { duration: 1.5, startY: 8, startScale: 0.2 },
  phases: {
    intro: 2800,
    split: 900,
    highlight: 750 * 8,
    right: 2800,
    preMerge: 400,
    merge: 900,
    fade: 800,
    pause: 1000,
  },
  lerp: { cube: 0.15, shell: 0.15, group: 0.06, rotation: 0.12 },
  colors: { light: 0x2ec4b6, dark: 0xffffff, wireframe: 0x0891b2 },
};

const ConnectLines = memo(function ConnectLines({ animRef }) {
  const matRef = useRef();
  const geo = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints(
        REST.flatMap((p) => [new THREE.Vector3(0, 0, 0), new THREE.Vector3(p[0], p[1], p[2])])
      ),
    []
  );
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
});

const WireframePulse = memo(function WireframePulse({ animRef }) {
  const ref = useRef();
  const totalSize = (STEP * 2 + CUBE_SIZE) * 1.06;
  useFrame(() => {
    if (!ref.current) return;
    const { phase } = animRef.current;
    const show = phase === 'fade' || phase === 'merge';
    const target = show ? 0.35 : 0;
    ref.current.material.opacity += (target - ref.current.material.opacity) * 0.1;
    if (show) {
      ref.current.scale.setScalar(1.02 + Math.sin(Date.now() * 0.008) * 0.01);
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
});

const CentralCube = memo(function CentralCube({ isDark }) {
  const ref = useRef();
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xff0000),
        metalness: 0.05,
        roughness: 0.32,
        clearcoat: 0.4,
        clearcoatRoughness: 0.2,
      }),
    []
  );
  return (
    <mesh ref={ref} material={mat}>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
    </mesh>
  );
});

const SolidShell = memo(function SolidShell({ animRef }) {
  const ref = useRef();
  const shellSize = CUBE_SIZE * 2 * 1.02;
  const isDark = useTheme();

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(isDark ? 0xffffff : 0xff0000),
        metalness: 0.05,
        roughness: 0.32,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
      }),
    [isDark]
  );

  useFrame(() => {
    if (!ref.current) return;
    const { phase } = animRef.current;
    const assembled = phase === 'idle' || phase === 'merge' || phase === 'fade' || phase === 'pause';
    const targetScale = assembled ? 1 : 0;
    const s = ref.current.scale.x;
    ref.current.scale.setScalar(s + (targetScale - s) * 0.15);
    mat.color.setHex(isDark ? 0xffffff : 0xff0000);
  });

  return (
    <mesh ref={ref} material={mat}>
      <boxGeometry args={[shellSize, shellSize, shellSize]} />
    </mesh>
  );
});

const TypewriterText = memo(function TypewriterText({ text, trigger, speed = 60 }) {
  const [displayed, setDisplayed] = useState('');
  const [typing, setTyping] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef(null);

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
    if (indexRef.current >= text.length) { setTyping(false); return; }
    timeoutRef.current = setTimeout(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
    }, speed);
    return () => clearTimeout(timeoutRef.current);
  }, [typing, displayed, text, speed]);

  return <span>{displayed}{typing && <span className="typewriter-cursor">|</span>}</span>;
});

function useAnimationMachine() {
  const animRef = useRef({ phase: 'idle', highlightIndex: -1, groupY: 0, showLeft: true, showRight: false });
  const timerRef = useRef(0);
  const stepRef = useRef(0);

  const PHASES = useMemo(
    () => [
      { name: 'intro', duration: 2800 },
      { name: 'split', duration: 900 },
      { name: 'highlight', duration: 750 * FEATURES.length, perCube: 750 },
      { name: 'right', duration: 2800 },
      { name: 'pre-merge', duration: 400 },
      { name: 'merge', duration: 900 },
      { name: 'fade', duration: 800 },
      { name: 'pause', duration: 1000 },
    ],
    []
  );

  useFrame((_, delta) => {
    timerRef.current += delta * 1000;
    const a = animRef.current;
    const phaseDef = PHASES[stepRef.current % PHASES.length];

    if (timerRef.current >= phaseDef.duration) {
      timerRef.current = 0;
      stepRef.current += 1;
      const next = PHASES[stepRef.current % PHASES.length];
      const transitions = {
        intro: { phase: 'idle', highlightIndex: -1, groupY: 0, showLeft: true, showRight: false },
        split: { phase: 'split', groupY: 0.15, showLeft: true, showRight: false },
        highlight: { phase: 'highlight', highlightIndex: 0, showLeft: true, showRight: false },
        right: { phase: 'right', showLeft: true, showRight: true },
        'pre-merge': { phase: 'pre-merge', highlightIndex: -1, showLeft: true, showRight: true },
        merge: { phase: 'merge', groupY: 0, showLeft: true, showRight: true },
        fade: { phase: 'fade', showLeft: false, showRight: false },
        pause: { phase: 'pause', showLeft: false, showRight: false },
      };
      if (transitions[next.name]) Object.assign(a, transitions[next.name]);
    }

    if (phaseDef.name === 'highlight') {
      const idx = Math.floor(timerRef.current / phaseDef.perCube);
      if (idx !== a.highlightIndex && idx < FEATURES.length) a.highlightIndex = idx;
    }
  });

  return animRef;
}

const Scene = memo(function Scene({ onAnimUpdate, onAnimationChange, onUserHover }) {
  const groupRef = useRef();
  const { camera } = useThree();
  const animRef = useAnimationMachine();
  const isDark = useTheme();
  const lastShowRef = useRef({ showLeft: true, showRight: false, highlightIndex: -1 });
  const dropRef = useRef({ t: 0, done: false });
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

  useFrame(({ pointer }, delta) => {
    if (!groupRef.current) return;
    const drop = dropRef.current;
    if (!drop.done) {
      drop.t += delta;
      const progress = Math.min(drop.t / ANIMATION_CONFIG.drop.duration, 1);
      const elastic = progress === 1 ? 1 : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
      groupRef.current.position.y = GROUP_Y_OFFSET + ANIMATION_CONFIG.drop.startY * (1 - elastic) + animRef.current.groupY;
      groupRef.current.scale.setScalar(ANIMATION_CONFIG.drop.startScale + (1 - ANIMATION_CONFIG.drop.startScale) * elastic);
      groupRef.current.rotation.x = -0.8 * (1 - elastic);
      if (progress >= 1) {
        drop.done = true;
        groupRef.current.scale.setScalar(1);
        groupRef.current.rotation.x = 0;
        groupRef.current.position.y = GROUP_Y_OFFSET + animRef.current.groupY;
      }
    } else {
      groupRef.current.rotation.y += (0.35 + pointer.x * 0.5 - groupRef.current.rotation.y) * ANIMATION_CONFIG.lerp.rotation;
      groupRef.current.rotation.x += (0.12 + pointer.y * 0.4 - groupRef.current.rotation.x) * ANIMATION_CONFIG.lerp.rotation;
      groupRef.current.position.y += (GROUP_Y_OFFSET + animRef.current.groupY - groupRef.current.position.y) * ANIMATION_CONFIG.lerp.group;
    }
    const { showLeft, showRight, highlightIndex, phase } = animRef.current;
    if (showLeft !== lastShowRef.current.showLeft || showRight !== lastShowRef.current.showRight || highlightIndex !== lastShowRef.current.highlightIndex || phase !== lastShowRef.current.phase) {
      lastShowRef.current = { showLeft, showRight, highlightIndex, phase };
      onAnimUpdate?.({ showLeft, showRight, highlightIndex, phase });
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
          <CentralCube isDark={isDark} />
          {REST.map((pos, i) => (
            <FeatureCube key={i} index={i} restPos={pos} splitPos={SPLIT[i]} accent={FEATURES[i].color} title={FEATURES[i].title} icon={FEATURES[i].icon} animRef={animRef} onAnimationChange={onAnimationChange} onUserHover={onUserHover} />
          ))}
          <ConnectLines animRef={animRef} />
          <WireframePulse animRef={animRef} />
          <SolidShell animRef={animRef} />
        </group>
      </Float>
      {!isMobile && supportsBloom() && (
        <EffectComposer>
          <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} intensity={0.5} />
        </EffectComposer>
      )}
    </>
  );
});

export default function HeroCube() {
  const [animState, setAnimState] = useState({ showLeft: true, showRight: false });
  const [animationFeature, setAnimationFeature] = useState(null);
  const [userHoveredFeature, setUserHoveredFeature] = useState(null);
  const [isIdle, setIsIdle] = useState(false);
  const [joinTrigger, setJoinTrigger] = useState(false);

  const handleAnimationChange = useCallback((index) => {
    setAnimationFeature(index);
  }, []);

  const handleUserHover = useCallback((index) => {
    setUserHoveredFeature(index);
  }, []);

  const handleAnimUpdate = useCallback(({ showLeft, showRight, highlightIndex, phase }) => {
    setAnimState({ showLeft, showRight });
    setAnimationFeature(highlightIndex >= 0 ? highlightIndex : null);
    const showJoin = phase === 'pre-merge' || phase === 'merge';
    setIsIdle(showJoin);
    setJoinTrigger(showJoin);
  }, []);

  const displayFeature = userHoveredFeature !== null ? userHoveredFeature : animationFeature;

  return (
    <div className="hero-cube-wrap">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} camera={{ fov: 35, near: 0.1, far: 100 }} style={{ background: 'transparent' }}>
        <Scene onAnimUpdate={handleAnimUpdate} onAnimationChange={handleAnimationChange} onUserHover={handleUserHover} />
      </Canvas>
      <div className="cube-overlay cube-overlay--left">
        <h2 className="cube-headline"><TypewriterText text="Explore our platform" trigger={animState.showLeft} speed={80} /></h2>
      </div>
      <div className="cube-overlay cube-overlay--right">
        <h2 className="cube-headline"><TypewriterText text="Everything in one place" trigger={animState.showRight} speed={80} /></h2>
      </div>
      {isIdle ? (
        <div className="cube-overlay cube-overlay--center" key="join">
          <h2 className="cube-headline"><TypewriterText text="Join Ostellos" trigger={joinTrigger} speed={80} /></h2>
        </div>
      ) : displayFeature !== null ? (
        <div className="hero-feature-display" key={displayFeature}>
          <i className={`ph ph-${FEATURES[displayFeature].icon}`}></i>
          <span>{FEATURES[displayFeature].title}</span>
        </div>
      ) : null}
    </div>
  );
}