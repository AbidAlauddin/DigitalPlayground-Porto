import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { getFurBumpTexture } from '../utils/furTextures';
import { getArchivistBadgeTexture } from '../utils/archivistTextures';
import { getOperatorBadgeTexture } from '../utils/operatorTextures';

const YETI_PATH = '/models/monster/yeti-mascot.glb';
const CACTORO_PATH = '/models/workspace/cactoro-dev.glb';
const BUILDER_PATH = '/monsters/skill-builder/builder-mascot.glb';
const ARCHIVIST_PATH = '/monsters/archivist/archivist-mascot.glb';
const OPERATOR_PATH = '/monsters/showcase-operator/operator-mascot.glb';

export type ContactGatheringState =
  | 'hidden'
  | 'entering'
  | 'idle'
  | 'observing'
  | 'celebrating'
  | 'happy-idle';

export type FocusedContactField = 'name' | 'email' | 'message' | null;

export type GatheringMonsterId =
  | 'yeti'
  | 'cactoro'
  | 'builder'
  | 'archivist'
  | 'operator';

export interface CardBoundsNdc {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ContactGatheringDebugState {
  loaded: boolean;
  state: ContactGatheringState;
  monsterCount: number;
  monsterIds: GatheringMonsterId[];
  focusedField: FocusedContactField;
  celebrationCount: number;
  enterProgress: Record<GatheringMonsterId, number>;
  celebrateProgress: Record<GatheringMonsterId, number>;
  headYaw: Record<GatheringMonsterId, number>;
  headPitch: Record<GatheringMonsterId, number>;
  reducedMotion: boolean;
}

declare global {
  interface Window {
    __CONTACT_GATHERING_STATE__?: ContactGatheringDebugState;
    __CONTACT_TIME_SCALE__?: number;
  }
}

export interface ContactGatheringSceneProps {
  isActive: boolean;
  reducedMotion: boolean;
  focusedField: FocusedContactField;
  typingTrigger: number;
  celebrationTrigger: number;
  getCardBoundsNdc: () => CardBoundsNdc | null;
}

interface EyeRigPair {
  leftUpper: THREE.Mesh;
  leftLower: THREE.Mesh;
  rightUpper: THREE.Mesh;
  rightLower: THREE.Mesh;
  leftPupil: THREE.Group;
  rightPupil: THREE.Group;
}

interface MonsterInstanceRig {
  id: GatheringMonsterId;
  root: THREE.Group;
  modelRoot: THREE.Group;
  clonedScene: THREE.Object3D;
  bones: Record<string, THREE.Bone>;
  restQuats: Record<string, THREE.Quaternion>;
  eyes: EyeRigPair | null;
  mixer: THREE.AnimationMixer | null;
  staggerDelay: number;
  enterProgress: number;
  celebrateProgress: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  blinkAmount: number;
}

const MONSTER_IDS: GatheringMonsterId[] = [
  'yeti',
  'cactoro',
  'builder',
  'archivist',
  'operator',
];

const STAGGER_DELAYS: Record<GatheringMonsterId, number> = {
  yeti: 0.0,
  cactoro: 0.16,
  archivist: 0.30,
  builder: 0.44,
  operator: 0.58,
};

const DUR_ENTER_PER_MONSTER = 0.92;
const DUR_CELEBRATING_TOTAL = 4.6; // Stage 2 Rise (0..0.95s) + Stage 3 Happy Celebration (0.95..3.1s) + Stage 4 Hold (3.1..4.6s) -> Stage 5 happy-idle

const CARD_PLANE_Z = 0.0;

function easeOutBack(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(c - 1, 3) + c1 * Math.pow(c - 1, 2);
}

function easeInOutCubic(t: number): number {
  const c = THREE.MathUtils.clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) * 0.5;
}

// Pre-allocated math scratch objects (zero per-frame GC allocations)
const _vUnproj = new THREE.Vector3();
const _vMinWorld = new THREE.Vector3();
const _vMaxWorld = new THREE.Vector3();
const _qRoot = new THREE.Quaternion();
const _qParent = new THREE.Quaternion();
const _qDelta = new THREE.Quaternion();
const _euler = new THREE.Euler();

export const ContactGatheringScene: React.FC<ContactGatheringSceneProps> = ({
  isActive,
  reducedMotion,
  focusedField,
  typingTrigger,
  celebrationTrigger,
  getCardBoundsNdc,
}) => {
  const yetiGltf = useGLTF(YETI_PATH);
  const cactoroGltf = useGLTF(CACTORO_PATH);
  const builderGltf = useGLTF(BUILDER_PATH);
  const archivistGltf = useGLTF(ARCHIVIST_PATH);
  const operatorGltf = useGLTF(OPERATOR_PATH);

  const { camera } = useThree();
  const stageGroupRef = useRef<THREE.Group>(null);
  const rigsRef = useRef<Record<GatheringMonsterId, MonsterInstanceRig> | null>(null);

  const furBump = useMemo(() => getFurBumpTexture(), []);
  const archivistBadgeTex = useMemo(() => getArchivistBadgeTexture(), []);
  const operatorBadgeTex = useMemo(() => getOperatorBadgeTexture(), []);

  // Clone all 5 monster skeletons independently so they never conflict with Sections 01-05
  const clonedModels = useMemo(() => {
    return {
      yeti: cloneSkeleton(yetiGltf.scene),
      cactoro: cloneSkeleton(cactoroGltf.scene),
      builder: cloneSkeleton(builderGltf.scene),
      archivist: cloneSkeleton(archivistGltf.scene),
      operator: cloneSkeleton(operatorGltf.scene),
    };
  }, [
    yetiGltf.scene,
    cactoroGltf.scene,
    builderGltf.scene,
    archivistGltf.scene,
    operatorGltf.scene,
  ]);

  const stateMachineRef = useRef({
    state: 'hidden' as ContactGatheringState,
    stateTime: 0,
    totalTime: 0,
    hasEnteredOnce: false,
    lastCelebrationTrigger: celebrationTrigger,
    celebrationCount: 0,
    lastTypingTrigger: typingTrigger,
    typingPulse: 0,
  });

  // Character-space rotation delta helper (resets to rest quaternion first — zero drift)
  const applyBoneDelta = (
    rig: MonsterInstanceRig,
    boneName: string,
    rx: number,
    ry: number,
    rz: number,
    order: THREE.EulerOrder = 'YXZ'
  ) => {
    const bone = rig.bones[boneName];
    const rest = rig.restQuats[boneName];
    if (!bone || !rest || !bone.parent) return;

    bone.quaternion.copy(rest);
    rig.modelRoot.updateMatrixWorld(true);

    rig.modelRoot.getWorldQuaternion(_qRoot);
    bone.parent.getWorldQuaternion(_qParent);

    const parentInChar = _qRoot.invert().multiply(_qParent);
    _euler.set(rx, ry, rz, order);
    _qDelta.setFromEuler(_euler);

    bone.quaternion
      .copy(parentInChar)
      .invert()
      .multiply(_qDelta)
      .multiply(parentInChar)
      .multiply(rest);
  };

  const unprojectNdc = (ndcX: number, ndcY: number, planeZ: number, out: THREE.Vector3) => {
    _vUnproj.set(
      THREE.MathUtils.clamp(ndcX, -0.98, 0.98),
      THREE.MathUtils.clamp(ndcY, -0.98, 0.98),
      0.5
    );
    _vUnproj.unproject(camera);
    const dir = _vUnproj.sub(camera.position).normalize();
    const denom = Math.abs(dir.z) > 1e-4 ? dir.z : -1;
    const t = (planeZ - camera.position.z) / denom;
    out.set(
      camera.position.x + dir.x * t,
      camera.position.y + dir.y * t,
      planeZ
    );
  };

  // Mount authentic materials, 3D glossy eyes, and signature accessories for all 5 monsters
  useEffect(() => {
    if (!stageGroupRef.current) return;
    const stageGroup = stageGroupRef.current;
    const disposables: Array<{ dispose: () => void }> = [];
    const attachedNodes: Array<{ parent: THREE.Object3D; child: THREE.Object3D }> = [];

    // Shared signature materials matching Sections 01-05
    const mainTealCoatMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#228B82'),
      roughness: 0.85,
      metalness: 0.04,
      sheen: 1.0,
      sheenRoughness: 0.56,
      sheenColor: new THREE.Color('#A7F3D0'),
      bumpMap: furBump,
      bumpScale: 0.012,
    });
    const secondaryMintMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#86D6CC'),
      roughness: 0.78,
      metalness: 0.02,
      sheen: 0.75,
      sheenRoughness: 0.65,
      sheenColor: new THREE.Color('#CCFBF1'),
      bumpMap: furBump,
      bumpScale: 0.008,
    });
    const cactoroSageMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#3B8B7C'),
      roughness: 0.86,
      metalness: 0.0,
      sheen: 1.0,
      sheenRoughness: 0.62,
      sheenColor: new THREE.Color('#CCFBF1'),
      bumpMap: furBump,
      bumpScale: 0.013,
    });
    const cactoroHatMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#D9A066'),
      roughness: 0.80,
      metalness: 0.0,
      sheen: 0.7,
      sheenColor: new THREE.Color('#FEF3C7'),
      bumpMap: furBump,
      bumpScale: 0.009,
    });
    const cactoroBandMat = new THREE.MeshStandardMaterial({
      color: '#115E59',
      roughness: 0.7,
    });
    const builderEarMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#5BB5AA'),
      roughness: 0.82,
      sheen: 0.8,
      sheenColor: new THREE.Color('#CCFBF1'),
    });
    const teethMat = new THREE.MeshStandardMaterial({ color: '#FFFBF2', roughness: 0.35 });
    const tongueMat = new THREE.MeshStandardMaterial({ color: '#E88B9C', roughness: 0.45 });

    const scleraMat = new THREE.MeshPhysicalMaterial({
      color: '#FFFFFF',
      roughness: 0.09,
      clearcoat: 1.0,
      clearcoatRoughness: 0.07,
    });
    const irisMat = new THREE.MeshStandardMaterial({
      color: '#0D6E68',
      roughness: 0.22,
      metalness: 0.04,
    });
    const pupilMat = new THREE.MeshBasicMaterial({ color: '#141316' });
    const catchMat = new THREE.MeshBasicMaterial({ color: '#FFFFFF' });

    disposables.push(
      mainTealCoatMat,
      secondaryMintMat,
      cactoroSageMat,
      cactoroHatMat,
      cactoroBandMat,
      builderEarMat,
      teethMat,
      tongueMat,
      scleraMat,
      irisMat,
      pupilMat,
      catchMat
    );

    const buildEyePairOnHead = (
      headBone: THREE.Bone,
      origEyeMesh: THREE.SkinnedMesh | null,
      eyeRadius: number,
      lidColorHex: string,
      fallbackLeft: THREE.Vector3,
      fallbackRight: THREE.Vector3,
      forwardNudge = 0.0
    ): EyeRigPair => {
      let leftSocket = fallbackLeft.clone();
      let rightSocket = fallbackRight.clone();

      if (origEyeMesh && origEyeMesh.skeleton) {
        const headIdx = origEyeMesh.skeleton.bones.findIndex((b) => b === headBone);
        if (headIdx !== -1 && origEyeMesh.skeleton.boneInverses[headIdx]) {
          const headInv = origEyeMesh.skeleton.boneInverses[headIdx];
          const posAttr = origEyeMesh.geometry.attributes.position;
          const lSum = new THREE.Vector3();
          const rSum = new THREE.Vector3();
          let lCnt = 0;
          let rCnt = 0;
          const v = new THREE.Vector3();
          for (let i = 0; i < posAttr.count; i++) {
            v.fromBufferAttribute(posAttr, i)
              .applyMatrix4(origEyeMesh.bindMatrix)
              .applyMatrix4(headInv);
            if (v.x < 0) {
              lSum.add(v);
              lCnt++;
            } else {
              rSum.add(v);
              rCnt++;
            }
          }
          if (lCnt > 0 && rCnt > 0) {
            lSum.divideScalar(lCnt);
            rSum.divideScalar(rCnt);
            const avgX = (Math.abs(lSum.x) + Math.abs(rSum.x)) * 0.5;
            const avgY = (lSum.y + rSum.y) * 0.5;
            const avgZ = (lSum.z + rSum.z) * 0.5;
            leftSocket = new THREE.Vector3(-avgX, avgY, avgZ);
            rightSocket = new THREE.Vector3(avgX, avgY, avgZ);
          }
        }
      }

      const scleraGeo = new THREE.SphereGeometry(eyeRadius, 22, 16);
      const irisGeo = new THREE.SphereGeometry(eyeRadius * 0.68, 18, 14);
      const pupilGeo = new THREE.SphereGeometry(eyeRadius * 0.43, 16, 12);
      const catchBigGeo = new THREE.SphereGeometry(eyeRadius * 0.19, 10, 8);
      const catchSmallGeo = new THREE.SphereGeometry(eyeRadius * 0.11, 8, 8);
      const upperLidGeo = new THREE.SphereGeometry(
        eyeRadius * 1.06,
        18,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.52
      );
      const lowerLidGeo = new THREE.SphereGeometry(
        eyeRadius * 1.06,
        18,
        12,
        0,
        Math.PI * 2,
        Math.PI * 0.48,
        Math.PI * 0.52
      );
      const lidMat = new THREE.MeshPhysicalMaterial({
        color: lidColorHex,
        roughness: 0.84,
        sheen: 0.85,
        sheenColor: new THREE.Color('#A7F3D0'),
      });

      disposables.push(
        scleraGeo,
        irisGeo,
        pupilGeo,
        catchBigGeo,
        catchSmallGeo,
        upperLidGeo,
        lowerLidGeo,
        lidMat
      );

      const fwdLeft = new THREE.Vector3(-0.18, 0.10, 0.98).normalize();
      const fwdRight = new THREE.Vector3(0.18, 0.10, 0.98).normalize();

      const pair: EyeRigPair = {
        leftUpper: null as unknown as THREE.Mesh,
        leftLower: null as unknown as THREE.Mesh,
        rightUpper: null as unknown as THREE.Mesh,
        rightLower: null as unknown as THREE.Mesh,
        leftPupil: null as unknown as THREE.Group,
        rightPupil: null as unknown as THREE.Group,
      };

      for (const [idx, socketPos] of [leftSocket, rightSocket].entries()) {
        const mount = new THREE.Group();
        mount.name = idx === 0 ? 'GatheringEye_L' : 'GatheringEye_R';
        mount.position.copy(socketPos);
        const fwd = idx === 0 ? fwdLeft : fwdRight;
        mount.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), fwd);
        if (forwardNudge !== 0) {
          mount.translateZ(forwardNudge);
        }

        mount.add(new THREE.Mesh(scleraGeo, scleraMat));

        const pupilGroup = new THREE.Group();
        const iris = new THREE.Mesh(irisGeo, irisMat);
        iris.position.set(0, 0, eyeRadius * 0.76);
        iris.scale.set(1, 1, 0.36);
        pupilGroup.add(iris);

        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.set(0, 0, eyeRadius * 0.88);
        pupil.scale.set(1, 1, 0.32);
        pupilGroup.add(pupil);

        const catch1 = new THREE.Mesh(catchBigGeo, catchMat);
        catch1.position.set(eyeRadius * 0.22, eyeRadius * 0.24, eyeRadius * 1.0);
        pupilGroup.add(catch1);

        const catch2 = new THREE.Mesh(catchSmallGeo, catchMat);
        catch2.position.set(-eyeRadius * 0.2, -eyeRadius * 0.18, eyeRadius * 0.98);
        pupilGroup.add(catch2);

        mount.add(pupilGroup);

        const upperLid = new THREE.Mesh(upperLidGeo, lidMat);
        upperLid.rotation.set(-1.52, 0, 0);
        mount.add(upperLid);

        const lowerLid = new THREE.Mesh(lowerLidGeo, lidMat);
        lowerLid.rotation.set(1.48, 0, 0);
        mount.add(lowerLid);

        headBone.add(mount);
        attachedNodes.push({ parent: headBone, child: mount });

        if (idx === 0) {
          pair.leftUpper = upperLid;
          pair.leftLower = lowerLid;
          pair.leftPupil = pupilGroup;
        } else {
          pair.rightUpper = upperLid;
          pair.rightLower = lowerLid;
          pair.rightPupil = pupilGroup;
        }
      }

      return pair;
    };

    const rigs: Record<GatheringMonsterId, MonsterInstanceRig> = {} as Record<
      GatheringMonsterId,
      MonsterInstanceRig
    >;

    const setupMonsterRig = (
      id: GatheringMonsterId,
      cloned: THREE.Object3D,
      animations: THREE.AnimationClip[],
      modelScale: number
    ) => {
      const root = new THREE.Group();
      root.name = `GatheringRoot_${id}`;
      const modelRoot = new THREE.Group();
      modelRoot.name = `GatheringModel_${id}`;
      modelRoot.scale.setScalar(modelScale);
      modelRoot.add(cloned);
      root.add(modelRoot);
      stageGroup.add(root);
      attachedNodes.push({ parent: stageGroup, child: root });

      const bones: Record<string, THREE.Bone> = {};
      const restQuats: Record<string, THREE.Quaternion> = {};
      let origEyeWhite: THREE.SkinnedMesh | null = null;

      cloned.traverse((obj) => {
        if ((obj as THREE.Bone).isBone) {
          const b = obj as THREE.Bone;
          const clean = b.name.replace(/\./g, '');
          bones[clean] = b;
          restQuats[clean] = b.quaternion.clone();
        }
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.frustumCulled = false;
          const matName = (mesh.material as THREE.MeshStandardMaterial)?.name || '';

          if (id === 'yeti') {
            if (matName === 'Yeti_Main') mesh.material = mainTealCoatMat;
            else if (matName === 'Yeti_Secondary') mesh.material = secondaryMintMat;
            else if (matName === 'Yeti_Teeth') mesh.material = teethMat;
            else if (matName === 'Tongue') mesh.material = tongueMat;
            else if (matName === 'Eye_White') {
              origEyeWhite = mesh as THREE.SkinnedMesh;
              mesh.visible = false;
            } else if (matName === 'Eye_Black') mesh.visible = false;
          } else if (id === 'cactoro') {
            if (matName === 'Cactoro_Main' || matName === 'Cactoro_Main.001')
              mesh.material = cactoroSageMat;
            else if (matName === 'Cactoro_Secondary') mesh.material = cactoroHatMat;
            else if (matName === 'Cactoro_Red') mesh.material = cactoroBandMat;
            else if (matName === 'Eye_White') {
              origEyeWhite = mesh as THREE.SkinnedMesh;
              mesh.visible = false;
            } else if (matName === 'Eye_Black') mesh.visible = false;
          } else if (id === 'builder') {
            if (
              matName === 'Monkroose_Main' ||
              matName.includes('Main') ||
              mesh.name === 'Monkroose_1'
            ) {
              mesh.material = mainTealCoatMat;
            } else if (
              matName === 'Monkroose_Secondary' ||
              matName.includes('Secondary') ||
              mesh.name === 'Monkroose_3'
            ) {
              mesh.material = secondaryMintMat;
            } else if (
              matName === 'Monkroose_Ears' ||
              matName.includes('Ears') ||
              mesh.name === 'Monkroose_2'
            ) {
              mesh.material = builderEarMat;
            } else if (matName === 'Eye_White' || mesh.name === 'Monkroose_4') {
              origEyeWhite = mesh as THREE.SkinnedMesh;
              mesh.visible = false;
            } else if (matName === 'Eye_Black' || mesh.name === 'Monkroose_5') {
              mesh.visible = false;
            }
          } else if (id === 'archivist') {
            if (mesh.name === 'Frog_2') mesh.material = mainTealCoatMat;
            else if (mesh.name === 'Frog_1') mesh.material = secondaryMintMat;
            else if (mesh.name === 'Frog_3') {
              origEyeWhite = mesh as THREE.SkinnedMesh;
              mesh.visible = false;
            } else if (mesh.name === 'Frog_4') mesh.visible = false;
          } else if (id === 'operator') {
            if (matName === 'Dino_Main') mesh.material = mainTealCoatMat;
            else if (matName === 'Dino_Secondary') mesh.material = secondaryMintMat;
            else if (matName === 'Eye_White') {
              origEyeWhite = mesh as THREE.SkinnedMesh;
              mesh.visible = false;
            } else if (
              matName === 'Eye_Black' ||
              matName === 'Dino_Teeth' ||
              matName === 'Dino_Tongue'
            ) {
              mesh.visible = false;
            }
          }
        }
      });

      // Scale down oversized Quaternius hands on Archivist & Operator for consistent anatomy
      if (id === 'archivist' || id === 'operator') {
        const handScale = id === 'archivist' ? 0.72 : 0.80;
        for (const s of ['L', 'R']) {
          for (const f of ['Thumb1', 'Index1', 'Middle1', 'Pinky1']) {
            const fb = bones[`${f}${s}`];
            if (fb) fb.scale.setScalar(handScale);
          }
        }
      }

      // Mount 3D eyes and character-specific accessories onto Head & Torso bones
      const headBone = bones['Head'];
      const torsoBone = bones['Torso'];
      let eyes: EyeRigPair | null = null;

      if (headBone) {
        if (id === 'yeti') {
          eyes = buildEyePairOnHead(
            headBone,
            origEyeWhite,
            0.00142,
            '#73C9BE',
            new THREE.Vector3(-0.0028, 0.0042, 0.0034),
            new THREE.Vector3(0.0028, 0.0042, 0.0034),
            0.0007
          );
        } else if (id === 'cactoro') {
          eyes = buildEyePairOnHead(
            headBone,
            origEyeWhite,
            0.00142,
            '#347D70',
            new THREE.Vector3(-0.0031, 0.0045, 0.0035),
            new THREE.Vector3(0.0031, 0.0045, 0.0035),
            0.00045
          );
        } else if (id === 'builder') {
          eyes = buildEyePairOnHead(
            headBone,
            origEyeWhite,
            0.00195,
            '#73C9BE',
            new THREE.Vector3(-0.00338, 0.00346, 0.00183),
            new THREE.Vector3(0.00340, 0.00346, 0.00183),
            0.00045
          );
        } else if (id === 'archivist') {
          eyes = buildEyePairOnHead(
            headBone,
            null, // Use exact deduplicated frog eye mound sockets from Section 04
            0.00120,
            '#228B82',
            new THREE.Vector3(-0.00350, 0.00552, 0.00342),
            new THREE.Vector3(0.00350, 0.00552, 0.00342),
            0.0
          );

          // Archivist Newsboy Cap + Work Shirt Collar & Tie + ID Badge
          const capMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.82 });
          const visorMat = new THREE.MeshStandardMaterial({ color: '#1E293B', roughness: 0.75 });
          const crownGeo = new THREE.SphereGeometry(0.0034, 20, 14);
          crownGeo.scale(1.02, 0.38, 1.04);
          const visorGeo = new THREE.CylinderGeometry(
            0.0032,
            0.0034,
            0.00025,
            18,
            1,
            false,
            Math.PI * 0.22,
            Math.PI * 0.56
          );
          visorGeo.rotateX(Math.PI * 0.5);
          visorGeo.scale(0.92, 0.92, 0.30);
          disposables.push(capMat, visorMat, crownGeo, visorGeo);

          const capGroup = new THREE.Group();
          capGroup.position.set(0, 0.0070, 0.0006);
          capGroup.rotation.set(-0.06, 0, 0);
          const crownMesh = new THREE.Mesh(crownGeo, capMat);
          crownMesh.position.set(0, 0.0004, -0.0002);
          capGroup.add(crownMesh);
          const visorMesh = new THREE.Mesh(visorGeo, visorMat);
          visorMesh.position.set(0, -0.0003, 0.0028);
          visorMesh.rotation.set(0.15, 0, 0);
          capGroup.add(visorMesh);
          headBone.add(capGroup);
          attachedNodes.push({ parent: headBone, child: capGroup });

          if (torsoBone) {
            const shirtMat = new THREE.MeshStandardMaterial({ color: '#F8FAFC', roughness: 0.65 });
            const tieMat = new THREE.MeshStandardMaterial({ color: '#D97706', roughness: 0.5 });
            const badgeFaceMat = new THREE.MeshBasicMaterial({
              map: archivistBadgeTex,
              transparent: true,
            });
            const tabGeo = new THREE.BoxGeometry(0.0020, 0.0026, 0.0005);
            const tieGeo = new THREE.BoxGeometry(0.0011, 0.0045, 0.0004);
            const badgeGeo = new THREE.PlaneGeometry(0.0018, 0.0026);
            disposables.push(shirtMat, tieMat, badgeFaceMat, tabGeo, tieGeo, badgeGeo);

            const outfit = new THREE.Group();
            outfit.position.set(0, 0.0105, 0.0040);
            const lTab = new THREE.Mesh(tabGeo, shirtMat);
            lTab.position.set(-0.0013, -0.0004, 0.0008);
            lTab.rotation.set(0.1, 0.14, -0.38);
            outfit.add(lTab);
            const rTab = new THREE.Mesh(tabGeo, shirtMat);
            rTab.position.set(0.0013, -0.0004, 0.0008);
            rTab.rotation.set(0.1, -0.14, 0.38);
            outfit.add(rTab);
            const tie = new THREE.Mesh(tieGeo, tieMat);
            tie.position.set(0, -0.0032, 0.0009);
            outfit.add(tie);
            const badge = new THREE.Mesh(badgeGeo, badgeFaceMat);
            badge.position.set(-0.0025, -0.0035, 0.0011);
            outfit.add(badge);
            torsoBone.add(outfit);
            attachedNodes.push({ parent: torsoBone, child: outfit });
          }
        } else if (id === 'operator') {
          eyes = buildEyePairOnHead(
            headBone,
            origEyeWhite,
            0.00112,
            '#228B82',
            new THREE.Vector3(-0.0038, 0.00521, 0.00094),
            new THREE.Vector3(0.0038, 0.00521, 0.00094),
            0.0
          );

          // Operator Headset + Cap + Vest & Badge
          const bandMat = new THREE.MeshStandardMaterial({
            color: '#1E293B',
            roughness: 0.45,
            metalness: 0.35,
          });
          const accentMat = new THREE.MeshStandardMaterial({ color: '#0D9488', roughness: 0.35 });
          const bandGeo = new THREE.TorusGeometry(0.0063, 0.00048, 8, 24, Math.PI * 1.06);
          const cupGeo = new THREE.CylinderGeometry(0.00175, 0.00175, 0.00095, 16);
          const crownGeo = new THREE.SphereGeometry(
            0.0044,
            20,
            12,
            0,
            Math.PI * 2,
            0,
            Math.PI * 0.56
          );
          crownGeo.scale(1.04, 0.52, 1.12);
          disposables.push(bandMat, accentMat, bandGeo, cupGeo, crownGeo);

          const headGear = new THREE.Group();
          const band = new THREE.Mesh(bandGeo, bandMat);
          band.position.set(0, 0.0036, -0.0008);
          headGear.add(band);
          for (const s of [-1, 1]) {
            const cup = new THREE.Mesh(cupGeo, accentMat);
            cup.rotation.z = Math.PI * 0.5;
            cup.position.set(s * 0.00625, 0.0036, -0.0008);
            headGear.add(cup);
          }
          const cap = new THREE.Mesh(crownGeo, bandMat);
          cap.position.set(0, 0.0076, 0.0004);
          headGear.add(cap);
          headBone.add(headGear);
          attachedNodes.push({ parent: headBone, child: headGear });

          if (torsoBone) {
            const badgeFaceMat = new THREE.MeshBasicMaterial({
              map: operatorBadgeTex,
              transparent: true,
            });
            const badgeGeo = new THREE.PlaneGeometry(0.0018, 0.0026);
            disposables.push(badgeFaceMat, badgeGeo);
            const badge = new THREE.Mesh(badgeGeo, badgeFaceMat);
            badge.position.set(-0.0024, 0.0046, 0.0043);
            torsoBone.add(badge);
            attachedNodes.push({ parent: torsoBone, child: badge });
          }
        }
      }

      // Optional subtle Idle AnimationMixer clip at low weight for organic life
      let mixer: THREE.AnimationMixer | null = null;
      if (animations && animations.length > 0) {
        const idleClip = animations.find((c) => c.name.endsWith('Idle'));
        if (idleClip) {
          mixer = new THREE.AnimationMixer(cloned);
          const action = mixer.clipAction(idleClip);
          action.reset().setEffectiveWeight(0.28).setEffectiveTimeScale(0.48).play();
        }
      }

      rigs[id] = {
        id,
        root,
        modelRoot,
        clonedScene: cloned,
        bones,
        restQuats,
        eyes,
        mixer,
        staggerDelay: STAGGER_DELAYS[id],
        enterProgress: reducedMotion ? 1 : 0,
        celebrateProgress: 0,
        headPitch: 0,
        headYaw: 0,
        headRoll: 0,
        blinkAmount: 0,
      };
    };

    setupMonsterRig('yeti', clonedModels.yeti, yetiGltf.animations, 0.25);
    setupMonsterRig('cactoro', clonedModels.cactoro, cactoroGltf.animations, 0.26);
    setupMonsterRig('builder', clonedModels.builder, builderGltf.animations, 0.27);
    setupMonsterRig('archivist', clonedModels.archivist, archivistGltf.animations, 0.27);
    setupMonsterRig('operator', clonedModels.operator, operatorGltf.animations, 0.26);

    rigsRef.current = rigs;

    return () => {
      Object.values(rigs).forEach((r) => r.mixer?.stopAllAction());
      attachedNodes.forEach(({ parent, child }) => parent.remove(child));
      disposables.forEach((d) => d.dispose());
      rigsRef.current = null;
    };
  }, [
    clonedModels,
    yetiGltf.animations,
    cactoroGltf.animations,
    builderGltf.animations,
    archivistGltf.animations,
    operatorGltf.animations,
    furBump,
    archivistBadgeTex,
    operatorBadgeTex,
    reducedMotion,
  ]);

  // Main 60 FPS Animation & State Machine Loop
  useFrame((_, rawDelta) => {
    const rigs = rigsRef.current;
    if (!rigs) return;

    const timeScale = window.__CONTACT_TIME_SCALE__ ?? 1;
    const dt = Math.min(rawDelta, 0.05) * timeScale;
    const sm = stateMachineRef.current;

    // 1. Measure live Contact Card DOM bounds in 3D world space
    const cardNdc = getCardBoundsNdc() ?? {
      minX: -0.05,
      maxX: 0.86,
      minY: -0.58,
      maxY: 0.56,
    };
    unprojectNdc(cardNdc.minX, cardNdc.minY, CARD_PLANE_Z, _vMinWorld);
    unprojectNdc(cardNdc.maxX, cardNdc.maxY, CARD_PLANE_Z, _vMaxWorld);

    const cardLeft = _vMinWorld.x;
    const cardRight = _vMaxWorld.x;
    const cardBottom = _vMinWorld.y;
    const cardTop = _vMaxWorld.y;
    const cardWidth = Math.max(0.8, cardRight - cardLeft);
    const cardHeight = Math.max(0.8, cardTop - cardBottom);
    const cardCenterX = (cardLeft + cardRight) * 0.5;
    const cardCenterY = (cardBottom + cardTop) * 0.5;
    const isCompactViewport = cardWidth > 2.35;

    // 2. Section Activation & State Machine Transitions
    if (!isActive) {
      return;
    }

    sm.totalTime += dt;

    // Trigger initial entrance when Section 06 becomes active
    if (!sm.hasEnteredOnce) {
      sm.hasEnteredOnce = true;
      sm.state = reducedMotion ? 'idle' : 'entering';
      sm.stateTime = 0;
    }

    // Trigger Final Gathering Celebration ONLY when celebrationTrigger increments (after confirmed form submission!)
    if (celebrationTrigger !== sm.lastCelebrationTrigger) {
      sm.lastCelebrationTrigger = celebrationTrigger;
      if (celebrationTrigger > 0) {
        sm.celebrationCount += 1;
        sm.state = 'celebrating';
        sm.stateTime = 0;
        // Ensure all monsters have full entrance progress if form was submitted mid-entrance
        MONSTER_IDS.forEach((id) => {
          rigs[id].enterProgress = 1;
        });
      }
    }

    // Track subtle typing pulse when user types in form fields
    if (typingTrigger !== sm.lastTypingTrigger) {
      sm.lastTypingTrigger = typingTrigger;
      sm.typingPulse = 1.0;
    }
    sm.typingPulse = THREE.MathUtils.damp(sm.typingPulse, 0, 4.5, dt);

    sm.stateTime += dt;

    // State Transitions
    const maxStagger = STAGGER_DELAYS.operator + DUR_ENTER_PER_MONSTER;
    if (sm.state === 'entering') {
      if (sm.stateTime >= maxStagger) {
        sm.state = focusedField ? 'observing' : 'idle';
        sm.stateTime = 0;
      }
    } else if (sm.state === 'idle') {
      if (focusedField) {
        sm.state = 'observing';
        sm.stateTime = 0;
      }
    } else if (sm.state === 'observing') {
      if (!focusedField) {
        sm.state = 'idle';
        sm.stateTime = 0;
      }
    } else if (sm.state === 'celebrating') {
      if (sm.stateTime >= DUR_CELEBRATING_TOTAL) {
        sm.state = 'happy-idle';
        sm.stateTime = 0;
      }
    }

    // 3. Asymmetric Balanced Peeking Anchors Around the Contact Card
    // At modelScale ~0.26, each monster's total height is ~0.92 world units (feet at y=0, neck at +0.52, eyes at +0.68, top of head at +0.88).
    // Placing Top monsters at cardTop - 0.50 hides their legs & lower torso behind the card while their head & eyes peek cleanly above cardTop!
    // Placing Side monsters near cardLeft / cardRight with angled roll hides their lower body behind the card edge while their head peeks out!
    const anchors: Record<
      GatheringMonsterId,
      {
        hiddenPos: [number, number, number];
        peekPos: [number, number, number];
        celebrateOffset: [number, number, number];
        baseRot: [number, number, number]; // pitch, yaw, roll
        armPeekL: [number, number, number];
        armPeekR: [number, number, number];
      }
    > = {
      // 1. Hero Yeti — Top-Left of Card (warm welcoming leader peeking over top-left border)
      yeti: {
        hiddenPos: [cardLeft + cardWidth * 0.20, cardTop - 0.92, -0.25],
        peekPos: [cardLeft + cardWidth * 0.20, cardTop - 0.50, -0.22],
        celebrateOffset: [0, 0.17, 0],
        baseRot: [0.06, 0.12, 0.04],
        armPeekL: [0.35, 0.10, -0.35],
        armPeekR: [0.35, -0.10, 0.35],
      },
      // 2. Archivist Frog — Top-Center-Right of Card (curious archivist with newsboy cap peering over top border)
      archivist: {
        hiddenPos: [cardLeft + cardWidth * 0.55, cardTop - 0.92, -0.32],
        peekPos: [cardLeft + cardWidth * 0.55, cardTop - 0.48, -0.28],
        celebrateOffset: [0, 0.16, 0],
        baseRot: [0.08, -0.06, -0.03],
        armPeekL: [0.32, 0.12, -0.30],
        armPeekR: [0.32, -0.12, 0.30],
      },
      // 3. Operator Dino — Top-Right Corner of Card (wearing headset & cap, tilting playfully inward)
      operator: {
        hiddenPos: [cardRight - cardWidth * 0.16, cardTop - 0.92, -0.24],
        peekPos: [cardRight - cardWidth * 0.16, cardTop - 0.51, -0.20],
        celebrateOffset: [0.03, 0.17, 0],
        baseRot: [0.07, -0.20, -0.07],
        armPeekL: [0.32, 0.12, -0.30],
        armPeekR: [0.32, -0.12, 0.30],
      },
      // 4. Cactoro Dev — Left Edge of Card (lower body & legs completely hidden behind card, head & sunhat leaning out to the left!)
      cactoro: {
        hiddenPos: [cardLeft + 0.45, cardCenterY - 0.14, -0.28],
        peekPos: [
          cardLeft + (isCompactViewport ? 0.25 : 0.24),
          cardCenterY - 0.14,
          -0.22,
        ],
        celebrateOffset: [-0.08, 0.14, 0],
        baseRot: [0.05, 0.22, 0.56],
        armPeekL: [0.25, 0.10, -0.25],
        armPeekR: [0.40, -0.20, 0.30],
      },
      // 5. Skill Builder Monkroose — Right Edge of Card (lower body & legs completely hidden behind card, head & ears leaning out to the right!)
      builder: {
        hiddenPos: [cardRight - 0.45, cardCenterY - 0.34, -0.28],
        peekPos: [
          cardRight - (isCompactViewport ? 0.25 : 0.24),
          cardCenterY - 0.34,
          -0.22,
        ],
        celebrateOffset: [0.08, 0.15, 0],
        baseRot: [0.04, -0.22, -0.56],
        armPeekL: [0.40, 0.20, -0.30],
        armPeekR: [0.25, -0.10, 0.25],
      },
    };

    // Compute 3D gaze target point inside the card when user focuses Name / Email / Message
    let focusTargetX = cardCenterX;
    let focusTargetY = cardCenterY;
    if (focusedField === 'name') {
      focusTargetX = cardCenterX - cardWidth * 0.08;
      focusTargetY = cardTop - cardHeight * 0.26;
    } else if (focusedField === 'email') {
      focusTargetX = cardCenterX - cardWidth * 0.05;
      focusTargetY = cardCenterY + cardHeight * 0.04;
    } else if (focusedField === 'message') {
      focusTargetX = cardCenterX;
      focusTargetY = cardBottom + cardHeight * 0.34;
    }

    // 4. Update Each of the 5 Monsters Independently (Staggered Entrance, Distinct Idles, Form Gaze, Final Celebration)
    for (const [idx, id] of MONSTER_IDS.entries()) {
      const rig = rigs[id];
      const cfg = anchors[id];
      if (!rig || !cfg) continue;

      if (rig.mixer) {
        rig.mixer.update(dt);
      }

      // 4a. Staggered Entrance Progress (0 -> 1 with natural easeOutBack anticipation/overshoot)
      if (reducedMotion || sm.state !== 'entering') {
        if (sm.hasEnteredOnce) {
          rig.enterProgress = THREE.MathUtils.damp(rig.enterProgress, 1, 8, dt);
        }
      } else {
        const localEnterT = Math.max(0, sm.stateTime - rig.staggerDelay) / DUR_ENTER_PER_MONSTER;
        rig.enterProgress = THREE.MathUtils.clamp(localEnterT, 0, 1);
      }
      const enterEased = reducedMotion ? rig.enterProgress : easeOutBack(rig.enterProgress);

      // 4b. Final Celebration Envelope (Staggered Rise -> Happy Celebration -> Celebration Hold -> Return to Happy Idle)
      let targetCelebrate = 0;
      let celebrateBounceY = 0;
      let celebrateWavePhase = 0;

      if (sm.state === 'celebrating') {
        const cDelay = idx * 0.09; // Staggered celebration start across the 5 monsters
        const cLocalT = Math.max(0, sm.stateTime - cDelay);
        if (cLocalT < 0.75) {
          // Stage 2: All Monsters Rise higher from behind the card
          targetCelebrate = easeOutBack(cLocalT / 0.75);
        } else if (cLocalT < 3.4) {
          // Stage 3 & 4: Happy Celebration & Hold
          targetCelebrate = 1.0;
        } else {
          // Stage 5 transition: Smoothly begin settling back toward happy-idle
          const settleT = Math.min(1, (cLocalT - 3.4) / 0.9);
          targetCelebrate = 1.0 - easeInOutCubic(settleT) * 0.65;
        }

        if (!reducedMotion && cLocalT > 0.15 && cLocalT < 3.4) {
          celebrateWavePhase = cLocalT * 6.5 + idx * 1.1;
          // Varied playful hops for Yeti, Builder, and Operator; joyful nods/sways for Cactoro & Archivist
          const hopAmp = id === 'yeti' || id === 'builder' ? 0.09 : id === 'operator' ? 0.075 : 0.045;
          celebrateBounceY = Math.abs(Math.sin(cLocalT * (4.8 + idx * 0.35))) * hopAmp;
        }
      } else if (sm.state === 'happy-idle') {
        // Remain slightly more visible and upbeat in happy-idle than standard idle
        targetCelebrate = 0.24;
      }

      rig.celebrateProgress = THREE.MathUtils.damp(rig.celebrateProgress, targetCelebrate, 7.5, dt);

      // 4c. Distinct Per-Monster Idle Breathing & Micro-Movement (desynchronized frequencies so they never move in unison)
      const phaseSeed = idx * 2.17;
      const breathFreq = 1.05 + idx * 0.19;
      const swayFreq = 0.52 + idx * 0.14;
      const idleBreathY = reducedMotion
        ? 0
        : Math.sin(sm.totalTime * breathFreq + phaseSeed) * 0.018;
      const idleSwayX = reducedMotion
        ? 0
        : Math.cos(sm.totalTime * swayFreq + phaseSeed) * 0.012;

      // Interpolate Hidden -> Peeking -> Celebrating Position
      const baseX = THREE.MathUtils.lerp(cfg.hiddenPos[0], cfg.peekPos[0], enterEased);
      const baseY = THREE.MathUtils.lerp(cfg.hiddenPos[1], cfg.peekPos[1], enterEased);
      const baseZ = THREE.MathUtils.lerp(cfg.hiddenPos[2], cfg.peekPos[2], enterEased);

      const finalX = baseX + cfg.celebrateOffset[0] * rig.celebrateProgress + idleSwayX;
      const finalY =
        baseY +
        cfg.celebrateOffset[1] * rig.celebrateProgress +
        idleBreathY +
        celebrateBounceY;
      const finalZ = baseZ + cfg.celebrateOffset[2] * rig.celebrateProgress;

      rig.root.position.set(finalX, finalY, finalZ);

      // Base body orientation + subtle follow-through tilt during entrance & celebration
      const enterTilt = (1 - Math.min(1, rig.enterProgress)) * 0.22;
      const happySwayRoll =
        sm.state === 'celebrating' && !reducedMotion
          ? Math.sin(celebrateWavePhase * 0.85) * 0.09
          : sm.state === 'happy-idle' && !reducedMotion
            ? Math.sin(sm.totalTime * 1.4 + phaseSeed) * 0.035
            : 0;

      rig.modelRoot.rotation.set(
        cfg.baseRot[0] + enterTilt,
        cfg.baseRot[1],
        cfg.baseRot[2] + happySwayRoll
      );

      // 4d. Head & Gaze Target (Idle curiosity vs Form Field Observation vs Happy Celebration)
      let desiredHeadPitch =
        Math.sin(sm.totalTime * (0.65 + idx * 0.11) + phaseSeed) * 0.04;
      let desiredHeadYaw =
        Math.sin(sm.totalTime * (0.42 + idx * 0.09) + phaseSeed * 1.3) * 0.10;
      let desiredHeadRoll =
        Math.cos(sm.totalTime * (0.48 + idx * 0.08) + phaseSeed) * 0.04;

      if (sm.state === 'observing' && focusedField) {
        // Subset of monsters attentively observe the active input field (so not all 5 snap robotically at once)
        const isPrimaryObserver =
          (focusedField === 'name' && (id === 'yeti' || id === 'cactoro' || id === 'archivist')) ||
          (focusedField === 'email' && (id === 'archivist' || id === 'operator' || id === 'cactoro')) ||
          (focusedField === 'message' && (id === 'builder' || id === 'cactoro' || id === 'operator' || id === 'yeti'));

        const gazeWeight = isPrimaryObserver ? 0.85 : 0.35;
        const dx = focusTargetX - finalX;
        const dy = focusTargetY - (finalY + 0.45);
        const lookYaw = THREE.MathUtils.clamp(dx * 0.24 - cfg.baseRot[1] * 0.5, -0.28, 0.28);
        const lookPitch = THREE.MathUtils.clamp(-dy * 0.22 + 0.10, -0.20, 0.24);
        const typingNod = sm.typingPulse * Math.sin(sm.totalTime * 14 + idx) * 0.035;

        desiredHeadYaw = THREE.MathUtils.lerp(desiredHeadYaw, lookYaw, gazeWeight);
        desiredHeadPitch = THREE.MathUtils.lerp(desiredHeadPitch, lookPitch + typingNod, gazeWeight);
        desiredHeadRoll = isPrimaryObserver ? (idx % 2 === 0 ? 0.05 : -0.05) : desiredHeadRoll;
      } else if (sm.state === 'celebrating') {
        // Enthusiastic nods & cheerful head tilts during celebration
        desiredHeadPitch = -0.10 + Math.sin(celebrateWavePhase * 1.1) * 0.10;
        desiredHeadYaw = Math.cos(celebrateWavePhase * 0.7) * 0.14;
        desiredHeadRoll = Math.sin(celebrateWavePhase * 0.85) * 0.08;
      } else if (sm.state === 'happy-idle') {
        desiredHeadPitch = -0.05 + Math.sin(sm.totalTime * 1.1 + phaseSeed) * 0.04;
        desiredHeadYaw = Math.sin(sm.totalTime * 0.6 + phaseSeed) * 0.11;
        desiredHeadRoll = Math.cos(sm.totalTime * 0.75 + phaseSeed) * 0.05;
      }

      rig.headPitch = THREE.MathUtils.damp(rig.headPitch, desiredHeadPitch, 5.0, dt);
      rig.headYaw = THREE.MathUtils.damp(rig.headYaw, desiredHeadYaw, 5.0, dt);
      rig.headRoll = THREE.MathUtils.damp(rig.headRoll, desiredHeadRoll, 5.0, dt);

      applyBoneDelta(rig, 'Head', rig.headPitch, rig.headYaw, rig.headRoll, 'YXZ');

      // 4e. Distinct Arm & Hand Poses (Peeking / Gripping Card Edge vs Varied Celebration Gestures)
      const cBlend = rig.celebrateProgress;
      const idleTap = reducedMotion
        ? 0
        : Math.sin(sm.totalTime * (1.5 + idx * 0.25) + phaseSeed) * 0.06;

      // In celebration, each monster has its own signature celebratory arm motion:
      // - Yeti: raises both fluffy arms cheering
      // - Cactoro: waves right arm high while left hand holds card edge
      // - Builder: energetic double-arm pump
      // - Archivist: polite enthusiastic right-hand wave & nod
      // - Operator: proud left-hand operator salute/wave
      let celArmL: [number, number, number] = [-0.65, 0.20, 0.75];
      let celArmR: [number, number, number] = [-0.65, -0.20, -0.75];
      const waveOsc = Math.sin(celebrateWavePhase) * 0.26;

      if (id === 'yeti') {
        celArmL = [-0.85 + waveOsc * 0.35, 0.22, 0.85];
        celArmR = [-0.85 - waveOsc * 0.35, -0.22, -0.85];
      } else if (id === 'cactoro') {
        celArmL = [-0.80 + waveOsc, 0.25, 0.85 + waveOsc * 0.4];
        celArmR = cfg.armPeekR;
      } else if (id === 'builder') {
        const pump = Math.abs(Math.sin(celebrateWavePhase)) * 0.35;
        celArmL = [-0.75 - pump, 0.22, 0.78];
        celArmR = [-0.75 - pump, -0.22, -0.78];
      } else if (id === 'archivist') {
        celArmL = cfg.armPeekL;
        celArmR = [-0.85 + waveOsc * 0.4, -0.24, -0.85 + waveOsc * 0.5];
      } else if (id === 'operator') {
        celArmL = [-0.85 + waveOsc * 0.4, 0.24, 0.85 - waveOsc * 0.5];
        celArmR = cfg.armPeekR;
      }

      const armLX = THREE.MathUtils.lerp(cfg.armPeekL[0] + idleTap, celArmL[0], cBlend);
      const armLY = THREE.MathUtils.lerp(cfg.armPeekL[1], celArmL[1], cBlend);
      const armLZ = THREE.MathUtils.lerp(cfg.armPeekL[2], celArmL[2], cBlend);

      const armRX = THREE.MathUtils.lerp(cfg.armPeekR[0] - idleTap, celArmR[0], cBlend);
      const armRY = THREE.MathUtils.lerp(cfg.armPeekR[1], celArmR[1], cBlend);
      const armRZ = THREE.MathUtils.lerp(cfg.armPeekR[2], celArmR[2], cBlend);

      applyBoneDelta(rig, 'UpperArmL', armLX, armLY, armLZ, 'YXZ');
      applyBoneDelta(rig, 'UpperArmR', armRX, armRY, armRZ, 'YXZ');
      applyBoneDelta(rig, 'LowerArmL', -0.55 - cBlend * 0.25, 0, 0, 'YXZ');
      applyBoneDelta(rig, 'LowerArmR', -0.55 - cBlend * 0.25, 0, 0, 'YXZ');

      // 4f. Expressive 3D Eyes (Desynchronized Natural Blinking, Gaze Tracking & Happy Celebration Squint)
      if (rig.eyes) {
        const blinkCycle = (sm.totalTime + idx * 1.37) % (3.6 + idx * 0.45);
        const isNaturalBlink = !reducedMotion && blinkCycle < 0.14;
        const isHappySquint = sm.state === 'celebrating' || sm.state === 'happy-idle';
        const targetBlink = isHappySquint
          ? sm.state === 'celebrating'
            ? 0.58
            : isNaturalBlink
              ? 1.0
              : 0.32
          : isNaturalBlink
            ? 1.0
            : 0.0;

        rig.blinkAmount = THREE.MathUtils.damp(rig.blinkAmount, targetBlink, 18, dt);

        const upperX = THREE.MathUtils.lerp(-1.52, 0.10, rig.blinkAmount);
        // In happy states, raise lower lid slightly more to create a warm smiling eye crescent
        const lowerTargetClosed = isHappySquint ? -0.22 : -0.08;
        const lowerX = THREE.MathUtils.lerp(1.48, lowerTargetClosed, rig.blinkAmount);

        rig.eyes.leftUpper.rotation.x = upperX;
        rig.eyes.leftLower.rotation.x = lowerX;
        rig.eyes.rightUpper.rotation.x = upperX;
        rig.eyes.rightLower.rotation.x = lowerX;

        const gazeYaw = THREE.MathUtils.clamp(rig.headYaw * 0.85, -0.24, 0.24);
        const gazePitch = THREE.MathUtils.clamp(rig.headPitch * 0.78, -0.20, 0.20);
        rig.eyes.leftPupil.rotation.y = THREE.MathUtils.damp(
          rig.eyes.leftPupil.rotation.y,
          gazeYaw,
          10,
          dt
        );
        rig.eyes.leftPupil.rotation.x = THREE.MathUtils.damp(
          rig.eyes.leftPupil.rotation.x,
          gazePitch,
          10,
          dt
        );
        rig.eyes.rightPupil.rotation.y = THREE.MathUtils.damp(
          rig.eyes.rightPupil.rotation.y,
          gazeYaw,
          10,
          dt
        );
        rig.eyes.rightPupil.rotation.x = THREE.MathUtils.damp(
          rig.eyes.rightPupil.rotation.x,
          gazePitch,
          10,
          dt
        );
      }
    }

    // 5. Publish deterministic telemetry for automated Playwright verification
    window.__CONTACT_GATHERING_STATE__ = {
      loaded: true,
      state: sm.state,
      monsterCount: MONSTER_IDS.length,
      monsterIds: [...MONSTER_IDS],
      focusedField,
      celebrationCount: sm.celebrationCount,
      enterProgress: {
        yeti: Number(rigs.yeti.enterProgress.toFixed(2)),
        cactoro: Number(rigs.cactoro.enterProgress.toFixed(2)),
        builder: Number(rigs.builder.enterProgress.toFixed(2)),
        archivist: Number(rigs.archivist.enterProgress.toFixed(2)),
        operator: Number(rigs.operator.enterProgress.toFixed(2)),
      },
      celebrateProgress: {
        yeti: Number(rigs.yeti.celebrateProgress.toFixed(2)),
        cactoro: Number(rigs.cactoro.celebrateProgress.toFixed(2)),
        builder: Number(rigs.builder.celebrateProgress.toFixed(2)),
        archivist: Number(rigs.archivist.celebrateProgress.toFixed(2)),
        operator: Number(rigs.operator.celebrateProgress.toFixed(2)),
      },
      headYaw: {
        yeti: Number(rigs.yeti.headYaw.toFixed(3)),
        cactoro: Number(rigs.cactoro.headYaw.toFixed(3)),
        builder: Number(rigs.builder.headYaw.toFixed(3)),
        archivist: Number(rigs.archivist.headYaw.toFixed(3)),
        operator: Number(rigs.operator.headYaw.toFixed(3)),
      },
      headPitch: {
        yeti: Number(rigs.yeti.headPitch.toFixed(3)),
        cactoro: Number(rigs.cactoro.headPitch.toFixed(3)),
        builder: Number(rigs.builder.headPitch.toFixed(3)),
        archivist: Number(rigs.archivist.headPitch.toFixed(3)),
        operator: Number(rigs.operator.headPitch.toFixed(3)),
      },
      reducedMotion,
    };
  });

  return <group ref={stageGroupRef} />;
};

useGLTF.preload(YETI_PATH);
useGLTF.preload(CACTORO_PATH);
useGLTF.preload(BUILDER_PATH);
useGLTF.preload(ARCHIVIST_PATH);
useGLTF.preload(OPERATOR_PATH);
