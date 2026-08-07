import { useRef, useMemo, useState, useEffect, memo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useTheme } from '../../ThemeProvider.jsx';
import { CUBE_SIZE } from './FeatureConfig';

const FeatureCube = memo(function FeatureCube({ index, restPos, splitPos, accent, title, icon, animRef, onAnimationChange, onUserHover }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);
  const isDark = useTheme();
  const prevIsActiveRef = useRef(false);

  const baseMat = useMemo(
    () => {
      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(isDark ? 0xffffff : 0x2ec4b6),
        metalness: isDark ? 0.0 : 0.05,
        roughness: isDark ? 0.15 : 0.32,
        emissive: new THREE.Color(isDark ? 0xffffff : 0x000000),
        emissiveIntensity: isDark ? 0.15 : 0,
        transparent: true,
        opacity: 1,
      });
      material.needsUpdate = true;
      return material;
    },
    [isDark]
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

    const wantNotify = isActive || hovered;
    if (wantNotify !== prevIsActiveRef.current) {
      prevIsActiveRef.current = wantNotify;
      onAnimationChange?.(wantNotify ? index : null);
    }
  });

  return (
    <group>
      <mesh
        ref={meshRef}
        position={restPos}
        material={baseMat}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onUserHover?.(index); }}
        onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onUserHover?.(null); }}
      >
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      </mesh>
      <mesh ref={glowRef} position={restPos} material={glowMat} scale={1.18}>
        <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      </mesh>
    </group>
  );
});

export default FeatureCube;