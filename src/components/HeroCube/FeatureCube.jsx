import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useTheme } from '../../ThemeProvider.jsx';
import { CUBE_SIZE } from './FeatureConfig';
import './FeatureCube.css';

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

  useEffect(() => {
    return () => {
      baseMat.dispose();
      glowMat.dispose();
    };
  }, [baseMat, glowMat]);

  useFrame(() => {
    if (!meshRef.current) return;
    const m = meshRef.current;
    const { phase, highlightIndex } = animRef.current;
    const isActive = phase === 'highlight' && highlightIndex === index;
    const isSplit = phase === 'split' || phase === 'highlight' || phase === 'right' || phase === 'pre-merge';
    const isDimmed = phase === 'highlight' && highlightIndex >= 0 && !isActive;

    let tx, ty, tz;
    if (isActive) {
      tx = splitPos[0]; ty = splitPos[1]; tz = splitPos[2] + 0.4;
    } else if (isSplit) {
      tx = splitPos[0]; ty = splitPos[1]; tz = splitPos[2];
    } else {
      tx = restPos[0]; ty = restPos[1]; tz = restPos[2];
    }

    const lerp = 0.15;
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

export default FeatureCube;