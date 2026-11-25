import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getFurBumpTexture, getFurShellAlphaTexture } from '../utils/furTextures';

const MODEL_PATH = '/models/monster/yeti-mascot.glb';
const FUR_SHELL_LAYERS = 5;

export interface HeroMonsterDebugState {
  loaded: boolean;
  breathingOffset: number;
  blinkCount: number;
  isBlinking: boolean;
  headYaw: number;
  headPitch: number;
  isTracking: boolean;
  reactionCount: number;
  activeClip: string;
  reducedMotion: boolean;
  clipped: boolean;
  ndcBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

declare global {
  interface Window {
    __HERO_MONSTER_STATE__?: HeroMonsterDebugState;
    __TRIGGER_MONSTER_WAVE__?: () => void;
  }
}

interface HeroMonsterModelProps {
  isActive: boolean;
  reducedMotion: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface EyeRig {
  upperLid: THREE.Mesh;
  lowerLid: THREE.Mesh;
  pupilGroup: THREE.Group;
}

export const HeroMonsterModel: React.FC<HeroMonsterModelProps> = ({
  isActive,
  reducedMotion,
  containerRef,
}) => {
  const { scene, animations } = useGLTF(MODEL_PATH);
  const rootGroupRef = useRef<THREE.Group>(null);

  // Clone GLTF with intact skeleton bindings
  const clonedScene = useMemo(() => cloneSkeleton(scene), [scene]);

  // Refs for bones, eyes, mixer, and interaction state (zero React re-renders per frame)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const waveActionRef = useRef<THREE.AnimationAction | null>(null);
  const yesActionRef = useRef<THREE.AnimationAction | null>(null);

  const headBoneRef = useRef<THREE.Bone | null>(null);
  const neckBoneRef = useRef<THREE.Bone | null>(null);
  const torsoBoneRef = useRef<THREE.Bone | null>(null);
  const abdomenBoneRef = useRef<THREE.Bone | null>(null);
  const baseHeadQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const baseNeckQuatRef = useRef<THREE.Quaternion>(new THREE.Quaternion());
  const eyesRef = useRef<EyeRig[]>([]);

  // Pointer & reaction refs
  const pointerRef = useRef({
    nx: 0,
    ny: 0,
    active: false,
    lastMoveTime: 0,
    speed: 0,
    hovered: false,
  });

  // Smoothed animation channels
  const animStateRef = useRef({
    yaw: 0,
    pitch: 0,
    roll: 0,
    pupilX: 0,
    pupilY: 0,
    blinkProgress: 0, // 0 = open, 1 = closed
    blinkPhase: 'idle' as 'idle' | 'closing' | 'opening' | 'double_wait',
    nextBlinkAt: 2.2,
    doubleBlinkPending: false,
    blinkCount: 0,
    reactionCount: 0,
    reactionCooldown: 0,
    activeClip: 'Idle',
    elapsed: 0,
    tabHidden: false,
    waveToggle: false,
  });

  // Setup materials, multi-layer skinned fur shells, and expressive 3D eyes on mount
  useEffect(() => {
    const bumpMap = getFurBumpTexture();
    const createdDisposables: Array<{ dispose: () => void }> = [];
    const addedObjects: Array<{ parent: THREE.Object3D; child: THREE.Object3D }> = [];

    let yetiMainMesh: THREE.SkinnedMesh | null = null;
    let eyeWhiteMesh: THREE.SkinnedMesh | null = null;

    clonedScene.updateMatrixWorld(true);

    clonedScene.traverse((obj) => {
      if ((obj as THREE.Bone).isBone) {
        const bone = obj as THREE.Bone;
        if (bone.name === 'Head') {
          headBoneRef.current = bone;
          baseHeadQuatRef.current.copy(bone.quaternion);
        }
        if (bone.name === 'Neck') {
          neckBoneRef.current = bone;
          baseNeckQuatRef.current.copy(bone.quaternion);
        }
        if (bone.name === 'Torso') torsoBoneRef.current = bone;
        if (bone.name === 'Abdomen') abdomenBoneRef.current = bone;
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
        const matName = mat?.name || '';

        if (matName === 'Yeti_Main') {
          yetiMainMesh = mesh as THREE.SkinnedMesh;
          const furBaseMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#228B82'), // Lush signature turquoise-teal coat
            roughness: 0.88,
            metalness: 0.0,
            sheen: 1.0,
            sheenRoughness: 0.6,
            sheenColor: new THREE.Color('#A7F3D0'),
            bumpMap,
            bumpScale: 0.015,
          });
          mesh.material = furBaseMat;
          createdDisposables.push(furBaseMat);
        } else if (matName === 'Yeti_Secondary') {
          const secondaryMat = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#86D6CC'), // Soft pastel mint-teal belly, face, hands, feet
            roughness: 0.82,
            metalness: 0.0,
            sheen: 0.75,
            sheenRoughness: 0.65,
            sheenColor: new THREE.Color('#CCFBF1'),
            bumpMap,
            bumpScale: 0.008,
          });
          mesh.material = secondaryMat;
          createdDisposables.push(secondaryMat);
        } else if (matName === 'Yeti_Teeth') {
          const teethMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#FFFBF2'),
            roughness: 0.35,
            metalness: 0.0,
          });
          mesh.material = teethMat;
          createdDisposables.push(teethMat);
        } else if (matName === 'Tongue') {
          const tongueMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#E88B9C'),
            roughness: 0.45,
            metalness: 0.0,
          });
          mesh.material = tongueMat;
          createdDisposables.push(tongueMat);
        } else if (matName === 'Eye_White') {
          eyeWhiteMesh = mesh as THREE.SkinnedMesh;
          mesh.visible = false; // Replaced by expressive rigged 3D eyes + blinking eyelids
        } else if (matName === 'Eye_Black') {
          mesh.visible = false;
        }
      }
    });

    // Build lightweight 5-layer skinned fur shells around Yeti_Main for visible fuzzy silhouette
    const mainMesh = yetiMainMesh as THREE.SkinnedMesh | null;
    if (mainMesh && mainMesh.parent && mainMesh.skeleton) {
      const furLengthLocal = 0.00072; // ~0.072 world units (CharacterArmature scale is 100)

      for (let layer = 0; layer < FUR_SHELL_LAYERS; layer++) {
        const t = (layer + 1) / FUR_SHELL_LAYERS;
        const offset = furLengthLocal * t;
        const alphaMap = getFurShellAlphaTexture(layer, FUR_SHELL_LAYERS);

        // Subtle root-to-tip AO & lighter fluffy tips
        const tipColor = new THREE.Color('#196D66').lerp(new THREE.Color('#42C4B5'), t * 0.9);

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
            .replace(
              '#include <common>',
              `#include <common>\nuniform float uFurOffset;`
            )
            .replace(
              '#include <begin_vertex>',
              `#include <begin_vertex>\ntransformed += normalize(objectNormal) * uFurOffset;`
            );
        };
        shellMat.customProgramCacheKey = () => `yeti-fur-shell-${layer}`;

        const shellMesh = new THREE.SkinnedMesh(mainMesh.geometry, shellMat);
        shellMesh.name = `Yeti_FurShell_${layer}`;
        shellMesh.bind(mainMesh.skeleton, mainMesh.bindMatrix);
        shellMesh.castShadow = false;
        shellMesh.receiveShadow = false;
        shellMesh.frustumCulled = false;

        mainMesh.parent.add(shellMesh);
        addedObjects.push({ parent: mainMesh.parent, child: shellMesh });
        createdDisposables.push(shellMat);
      }
    }

    // Mount expressive 3D eyes + blinking eyelids directly onto the Head bone
    const headBone = headBoneRef.current;
    const origEyeMesh = eyeWhiteMesh as THREE.SkinnedMesh | null;
    const mountedEyes: EyeRig[] = [];

    if (headBone && origEyeMesh) {
      // Ensure world matrices are current (do NOT use getVertexPosition + matrixWorld which double-scales!)
      if (rootGroupRef.current) {
        rootGroupRef.current.updateMatrixWorld(true);
      } else {
        clonedScene.updateMatrixWorld(true);
      }

      const posAttr = origEyeMesh.geometry.attributes.position;
      const leftLocalSum = new THREE.Vector3();
      const rightLocalSum = new THREE.Vector3();
      let leftCount = 0;
      let rightCount = 0;
      let minZ = Infinity;
      let maxZ = -Infinity;

      const v = new THREE.Vector3();
      for (let i = 0; i < posAttr.count; i++) {
        v.fromBufferAttribute(posAttr, i);
        minZ = Math.min(minZ, v.z);
        maxZ = Math.max(maxZ, v.z);

        if (v.x < 0) {
          leftLocalSum.add(v);
          leftCount++;
        } else {
          rightLocalSum.add(v);
          rightCount++;
        }
      }

      if (leftCount > 0 && rightCount > 0) {
        // Transform bind-pose eye centroids from mesh local -> world -> headBone local (single scale pass)
        const leftWorld = leftLocalSum.divideScalar(leftCount).applyMatrix4(origEyeMesh.matrixWorld);
        const rightWorld = rightLocalSum.divideScalar(rightCount).applyMatrix4(origEyeMesh.matrixWorld);

        const leftInHead = headBone.worldToLocal(leftWorld.clone());
        const rightInHead = headBone.worldToLocal(rightWorld.clone());

        // Compute world-to-head rotation so each eye's +Z faces forward and +Y faces up
        const headWorldQuat = new THREE.Quaternion();
        headBone.getWorldQuaternion(headWorldQuat);
        const worldToHeadQuat = headWorldQuat.clone().invert();

        // Eye radius in headBone local space (~0.00148 -> ~0.15 world units)
        const eyeRadius = Math.max(0.00135, (maxZ - minZ) * 0.46);

        const scleraGeo = new THREE.SphereGeometry(eyeRadius, 20, 16);
        const irisGeo = new THREE.SphereGeometry(eyeRadius * 0.62, 18, 14);
        const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.44, 16, 12);
        const catchlightBigGeo = new THREE.SphereGeometry(eyeRadius * 0.17, 10, 8);
        const catchlightSmallGeo = new THREE.SphereGeometry(eyeRadius * 0.085, 8, 8);
        const upperLidGeo = new THREE.SphereGeometry(
          eyeRadius * 1.12,
          20,
          12,
          0,
          Math.PI * 2,
          0,
          Math.PI * 0.52
        );
        const lowerLidGeo = new THREE.SphereGeometry(
          eyeRadius * 1.11,
          20,
          12,
          0,
          Math.PI * 2,
          Math.PI * 0.48,
          Math.PI * 0.52
        );

        const scleraMat = new THREE.MeshPhysicalMaterial({
          color: '#FFFFFF',
          roughness: 0.14,
          metalness: 0.0,
          clearcoat: 0.9,
          clearcoatRoughness: 0.12,
        });
        const irisMat = new THREE.MeshStandardMaterial({
          color: '#0D6E68',
          roughness: 0.25,
          metalness: 0.05,
        });
        const pupilMat = new THREE.MeshStandardMaterial({
          color: '#141316',
          roughness: 0.15,
          metalness: 0.0,
        });
        const catchlightMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
        const lidMat = new THREE.MeshPhysicalMaterial({
          color: '#73C9BE',
          roughness: 0.78,
          metalness: 0.0,
          sheen: 0.7,
          sheenColor: new THREE.Color('#CCFBF1'),
        });

        createdDisposables.push(
          scleraGeo,
          irisGeo,
          pupilGeo,
          catchlightBigGeo,
          catchlightSmallGeo,
          upperLidGeo,
          lowerLidGeo,
          scleraMat,
          irisMat,
          pupilMat,
          catchlightMat,
          lidMat
        );

        for (const [idx, eyePos] of [leftInHead, rightInHead].entries()) {
          const eyeMount = new THREE.Group();
          eyeMount.name = idx === 0 ? 'CustomEye_R' : 'CustomEye_L';
          eyeMount.position.copy(eyePos);
          eyeMount.quaternion.copy(worldToHeadQuat);

          // Nudge eyes forward onto the front face plane, slightly inward & down above the nose
          eyeMount.translateZ(eyeRadius * 0.95);
          eyeMount.translateY(-eyeRadius * 0.32);
          eyeMount.translateX(idx === 0 ? eyeRadius * 0.65 : -eyeRadius * 0.65);

          const sclera = new THREE.Mesh(scleraGeo, scleraMat);
          eyeMount.add(sclera);

          // Pupil + iris + catchlights sit cleanly on the front surface of the sclera
          const pupilGroup = new THREE.Group();
          const iris = new THREE.Mesh(irisGeo, irisMat);
          iris.position.set(0, 0, eyeRadius * 0.78);
          iris.scale.set(1, 1, 0.38);
          pupilGroup.add(iris);

          const pupil = new THREE.Mesh(pupilGeo, pupilMat);
          pupil.position.set(0, 0, eyeRadius * 0.89);
          pupil.scale.set(1, 1, 0.35);
          pupilGroup.add(pupil);

          const catchBig = new THREE.Mesh(catchlightBigGeo, catchlightMat);
          catchBig.position.set(eyeRadius * 0.2, eyeRadius * 0.22, eyeRadius * 1.02);
          pupilGroup.add(catchBig);

          const catchSmall = new THREE.Mesh(catchlightSmallGeo, catchlightMat);
          catchSmall.position.set(-eyeRadius * 0.17, -eyeRadius * 0.14, eyeRadius * 1.02);
          pupilGroup.add(catchSmall);

          eyeMount.add(pupilGroup);

          // Upper & lower eyelids
          const upperLid = new THREE.Mesh(upperLidGeo, lidMat);
          upperLid.rotation.x = -1.26; // Open resting angle
          eyeMount.add(upperLid);

          const lowerLid = new THREE.Mesh(lowerLidGeo, lidMat);
          lowerLid.rotation.x = 1.22; // Open resting angle
          eyeMount.add(lowerLid);

          headBone.add(eyeMount);
          addedObjects.push({ parent: headBone, child: eyeMount });
          mountedEyes.push({ upperLid, lowerLid, pupilGroup });
        }
      }
    }

    eyesRef.current = mountedEyes;

    // Setup AnimationMixer for Idle + subtle Wave / Yes reactions
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const idleClip = animations.find((a) => a.name.endsWith('|Idle')) || animations[0];
    const waveClip = animations.find((a) => a.name.endsWith('|Wave'));
    const yesClip = animations.find((a) => a.name.endsWith('|Yes'));

    if (idleClip) {
      const action = mixer.clipAction(idleClip);
      action.timeScale = 0.68; // Calm, relaxed idle sway
      action.play();
      idleActionRef.current = action;
    }

    if (waveClip) {
      const action = mixer.clipAction(waveClip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = false;
      action.timeScale = 0.9;
      waveActionRef.current = action;
    }

    if (yesClip) {
      const action = mixer.clipAction(yesClip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = false;
      action.timeScale = 0.95;
      yesActionRef.current = action;
    }

    const onMixerFinished = () => {
      if (idleActionRef.current) {
        idleActionRef.current.reset().fadeIn(0.35).play();
        animStateRef.current.activeClip = 'Idle';
      }
    };
    mixer.addEventListener('finished', onMixerFinished);

    // Initialize debug snapshot & wave trigger helper for verification
    window.__HERO_MONSTER_STATE__ = {
      loaded: true,
      breathingOffset: 0,
      blinkCount: 0,
      isBlinking: false,
      headYaw: 0,
      headPitch: 0,
      isTracking: false,
      reactionCount: 0,
      activeClip: 'Idle',
      reducedMotion,
      clipped: false,
      ndcBounds: { minX: 0, maxX: 0, minY: 0, maxY: 0 },
    };

    window.__TRIGGER_MONSTER_WAVE__ = () => {
      const wave = waveActionRef.current;
      const idle = idleActionRef.current;
      if (wave && idle) {
        wave.reset().fadeIn(0.18).play();
        idle.fadeOut(0.18);
        animStateRef.current.activeClip = 'Wave';
        animStateRef.current.reactionCount += 1;
      }
    };

    return () => {
      delete window.__TRIGGER_MONSTER_WAVE__;
      mixer.removeEventListener('finished', onMixerFinished);
      mixer.stopAllAction();
      for (const { parent, child } of addedObjects) {
        parent.remove(child);
      }
      for (const d of createdDisposables) {
        d.dispose();
      }
      eyesRef.current = [];
    };
  }, [clonedScene, animations, reducedMotion]);

  // Global pointer tracking (desktop / fine pointer only) + tab visibility pause
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reducedMotion) return;

      const el = containerRef.current;
      const now = performance.now() / 1000;
      const rect = el ? el.getBoundingClientRect() : null;
      const nx = rect
        ? THREE.MathUtils.clamp((e.clientX - (rect.left + rect.width * 0.5)) / (window.innerWidth * 0.45), -1, 1)
        : (e.clientX / window.innerWidth) * 2 - 1;
      const ny = rect
        ? THREE.MathUtils.clamp((e.clientY - (rect.top + rect.height * 0.44)) / (window.innerHeight * 0.45), -1, 1)
        : (e.clientY / window.innerHeight) * 2 - 1;

      const prev = pointerRef.current;
      const dt = Math.max(0.016, now - prev.lastMoveTime);
      const dist = Math.hypot(nx - prev.nx, ny - prev.ny);
      const speed = dist / dt;

      prev.nx = nx;
      prev.ny = ny;
      prev.active = true;
      prev.lastMoveTime = now;
      prev.speed = speed;

      // Subtle reaction on brisk pointer motion near the monster: quick attentive blink
      const st = animStateRef.current;
      if (speed > 3.2 && st.blinkPhase === 'idle' && st.reactionCooldown <= 0) {
        st.blinkPhase = 'closing';
        st.doubleBlinkPending = false;
        st.reactionCooldown = 1.6;
      }
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    const handleVisibilityChange = () => {
      animStateRef.current.tabHidden = document.hidden;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [containerRef, reducedMotion]);

  // Trigger playful Wave / Yes reaction when user clicks or taps the monster
  const triggerFriendlyReaction = () => {
    if (reducedMotion) return;
    const st = animStateRef.current;
    const idle = idleActionRef.current;
    const nextAction = st.waveToggle ? yesActionRef.current : waveActionRef.current;
    const nextName = st.waveToggle ? 'Yes' : 'Wave';
    st.waveToggle = !st.waveToggle;

    if (nextAction && idle && st.activeClip === 'Idle') {
      nextAction.reset();
      nextAction.fadeIn(0.22).play();
      idle.fadeOut(0.22);
      st.activeClip = nextName;
      st.reactionCount += 1;
    }

    // Also trigger a cheerful blink
    if (st.blinkPhase === 'idle') {
      st.blinkPhase = 'closing';
    }
  };

  // Reusable math objects for zero-GC NDC safe-area projection
  const boneBoundsRef = useRef({
    vec: new THREE.Vector3(),
    trackedBones: [] as THREE.Bone[],
  });

  // Frame loop: Breathing, Eye Blinking, Cursor Tracking, and Subtle Reactions
  useFrame((state, rawDelta) => {
    const st = animStateRef.current;
    if (!isActive || st.tabHidden) return;

    const delta = Math.min(rawDelta, 0.05);
    st.elapsed += delta;
    if (st.reactionCooldown > 0) st.reactionCooldown -= delta;

    const t = st.elapsed;

    // 1. Update skeletal Idle/Wave mixer
    if (mixerRef.current && !reducedMotion) {
      mixerRef.current.update(delta);
    }

    // 2. Organic Idle / Breathing animation (multi-harmonic, non-mechanical)
    const breathWave = Math.sin(t * 1.55) * 0.7 + Math.sin(t * 0.72 + 1.1) * 0.3;
    const breathingOffset = reducedMotion ? 0 : breathWave * 0.028;

    if (rootGroupRef.current && !reducedMotion) {
      // Gentle living bob + subtle weight shift (grounded at y = -1.32)
      rootGroupRef.current.position.y = -1.32 + breathingOffset;
      rootGroupRef.current.rotation.z = Math.sin(t * 0.65) * 0.016;
    }

    if (torsoBoneRef.current && !reducedMotion) {
      const chestExpand = 1 + breathWave * 0.022;
      const chestHeight = 1 + breathWave * 0.014;
      torsoBoneRef.current.scale.set(chestExpand, chestHeight, chestExpand);
    }

    if (abdomenBoneRef.current && !reducedMotion) {
      const bellyExpand = 1 + breathWave * 0.018;
      abdomenBoneRef.current.scale.set(bellyExpand, 1, bellyExpand);
    }

    // 3. Autonomous Eye Blinking with varied intervals + occasional double blink
    if (st.blinkPhase === 'idle') {
      if (t >= st.nextBlinkAt) {
        st.blinkPhase = 'closing';
        st.doubleBlinkPending = Math.random() < 0.22;
      }
    } else if (st.blinkPhase === 'closing') {
      st.blinkProgress = Math.min(1, st.blinkProgress + delta / 0.075);
      if (st.blinkProgress >= 1) {
        st.blinkPhase = 'opening';
        st.blinkCount += 1;
      }
    } else if (st.blinkPhase === 'opening') {
      st.blinkProgress = Math.max(0, st.blinkProgress - delta / 0.105);
      if (st.blinkProgress <= 0) {
        if (st.doubleBlinkPending) {
          st.doubleBlinkPending = false;
          st.blinkPhase = 'double_wait';
          st.nextBlinkAt = t + 0.11;
        } else {
          st.blinkPhase = 'idle';
          st.nextBlinkAt = t + 2.6 + Math.random() * 3.0;
        }
      }
    } else if (st.blinkPhase === 'double_wait') {
      if (t >= st.nextBlinkAt) {
        st.blinkPhase = 'closing';
      }
    }

    // 4. Cursor Tracking with smooth damping, rotation clamping & automatic idle return
    const nowSec = performance.now() / 1000;
    const p = pointerRef.current;
    const pointerRecentlyMoved = p.active && nowSec - p.lastMoveTime < 2.8;
    const isTracking = !reducedMotion && (pointerRecentlyMoved || p.hovered);

    // Natural subtle ambient head curiosity when idle
    const idleYaw = reducedMotion ? 0 : Math.sin(t * 0.52) * 0.065;
    const idlePitch = reducedMotion ? 0 : Math.sin(t * 0.84 + 0.7) * 0.035;
    const idleRoll = reducedMotion ? 0 : Math.cos(t * 0.48) * 0.03;

    const targetYaw = isTracking ? THREE.MathUtils.clamp(p.nx * 0.36, -0.38, 0.38) : idleYaw;
    const targetPitch = isTracking ? THREE.MathUtils.clamp(p.ny * 0.22, -0.22, 0.22) : idlePitch;
    const targetRoll = isTracking
      ? THREE.MathUtils.clamp(-p.nx * 0.09 + (p.hovered ? 0.06 : 0), -0.14, 0.14)
      : idleRoll;

    const dampLambda = isTracking ? 6.5 : 2.8;
    st.yaw = THREE.MathUtils.damp(st.yaw, targetYaw, dampLambda, delta);
    st.pitch = THREE.MathUtils.damp(st.pitch, targetPitch, dampLambda, delta);
    st.roll = THREE.MathUtils.damp(st.roll, targetRoll, dampLambda, delta);

    // Apply non-accumulating quaternion offsets relative to rest pose (or current clip pose)
    // Using baseHeadQuatRef prevents frame-by-frame accumulation when Idle doesn't keyframe Head
    const isPlayingReaction = st.activeClip !== 'Idle';
    const neckDelta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(st.pitch * 0.3, st.yaw * 0.35, 0, 'YXZ')
    );
    const headDelta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(st.pitch * 0.65, st.yaw * 0.65, st.roll, 'YXZ')
    );

    if (neckBoneRef.current) {
      if (!isPlayingReaction) {
        neckBoneRef.current.quaternion.copy(baseNeckQuatRef.current).multiply(neckDelta);
      }
    }
    if (headBoneRef.current) {
      if (!isPlayingReaction) {
        headBoneRef.current.quaternion.copy(baseHeadQuatRef.current).multiply(headDelta);
      }
    }

    // 5. Independent eye pupil gaze + eyelid blinking
    const targetPupilX = isTracking ? THREE.MathUtils.clamp(p.nx * 0.32, -0.34, 0.34) : 0;
    const targetPupilY = isTracking ? THREE.MathUtils.clamp(p.ny * 0.22, -0.24, 0.24) : 0;
    st.pupilX = THREE.MathUtils.damp(st.pupilX, targetPupilX, 9.0, delta);
    st.pupilY = THREE.MathUtils.damp(st.pupilY, targetPupilY, 9.0, delta);

    const blink = st.blinkProgress;
    const upperLidX = THREE.MathUtils.lerp(-1.26, 0.08, blink);
    const lowerLidX = THREE.MathUtils.lerp(1.22, -0.06, blink);
    eyesRef.current.forEach((eye) => {
      eye.pupilGroup.rotation.set(st.pupilY, st.pupilX, 0);
      eye.upperLid.rotation.set(upperLidX, 0, 0);
      eye.lowerLid.rotation.set(lowerLidX, 0, 0);
    });

    // Update lightweight diagnostic snapshot + real-time NDC safe-area projection
    if (window.__HERO_MONSTER_STATE__ && rootGroupRef.current) {
      const bounds = boneBoundsRef.current;
      if (bounds.trackedBones.length === 0) {
        clonedScene.traverse((obj) => {
          if ((obj as THREE.Bone).isBone) {
            bounds.trackedBones.push(obj as THREE.Bone);
          }
        });
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      const v = bounds.vec;

      for (let i = 0; i < bounds.trackedBones.length; i++) {
        bounds.trackedBones[i].getWorldPosition(v);
        v.project(state.camera);
        if (v.x < minX) minX = v.x;
        if (v.x > maxX) maxX = v.x;
        if (v.y < minY) minY = v.y;
        if (v.y > maxY) maxY = v.y;
      }

      const dbg = window.__HERO_MONSTER_STATE__;
      dbg.breathingOffset = Number(breathingOffset.toFixed(4));
      dbg.blinkCount = st.blinkCount;
      dbg.isBlinking = blink > 0.1;
      dbg.headYaw = Number(st.yaw.toFixed(4));
      dbg.headPitch = Number(st.pitch.toFixed(4));
      dbg.isTracking = isTracking;
      dbg.reactionCount = st.reactionCount;
      dbg.activeClip = st.activeClip;
      dbg.reducedMotion = reducedMotion;
      dbg.ndcBounds = {
        minX: Number(minX.toFixed(3)),
        maxX: Number(maxX.toFixed(3)),
        minY: Number(minY.toFixed(3)),
        maxY: Number(maxY.toFixed(3)),
      };
      // Safe margin check for mesh thickness & fur around skeleton endpoints
      dbg.clipped = minX < -0.94 || maxX > 0.94 || minY < -0.94 || maxY > 0.94;
    }
  });

  return (
    <group
      ref={rootGroupRef}
      position={[0, -1.32, 0]}
      scale={1.06}
      onClick={(e) => {
        e.stopPropagation();
        triggerFriendlyReaction();
      }}
      onPointerOver={() => {
        pointerRef.current.hovered = true;
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        pointerRef.current.hovered = false;
        document.body.style.cursor = '';
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
