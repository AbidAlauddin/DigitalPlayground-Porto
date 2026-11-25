import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getTechBlockTexture, getSleepZTexture } from '../utils/blockTextures';
import { getFurBumpTexture } from '../utils/furTextures';

const MODEL_PATH = '/monsters/skill-builder/builder-mascot.glb';

const OFFSCREEN_X = -5.25; // Invisible past left canvas frustum boundary
const PYRAMID_CENTER_X = 0.82;
const PYRAMID_Z = 0.0;
const SLEEP_SPOT_X = -1.25;

export type SkillBuilderPhase =
  | 'entering'
  | 'fetching'
  | 'offscreen_fetch'
  | 'carrying'
  | 'placing'
  | 'post_place_pause'
  | 'returning'
  | 'resting'
  | 'celebrating'
  | 'exhausted'
  | 'sleeping'
  | 'slowing_down'
  | 'surprised'
  | 'looking'
  | 'resuming';

export interface SkillBuilderDebugState {
  loaded: boolean;
  characterName: string;
  eyeCount: number;
  hasFur: boolean;
  phase: SkillBuilderPhase;
  posX: number;
  currentBlockIdx: number;
  placedCount: number;
  placedIds: string[];
  visibleBlocksCount: number;
  monsterFullyOffscreen: boolean;
  carryingBlockIdx: number | null;
  fatigueLevel: number;
  sleepDisturbed: boolean;
  surpriseCount: number;
  blinkCount: number;
  breathingOffset: number;
  dynamicShadowActive: boolean;
  reducedMotion: boolean;
  clipped: boolean;
}

declare global {
  interface Window {
    __SKILL_BUILDER_STATE__?: SkillBuilderDebugState;
    __FAST_FORWARD_SKILL_BUILDER__?: (placedBlocks: number) => void;
  }
}

interface SkillBuilderSceneProps {
  isActive: boolean;
  reducedMotion: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface EyeRig {
  mount: THREE.Group;
  sclera: THREE.Mesh;
  upperLid: THREE.Mesh;
  lowerLid: THREE.Mesh;
  pupilGroup: THREE.Group;
}

interface PyramidBlockConfig {
  id: string;
  label: string;
  color: string;
  size: [number, number, number];
  targetPos: [number, number, number];
  targetRotY: number;
}

// 10 Technology Blocks forming a clean, substantial 4-3-2-1 Pyramid (Row 0 -> Row 3 Apex)
const DX = 0.60;
const ROW_H = 0.50;
const ROW_Y = [
  ROW_H * 0.5,
  ROW_H * 1.5 + 0.005,
  ROW_H * 2.5 + 0.01,
  ROW_H * 3.5 + 0.015,
];

// 10 Technology Blocks ordered strictly Right-to-Left, Bottom-to-Top:
//             [10]
//          [9] [8]
//       [7] [6] [5]
//    [4] [3] [2] [1]
const PYRAMID_BLOCKS: PyramidBlockConfig[] = [
  // Row 0 (Base — Right to Left: [1], [2], [3], [4])
  {
    id: 'vite',
    label: 'Vite',
    color: '#7C3AED',
    size: [0.56, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X + 1.5 * DX, ROW_Y[0], PYRAMID_Z],
    targetRotY: -0.02,
  },
  {
    id: 'python',
    label: 'Python',
    color: '#2563EB',
    size: [0.56, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X + 0.5 * DX, ROW_Y[0], PYRAMID_Z],
    targetRotY: 0.03,
  },
  {
    id: 'tailwind',
    label: 'Tailwind',
    color: '#0D9488',
    size: [0.57, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X - 0.5 * DX, ROW_Y[0], PYRAMID_Z],
    targetRotY: -0.02,
  },
  {
    id: 'js',
    label: 'JavaScript',
    color: '#CA8A04',
    size: [0.56, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X - 1.5 * DX, ROW_Y[0], PYRAMID_Z],
    targetRotY: 0.02,
  },
  // Row 1 (Right to Left: [5], [6], [7])
  {
    id: 'docker',
    label: 'Docker',
    color: '#0284C7',
    size: [0.56, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X + 1.0 * DX, ROW_Y[1], PYRAMID_Z],
    targetRotY: -0.02,
  },
  {
    id: 'mysql',
    label: 'MySQL',
    color: '#0369A1',
    size: [0.56, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X, ROW_Y[1], PYRAMID_Z],
    targetRotY: 0.02,
  },
  {
    id: 'laravel',
    label: 'Laravel',
    color: '#0F766E',
    size: [0.57, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X - 1.0 * DX, ROW_Y[1], PYRAMID_Z],
    targetRotY: -0.03,
  },
  // Row 2 (Right to Left: [8], [9])
  {
    id: 'git',
    label: 'Git',
    color: '#D97706',
    size: [0.56, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X + 0.5 * DX, ROW_Y[2], PYRAMID_Z],
    targetRotY: -0.03,
  },
  {
    id: 'react',
    label: 'React',
    color: '#0891B2',
    size: [0.56, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X - 0.5 * DX, ROW_Y[2], PYRAMID_Z],
    targetRotY: 0.03,
  },
  // Row 3 (Apex: [10])
  {
    id: 'php',
    label: 'PHP',
    color: '#475569',
    size: [0.57, ROW_H, 0.54],
    targetPos: [PYRAMID_CENTER_X, ROW_Y[3], PYRAMID_Z],
    targetRotY: 0.0,
  },
];

export const SkillBuilderScene: React.FC<SkillBuilderSceneProps> = ({
  isActive,
  reducedMotion,
  containerRef,
}) => {
  const { scene, animations } = useGLTF(MODEL_PATH);
  // CRITICAL: Must use SkeletonUtils.clone so SkinnedMesh skeletons are properly rebound to cloned bones!
  const clonedScene = useMemo(() => cloneSkeleton(scene), [scene]);

  const stageGroupRef = useRef<THREE.Group>(null);
  const monsterCarrierRef = useRef<THREE.Group>(null);
  const monsterRootRef = useRef<THREE.Group>(null);
  const carryAnchorRef = useRef<THREE.Group>(null);
  const blockMeshRefs = useRef<Array<THREE.Mesh | null>>(PYRAMID_BLOCKS.map(() => null));
  const sleepZRefs = useRef<Array<THREE.Sprite | null>>([null, null, null]);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);
  const duckActionRef = useRef<THREE.AnimationAction | null>(null);

  const bonesRef = useRef<Record<string, THREE.Bone>>({});
  const restQuatsRef = useRef<Record<string, THREE.Quaternion>>({});
  const eyesRef = useRef<EyeRig[]>([]);

  const pointerRef = useRef({
    hovered: false,
    nx: 0,
    ny: 0,
    lastMoveTime: 0,
  });

  // All 10 blocks start hidden off-screen on the left (ZERO blocks visible initially!)
  const blocksStateRef = useRef(
    PYRAMID_BLOCKS.map(() => ({
      status: 'offscreen' as 'offscreen' | 'carried' | 'placed',
      pos: new THREE.Vector3(OFFSCREEN_X, 0.76, 0),
      rotY: 0,
      settleTime: 99,
      placeOrigin: new THREE.Vector3(OFFSCREEN_X, 0.76, 0),
    }))
  );

  const stateRef = useRef({
    elapsed: 0,
    phase: 'entering' as SkillBuilderPhase,
    pausedReturnPhase: 'carrying' as SkillBuilderPhase,
    phaseTimer: 0,
    posX: OFFSCREEN_X,
    posZ: 0.0,
    facingYaw: Math.PI * 0.34,
    currentSpeed: 0,
    smoothTorsoBend: 0,
    smoothArmLift: -0.22,
    smoothArmInward: 0.08,
    gripWeight: 0,
    carryHeightNorm: 0,
    releaseSpread: 0,
    currentBlockIdx: 0,
    carryingBlockIdx: null as number | null,
    placedCount: 0,
    sleepBlend: 0, // 0 = standing, 1 = seated/lounging asleep
    sleepDisturbTimer: 0,
    surpriseCount: 0,
    headYaw: 0,
    headPitch: 0,
    headRoll: 0,
    eyeScale: 1,
    blinkProgress: 0,
    blinkPhase: 'idle' as 'idle' | 'closing' | 'opening' | 'double_wait',
    nextBlinkAt: 2.5,
    doubleBlinkPending: false,
    blinkCount: 0,
    tabHidden: false,
    reducedMotionApplied: false,
  });

  const blockMaterials = useMemo(() => {
    return PYRAMID_BLOCKS.map((b) => {
      const tex = getTechBlockTexture(b.label, b.color, '#FFFFFF');
      return new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.52,
        metalness: 0.05,
      });
    });
  }, []);

  const sleepZMaterials = useMemo(() => {
    const tex = getSleepZTexture();
    return [0, 1, 2].map(
      () =>
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        })
    );
  }, []);

  // Setup materials (signature plush turquoise-teal coat + pastel mint secondary),
  // AnimationMixer, and mount EXACTLY 2 expressive glossy 3D eyes on the Head bone
  useEffect(() => {
    const createdDisposables: Array<{ dispose: () => void }> = [];
    const addedObjects: Array<{ parent: THREE.Object3D; child: THREE.Object3D }> = [];

    const bones: Record<string, THREE.Bone> = {};
    const restQuats: Record<string, THREE.Quaternion> = {};

    const bumpMap = getFurBumpTexture();

    // Signature plush turquoise-teal coat matching Monster Home (Yeti) & Monster About (Cactoro)
    const mainCoatMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#228B82'),
      roughness: 0.88,
      metalness: 0.0,
      sheen: 1.0,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color('#A7F3D0'),
      bumpMap,
      bumpScale: 0.015,
    });

    // Soft pastel mint-teal belly, face, hands, feet (exact match with Yeti secondary)
    const secondaryMintMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#86D6CC'),
      roughness: 0.82,
      metalness: 0.0,
      sheen: 0.75,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color('#CCFBF1'),
      bumpMap,
      bumpScale: 0.008,
    });

    // Soft warm mint-teal inner ears
    const earsMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#7ECFC3'),
      roughness: 0.85,
      metalness: 0.0,
      sheen: 0.7,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color('#CCFBF1'),
    });

    createdDisposables.push(mainCoatMat, secondaryMintMat, earsMat);

    clonedScene.updateMatrixWorld(true);

    let origEyeMesh: THREE.SkinnedMesh | null = null;

    clonedScene.traverse((obj) => {
      if ((obj as THREE.Bone).isBone) {
        const b = obj as THREE.Bone;
        bones[b.name] = b;
        restQuats[b.name] = b.quaternion.clone();
      }

      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; // NEVER cull body mesh parts!

        const matName = (mesh.material as THREE.MeshStandardMaterial)?.name || '';

        if (matName === 'Monkroose_Main' || matName.includes('Main') || mesh.name === 'Monkroose_1') {
          mesh.material = mainCoatMat;
        } else if (matName === 'Monkroose_Secondary' || matName.includes('Secondary') || mesh.name === 'Monkroose_3') {
          mesh.material = secondaryMintMat;
        } else if (matName === 'Monkroose_Ears' || matName.includes('Ears') || mesh.name === 'Monkroose_2') {
          mesh.material = earsMat;
        } else if (matName === 'Eye_White' || mesh.name === 'Monkroose_4') {
          mesh.visible = false; // Replaced by expressive 3D eyes mounted on Head bone
          origEyeMesh = mesh as THREE.SkinnedMesh;
        } else if (matName === 'Eye_Black' || mesh.name === 'Monkroose_5') {
          mesh.visible = false;
        }
      }
    });

    bonesRef.current = bones;
    restQuatsRef.current = restQuats;
    (window as unknown as { __DEBUG_SCENE__: THREE.Object3D }).__DEBUG_SCENE__ = clonedScene;

    // Setup AnimationMixer for organic walking and idle sway
    const mixer = new THREE.AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    const walkClip = animations.find((a) => a.name.includes('Walk'));
    const idleClip = animations.find((a) => a.name.includes('Idle'));
    const duckClip = animations.find((a) => a.name.includes('Duck'));

    if (walkClip) {
      const walkAction = mixer.clipAction(walkClip);
      walkAction.timeScale = 1.0;
      walkAction.play();
      walkAction.setEffectiveWeight(0);
      walkActionRef.current = walkAction;
    }

    if (idleClip) {
      const idleAction = mixer.clipAction(idleClip);
      idleAction.timeScale = 0.72;
      idleAction.play();
      idleAction.setEffectiveWeight(1.0);
      idleActionRef.current = idleAction;
    }

    if (duckClip) {
      const duckAction = mixer.clipAction(duckClip);
      duckAction.timeScale = 0.8;
      duckActionRef.current = duckAction;
    }

    // Mount EXACTLY 2 large, symmetrical, expressive glossy 3D eyes on the Head bone
    const headNode = (bones['Head'] || clonedScene.getObjectByName('Head')) as THREE.Bone | undefined;
    const mountedEyes: EyeRig[] = [];

    if (headNode) {
      // Default exact ground-truth coordinates in Head bone space from Monkroose_4 inverseBindMatrix
      let leftInHead = new THREE.Vector3(-0.003388, 0.003466, 0.001834);
      let rightInHead = new THREE.Vector3(0.003403, 0.003466, 0.001831);

      const skinnedEyeMesh = origEyeMesh as THREE.SkinnedMesh | null;
      if (skinnedEyeMesh && skinnedEyeMesh.skeleton) {
        const headIdx = skinnedEyeMesh.skeleton.bones.indexOf(headNode);
        if (headIdx !== -1 && skinnedEyeMesh.skeleton.boneInverses[headIdx]) {
          const invBindMatrix = skinnedEyeMesh.skeleton.boneInverses[headIdx];
          const posAttr = skinnedEyeMesh.geometry.attributes.position;
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
            leftInHead = leftSum.divideScalar(leftCount).applyMatrix4(invBindMatrix);
            rightInHead = rightSum.divideScalar(rightCount).applyMatrix4(invBindMatrix);
          }
        }
      }

      const eyeRadius = 0.00205;

      const scleraGeo = new THREE.SphereGeometry(eyeRadius, 20, 16);
      const irisGeo = new THREE.SphereGeometry(eyeRadius * 0.62, 18, 14);
      const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.44, 16, 12);
      const catchBigGeo = new THREE.SphereGeometry(eyeRadius * 0.17, 10, 8);
      const catchSmallGeo = new THREE.SphereGeometry(eyeRadius * 0.085, 8, 8);
      const upperLidGeo = new THREE.SphereGeometry(
        eyeRadius * 1.14,
        20,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.52
      );
      const lowerLidGeo = new THREE.SphereGeometry(
        eyeRadius * 1.13,
        20,
        12,
        0,
        Math.PI * 2,
        Math.PI * 0.48,
        Math.PI * 0.52
      );

      const scleraMat = new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.12,
        metalness: 0.0,
        clearcoat: 0.95,
        clearcoatRoughness: 0.1,
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
      const catchMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });
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
        catchBigGeo,
        catchSmallGeo,
        upperLidGeo,
        lowerLidGeo,
        scleraMat,
        irisMat,
        pupilMat,
        catchMat,
        lidMat
      );

      // Socket forward normals in Head bone space
      const fwdLeft = new THREE.Vector3(-0.266, 0.365, 0.892).normalize();
      const fwdRight = new THREE.Vector3(0.266, 0.365, 0.892).normalize();
      const zUnit = new THREE.Vector3(0, 0, 1);

      for (const [idx, eyePos] of [leftInHead, rightInHead].entries()) {
        const eyeMount = new THREE.Group();
        eyeMount.name = idx === 0 ? 'CustomEye_L' : 'CustomEye_R';
        eyeMount.position.copy(eyePos);

        const fwd = idx === 0 ? fwdLeft : fwdRight;
        eyeMount.quaternion.setFromUnitVectors(zUnit, fwd);

        // Nudge eyes slightly forward along socket normal so sclera sits proud on face
        eyeMount.translateZ(0.00045);

        const scleraMesh = new THREE.Mesh(scleraGeo, scleraMat);
        eyeMount.add(scleraMesh);

        const pupilGroup = new THREE.Group();
        const iris = new THREE.Mesh(irisGeo, irisMat);
        iris.position.set(0, 0, eyeRadius * 0.78);
        iris.scale.set(1, 1, 0.38);
        pupilGroup.add(iris);

        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(0, 0, eyeRadius * 0.9);
        pupil.scale.set(1, 1, 0.35);
        pupilGroup.add(pupil);

        const catchBig = new THREE.Mesh(catchBigGeo, catchMat);
        catchBig.position.set(eyeRadius * 0.22, eyeRadius * 0.24, eyeRadius * 1.04);
        pupilGroup.add(catchBig);

        const catchSmall = new THREE.Mesh(catchSmallGeo, catchMat);
        catchSmall.position.set(-eyeRadius * 0.2, -eyeRadius * 0.18, eyeRadius * 1.02);
        pupilGroup.add(catchSmall);

        eyeMount.add(pupilGroup);

        const upperLid = new THREE.Mesh(upperLidGeo, lidMat);
        upperLid.rotation.x = -1.26;
        eyeMount.add(upperLid);

        const lowerLid = new THREE.Mesh(lowerLidGeo, lidMat);
        lowerLid.rotation.x = 1.22;
        eyeMount.add(lowerLid);

        headNode.add(eyeMount);
        addedObjects.push({ parent: headNode, child: eyeMount });
        mountedEyes.push({ mount: eyeMount, sclera: scleraMesh, upperLid, lowerLid, pupilGroup });
      }
    }

    eyesRef.current = mountedEyes;

    window.__SKILL_BUILDER_STATE__ = {
      loaded: true,
      characterName: 'The Skill Builder (Quaternius CC0 Mascot)',
      eyeCount: mountedEyes.length,
      hasFur: true,
      phase: 'entering',
      posX: stateRef.current.posX,
      currentBlockIdx: 0,
      placedCount: 0,
      placedIds: [],
      visibleBlocksCount: 0,
      monsterFullyOffscreen: true,
      carryingBlockIdx: null,
      fatigueLevel: 0,
      sleepDisturbed: false,
      surpriseCount: 0,
      blinkCount: 0,
      breathingOffset: 0,
      dynamicShadowActive: !reducedMotion,
      reducedMotion,
      clipped: false,
    };

    window.__FAST_FORWARD_SKILL_BUILDER__ = (placedBlocks: number) => {
      const clamped = Math.max(0, Math.min(PYRAMID_BLOCKS.length, placedBlocks));
      const st = stateRef.current;
      st.placedCount = clamped;
      st.currentBlockIdx = clamped;
      st.carryingBlockIdx = null;
      PYRAMID_BLOCKS.forEach((cfg, idx) => {
        const bs = blocksStateRef.current[idx];
        if (idx < clamped) {
          bs.status = 'placed';
          bs.pos.set(...cfg.targetPos);
          bs.rotY = cfg.targetRotY;
          bs.settleTime = 99;
        } else {
          bs.status = 'offscreen';
          bs.pos.set(OFFSCREEN_X, 0.76, 0);
        }
      });
      if (clamped >= PYRAMID_BLOCKS.length) {
        st.posX = SLEEP_SPOT_X;
        st.posZ = 0.08;
        st.facingYaw = Math.PI * 0.22;
        st.sleepBlend = 1;
        st.gripWeight = 0;
        st.carryHeightNorm = 0;
        st.releaseSpread = 0;
        st.phase = 'sleeping';
        st.phaseTimer = 0;
      } else {
        st.posX = -1.5;
        st.posZ = PYRAMID_Z;
        st.facingYaw = Math.PI * 0.34;
        st.sleepBlend = 0;
        st.gripWeight = 1;
        st.carryHeightNorm = 0;
        st.releaseSpread = 0;
        st.phase = 'carrying';
        st.carryingBlockIdx = clamped;
        blocksStateRef.current[clamped].status = 'carried';
        st.phaseTimer = 0.5;
      }
    };

    return () => {
      delete window.__FAST_FORWARD_SKILL_BUILDER__;
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

  // Isolated Cursor Hover & Tracking Listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerEnter = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reducedMotion) return;
      pointerRef.current.hovered = true;
      pointerRef.current.lastMoveTime = performance.now() / 1000;
      if (stateRef.current.phase === 'sleeping') {
        stateRef.current.sleepDisturbTimer = 0.75;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || reducedMotion) return;
      const rect = el.getBoundingClientRect();
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      pointerRef.current.hovered = inside;
      if (inside) {
        pointerRef.current.nx = THREE.MathUtils.clamp(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -1,
          1
        );
        pointerRef.current.ny = THREE.MathUtils.clamp(
          ((e.clientY - rect.top) / rect.height) * 2 - 1,
          -1,
          1
        );
        pointerRef.current.lastMoveTime = performance.now() / 1000;
      }
    };

    const onPointerLeave = () => {
      pointerRef.current.hovered = false;
    };

    const onVisibility = () => {
      stateRef.current.tabHidden = document.hidden;
    };

    el.addEventListener('pointerenter', onPointerEnter);
    el.addEventListener('pointermove', onPointerMove, { passive: true });
    el.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      el.removeEventListener('pointerenter', onPointerEnter);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [containerRef, reducedMotion]);

  const getNodeKey = (name: string): string => {
    if (bonesRef.current[name]) return name;
    const sanitized = name.replace(/\./g, '');
    if (bonesRef.current[sanitized]) return sanitized;
    return name;
  };

  // Mathematically sound character-space Euler delta onto bone's rest quaternion
  // Converts character-space delta into bone's parent-local frame: parentInChar^-1 * deltaChar * parentInChar * rest
  const applyCharSpaceDelta = (
    name: string,
    rx: number,
    ry: number,
    rz: number,
    order: THREE.EulerOrder = 'XYZ'
  ) => {
    const key = getNodeKey(name);
    const bone = bonesRef.current[key];
    const rest = restQuatsRef.current[key];
    const root = monsterRootRef.current;
    if (!bone || !rest || !bone.parent || !root) return;

    bone.quaternion.copy(rest);
    root.updateMatrixWorld(true);

    const rootQuat = new THREE.Quaternion();
    const parentQuat = new THREE.Quaternion();
    root.getWorldQuaternion(rootQuat);
    bone.parent.getWorldQuaternion(parentQuat);

    const parentInChar = rootQuat.clone().invert().multiply(parentQuat);
    const deltaChar = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, order));

    bone.quaternion
      .copy(parentInChar)
      .invert()
      .multiply(deltaChar)
      .multiply(parentInChar)
      .multiply(rest);
  };

  const computeCarryPosition = (
    posX: number,
    posZ: number,
    facingYaw: number,
    stepBob: number,
    carryHeight = 0.72
  ): THREE.Vector3 => {
    const forwardDist = 0.68;
    return new THREE.Vector3(
      posX + Math.sin(facingYaw) * forwardDist,
      carryHeight + stepBob,
      posZ + Math.cos(facingYaw) * forwardDist
    );
  };

  // Main "The Exhausted Builder" Story Loop (100% preserved timeline, RTL order, slow organic pacing)
  useFrame((state, rawDelta) => {
    const st = stateRef.current;
    if (!isActive || st.tabHidden) return;

    const delta = Math.min(rawDelta, 0.05);
    st.elapsed += delta;
    st.phaseTimer += delta;
    if (st.sleepDisturbTimer > 0) st.sleepDisturbTimer = Math.max(0, st.sleepDisturbTimer - delta);
    const t = st.elapsed;

    // Reduced-motion mode: show completed 10-block pyramid with calm sleeping monster
    if (reducedMotion) {
      if (!st.reducedMotionApplied) {
        st.reducedMotionApplied = true;
        st.posX = SLEEP_SPOT_X;
        st.posZ = 0.08;
        st.facingYaw = Math.PI * 0.22;
        st.placedCount = PYRAMID_BLOCKS.length;
        st.carryingBlockIdx = null;
        st.sleepBlend = 1;
        st.phase = 'sleeping';
        PYRAMID_BLOCKS.forEach((cfg, idx) => {
          blocksStateRef.current[idx].status = 'placed';
          blocksStateRef.current[idx].pos.set(...cfg.targetPos);
          blocksStateRef.current[idx].rotY = cfg.targetRotY;
        });
      }
      if (monsterCarrierRef.current) {
        monsterCarrierRef.current.position.set(st.posX, -0.32, st.posZ);
        monsterCarrierRef.current.rotation.y = st.facingYaw;
      }
      PYRAMID_BLOCKS.forEach((_, idx) => {
        const mesh = blockMeshRefs.current[idx];
        const bs = blocksStateRef.current[idx];
        if (mesh) {
          mesh.visible = true;
          mesh.position.copy(bs.pos);
          mesh.rotation.set(0, bs.rotY, 0);
        }
      });
      return;
    }

    const isHovered = pointerRef.current.hovered;
    const fatigueLevel = THREE.MathUtils.clamp(st.placedCount / PYRAMID_BLOCKS.length, 0, 1);
    const currentCfg = PYRAMID_BLOCKS[Math.min(st.currentBlockIdx, PYRAMID_BLOCKS.length - 1)];

    // --- 1. SAFE CURSOR INTERACTION GUARD ---
    const isSafeToPauseForCursor = st.phase === 'carrying' || st.phase === 'returning';
    if (isHovered && isSafeToPauseForCursor && st.posX > -2.8) {
      st.pausedReturnPhase = st.phase;
      st.phase = 'slowing_down';
      st.phaseTimer = 0;
    } else if (
      !isHovered &&
      (st.phase === 'slowing_down' || st.phase === 'surprised' || st.phase === 'looking')
    ) {
      st.phase = 'resuming';
      st.phaseTimer = 0;
    }

    // --- 2. EXHAUSTED BUILDER STATE MACHINE ---
    const baseWalkSpeed = THREE.MathUtils.lerp(1.15, 0.78, fatigueLevel);
    const smoothstep01 = (v: number) => {
      const c = THREE.MathUtils.clamp(v, 0, 1);
      return c * c * (3 - 2 * c);
    };
    let targetFacingYaw = st.facingYaw;
    let torsoBend = 0;
    let armLift = -0.22;
    let armInward = 0.08;
    let targetSleepBlend = 0;
    let targetGripWeight = st.carryingBlockIdx !== null ? 1.0 : 0.0;
    let targetCarryHeightNorm = 0.0;
    let targetReleaseSpread = 0.0;

    if (st.phase === 'entering') {
      targetGripWeight = 0;
      const inspectX = -1.85;
      if (st.phaseTimer < 2.4) {
        targetFacingYaw = Math.PI * 0.34;
        const dist = inspectX - st.posX;
        if (dist > 0.03) {
          const easeFactor = 0.24 + 0.76 * smoothstep01(dist / 1.45);
          st.currentSpeed = THREE.MathUtils.damp(
            st.currentSpeed,
            baseWalkSpeed * 0.85 * easeFactor,
            3.2,
            delta
          );
          st.posX = Math.min(inspectX, st.posX + st.currentSpeed * delta);
        } else {
          st.posX = inspectX;
          st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, 0, 4.5, delta);
        }
      } else {
        st.phase = 'fetching';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'fetching') {
      targetGripWeight = 0;
      targetFacingYaw = -Math.PI * 0.42;
      st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, baseWalkSpeed * 1.05, 3.2, delta);
      st.posX = Math.max(OFFSCREEN_X, st.posX - st.currentSpeed * delta);

      if (st.posX <= OFFSCREEN_X + 0.04) {
        st.posX = OFFSCREEN_X;
        st.currentSpeed = 0;
        st.phase = 'offscreen_fetch';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'offscreen_fetch') {
      st.posX = OFFSCREEN_X;
      st.currentSpeed = 0;
      targetFacingYaw = Math.PI * 0.34;

      // Smooth pickup sequence: approach & bend -> touch block -> lift into chest carry anchor
      const fetchP = Math.min(1, st.phaseTimer / 1.8);
      if (fetchP < 0.45) {
        const reachP = smoothstep01(fetchP / 0.45);
        targetGripWeight = reachP;
        targetCarryHeightNorm = -0.95;
        torsoBend = THREE.MathUtils.lerp(0, 0.28, reachP);
      } else {
        const liftP = smoothstep01((fetchP - 0.45) / 0.55);
        targetGripWeight = 1.0;
        targetCarryHeightNorm = THREE.MathUtils.lerp(-0.95, 0.0, liftP);
        torsoBend = THREE.MathUtils.lerp(0.28, 0.08 + fatigueLevel * 0.08, liftP);
        const idx = st.currentBlockIdx;
        const bs = blocksStateRef.current[idx];
        if (bs.status !== 'carried') {
          bs.status = 'carried';
          st.carryingBlockIdx = idx;
          bs.pos.copy(computeCarryPosition(st.posX, st.posZ, Math.PI * 0.34, 0, 1.15));
        }
      }

      if (st.phaseTimer >= 1.8) {
        const idx = st.currentBlockIdx;
        const bs = blocksStateRef.current[idx];
        bs.status = 'carried';
        st.carryingBlockIdx = idx;
        st.facingYaw = Math.PI * 0.34;
        st.gripWeight = 1.0;
        st.carryHeightNorm = 0.0;
        st.phase = 'carrying';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'carrying') {
      const isUpperRow = st.currentBlockIdx >= 4;
      const dropX = isUpperRow ? currentCfg.targetPos[0] - 0.64 : currentCfg.targetPos[0] - 0.70;
      const targetZ = isUpperRow ? PYRAMID_Z + 0.42 : PYRAMID_Z - 0.14;
      const dist = dropX - st.posX;
      targetFacingYaw = isUpperRow ? Math.PI * 0.38 : Math.PI * 0.42;
      torsoBend = 0.08 + fatigueLevel * 0.07;
      targetGripWeight = 1.0;
      targetCarryHeightNorm = 0.0;

      const approachEase = 0.28 + 0.72 * smoothstep01(dist / 1.5);
      st.currentSpeed = THREE.MathUtils.damp(
        st.currentSpeed,
        baseWalkSpeed * approachEase,
        3.0,
        delta
      );
      st.posX = Math.min(dropX, st.posX + st.currentSpeed * delta);
      st.posZ = THREE.MathUtils.damp(st.posZ, targetZ, 3.0, delta);

      if (Math.abs(st.posX - dropX) < 0.045) {
        st.posX = dropX;
        st.phase = 'placing';
        st.phaseTimer = 0;
        if (st.carryingBlockIdx !== null) {
          blocksStateRef.current[st.carryingBlockIdx].placeOrigin.copy(
            blocksStateRef.current[st.carryingBlockIdx].pos
          );
        }
      }
    } else if (st.phase === 'placing') {
      st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, 0, 5.5, delta);
      const isUpperRow = st.currentBlockIdx >= 4;
      targetFacingYaw = isUpperRow ? Math.PI * 0.56 : Math.PI * 0.44;

      const idx = st.currentBlockIdx;
      const cfg = PYRAMID_BLOCKS[idx];
      const bs = blocksStateRef.current[idx];
      const slotY = cfg.targetPos[1];
      // Map pyramid row height (0.25 -> 1.765) to normalized hand grip height (-0.92 -> +0.92)
      const slotHeightNorm = THREE.MathUtils.clamp(((slotY - 0.95) / 0.82), -0.92, 0.95);
      const slotTorsoBend = slotY < 0.6 ? 0.30 : slotY < 1.0 ? 0.14 : slotY > 1.5 ? -0.10 : -0.02;

      const p = Math.min(1, st.phaseTimer / 1.8);
      if (p < 0.2) {
        const prep = smoothstep01(p / 0.2);
        torsoBend = THREE.MathUtils.lerp(0.08, 0.12, prep);
        targetGripWeight = 1.0;
        targetCarryHeightNorm = THREE.MathUtils.lerp(0.0, slotHeightNorm * 0.25, prep);
      } else if (p < 0.72) {
        const eased = smoothstep01((p - 0.2) / 0.52);
        torsoBend = THREE.MathUtils.lerp(0.12, slotTorsoBend, eased);
        targetGripWeight = 1.0;
        targetCarryHeightNorm = THREE.MathUtils.lerp(slotHeightNorm * 0.25, slotHeightNorm, eased);
      } else {
        if (bs.status !== 'placed') {
          bs.status = 'placed';
          bs.pos.set(...cfg.targetPos);
          bs.rotY = cfg.targetRotY;
          bs.settleTime = 0;
          st.carryingBlockIdx = null;
          st.placedCount = Math.min(PYRAMID_BLOCKS.length, idx + 1);
        }
        const relax = smoothstep01((p - 0.72) / 0.28);
        torsoBend = THREE.MathUtils.lerp(slotTorsoBend, 0, relax);
        targetGripWeight = 1.0 - relax;
        targetCarryHeightNorm = THREE.MathUtils.lerp(slotHeightNorm, 0.0, relax);
        targetReleaseSpread = Math.sin(relax * Math.PI) * 0.45;
      }

      if (st.phaseTimer >= 1.8) {
        st.phase = 'post_place_pause';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'post_place_pause') {
      st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, 0, 5.5, delta);
      targetFacingYaw = Math.PI * 0.32;
      torsoBend = 0;
      targetGripWeight = 0;

      if (st.phaseTimer >= 1.5) {
        if (st.currentBlockIdx + 1 < PYRAMID_BLOCKS.length) {
          st.currentBlockIdx += 1;
          if (st.placedCount === 4 || st.placedCount === 7 || st.placedCount === 9) {
            st.phase = 'resting';
            st.phaseTimer = 0;
          } else {
            st.phase = 'returning';
            st.phaseTimer = 0;
          }
        } else {
          st.phase = 'celebrating';
          st.phaseTimer = 0;
        }
      }
    } else if (st.phase === 'resting') {
      st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, 0, 4.5, delta);
      targetFacingYaw = Math.PI * 0.18;
      torsoBend = 0.14;
      targetGripWeight = 0;

      if (st.phaseTimer >= 2.6) {
        st.phase = 'returning';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'returning') {
      targetGripWeight = 0;
      targetFacingYaw = -Math.PI * 0.42;
      st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, baseWalkSpeed * 1.08, 3.2, delta);
      st.posX = Math.max(OFFSCREEN_X, st.posX - st.currentSpeed * delta);
      if (st.posX < -0.95) {
        st.posZ = THREE.MathUtils.damp(st.posZ, PYRAMID_Z, 2.8, delta);
      }

      if (st.posX <= OFFSCREEN_X + 0.04) {
        st.posX = OFFSCREEN_X;
        st.posZ = PYRAMID_Z;
        st.currentSpeed = 0;
        st.phase = 'offscreen_fetch';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'celebrating') {
      targetGripWeight = 0;
      const admireX = SLEEP_SPOT_X;
      const dist = st.posX - admireX;
      st.posZ = THREE.MathUtils.damp(st.posZ, 0.08, 2.8, delta);
      if (dist > 0.05) {
        const approachEase = 0.24 + 0.76 * smoothstep01(dist / 1.1);
        targetFacingYaw = -Math.PI * 0.38;
        st.currentSpeed = THREE.MathUtils.damp(
          st.currentSpeed,
          baseWalkSpeed * 0.85 * approachEase,
          3.2,
          delta
        );
        st.posX = Math.max(admireX, st.posX - st.currentSpeed * delta);
      } else {
        st.posX = admireX;
        st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, 0, 4.5, delta);
        targetFacingYaw = Math.PI * 0.26;
        torsoBend = -0.05;
        armLift = -0.64 - Math.sin(t * 3.2) * 0.14;
        armInward = -0.14;
      }
      if (st.phaseTimer >= 3.6) {
        st.phase = 'exhausted';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'exhausted') {
      targetGripWeight = 0;
      st.currentSpeed = 0;
      targetFacingYaw = Math.PI * 0.22;
      const p = Math.min(1, st.phaseTimer / 3.0);
      if (p < 0.48) {
        const yawn = Math.sin((p / 0.48) * Math.PI);
        torsoBend = -yawn * 0.12;
        armLift = -0.35 - yawn * 0.65;
        armInward = -yawn * 0.16;
        targetSleepBlend = 0;
      } else {
        const sitP = (p - 0.48) / 0.52;
        targetSleepBlend = smoothstep01(sitP);
        torsoBend = targetSleepBlend * 0.12;
      }
      if (st.phaseTimer >= 3.0) {
        st.phase = 'sleeping';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'sleeping') {
      targetGripWeight = 0;
      st.currentSpeed = 0;
      targetFacingYaw = Math.PI * 0.22;
      targetSleepBlend = 1;
      torsoBend = 0.12;
      armLift = -0.45;
      armInward = 0.22;
    } else if (st.phase === 'slowing_down') {
      st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, 0, 6.5, delta);
      targetGripWeight = st.carryingBlockIdx !== null ? 1.0 : 0.0;
      if (st.phaseTimer >= 0.28) {
        st.phase = 'surprised';
        st.phaseTimer = 0;
        st.surpriseCount += 1;
        st.blinkProgress = 0;
        st.blinkPhase = 'idle';
      }
    } else if (st.phase === 'surprised') {
      st.currentSpeed = 0;
      targetFacingYaw = st.facingYaw * 0.42;
      if (st.carryingBlockIdx !== null) {
        targetGripWeight = 1.0;
        targetCarryHeightNorm = 0.14;
      } else {
        targetGripWeight = 0.0;
        armLift = -0.68;
        armInward = -0.16;
      }
      if (st.phaseTimer >= 0.48) {
        st.phase = 'looking';
        st.phaseTimer = 0;
      }
    } else if (st.phase === 'looking') {
      st.currentSpeed = 0;
      targetFacingYaw = st.facingYaw * 0.85;
      targetGripWeight = st.carryingBlockIdx !== null ? 1.0 : 0.0;
    } else if (st.phase === 'resuming') {
      st.currentSpeed = THREE.MathUtils.damp(st.currentSpeed, 0, 5.0, delta);
      targetGripWeight = st.carryingBlockIdx !== null ? 1.0 : 0.0;
      if (st.phaseTimer >= 0.34) {
        st.phase = st.pausedReturnPhase;
        st.phaseTimer = 0;
      }
    }

    // --- 3. ANIMATION MIXER & BONE KINEMATICS ---
    st.facingYaw = THREE.MathUtils.damp(st.facingYaw, targetFacingYaw, 4.2, delta);
    st.sleepBlend = THREE.MathUtils.damp(st.sleepBlend, targetSleepBlend, 3.2, delta);
    st.smoothTorsoBend = THREE.MathUtils.damp(st.smoothTorsoBend, torsoBend, 5.2, delta);
    st.smoothArmLift = THREE.MathUtils.damp(st.smoothArmLift, armLift, 5.2, delta);
    st.smoothArmInward = THREE.MathUtils.damp(st.smoothArmInward, armInward, 5.2, delta);
    st.gripWeight = THREE.MathUtils.damp(st.gripWeight, targetGripWeight, 10.0, delta);
    st.carryHeightNorm = THREE.MathUtils.damp(st.carryHeightNorm, targetCarryHeightNorm, 8.5, delta);
    st.releaseSpread = THREE.MathUtils.damp(st.releaseSpread, targetReleaseSpread, 10.0, delta);

    const speedRatio = THREE.MathUtils.clamp(st.currentSpeed / Math.max(0.5, baseWalkSpeed), 0, 1);
    const isWalking = speedRatio > 0.08 && st.phase !== 'sleeping' && st.phase !== 'exhausted';

    // Update Skeletal Mixer (Walk vs Idle)
    if (mixerRef.current) {
      const walkAct = walkActionRef.current;
      const idleAct = idleActionRef.current;
      if (walkAct && idleAct) {
        walkAct.setEffectiveWeight(isWalking ? 1 : 0);
        idleAct.setEffectiveWeight(isWalking ? 0 : 1);
        walkAct.timeScale = THREE.MathUtils.lerp(0.85, 1.25, speedRatio);
      }
      mixerRef.current.update(delta);
    }

    const breathFreq = st.phase === 'sleeping' ? 0.9 : st.phase === 'resting' ? 2.2 : 1.35;
    const breathAmp = st.phase === 'sleeping' ? 0.024 : st.phase === 'resting' ? 0.03 : 0.016;
    const breathWave = Math.sin(t * breathFreq) * 0.72 + Math.sin(t * breathFreq * 0.47 + 0.8) * 0.28;
    const breathingOffset = breathWave * breathAmp;

    const surprisePulse =
      st.phase === 'surprised' ? Math.sin(Math.min(1, st.phaseTimer / 0.48) * Math.PI) : 0;
    const sleepSitDrop = st.sleepBlend * -0.32;

    if (monsterCarrierRef.current) {
      monsterCarrierRef.current.position.set(st.posX, sleepSitDrop, st.posZ);
      monsterCarrierRef.current.rotation.y = st.facingYaw;
    }

    if (monsterRootRef.current) {
      monsterRootRef.current.position.y = surprisePulse * 0.065;
    }

    // Spine breathing & fatigue torso bend
    const finalTorsoPitch =
      st.smoothTorsoBend - surprisePulse * 0.14 + breathingOffset * (st.phase === 'sleeping' ? 1.2 : 0.5);
    applyCharSpaceDelta('Hips', finalTorsoPitch * 0.25, 0, 0);
    applyCharSpaceDelta('Abdomen', finalTorsoPitch * 0.35, 0, 0);
    applyCharSpaceDelta('Torso', finalTorsoPitch * 0.4, 0, 0);

    const torsoNode = bonesRef.current['Torso'];
    if (torsoNode) {
      const expand = 1 + breathWave * (st.phase === 'sleeping' ? 0.03 : 0.018);
      torsoNode.scale.set(expand, 1 + (expand - 1) * 0.65, expand);
    }

    // Sitting posture during sleep (legs bent forward comfortably on ground)
    if (st.sleepBlend > 0.02) {
      const legSleepPitch = st.sleepBlend * -1.25;
      const kneeSleepBend = st.sleepBlend * 1.12;
      applyCharSpaceDelta('UpperLegL', legSleepPitch, 0.1, 0);
      applyCharSpaceDelta('LowerLegL', kneeSleepBend, 0, 0);
      applyCharSpaceDelta('UpperLegR', legSleepPitch, -0.1, 0);
      applyCharSpaceDelta('LowerLegR', kneeSleepBend, 0, 0);
    }

    // Reset finger bones to symmetric rest pose so Walk clip's right-hand curl doesn't skew the grip
    const fingerBoneNames = [
      'Index1L', 'Index2L', 'Index3L', 'Middle1L', 'Middle2L', 'Middle3L', 'Pinky1L', 'Pinky2L', 'Pinky3L', 'Thumb1L', 'Thumb2L',
      'Index1R', 'Index2R', 'Index3R', 'Middle1R', 'Middle2R', 'Middle3R', 'Pinky1R', 'Pinky2R', 'Pinky3R', 'Thumb1R', 'Thumb2R',
    ];
    for (const fName of fingerBoneNames) {
      const fb = bonesRef.current[fName];
      const fRest = restQuatsRef.current[fName];
      if (fb && fRest) fb.quaternion.copy(fRest);
    }

    // --- TWO-HAND BLOCK GRIP & NATURAL IDLE ARM KINEMATICS ---
    // Note: CharacterArmature|Idle lacks UpperArm tracks, so we explicitly pose non-walking idle arms
    // and smoothly blend into the IK-calibrated Two-Hand Block Grip Pose via st.gripWeight.
    const armBoneKeys = ['ShoulderL', 'UpperArmL', 'LowerArmL', 'ShoulderR', 'UpperArmR', 'LowerArmR'] as const;

    if (!isWalking) {
      // Base non-carrying idle / sleeping / celebrating / surprised pose
      const isExpressiveIdle =
        st.phase === 'sleeping' ||
        st.phase === 'exhausted' ||
        (st.phase === 'celebrating' && st.currentSpeed < 0.08) ||
        (st.phase === 'surprised' && st.carryingBlockIdx === null);
      const idleU_rx = isExpressiveIdle ? st.smoothArmLift : -0.15;
      const idleU_ry = isExpressiveIdle ? -st.smoothArmInward : 0.08;
      const idleU_rz = isExpressiveIdle ? -0.22 : -0.26;
      const idleL_rx = isExpressiveIdle ? -0.45 : -0.72;
      const idleL_ry = -0.18;

      applyCharSpaceDelta('ShoulderL', 0, 0, -0.04, 'YXZ');
      applyCharSpaceDelta('UpperArmL', idleU_rx, idleU_ry, idleU_rz, 'YXZ');
      applyCharSpaceDelta('LowerArmL', idleL_rx, idleL_ry, 0, 'YXZ');

      applyCharSpaceDelta('ShoulderR', 0, 0, 0.04, 'YXZ');
      applyCharSpaceDelta('UpperArmR', idleU_rx, -idleU_ry, -idleU_rz, 'YXZ');
      applyCharSpaceDelta('LowerArmR', idleL_rx, -idleL_ry, 0, 'YXZ');
    }

    if (st.gripWeight > 0.001) {
      // Save non-grip arm quaternions for smooth SLERP transition during pickup & release
      const nonGripQuats: Record<string, THREE.Quaternion> = {};
      if (st.gripWeight < 0.999) {
        for (const k of armBoneKeys) {
          const b = bonesRef.current[k];
          if (b) nonGripQuats[k] = b.quaternion.clone();
        }
      }

      // IK-calibrated Two-Hand Grip Poses [s_ry, s_rz, u_rx, u_ry, u_rz, l_rx, l_ry, l_rz]
      // Optimized directly against the GPU-skinned vertex bounding box of Monkroose_3 (mint hands):
      // Left hand mesh X=[+0.240..+0.648], Right hand mesh X=[-0.648..-0.240], Y=[0.683..1.317], Z=[0.276..1.033],
      // clamping the block X=[-0.267..+0.267], Y=[0.73..1.21], Z=[0.40..0.92] with both full hands visible on the sides.
      const LOW_GRIP = [0.1942, 0.133, -0.2053, -0.2728, -0.5717, -0.813, 0.3346, -0.6745];
      const MID_CARRY = [0.1413, 0.133, -0.2106, -0.0431, -0.5731, -1.3935, 0.2929, -0.6794];
      const HIGH_GRIP = [0.0821, 0.2716, -0.3994, 0.0707, -0.5919, -1.7823, 0.0535, -0.7515];

      const hn = THREE.MathUtils.clamp(st.carryHeightNorm, -1, 1);
      const targetPose = hn < 0 ? LOW_GRIP : HIGH_GRIP;
      const blendT = Math.abs(hn);

      const s_ry = THREE.MathUtils.lerp(MID_CARRY[0], targetPose[0], blendT);
      const s_rz = THREE.MathUtils.lerp(MID_CARRY[1], targetPose[1], blendT);
      const u_rx = THREE.MathUtils.lerp(MID_CARRY[2], targetPose[2], blendT);
      const u_ry = THREE.MathUtils.lerp(MID_CARRY[3], targetPose[3], blendT) - st.releaseSpread * 0.45;
      const u_rz = THREE.MathUtils.lerp(MID_CARRY[4], targetPose[4], blendT);
      const l_rx = THREE.MathUtils.lerp(MID_CARRY[5], targetPose[5], blendT);
      const l_ry = THREE.MathUtils.lerp(MID_CARRY[6], targetPose[6], blendT) - st.releaseSpread * 0.35;
      const l_rz = THREE.MathUtils.lerp(MID_CARRY[7], targetPose[7], blendT);

      applyCharSpaceDelta('ShoulderL', 0, s_ry, s_rz, 'YXZ');
      applyCharSpaceDelta('UpperArmL', u_rx, u_ry, u_rz, 'YXZ');
      applyCharSpaceDelta('LowerArmL', l_rx, l_ry, l_rz, 'YXZ');

      applyCharSpaceDelta('ShoulderR', 0, -s_ry, -s_rz, 'YXZ');
      applyCharSpaceDelta('UpperArmR', u_rx, -u_ry, -u_rz, 'YXZ');
      applyCharSpaceDelta('LowerArmR', l_rx, -l_ry, -l_rz, 'YXZ');

      if (st.gripWeight < 0.999) {
        for (const k of armBoneKeys) {
          const b = bonesRef.current[k];
          const q0 = nonGripQuats[k];
          if (b && q0) {
            b.quaternion.copy(q0).slerp(b.quaternion, st.gripWeight);
          }
        }
      }
    }

    // --- 4. EXPRESSIVE HEAD, EYE TRACKING & BLINKING ---
    let targetHeadYaw = 0;
    let targetHeadPitch = 0.02;
    let targetHeadRoll = Math.sin(t * 0.7) * 0.025;

    if (st.phase === 'entering') {
      targetHeadYaw = 0.18;
    } else if (st.phase === 'placing') {
      targetHeadPitch = currentCfg.targetPos[1] > 1.0 ? -0.18 : 0.12;
    } else if (st.phase === 'resting') {
      targetHeadYaw = isHovered ? pointerRef.current.nx * 0.24 : Math.sin(t * 3.0) * 0.12;
      targetHeadPitch = isHovered ? -0.06 : 0.1;
    } else if (st.phase === 'celebrating') {
      targetHeadYaw = 0.18 + Math.sin(t * 1.1) * 0.05;
      targetHeadPitch = -0.18 + Math.sin(t * 1.8) * 0.04;
      targetHeadRoll = 0.06;
    } else if (st.phase === 'exhausted') {
      const yawnPeak = st.phaseTimer < 1.1 ? Math.sin((st.phaseTimer / 1.1) * Math.PI) : 0;
      targetHeadPitch = -yawnPeak * 0.24 + st.sleepBlend * 0.16;
      targetHeadRoll = Math.sin(t * 2.0) * 0.09;
    } else if (st.phase === 'sleeping') {
      const disturbed = st.sleepDisturbTimer > 0;
      targetHeadYaw = disturbed ? Math.sin(t * 8) * 0.08 : 0.04;
      targetHeadPitch = disturbed ? 0.06 : 0.12 + Math.sin(t * 0.9) * 0.035;
      targetHeadRoll = disturbed ? 0.04 : 0.12 + Math.sin(t * 0.45) * 0.025;
    } else if (st.phase === 'surprised') {
      targetHeadYaw = -st.facingYaw * 0.42;
      targetHeadPitch = -0.14;
      targetHeadRoll = 0.07;
    } else if (st.phase === 'looking') {
      const p = pointerRef.current;
      targetHeadYaw = THREE.MathUtils.clamp(-st.facingYaw * 0.36 + p.nx * 0.3, -0.38, 0.38);
      targetHeadPitch = THREE.MathUtils.clamp(p.ny * 0.16, -0.18, 0.18);
      targetHeadRoll = THREE.MathUtils.clamp(-p.nx * 0.07, -0.09, 0.09);
    }

    st.headYaw = THREE.MathUtils.damp(st.headYaw, targetHeadYaw, 5.2, delta);
    st.headPitch = THREE.MathUtils.damp(st.headPitch, targetHeadPitch, 5.2, delta);
    st.headRoll = THREE.MathUtils.damp(st.headRoll, targetHeadRoll, 4.8, delta);

    applyCharSpaceDelta('Neck', st.headPitch * 0.35, st.headYaw * 0.35, 0, 'YXZ');
    applyCharSpaceDelta('Head', st.headPitch * 0.65, st.headYaw * 0.65, st.headRoll, 'YXZ');

    const targetEyeScale = st.phase === 'surprised' ? 1.18 : st.phase === 'looking' ? 1.05 : 1.0;
    st.eyeScale = THREE.MathUtils.damp(st.eyeScale, targetEyeScale, 12.0, delta);

    if (st.phase === 'sleeping') {
      const targetClosed = st.sleepDisturbTimer > 0.25 ? 0.45 : 1.0;
      st.blinkProgress = THREE.MathUtils.damp(st.blinkProgress, targetClosed, 7.0, delta);
    } else if (st.phase === 'exhausted') {
      const drowsy = THREE.MathUtils.clamp(st.phaseTimer / 2.3, 0.35, 0.95);
      st.blinkProgress = THREE.MathUtils.damp(st.blinkProgress, drowsy, 5.0, delta);
    } else if (st.phase !== 'surprised') {
      if (st.blinkPhase === 'idle') {
        if (t >= st.nextBlinkAt) {
          st.blinkPhase = 'closing';
          st.doubleBlinkPending = Math.random() < 0.2;
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
            st.nextBlinkAt = t + 2.7 + Math.random() * 2.8;
          }
        }
      } else if (st.blinkPhase === 'double_wait') {
        if (t >= st.nextBlinkAt) {
          st.blinkPhase = 'closing';
        }
      }
    }

    const blink = st.blinkProgress;
    const upperLidX = THREE.MathUtils.lerp(st.phase === 'surprised' ? -1.42 : -1.28, 0.18, blink);
    const lowerLidX = THREE.MathUtils.lerp(st.phase === 'surprised' ? 1.38 : 1.24, -0.14, blink);
    const pupilYaw =
      st.phase === 'looking' ? THREE.MathUtils.clamp(pointerRef.current.nx * 0.28, -0.3, 0.3) : 0;
    const pupilPitch =
      st.phase === 'looking'
        ? THREE.MathUtils.clamp(pointerRef.current.ny * 0.18, -0.2, 0.2)
        : 0.04;

    eyesRef.current.forEach((eye) => {
      eye.mount.scale.setScalar(st.eyeScale);
      eye.sclera.visible = blink < 0.88;
      eye.pupilGroup.visible = blink < 0.82;
      eye.pupilGroup.rotation.set(pupilPitch, pupilYaw, 0);
      eye.upperLid.rotation.set(upperLidX, 0, 0);
      eye.lowerLid.rotation.set(lowerLidX, 0, 0);
    });

    // --- 5. FLOATING "Z" SLEEP INDICATORS ---
    sleepZRefs.current.forEach((sprite, i) => {
      if (!sprite) return;
      const mat = sleepZMaterials[i];
      if (st.phase === 'sleeping' && st.sleepDisturbTimer <= 0.1) {
        const cycle = (t * 0.45 + i * 0.33) % 1;
        const fade = Math.sin(cycle * Math.PI);
        sprite.visible = true;
        sprite.position.set(
          st.posX + 0.22 + Math.sin(cycle * Math.PI * 2 + i) * 0.12 + cycle * 0.3,
          1.55 + cycle * 0.95,
          st.posZ + 0.15
        );
        const s = 0.22 + cycle * 0.18;
        sprite.scale.set(s, s, 1);
        mat.opacity = fade * 0.82;
      } else {
        sprite.visible = false;
        mat.opacity = 0;
      }
    });

    // --- 6. CARRY ANCHOR ATTACHMENT & SYNC ALL 10 PYRAMID BLOCKS ---
    // Lock carryAnchorRef directly to the live midpoint between Left Hand (Middle1L/Middle2L) and Right Hand (Middle1R/Middle2R)
    // inside monsterRootRef so the block sits snugly against the torso with both palms & fingers wrapping its left/right sides.
    const anchorInStage = computeCarryPosition(st.posX, st.posZ, st.facingYaw, surprisePulse * 0.065, 1.02);
    if (monsterRootRef.current && stageGroupRef.current && carryAnchorRef.current) {
      monsterRootRef.current.updateMatrixWorld(true);
      const wristL = bonesRef.current['Middle1L'];
      const wristR = bonesRef.current['Middle1R'];
      const palmL = bonesRef.current['Middle2L'];
      const palmR = bonesRef.current['Middle2R'];
      if (wristL && wristR && palmL && palmR) {
        const wL = new THREE.Vector3();
        const wR = new THREE.Vector3();
        const pL = new THREE.Vector3();
        const pR = new THREE.Vector3();
        wristL.getWorldPosition(wL);
        wristR.getWorldPosition(wR);
        palmL.getWorldPosition(pL);
        palmR.getWorldPosition(pR);
        monsterRootRef.current.worldToLocal(wL);
        monsterRootRef.current.worldToLocal(wR);
        monsterRootRef.current.worldToLocal(pL);
        monsterRootRef.current.worldToLocal(pR);

        const midY = (pL.y + pR.y) * 0.5 + 0.05;
        const midZ = (pL.z + pR.z) * 0.5 - 0.065;
        carryAnchorRef.current.position.set(0, midY, midZ);
      }
      carryAnchorRef.current.updateMatrixWorld(true);
      carryAnchorRef.current.getWorldPosition(anchorInStage);
      stageGroupRef.current.worldToLocal(anchorInStage);
    }

    if (st.carryingBlockIdx !== null) {
      const carried = blocksStateRef.current[st.carryingBlockIdx];
      if (st.phase === 'placing') {
        const cfg = PYRAMID_BLOCKS[st.carryingBlockIdx];
        const p = Math.min(1, st.phaseTimer / 1.8);
        if (p < 0.2) {
          carried.pos.copy(anchorInStage);
          carried.placeOrigin.copy(anchorInStage);
          carried.rotY = st.facingYaw;
        } else if (p < 0.72) {
          const eased = smoothstep01((p - 0.2) / 0.52);
          const targetVec = new THREE.Vector3(...cfg.targetPos);
          // Follow the live hands/carryAnchor vertically while converging smoothly onto the exact pyramid slot
          carried.pos.lerpVectors(anchorInStage, targetVec, eased);
          carried.rotY = THREE.MathUtils.lerp(st.facingYaw, cfg.targetRotY, eased);
        }
      } else {
        carried.pos.copy(anchorInStage);
        carried.rotY = st.facingYaw;
      }
    }

    let visibleCount = 0;
    PYRAMID_BLOCKS.forEach((cfg, idx) => {
      const mesh = blockMeshRefs.current[idx];
      const bs = blocksStateRef.current[idx];
      if (!mesh) return;

      if (bs.status === 'offscreen') {
        mesh.visible = false;
        return;
      }

      mesh.visible = true;
      visibleCount += 1;

      let settleY = 0;
      let settleTilt = 0;
      if (bs.status === 'placed' && bs.settleTime < 0.65) {
        bs.settleTime += delta;
        const decay = Math.exp(-9.0 * bs.settleTime);
        settleY = Math.abs(Math.sin(bs.settleTime * 16)) * 0.026 * decay;
        settleTilt = Math.sin(bs.settleTime * 18) * 0.036 * decay;
      }

      mesh.position.set(bs.pos.x, bs.pos.y + settleY, bs.pos.z);
      mesh.rotation.set(settleTilt, bs.rotY, settleTilt * 0.4);
      if (bs.status === 'placed') {
        mesh.position.x = cfg.targetPos[0];
        mesh.position.z = cfg.targetPos[2];
      }
    });

    // --- 7. UPDATE DIAGNOSTIC SNAPSHOT ---
    if (window.__SKILL_BUILDER_STATE__) {
      const dbg = window.__SKILL_BUILDER_STATE__;
      dbg.eyeCount = eyesRef.current.length;
      dbg.hasFur = true;
      dbg.phase = st.phase;
      dbg.posX = Number(st.posX.toFixed(3));
      dbg.currentBlockIdx = st.currentBlockIdx;
      dbg.placedCount = st.placedCount;
      dbg.placedIds = PYRAMID_BLOCKS.filter(
        (_, i) => blocksStateRef.current[i].status === 'placed'
      ).map((b) => b.id);
      dbg.visibleBlocksCount = visibleCount;
      dbg.carryingBlockIdx = st.carryingBlockIdx;
      dbg.fatigueLevel = Number(fatigueLevel.toFixed(2));
      dbg.sleepDisturbed = st.sleepDisturbTimer > 0;
      dbg.surpriseCount = st.surpriseCount;
      dbg.blinkCount = st.blinkCount;
      dbg.breathingOffset = Number(breathingOffset.toFixed(4));
      dbg.dynamicShadowActive = !reducedMotion;
      dbg.reducedMotion = reducedMotion;

      const head = bonesRef.current['Head'];
      if (head) {
        const hv = new THREE.Vector3();
        head.getWorldPosition(hv).project(state.camera);
        dbg.monsterFullyOffscreen = hv.x < -1.25;
        dbg.clipped = st.posX > -2.5 ? Math.abs(hv.x) > 0.94 || Math.abs(hv.y) > 0.94 : false;
      } else {
        dbg.monsterFullyOffscreen = false;
        dbg.clipped = false;
      }
    }
  });

  return (
    <group ref={stageGroupRef} position={[0, -1.16, 0]}>
      {/* The Skill Builder — 100% Intact Skeletally Rigged Quaternius Mascot */}
      <group
        ref={monsterCarrierRef}
        position={[OFFSCREEN_X, 0, 0]}
        rotation={[0, Math.PI * 0.34, 0]}
      >
        <group ref={monsterRootRef} scale={1.05}>
          <primitive object={clonedScene} />
          <group ref={carryAnchorRef} name="CarryAnchor" position={[0, 1.14, 0.66]} />
        </group>
      </group>

      {/* 10 Technology Blocks — Substantial, Clear, High-Contrast */}
      {PYRAMID_BLOCKS.map((cfg, idx) => (
        <mesh
          key={cfg.id}
          ref={(el) => {
            blockMeshRefs.current[idx] = el;
          }}
          visible={false}
          position={[OFFSCREEN_X, 0.76, 0]}
          material={blockMaterials[idx]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={cfg.size} />
        </mesh>
      ))}

      {/* Subtle Floating "Z" Sleep Indicators */}
      {sleepZMaterials.map((mat, i) => (
        <sprite
          key={`sleep-z-${i}`}
          ref={(el) => {
            sleepZRefs.current[i] = el;
          }}
          visible={false}
          material={mat}
        />
      ))}
    </group>
  );
};

useGLTF.preload(MODEL_PATH);
