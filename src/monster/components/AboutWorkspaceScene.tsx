import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getFurBumpTexture, getFurShellAlphaTexture } from '../utils/furTextures';

const MONSTER_PATH = '/models/workspace/cactoro-dev.glb';
const DESK_PATH = '/models/workspace/desk.glb';
const CHAIR_PATH = '/models/workspace/chair.glb';
const LAPTOP_PATH = '/models/workspace/laptop.glb';
const FUR_SHELL_LAYERS = 5;

export interface AboutMonsterDebugState {
  loaded: boolean;
  mode: 'typing' | 'thinking';
  breathingOffset: number;
  blinkCount: number;
  typingCycles: number;
  headYaw: number;
  headPitch: number;
  glancing: boolean;
  reducedMotion: boolean;
  clipped: boolean;
}

declare global {
  interface Window {
    __ABOUT_MONSTER_STATE__?: AboutMonsterDebugState;
  }
}

interface AboutWorkspaceSceneProps {
  isActive: boolean;
  reducedMotion: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface EyeRig {
  upperLid: THREE.Mesh;
  lowerLid: THREE.Mesh;
  pupilGroup: THREE.Group;
}

/**
 * Normalizes a static prop GLTF so its X/Z center is at 0 and its bottom rests exactly at y = 0,
 * scaled to a target height (or width).
 */
function normalizeProp(
  source: THREE.Object3D,
  targetSize: { height?: number; width?: number }
): { scene: THREE.Group; size: THREE.Vector3 } {
  const wrapper = new THREE.Group();
  const cloned = source.clone(true);
  wrapper.add(cloned);
  wrapper.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(cloned);
  const rawSize = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(rawSize);
  box.getCenter(center);

  let scale = 1;
  if (targetSize.height && rawSize.y > 0.0001) {
    scale = targetSize.height / rawSize.y;
  } else if (targetSize.width && rawSize.x > 0.0001) {
    scale = targetSize.width / rawSize.x;
  }

  cloned.scale.multiplyScalar(scale);
  cloned.position.set(
    -center.x * scale,
    -box.min.y * scale,
    -center.z * scale
  );

  wrapper.updateMatrixWorld(true);
  const finalBox = new THREE.Box3().setFromObject(wrapper);
  const finalSize = new THREE.Vector3();
  finalBox.getSize(finalSize);

  return { scene: wrapper, size: finalSize };
}

export const AboutWorkspaceScene: React.FC<AboutWorkspaceSceneProps> = ({
  isActive,
  reducedMotion,
  containerRef,
}) => {
  const monsterGltf = useGLTF(MONSTER_PATH);
  const deskGltf = useGLTF(DESK_PATH);
  const chairGltf = useGLTF(CHAIR_PATH);
  const laptopGltf = useGLTF(LAPTOP_PATH);

  const dioramaRef = useRef<THREE.Group>(null);
  const monsterGroupRef = useRef<THREE.Group>(null);

  // Clone monster with intact skeleton
  const clonedMonster = useMemo(() => cloneSkeleton(monsterGltf.scene), [monsterGltf.scene]);

  // Normalize furniture & laptop props to consistent ergonomic diorama proportions
  const { deskObj, deskTopY, chairObj, laptopObj } = useMemo(() => {
    const deskNorm = normalizeProp(deskGltf.scene, { height: 1.12 });
    deskNorm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const name = (mesh.material as THREE.MeshStandardMaterial)?.name || '';
        if (name.toLowerCase().includes('wood')) {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#DFC3A3',
            roughness: 0.72,
            metalness: 0.02,
          });
        } else {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#3A3735',
            roughness: 0.5,
            metalness: 0.25,
          });
        }
      }
    });

    const chairNorm = normalizeProp(chairGltf.scene, { height: 1.72 });
    chairNorm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const name = (mesh.material as THREE.MeshStandardMaterial)?.name || '';
        if (name === 'Chair') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#445C5A',
            roughness: 0.85,
            metalness: 0.0,
          });
        } else if (name === 'Grey') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#78716C',
            roughness: 0.55,
            metalness: 0.2,
          });
        } else {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#292524',
            roughness: 0.5,
            metalness: 0.25,
          });
        }
      }
    });

    const laptopNorm = normalizeProp(laptopGltf.scene, { width: 0.82 });
    laptopNorm.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const name = (mesh.material as THREE.MeshStandardMaterial)?.name || '';
        if (name === 'metalDark') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#1E293B',
            emissive: new THREE.Color('#0F766E'),
            emissiveIntensity: 0.35,
            roughness: 0.35,
            metalness: 0.15,
          });
        } else {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#D6D3D1',
            roughness: 0.32,
            metalness: 0.55,
          });
        }
      }
    });

    return {
      deskObj: deskNorm.scene,
      deskTopY: deskNorm.size.y,
      chairObj: chairNorm.scene,
      laptopObj: laptopNorm.scene,
    };
  }, [deskGltf.scene, chairGltf.scene, laptopGltf.scene]);

  // Bone & eye refs for procedural seated pose + calm typing animation
  const bonesRef = useRef<Record<string, THREE.Bone>>({});
  const restQuatsRef = useRef<Record<string, THREE.Quaternion>>({});
  const eyesRef = useRef<EyeRig[]>([]);

  const pointerRef = useRef({
    nx: 0,
    ny: 0,
    nearWorkspace: false,
    lastMoveTime: 0,
  });

  const animRef = useRef({
    elapsed: 0,
    mode: 'typing' as 'typing' | 'thinking',
    nextModeSwitchAt: 3.4,
    typingCycles: 0,
    blinkProgress: 0,
    blinkPhase: 'idle' as 'idle' | 'closing' | 'opening' | 'double_wait',
    nextBlinkAt: 2.8,
    doubleBlinkPending: false,
    blinkCount: 0,
    yaw: 0,
    pitch: 0.24,
    roll: 0,
    tabHidden: false,
  });

  // Setup monster materials (cozy slate-teal fur + sage antennae), fur shells, and 3D blinking eyes
  useEffect(() => {
    const bumpMap = getFurBumpTexture();
    const createdDisposables: Array<{ dispose: () => void }> = [];
    const addedObjects: Array<{ parent: THREE.Object3D; child: THREE.Object3D }> = [];

    const bones: Record<string, THREE.Bone> = {};
    const restQuats: Record<string, THREE.Quaternion> = {};
    const furTargetMeshes: THREE.SkinnedMesh[] = [];
    let eyeWhiteMesh: THREE.SkinnedMesh | null = null;

    clonedMonster.updateMatrixWorld(true);

    clonedMonster.traverse((obj) => {
      if ((obj as THREE.Bone).isBone) {
        const bone = obj as THREE.Bone;
        bones[bone.name] = bone;
        restQuats[bone.name] = bone.quaternion.clone();
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const matName = (mesh.material as THREE.MeshStandardMaterial)?.name || '';

        if (matName === 'Cactoro_Main' || matName === 'Cactoro_Main.001') {
          furTargetMeshes.push(mesh as THREE.SkinnedMesh);
          const furMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#3B8B7C'), // Lush cozy sage-teal fluffy creature fur
            roughness: 0.88,
            metalness: 0.0,
            sheen: 1.0,
            sheenRoughness: 0.62,
            sheenColor: new THREE.Color('#CCFBF1'),
            bumpMap,
            bumpScale: 0.015,
          });
          mesh.material = furMat;
          createdDisposables.push(furMat);
        } else if (matName === 'Cactoro_Secondary') {
          const hatAndTuftMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#D9A066'), // Warm editorial sand-terracotta hat & soft tufts
            roughness: 0.82,
            metalness: 0.0,
            sheen: 0.7,
            sheenColor: new THREE.Color('#FEF3C7'),
            bumpMap,
            bumpScale: 0.009,
          });
          mesh.material = hatAndTuftMat;
          createdDisposables.push(hatAndTuftMat);
        } else if (matName === 'Cactoro_Red') {
          const bandMat = new THREE.MeshStandardMaterial({
            color: '#115E59', // Deep portfolio teal hatband accent
            roughness: 0.7,
          });
          mesh.material = bandMat;
          createdDisposables.push(bandMat);
        } else if (matName === 'Eye_White') {
          eyeWhiteMesh = mesh as THREE.SkinnedMesh;
          mesh.visible = false;
        } else if (matName === 'Eye_Black') {
          mesh.visible = false;
        }
      }
    });

    bonesRef.current = bones;
    restQuatsRef.current = restQuats;

    // 5-layer skinned fur shells on Cactoro body & lower body for lush tactile fluffy edges
    for (const [mIdx, bodySkinned] of furTargetMeshes.entries()) {
      if (bodySkinned.parent && bodySkinned.skeleton) {
        const furLengthLocal = 0.00125; // Matches Cactoro's bindMatrix mesh scale (~0.062 world units)
        for (let layer = 0; layer < FUR_SHELL_LAYERS; layer++) {
          const t = (layer + 1) / FUR_SHELL_LAYERS;
          const offset = furLengthLocal * t;
          const alphaMap = getFurShellAlphaTexture(layer, FUR_SHELL_LAYERS);
          const tipColor = new THREE.Color('#2A6F63').lerp(new THREE.Color('#66C2B0'), t * 0.88);

          const shellMat = new THREE.MeshStandardMaterial({
            color: tipColor,
            roughness: 0.92,
            metalness: 0.0,
            alphaMap,
            alphaTest: 0.28 + t * 0.28,
            side: THREE.DoubleSide,
          });
          shellMat.onBeforeCompile = (shader) => {
            shader.uniforms.uFurOffset = { value: offset };
            shader.vertexShader = shader.vertexShader
              .replace('#include <common>', `#include <common>\nuniform float uFurOffset;`)
              .replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>\ntransformed += normalize(objectNormal) * uFurOffset;`
              );
          };
          shellMat.customProgramCacheKey = () => `cactoro-fur-${mIdx}-${layer}`;

          const shellMesh = new THREE.SkinnedMesh(bodySkinned.geometry, shellMat);
          shellMesh.bind(bodySkinned.skeleton, bodySkinned.bindMatrix);
          shellMesh.castShadow = false;
          shellMesh.receiveShadow = false;
          shellMesh.frustumCulled = false;

          bodySkinned.parent.add(shellMesh);
          addedObjects.push({ parent: bodySkinned.parent, child: shellMesh });
          createdDisposables.push(shellMat);
        }
      }
    }

    // Mount expressive 3D glossy eyes + blinking eyelids onto Head bone
    const headBone = bones['Head'];
    const origEye = eyeWhiteMesh as THREE.SkinnedMesh | null;
    const mountedEyes: EyeRig[] = [];

    if (headBone && origEye) {
      // Update full diorama world matrix so origEye.matrixWorld and headBone.worldToLocal are 100% synced
      if (dioramaRef.current) {
        dioramaRef.current.updateMatrixWorld(true);
      } else if (monsterGroupRef.current) {
        monsterGroupRef.current.updateMatrixWorld(true);
      } else {
        clonedMonster.updateMatrixWorld(true);
      }

      const posAttr = origEye.geometry.attributes.position;
      const leftSum = new THREE.Vector3();
      const rightSum = new THREE.Vector3();
      let leftCount = 0;
      let rightCount = 0;

      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        if (v.x < 0) {
          leftSum.add(v);
          leftCount++;
        } else {
          rightSum.add(v);
          rightCount++;
        }
      }

      if (leftCount > 0 && rightCount > 0) {
        const leftWorld = leftSum.divideScalar(leftCount).applyMatrix4(origEye.matrixWorld);
        const rightWorld = rightSum.divideScalar(rightCount).applyMatrix4(origEye.matrixWorld);
        const leftInHead = headBone.worldToLocal(leftWorld.clone());
        const rightInHead = headBone.worldToLocal(rightWorld.clone());

        const headWorldQuat = new THREE.Quaternion();
        headBone.getWorldQuaternion(headWorldQuat);
        const worldToHeadQuat = headWorldQuat.clone().invert();

        // Exact eye radius in headBone local space (~0.00145 -> ~0.145 world units)
        const eyeRadius = 0.00145;

        const scleraGeo = new THREE.SphereGeometry(eyeRadius, 18, 14);
        const irisGeo = new THREE.SphereGeometry(eyeRadius * 0.62, 16, 12);
        const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.42, 14, 10);
        const catchBigGeo = new THREE.SphereGeometry(eyeRadius * 0.16, 8, 8);
        const upperLidGeo = new THREE.SphereGeometry(
          eyeRadius * 1.12,
          18,
          10,
          0,
          Math.PI * 2,
          0,
          Math.PI * 0.52
        );
        const lowerLidGeo = new THREE.SphereGeometry(
          eyeRadius * 1.11,
          18,
          10,
          0,
          Math.PI * 2,
          Math.PI * 0.48,
          Math.PI * 0.52
        );

        const scleraMat = new THREE.MeshPhysicalMaterial({
          color: '#FFFFFF',
          roughness: 0.14,
          clearcoat: 0.9,
        });
        const irisMat = new THREE.MeshStandardMaterial({ color: '#155E75', roughness: 0.25 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: '#141316', roughness: 0.15 });
        const catchMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
        const lidMat = new THREE.MeshPhysicalMaterial({
          color: '#347D70',
          roughness: 0.82,
          sheen: 0.7,
        });

        createdDisposables.push(
          scleraGeo,
          irisGeo,
          pupilGeo,
          catchBigGeo,
          upperLidGeo,
          lowerLidGeo,
          scleraMat,
          irisMat,
          pupilMat,
          catchMat,
          lidMat
        );

        for (const [idx, eyePos] of [leftInHead, rightInHead].entries()) {
          const eyeMount = new THREE.Group();
          eyeMount.position.copy(eyePos);
          eyeMount.quaternion.copy(worldToHeadQuat);
          eyeMount.translateZ(eyeRadius * 0.55);
          eyeMount.translateX(idx === 0 ? eyeRadius * 0.32 : -eyeRadius * 0.32);

          eyeMount.add(new THREE.Mesh(scleraGeo, scleraMat));

          const pupilGroup = new THREE.Group();
          const iris = new THREE.Mesh(irisGeo, irisMat);
          iris.position.set(0, 0, eyeRadius * 0.78);
          iris.scale.set(1, 1, 0.38);
          pupilGroup.add(iris);

          const pupil = new THREE.Mesh(pupilGeo, pupilMat);
          pupil.position.set(0, 0, eyeRadius * 0.89);
          pupil.scale.set(1, 1, 0.35);
          pupilGroup.add(pupil);

          const catchBig = new THREE.Mesh(catchBigGeo, catchMat);
          catchBig.position.set(eyeRadius * 0.2, eyeRadius * 0.22, eyeRadius * 1.02);
          pupilGroup.add(catchBig);

          eyeMount.add(pupilGroup);

          const upperLid = new THREE.Mesh(upperLidGeo, lidMat);
          upperLid.rotation.x = -1.18;
          eyeMount.add(upperLid);

          const lowerLid = new THREE.Mesh(lowerLidGeo, lidMat);
          lowerLid.rotation.x = 1.15;
          eyeMount.add(lowerLid);

          headBone.add(eyeMount);
          addedObjects.push({ parent: headBone, child: eyeMount });
          mountedEyes.push({ upperLid, lowerLid, pupilGroup });
        }
      }
    }

    eyesRef.current = mountedEyes;

    window.__ABOUT_MONSTER_STATE__ = {
      loaded: true,
      mode: 'typing',
      breathingOffset: 0,
      blinkCount: 0,
      typingCycles: 0,
      headYaw: 0,
      headPitch: 0.24,
      glancing: false,
      reducedMotion,
      clipped: false,
    };

    return () => {
      for (const { parent, child } of addedObjects) {
        parent.remove(child);
      }
      for (const d of createdDisposables) {
        d.dispose();
      }
      eyesRef.current = [];
    };
  }, [clonedMonster, reducedMotion]);

  // Subtle pointer glance listener (only reacts when pointer is close to workspace)
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reducedMotion) return;
      const el = containerRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const margin = 90;
      const inside =
        e.clientX >= rect.left - margin &&
        e.clientX <= rect.right + margin &&
        e.clientY >= rect.top - margin &&
        e.clientY <= rect.bottom + margin;

      const p = pointerRef.current;
      p.nearWorkspace = inside;
      if (inside) {
        const cx = rect.left + rect.width * 0.5;
        const cy = rect.top + rect.height * 0.45;
        p.nx = THREE.MathUtils.clamp((e.clientX - cx) / (rect.width * 0.6), -1, 1);
        p.ny = THREE.MathUtils.clamp((e.clientY - cy) / (rect.height * 0.6), -1, 1);
        p.lastMoveTime = performance.now() / 1000;
      }
    };

    const onVisibility = () => {
      animRef.current.tabHidden = document.hidden;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [containerRef, reducedMotion]);

  // Helper to resolve Blender bone names whether GLTFLoader preserved '.' or stripped it (e.g. UpperArm.L -> UpperArmL)
  const getBoneKey = (name: string): string => {
    if (bonesRef.current[name]) return name;
    const sanitized = name.replace(/\./g, '');
    if (bonesRef.current[sanitized]) return sanitized;
    return name;
  };

  // Helper to apply non-accumulating Euler delta onto a bone's rest quaternion
  const applyBonePose = (
    name: string,
    rx: number,
    ry: number,
    rz: number,
    order: THREE.EulerOrder = 'XYZ'
  ) => {
    const key = getBoneKey(name);
    const bone = bonesRef.current[key];
    const rest = restQuatsRef.current[key];
    if (!bone || !rest) return;
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, order));
    bone.quaternion.copy(rest).multiply(q);
  };

  // Helper to apply a character-space Euler delta cleanly onto a bone's rest quaternion
  // (works regardless of Blender's internal bone roll axes!)
  const applyCharSpaceDelta = (
    name: string,
    rx: number,
    ry: number,
    rz: number,
    order: THREE.EulerOrder = 'XYZ'
  ) => {
    const key = getBoneKey(name);
    const bone = bonesRef.current[key];
    const rest = restQuatsRef.current[key];
    const root = monsterGroupRef.current;
    if (!bone || !rest || !bone.parent || !root) return;

    // Reset to rest before computing parent's orientation relative to monster root
    bone.quaternion.copy(rest);
    root.updateMatrixWorld(true);

    const rootQuat = new THREE.Quaternion();
    const parentQuat = new THREE.Quaternion();
    root.getWorldQuaternion(rootQuat);
    bone.parent.getWorldQuaternion(parentQuat);

    // Parent orientation in monster-local coordinates
    const parentInChar = rootQuat.clone().invert().multiply(parentQuat);
    const deltaChar = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, order));

    // Convert character-space delta into bone's parent-local frame: parentInChar^-1 * deltaChar * parentInChar * rest
    bone.quaternion
      .copy(parentInChar)
      .invert()
      .multiply(deltaChar)
      .multiply(parentInChar)
      .multiply(rest);
  };

  // Main calm developer animation loop
  useFrame((state, rawDelta) => {
    const st = animRef.current;
    if (!isActive || st.tabHidden) return;

    const delta = Math.min(rawDelta, 0.05);
    st.elapsed += delta;
    const t = st.elapsed;

    // 1. Alternate naturally between Typing bursts and calm Thinking pauses
    if (!reducedMotion && t >= st.nextModeSwitchAt) {
      if (st.mode === 'typing') {
        st.mode = 'thinking';
        st.nextModeSwitchAt = t + 1.8 + Math.random() * 2.0;
      } else {
        st.mode = 'typing';
        st.typingCycles += 1;
        st.nextModeSwitchAt = t + 2.4 + Math.random() * 2.6;
      }
    }

    // 2. Subtle Seated Breathing (calmer & smaller amplitude than Hero monster)
    const breathWave = Math.sin(t * 1.25) * 0.72 + Math.sin(t * 0.58 + 0.9) * 0.28;
    const breathingOffset = reducedMotion ? 0 : breathWave * 0.014;

    if (bonesRef.current['Torso']) {
      const expand = reducedMotion ? 1 : 1 + breathWave * 0.016;
      bonesRef.current['Torso'].scale.set(expand, 1 + (expand - 1) * 0.6, expand);
    }

    // 3. Natural Seated Posture (hips grounded on chair, legs bent comfortably forward)
    applyCharSpaceDelta('Hips', 0.04, 0, 0);
    applyCharSpaceDelta('Abdomen', 0.06 + breathingOffset * 1.0, 0, 0);
    applyCharSpaceDelta('Torso', 0.06 + breathingOffset * 0.8, 0, 0);
    applyCharSpaceDelta('UpperLeg.L', -1.25, 0.1, 0);
    applyCharSpaceDelta('LowerLeg.L', 1.12, 0, 0);
    applyCharSpaceDelta('UpperLeg.R', -1.25, -0.1, 0);
    applyCharSpaceDelta('LowerLeg.R', 1.12, 0, 0);

    // 4. Arms & Fingers: Reached naturally forward onto the laptop keyboard with gentle typing rhythm
    const isTyping = !reducedMotion && st.mode === 'typing';
    const leftTap = isTyping ? Math.sin(t * 9.2) * Math.max(0, Math.sin(t * 2.7)) : 0;
    const rightTap = isTyping ? Math.sin(t * 10.6 + 1.4) * Math.max(0, Math.cos(t * 2.3)) : 0;

    // Lift both arms forward onto the desk and tuck elbows/forearms inward onto the laptop keyboard
    applyCharSpaceDelta('UpperArm.L', -1.15 + leftTap * 0.03, -0.48, 0.36, 'YXZ');
    applyCharSpaceDelta('LowerArm.L', -0.15 + leftTap * 0.055, -0.55, 0, 'YXZ');

    applyCharSpaceDelta('UpperArm.R', -1.15 + rightTap * 0.03, 0.48, -0.36, 'YXZ');
    applyCharSpaceDelta('LowerArm.R', -0.15 + rightTap * 0.055, 0.55, 0, 'YXZ');

    // Subtle finger taps when typing
    const fL1 = isTyping ? Math.sin(t * 12.5) * 0.14 : 0.06;
    const fL2 = isTyping ? Math.sin(t * 11.2 + 1.1) * 0.13 : 0.08;
    const fR1 = isTyping ? Math.sin(t * 13.1 + 0.6) * 0.14 : 0.06;
    const fR2 = isTyping ? Math.sin(t * 11.8 + 2.0) * 0.13 : 0.08;
    applyBonePose('Index1.L', fL1, 0, 0);
    applyBonePose('Middle1.L', fL2, 0, 0);
    applyBonePose('Pinky1.L', fL1 * 0.7, 0, 0);
    applyBonePose('Index1.R', fR1, 0, 0);
    applyBonePose('Middle1.R', fR2, 0, 0);
    applyBonePose('Pinky1.R', fR1 * 0.7, 0, 0);

    // 5. Calm Head Focus on Laptop + Occasional Thinking Tilt + Minimal Cursor Glance
    const nowSec = performance.now() / 1000;
    const p = pointerRef.current;
    const glancing = !reducedMotion && p.nearWorkspace && nowSec - p.lastMoveTime < 1.8;

    const screenScanYaw = reducedMotion
      ? 0
      : st.mode === 'typing'
      ? Math.sin(t * 0.85) * 0.055
      : Math.sin(t * 0.45) * 0.085;
    const thinkingRoll = reducedMotion
      ? 0
      : st.mode === 'thinking'
      ? Math.sin(t * 0.6) * 0.075
      : Math.sin(t * 0.4) * 0.025;

    const targetYaw = glancing
      ? THREE.MathUtils.clamp(screenScanYaw + p.nx * 0.14, -0.2, 0.2)
      : screenScanYaw;
    const targetPitch = glancing
      ? THREE.MathUtils.clamp(0.2 + p.ny * 0.08, 0.1, 0.32)
      : st.mode === 'thinking'
      ? 0.16
      : 0.24;
    const targetRoll = thinkingRoll;

    st.yaw = THREE.MathUtils.damp(st.yaw, targetYaw, 3.2, delta);
    st.pitch = THREE.MathUtils.damp(st.pitch, targetPitch, 3.2, delta);
    st.roll = THREE.MathUtils.damp(st.roll, targetRoll, 2.6, delta);

    applyCharSpaceDelta('Neck', st.pitch * 0.35, st.yaw * 0.35, 0, 'YXZ');
    applyCharSpaceDelta('Head', st.pitch * 0.65, st.yaw * 0.65, st.roll, 'YXZ');

    // 6. Natural Autonomous Blinking (slower, calmer cadence than Hero)
    if (st.blinkPhase === 'idle') {
      if (t >= st.nextBlinkAt) {
        st.blinkPhase = 'closing';
        st.doubleBlinkPending = Math.random() < 0.18;
      }
    } else if (st.blinkPhase === 'closing') {
      st.blinkProgress = Math.min(1, st.blinkProgress + delta / 0.08);
      if (st.blinkProgress >= 1) {
        st.blinkPhase = 'opening';
        st.blinkCount += 1;
      }
    } else if (st.blinkPhase === 'opening') {
      st.blinkProgress = Math.max(0, st.blinkProgress - delta / 0.11);
      if (st.blinkProgress <= 0) {
        if (st.doubleBlinkPending) {
          st.doubleBlinkPending = false;
          st.blinkPhase = 'double_wait';
          st.nextBlinkAt = t + 0.12;
        } else {
          st.blinkPhase = 'idle';
          st.nextBlinkAt = t + 3.2 + Math.random() * 3.0;
        }
      }
    } else if (st.blinkPhase === 'double_wait') {
      if (t >= st.nextBlinkAt) {
        st.blinkPhase = 'closing';
      }
    }

    const blink = st.blinkProgress;
    const upperLidX = THREE.MathUtils.lerp(-1.18, 0.08, blink);
    const lowerLidX = THREE.MathUtils.lerp(1.15, -0.06, blink);
    const pupilPitch = 0.16; // Focused calmly downward toward laptop screen
    const pupilYaw = glancing ? p.nx * 0.14 : screenScanYaw * 0.8;

    eyesRef.current.forEach((eye) => {
      eye.pupilGroup.rotation.set(pupilPitch, pupilYaw, 0);
      eye.upperLid.rotation.set(upperLidX, 0, 0);
      eye.lowerLid.rotation.set(lowerLidX, 0, 0);
    });

    // Update diagnostics + simple diorama frustum check
    if (window.__ABOUT_MONSTER_STATE__ && dioramaRef.current) {
      const dbg = window.__ABOUT_MONSTER_STATE__;
      dbg.mode = st.mode;
      dbg.breathingOffset = Number(breathingOffset.toFixed(4));
      dbg.blinkCount = st.blinkCount;
      dbg.typingCycles = st.typingCycles;
      dbg.headYaw = Number(st.yaw.toFixed(4));
      dbg.headPitch = Number(st.pitch.toFixed(4));
      dbg.glancing = glancing;
      dbg.reducedMotion = reducedMotion;

      // Project head & desk corners to verify zero clipping
      const head = bonesRef.current['Head'];
      if (head) {
        const hv = new THREE.Vector3();
        head.getWorldPosition(hv).project(state.camera);
        dbg.clipped = Math.abs(hv.x) > 0.9 || Math.abs(hv.y) > 0.9;
      }
    }
  });

  return (
    <group ref={dioramaRef} position={[0, -1.25, 0]} rotation={[0, 0.72, 0]}>
      {/* Cozy Office Chair (CC0 by Quaternius) */}
      <primitive object={chairObj} position={[0, 0, -0.48]} rotation={[0, Math.PI, 0]} />

      {/* Seated Second Monster (Alien CC0 by Quaternius, styled with slate-teal fur) */}
      <group ref={monsterGroupRef} position={[0, 0.28, -0.18]} scale={0.82}>
        <primitive object={clonedMonster} />
      </group>

      {/* Compact Developer Desk (CC0 by Kenney) */}
      <primitive object={deskObj} position={[0, 0, 0.86]} />

      {/* Minimalist Laptop on Desk facing the Monster (CC0 by Kenney) */}
      <primitive object={laptopObj} position={[0, deskTopY, 0.72]} rotation={[0, 0, 0]} />

      {/* Subtle cozy screen glow illuminating the monster's face while working */}
      <pointLight
        position={[0, deskTopY + 0.36, 0.55]}
        intensity={0.75}
        distance={2.2}
        color="#99F6E4"
      />

      {/* Tiny ceramic coffee mug on the desk corner for miniature-world charm */}
      <group position={[0.76, deskTopY, 0.86]}>
        <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.075, 0.068, 0.18, 16]} />
          <meshStandardMaterial color="#D97706" roughness={0.45} />
        </mesh>
        <mesh position={[0.075, 0.095, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.042, 0.013, 8, 14, Math.PI]} />
          <meshStandardMaterial color="#D97706" roughness={0.45} />
        </mesh>
      </group>
    </group>
  );
};

useGLTF.preload(MONSTER_PATH);
useGLTF.preload(DESK_PATH);
useGLTF.preload(CHAIR_PATH);
useGLTF.preload(LAPTOP_PATH);
